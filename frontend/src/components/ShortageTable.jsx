import React from "react";

const LEVEL_STYLES = {
  shortage: { color: "#ef4444", bg: "#ef444415", label: "Shortage" },
  metropolitan_shortage: { color: "#f59e0b", bg: "#f59e0b15", label: "Metro shortage" },
  no_shortage: { color: "#22c55e", bg: "#22c55e15", label: "No shortage" },
};

const CARE_LABELS = {
  home_care: "Home Care",
  residential: "Residential",
  sector_wide: "Sector-wide",
};

export default function ShortageTable({ data, loading }) {
  if (loading) return <div style={styles.ph}>Loading...</div>;
  if (!data?.length) return <div style={styles.ph}>No shortage data available.</div>;

  return (
    <div style={styles.wrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Occupation", "Care Type", "Status"].map((h) => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const s = LEVEL_STYLES[row.shortage_level] || LEVEL_STYLES.no_shortage;
            return (
              <tr key={i} style={i % 2 === 0 ? {} : { background: "#ffffff04" }}>
                <td style={styles.td}>{row.occupation}</td>
                <td style={styles.td}>{CARE_LABELS[row.care_type] || row.care_type}</td>
                <td style={styles.td}>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg }}>
                    {s.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  wrap: { overflowX: "auto", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", background: "#12141e", borderBottom: "1px solid var(--border)" },
  td: { padding: "10px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", verticalAlign: "middle" },
  ph: { padding: "40px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 },
};
