import React from "react";
import { useQuery } from "../hooks/useQuery";
import { fetchNewsItems } from "../lib/api";

export default function NewsTicker() {
  const { data: items, loading } = useQuery(fetchNewsItems);

  if (loading || !items?.length) {
    return (
      <div style={styles.bar}>
        <span style={styles.label}>LATEST</span>
        <span style={styles.loading}>{loading ? "Loading headlines..." : "No news items available."}</span>
      </div>
    );
  }

  const display = [...items, ...items];

  return (
    <div style={styles.bar}>
      <span style={styles.label}>LATEST</span>
      <div style={styles.viewport}>
        <div className="ticker-track">
          {display.map((item, i) => (
            <span key={i} style={styles.item}>
              {item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                  {item.title}
                </a>
              ) : item.title}
              <span style={styles.source}>{item.source}</span>
              <span style={styles.sep}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  bar: { background: "#12141e", borderBottom: "1px solid var(--border)", height: 38, display: "flex", alignItems: "center", overflow: "hidden", flexShrink: 0 },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent-blue)", padding: "0 14px", flexShrink: 0, borderRight: "1px solid var(--border)", alignSelf: "stretch", display: "flex", alignItems: "center", background: "var(--accent-blue)0d" },
  viewport: { flex: 1, overflow: "hidden", height: "100%", display: "flex", alignItems: "center" },
  loading: { fontSize: 12, color: "var(--text-muted)", padding: "0 16px" },
  item: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" },
  link: { color: "var(--text-primary)", textDecoration: "none" },
  source: { fontSize: 10, color: "var(--text-muted)", background: "var(--border)", padding: "1px 6px", borderRadius: 4, fontWeight: 500 },
  sep: { color: "var(--border)", fontSize: 16, userSelect: "none" },
};
