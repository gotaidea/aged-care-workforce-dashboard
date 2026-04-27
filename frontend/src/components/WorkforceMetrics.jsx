import React from "react";

const METRIC_LABELS = {
  total_workers: "Total Workers",
  pct_female: "Female",
  median_age: "Median Age",
  pct_casual: "Casual/Part-time",
  turnover_rate: "Annual Turnover",
  vacancy_rate: "Vacancy Rate",
  pct_cert3_qualified: "Cert III+ Qualified",
  pct_born_overseas: "Born Overseas",
};

const METRIC_ORDER = Object.keys(METRIC_LABELS);

function MetricRow({ label, value, unit, highlight }) {
  return (
    <div style={{ ...styles.row, ...(highlight ? styles.rowHighlight : {}) }}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>
        {value != null ? (
          <>{unit === "persons" ? Number(value).toLocaleString() : value}{unit === "%" ? "%" : unit === "years" ? " yrs" : ""}</>
        ) : "—"}
      </span>
    </div>
  );
}

export default function WorkforceMetrics({ data, loading, careType }) {
  if (loading) return <div style={styles.ph}>Loading...</div>;
  if (!data?.length) return <div style={styles.ph}>No workforce data available.</div>;

  const filtered = data.filter((d) => !careType || careType === "sector_wide" || d.care_type === careType);
  const latestByMetric = {};
  for (const row of filtered) {
    const ex = latestByMetric[row.metric];
    if (!ex || row.period > ex.period) latestByMetric[row.metric] = row;
  }

  const rows = METRIC_ORDER.filter((m) => latestByMetric[m]).map((m) => ({ key: m, ...latestByMetric[m] }));
  if (!rows.length) return <div style={styles.ph}>No data for selected care type.</div>;

  return (
    <div style={styles.grid}>
      {rows.map((row) => (
        <MetricRow
          key={row.key}
          label={METRIC_LABELS[row.key] || row.key}
          value={row.value}
          unit={row.unit}
          highlight={row.key === "turnover_rate" || row.key === "vacancy_rate"}
        />
      ))}
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 1, background: "var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" },
  row: { background: "var(--bg-card)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 },
  rowHighlight: { background: "var(--bg-card-hover)" },
  label: { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" },
  value: { fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" },
  ph: { padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 },
};
