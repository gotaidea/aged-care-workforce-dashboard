import React from "react";

export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>{title}</h3>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ width: "100%", overflowX: "auto" }}>{children}</div>
    </div>
  );
}

const styles = {
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px", boxShadow: "var(--shadow)" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" },
  title: { fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 },
  subtitle: { fontSize: 12, color: "var(--text-secondary)" },
};
