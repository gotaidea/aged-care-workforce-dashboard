import React from "react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
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
          <span style={{ fontWeight: 600 }}>
            {p.value != null ? Number(p.value).toLocaleString() : "—"}
            {p.name === "Unemployment rate" ? "%" : p.value ? "k" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function EmploymentTrendChart({ data, loading }) {
  if (loading) return <div style={styles.ph}>Loading...</div>;
  if (!data?.length) return <div style={styles.ph}>No employment data available yet.</div>;

  const chartData = data.map((row) => ({
    period: format(parseISO(row.period), "MMM yy"),
    "Total employed (000s)": row.employed_total,
    "Full-time": row.employed_fulltime,
    "Part-time": row.employed_parttime,
    "Unemployment rate": row.unemployment_rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2a2e42" }} interval="preserveStartEnd" />
        <YAxis yAxisId="left" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}k`} width={48} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: "#8b8fa8" }} iconType="circle" iconSize={8} />
        <Area yAxisId="left" type="monotone" dataKey="Total employed (000s)" fill="#4f8ef720" stroke="#4f8ef7" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line yAxisId="left" type="monotone" dataKey="Full-time" stroke="#2dd4bf" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line yAxisId="left" type="monotone" dataKey="Part-time" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line yAxisId="right" type="monotone" dataKey="Unemployment rate" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const styles = { ph: { height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 } };
