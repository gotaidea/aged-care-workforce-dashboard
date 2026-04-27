import React from "react";

const TREND_UP_GOOD = {
  up: { color: "var(--accent-green)" },
  down: { color: "var(--accent-red)" },
};
const TREND_DOWN_GOOD = {
  up: { color: "var(--accent-red)" },
  down: { color: "var(--accent-green)" },
};
const TREND_NEUTRAL = {
  up: { color: "var(--accent-amber)" },
  down: { color: "var(--accent-amber)" },
};

function TrendArrow({ change, sentiment = "neutral" }) {
  if (change === null || change === undefined) return null;
  const direction = change >= 0 ? "up" : "down";
  const map = sentiment === "up_good" ? TREND_UP_GOOD : sentiment === "down_good" ? TREND_DOWN_GOOD : TREND_NEUTRAL;
  return (
    <span style={{ color: map[direction].color, fontSize: 12, marginLeft: 6, fontWeight: 600 }}>
      {direction === "up" ? "▲" : "▼"} {Math.abs(change).toFixed(1)}
    </span>
  );
}

export default function StatCard({
  title, value, unit, subtitle, change, changeSuffix = "",
  sentiment = "neutral", badge, badgeColor = "var(--accent-amber)",
  loading = false, source,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.title}>{title}</span>
        {badge && (
          <span style={{ ...styles.badge, background: badgeColor + "22", color: badgeColor }}>
            {badge}
          </span>
        )}
      </div>
      {loading ? (
        <div style={styles.skeleton} />
      ) : value === null || value === undefined ? (
        <div style={styles.noData}>No data</div>
      ) : (
        <div style={styles.valueRow}>
          <span style={styles.value}>{value}</span>
          {unit && <span style={styles.unit}>{unit}</span>}
          {change !== undefined && <TrendArrow change={change} sentiment={sentiment} />}
          {change !== undefined && changeSuffix && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}>{changeSuffix}</span>
          )}
        </div>
      )}
      {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      {source && <div style={styles.source}>{source}</div>}
    </div>
  );
}

const styles = {
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "var(--shadow)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)" },
  badge: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 99 },
  valueRow: { display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" },
  value: { fontSize: 36, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--text-primary)" },
  unit: { fontSize: 16, fontWeight: 500, color: "var(--text-secondary)", alignSelf: "flex-end", paddingBottom: 2 },
  subtitle: { fontSize: 12, color: "var(--text-secondary)", marginTop: 2 },
  source: { fontSize: 10, color: "var(--text-muted)", marginTop: 4 },
  skeleton: { height: 36, borderRadius: 6, background: "linear-gradient(90deg, var(--border) 25%, var(--bg-card-hover) 50%, var(--border) 75%)", backgroundSize: "200% 100%" },
  noData: { fontSize: 14, color: "var(--text-muted)", fontStyle: "italic" },
};
