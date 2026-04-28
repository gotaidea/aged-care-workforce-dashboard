import React from "react";

const OPTIONS = [
  { value: "sector_wide", label: "Sector-wide" },
  { value: "home_care", label: "Home Care" },
  { value: "residential", label: "Residential" },
];

const COLORS = {
  sector_wide: "var(--sector-wide)",
  home_care: "var(--home-care)",
  residential: "var(--residential)",
};

export default function CareTypeFilter({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        const color = COLORS[opt.value];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "6px 16px",
              borderRadius: 99,
              border: `1px solid ${active ? color : "var(--border)"}`,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "inherit",
              transition: "all 0.15s ease",
              lineHeight: 1.4,
              color: active ? color : "var(--text-secondary)",
              background: active ? color + "18" : "transparent",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
