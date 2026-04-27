import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";

const TT_STYLE = { background: "#1a1d27", border: "1px solid #2a2e42", borderRadius: 8, fontSize: 12, color: "#e8eaf0" };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TT_STYLE}>
      <div style={{ padding: "8px 12px 4px", fontWeight: 600, borderBottom: "1px solid #2a2e42" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ padding: "3px 12px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ color: "#8b8fa8" }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{p.value != null ? `${Number(p.value).toFixed(1)}%` : "—"}</span>
        </div>
      ))}
    </div>
  );
}

export default function WageTrendChart({ data, loading }) {
  if (loading) return <div style={styles.ph}>Loading...</div>;
  if (!data?.length) return <div style={styles.ph}>No wage data available yet.</div>;

  const byPeriod = {};
  for (const row of data) {
    const label = format(parseISO(row.period), "QQQ yy");
    if (!byPeriod[label]) byPeriod[label] = { period: label };
    if (row.industry === "health_social") byPeriod[label]["Health & Social Assistance"] = row.wpi_annual_change;
    else if (row.industry === "all_industries") byPeriod[label]["All Industries"] = row.wpi_annual_change;
  }
  const chartData = Object.values(byPeriod);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2a2e42" }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#8b8fa8" }} iconType="circle" iconSize={8} />
        <ReferenceLine y={0} stroke="#5a5e74" strokeDasharray="4 2" />
        <Line type="monotone" dataKey="Health & Social Assistance" stroke="#4f8ef7" strokeWidth={2.5} dot={{ r: 3, fill: "#4f8ef7", strokeWidth: 0 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="All Industries" stroke="#5a5e74" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 4, fill: "#5a5e74" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const styles = { ph: { height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 } };
