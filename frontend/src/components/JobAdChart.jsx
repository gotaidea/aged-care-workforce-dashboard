import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { format, parseISO } from "date-fns";

const TT_STYLE = { background: "#1a1d27", border: "1px solid #2a2e42", borderRadius: 8, fontSize: 12, color: "#e8eaf0" };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={TT_STYLE}>
      <div style={{ padding: "8px 12px 4px", fontWeight: 600, borderBottom: "1px solid #2a2e42" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ padding: "3px 12px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill, flexShrink: 0 }} />
          <span style={{ color: "#8b8fa8" }}>Ads:</span>
          <span style={{ fontWeight: 600 }}>{p.value?.toLocaleString() ?? "—"}</span>
        </div>
      ))}
    </div>
  );
}

export function JobAdTrendChart({ data, loading }) {
  if (loading) return <div style={styles.ph}>Loading...</div>;
  if (!data?.length) return <div style={styles.ph}>No SEEK data yet — pipeline will populate on first run.</div>;

  const byPeriod = {};
  for (const row of data) {
    if (row.role_category !== "All Aged Care (SEEK category)") continue;
    const label = format(parseISO(row.period), "d MMM yy");
    byPeriod[label] = (byPeriod[label] || 0) + (row.ad_count || 0);
  }
  const chartData = Object.entries(byPeriod).map(([period, ads]) => ({ period, ads }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2a2e42" }} interval="preserveStartEnd" />
        <YAxis tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="ads" fill="#4f8ef7" radius={[3, 3, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={i === chartData.length - 1 ? "#4f8ef7" : "#4f8ef750"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function JobAdsByRoleChart({ data, loading }) {
  if (loading) return <div style={styles.ph}>Loading...</div>;
  if (!data?.length) return <div style={styles.ph}>No data available.</div>;

  const latestByRole = {};
  for (const row of data) {
    if (!row.role_category || row.role_category === "All Aged Care (SEEK category)") continue;
    const existing = latestByRole[row.role_category];
    if (!existing || row.period > existing.period) latestByRole[row.role_category] = row;
  }

  const chartData = Object.values(latestByRole)
    .sort((a, b) => (b.ad_count || 0) - (a.ad_count || 0))
    .map((row) => ({
      role: row.role_category.replace(" Aged Care", "").replace("Registered Nurse", "RN"),
      ads: row.ad_count,
    }));

  if (!chartData.length) return <div style={styles.ph}>No role breakdown available.</div>;

  const COLORS = ["#4f8ef7", "#2dd4bf", "#a78bfa", "#f59e0b", "#22c55e"];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2e42" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#2a2e42" }} />
        <YAxis type="category" dataKey="role" tick={{ fill: "#8b8fa8", fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="ads" radius={[0, 3, 3, 0]}>
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const styles = { ph: { height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "0 24px" } };
