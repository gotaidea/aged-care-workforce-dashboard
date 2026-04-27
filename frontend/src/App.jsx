import React, { useState } from "react";
import NewsTicker from "./components/NewsTicker";
import StatCard from "./components/StatCard";
import ChartCard from "./components/ChartCard";
import CareTypeFilter from "./components/CareTypeFilter";
import EmploymentTrendChart from "./components/EmploymentTrendChart";
import WageTrendChart from "./components/WageTrendChart";
import { JobAdTrendChart, JobAdsByRoleChart } from "./components/JobAdChart";
import WorkforceMetrics from "./components/WorkforceMetrics";
import ShortageTable from "./components/ShortageTable";
import { useQuery } from "./hooks/useQuery";
import {
  fetchLatestUnemploymentRate,
  fetchLatestWPI,
  fetchLatestJobAds,
  fetchShortageStatus,
  fetchEmploymentTrend,
  fetchWageTrend,
  fetchJobAdTrend,
  fetchWorkforceCharacteristics,
  fetchLatestEmploymentLevel,
} from "./lib/api";
import { format } from "date-fns";

function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div>
          <div style={styles.headerTitle}>Aged Care Workforce Intelligence</div>
          <div style={styles.headerSub}>Australian labour market data — updated automatically</div>
        </div>
        <div style={styles.headerMeta}>
          <span style={styles.metaTag}>Australia</span>
          <span style={styles.metaTag}>Health Care &amp; Social Assistance</span>
        </div>
      </div>
    </header>
  );
}

function SectionHeading({ children }) {
  return <h2 style={styles.sectionHeading}>{children}</h2>;
}

export default function App() {
  const [careType, setCareType] = useState("sector_wide");

  const unemp = useQuery(fetchLatestUnemploymentRate);
  const wpi = useQuery(fetchLatestWPI);
  const jobAds = useQuery(fetchLatestJobAds);
  const shortage = useQuery(fetchShortageStatus);
  const empLevel = useQuery(fetchLatestEmploymentLevel);

  const empTrend = useQuery(() => fetchEmploymentTrend(careType), [careType]);
  const wageTrend = useQuery(fetchWageTrend);
  const jobAdTrend = useQuery(() => fetchJobAdTrend(careType), [careType]);
  const workforce = useQuery(fetchWorkforceCharacteristics, []);

  const latestUnemp = unemp.data?.[0];
  const prevUnemp = unemp.data?.[1];
  const unempChange = latestUnemp && prevUnemp
    ? latestUnemp.unemployment_rate - prevUnemp.unemployment_rate
    : undefined;

  const wpiRows = wpi.data || [];
  const healthWPI = wpiRows.find((r) => r.industry === "health_social");
  const allWPI = wpiRows.find((r) => r.industry === "all_industries");

  const latestEmp = empLevel.data?.find((r) => r.care_type === "sector_wide");
  const latestJobAds = jobAds.data?.find((r) => r.role_category === "All Aged Care (SEEK category)");
  const shortageCount = shortage.data?.filter((r) => r.shortage_level === "shortage").length;

  return (
    <div style={styles.app}>
      <NewsTicker />
      <Header />

      <main style={styles.main}>
        <div style={styles.filterRow}>
          <CareTypeFilter value={careType} onChange={setCareType} />
          <span style={styles.filterNote}>Filter applies to trend charts and workforce metrics</span>
        </div>

        <SectionHeading>Headline Metrics</SectionHeading>
        <div style={styles.statGrid}>
          <StatCard
            title="Unemployment Rate"
            value={latestUnemp?.unemployment_rate?.toFixed(1) ?? null}
            unit="%"
            subtitle={latestUnemp ? `Period: ${format(new Date(latestUnemp.period), "MMM yyyy")}` : undefined}
            change={unempChange}
            changeSuffix="pp"
            sentiment="down_good"
            loading={unemp.loading}
            source="ABS Labour Force"
          />
          <StatCard
            title="Sector Employment"
            value={latestEmp?.employed_total ? (latestEmp.employed_total / 1000).toFixed(0) : null}
            unit="k workers"
            subtitle="Health Care & Social Assistance"
            loading={empLevel.loading}
            source="ABS Labour Force"
          />
          <StatCard
            title="WPI Growth — Health & Social"
            value={healthWPI?.wpi_annual_change?.toFixed(1) ?? null}
            unit="%"
            subtitle={allWPI ? `All industries: ${allWPI.wpi_annual_change?.toFixed(1)}%` : undefined}
            change={healthWPI && allWPI ? healthWPI.wpi_annual_change - allWPI.wpi_annual_change : undefined}
            changeSuffix="pp vs all industries"
            sentiment="up_good"
            loading={wpi.loading}
            source="ABS Wage Price Index"
          />
          <StatCard
            title="Care Worker Shortage"
            value={shortageCount ?? null}
            unit="occupations"
            subtitle="Currently on Skills Priority List"
            badge={shortageCount > 0 ? "Active shortage" : undefined}
            badgeColor="var(--accent-red)"
            loading={shortage.loading}
            source="Jobs & Skills Australia"
          />
          <StatCard
            title="Live Job Ads — SEEK"
            value={latestJobAds?.ad_count?.toLocaleString() ?? null}
            subtitle="All aged care roles, national"
            badge={latestJobAds ? "SEEK" : undefined}
            badgeColor="var(--accent-teal)"
            loading={jobAds.loading}
            source="SEEK (via search API)"
          />
        </div>

        <SectionHeading>Employment Trends</SectionHeading>
        <ChartCard
          title="Employed Persons — Health Care & Social Assistance"
          subtitle="Monthly, thousands of persons. Right axis: unemployment rate (all industries)."
        >
          <EmploymentTrendChart data={empTrend.data} loading={empTrend.loading} />
        </ChartCard>

        <SectionHeading>Wage & Salary Data</SectionHeading>
        <ChartCard
          title="Wage Price Index — Annual % Change"
          subtitle="Health & Social Assistance vs all industries. Quarterly."
        >
          <WageTrendChart data={wageTrend.data} loading={wageTrend.loading} />
        </ChartCard>

        <SectionHeading>Job Market</SectionHeading>
        <div style={styles.twoCol}>
          <ChartCard title="SEEK Job Ad Volume" subtitle="All aged care roles, national, weekly snapshots.">
            <JobAdTrendChart data={jobAdTrend.data} loading={jobAdTrend.loading} />
          </ChartCard>
          <ChartCard title="Most In-Demand Roles" subtitle="Live ad count by role — latest snapshot.">
            <JobAdsByRoleChart data={jobAds.data} loading={jobAds.loading} />
          </ChartCard>
        </div>

        <SectionHeading>Workforce Characteristics</SectionHeading>
        <ChartCard title="Workforce Profile" subtitle="AIHW Aged Care Workforce Census. Updated biennially.">
          <WorkforceMetrics data={workforce.data} loading={workforce.loading} careType={careType} />
        </ChartCard>

        <SectionHeading>Occupation Shortage Status</SectionHeading>
        <ChartCard
          title="Skills Priority List — Aged Care Occupations"
          subtitle="Jobs and Skills Australia. Updated annually."
        >
          <ShortageTable data={shortage.data} loading={shortage.loading} />
        </ChartCard>
      </main>

      <footer style={styles.footer}>
        <span>Aged Care Workforce Intelligence Dashboard</span>
        <span>·</span>
        <span>Data: ABS, AIHW, JSA, SEEK</span>
        <span>·</span>
        <span>Not financial or investment advice</span>
      </footer>
    </div>
  );
}

const styles = {
  app: { display: "flex", flexDirection: "column", minHeight: "100vh" },
  header: { borderBottom: "1px solid var(--border)", background: "var(--bg-card)", padding: "20px 0", flexShrink: 0 },
  headerInner: { maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  headerTitle: { fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" },
  headerSub: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  headerMeta: { display: "flex", gap: 8, flexWrap: "wrap" },
  metaTag: { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "var(--border)", padding: "4px 10px", borderRadius: 99, letterSpacing: "0.03em" },
  main: { flex: 1, maxWidth: 1280, margin: "0 auto", padding: "28px 24px", width: "100%", display: "flex", flexDirection: "column", gap: 24 },
  filterRow: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
  filterNote: { fontSize: 11, color: "var(--text-muted)" },
  sectionHeading: { fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: -8 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 16 },
  footer: { borderTop: "1px solid var(--border)", padding: "14px 24px", fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 1280, margin: "0 auto", width: "100%" },
};
