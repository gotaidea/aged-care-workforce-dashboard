# Aged Care Workforce Intelligence Dashboard — Codex Handover

**Date:** April 2026  
**Prepared by:** Claude (claude-sonnet-4-6)  
**Handed to:** Codex  
**Repo:** `gotaidea/aged-care-workforce-dashboard` — branch `main`

---

## Project overview

A real-time workforce intelligence dashboard for the Australian aged care sector. It pulls data from public Australian government APIs and job platforms, stores it in Supabase (Postgres), and displays it as a dark-theme React dashboard.

**Purpose:** Give aged care operators and policy people a single view of sector employment trends, wage growth, SEEK job ad volumes, AIHW workforce census metrics, and JSA occupation shortage status — all auto-refreshed via GitHub Actions CI.

**Stack:**
- **Frontend:** React 18 + Recharts + Vite, deployed to Vercel
- **Database:** Supabase (Postgres), public read-only via anon key
- **Pipeline:** Python 3.12 scripts, run on GitHub Actions schedule
- **CI/CD:** GitHub Actions (daily + weekly workflows)

---

## Supabase project

| | |
|---|---|
| **Project ID** | `rmebcckenesgzhtshrcb` |
| **Project URL** | `https://rmebcckenesgzhtshrcb.supabase.co` |
| **Anon key** | see `frontend/.env.local` on disk (gitignored) |
| **Service role key** | see `pipeline/.env` on disk (gitignored) |
| **Schema status** | Deployed — all 7 tables created, indexes and RLS in place |
| **Data status** | Empty (no pipeline run yet) — AIHW and JSA show fallback data in UI |

---

## Full file structure

```
aged-care-workforce-dashboard/
├── .github/
│   └── workflows/
│       ├── daily.yml              # Runs rss_fetcher.py at 6am AEST daily
│       └── weekly.yml             # Runs all fetchers at 5am AEST Monday
├── frontend/
│   ├── .env.example               # Template — actual keys go in .env.local
│   ├── .env.local                 # ✓ Created — Supabase URL + anon key (gitignored)
│   ├── index.html
│   ├── package.json               # React 18, Recharts 2, Supabase JS 2, date-fns 3, Vite 5
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                # Root layout — wires all sections together
│       ├── main.jsx               # React entry point
│       ├── index.css              # Dark theme CSS variables + ticker animation
│       ├── components/
│       │   ├── CareTypeFilter.jsx # Toggle: Sector-wide / Home Care / Residential
│       │   ├── ChartCard.jsx      # Titled card wrapper used by all chart sections
│       │   ├── EmploymentTrendChart.jsx  # Area chart — employed persons + unemployment rate
│       │   ├── JobAdChart.jsx     # Two exports: JobAdTrendChart + JobAdsByRoleChart
│       │   ├── NewsTicker.jsx     # Horizontally scrolling RSS headlines, pauses on hover
│       │   ├── ShortageTable.jsx  # JSA Skills Priority List table with colour-coded badges
│       │   ├── StatCard.jsx       # Headline metric card with trend arrow + skeleton loader
│       │   ├── WageTrendChart.jsx # Dual line chart — WPI Health & Social vs all industries
│       │   └── WorkforceMetrics.jsx  # AIHW census metrics grid, filtered by care type
│       ├── hooks/
│       │   └── useQuery.js        # Async data hook: loading / error / cancellation via flag
│       └── lib/
│           ├── api.js             # 10 Supabase query functions (one per data need)
│           └── supabase.js        # Supabase client, initialised from VITE_ env vars
├── pipeline/
│   ├── .env.example               # Template — actual keys go in .env (gitignored)
│   ├── .env                       # ✓ Created — Supabase URL + service role key (gitignored)
│   ├── requirements.txt           # requests, supabase, python-dotenv, feedparser, bs4, pandas
│   ├── db.py                      # Shared Supabase client + generic upsert() helper
│   ├── run_all.py                 # Master runner — loops FETCHERS list, exits 1 on any error
│   ├── abs_labour_force.py        # ABS Labour Force Survey via SDMX-JSON API
│   ├── abs_wpi.py                 # ABS Wage Price Index via SDMX-JSON API
│   ├── aihw_scraper.py            # AIHW Aged Care Workforce Census + hardcoded fallback data
│   ├── jsa_scraper.py             # JSA Skills Priority List + hardcoded fallback data
│   ├── seek_scraper.py            # SEEK internal search endpoint (may return 403 — see gotchas)
│   └── rss_fetcher.py             # 6 RSS feeds: ABS, RBA, Google News, ACQSC, DSS
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Full schema — already deployed to Supabase project
├── .gitignore                     # Covers .env*, node_modules/, dist/, __pycache__/
├── PROGRESS.md                    # Running build log
├── HANDOVER.md                    # This file
├── README.md                      # Empty (placeholder)
└── vercel.json                    # SPA rewrite rule pointing to frontend/dist/
```

**What is NOT in the repo (gitignored):**
- `frontend/.env.local` — exists on disk, has the Supabase anon key
- `pipeline/.env` — exists on disk, has the Supabase service role key
- `frontend/node_modules/` — exists on disk, `npm install` already run (326 packages)

---

## What is working

- All code merged to `main` and pushed to remote
- Supabase schema deployed — 7 tables, RLS policies, indexes, `updated_at` triggers all in place
- `frontend/.env.local` and `pipeline/.env` created with live Supabase credentials
- `npm install` complete — `frontend/node_modules/` present on disk
- Vite dev server starts successfully (`npm run dev -- --host 0.0.0.0` from `frontend/`)
- Full dashboard UI structure is correct — dark theme, news ticker, care type filter, all chart sections
- AIHW and JSA sections show hardcoded fallback data immediately (no pipeline run needed)
- All other sections show "No data" / skeleton loaders gracefully while Supabase tables are empty
- GitHub Actions workflows are wired up and will run on schedule once secrets are added

---

## What is NOT working

### 1. Windows localhost connection refused (blocker for local preview)

`npm run dev` on the Linux host (WSL2 or Codex sandbox) starts Vite fine and binds to `0.0.0.0:3000`. The Windows browser then refuses the connection.

**Root cause:** WSL2 runs in a lightweight VM with its own network namespace. Windows does not automatically forward WSL2 ports to localhost.

**Fix options (try in order):**

Option A — open the Network IP directly. Vite prints two URLs on start:
```
Local:   http://localhost:3000/
Network: http://192.0.2.x:3000/    ← open THIS one in Windows browser
```

Option B — add a WSL2 port-forwarding rule (run once in admin PowerShell):
```powershell
$wslIp = (wsl hostname -I).Trim()
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp
```
Then `http://localhost:3000` will work in Windows.

Option C — use `localhost.run` or `npx localtunnel --port 3000` for a temporary public URL.

### 2. No live data in the dashboard

The data pipeline has never been run. ABS, SEEK, and RSS sections show empty state. Fix: run the pipeline (see next steps).

### 3. GitHub Actions CI not yet active

The workflows exist but `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` have not been added as GitHub repo secrets yet, so the scheduled runs will fail silently.

---

## Next steps in order

### Step 1 — Confirm UI works (fix localhost)
```bash
cd frontend
npm run dev -- --host 0.0.0.0
# Note the "Network:" IP in output and open it in Windows browser
```

### Step 2 — Seed the database
```bash
cd pipeline
pip install -r requirements.txt
python run_all.py
# Then check Supabase Table Editor — rows should appear in employment_data, wage_data, etc.
```

### Step 3 — Deploy frontend to Vercel
```
1. vercel.com → Add New Project → Import Git Repository
2. Select: gotaidea/aged-care-workforce-dashboard
3. Set root directory to: frontend
4. Framework preset: Vite
5. Environment Variables:
     VITE_SUPABASE_URL  = https://rmebcckenesgzhtshrcb.supabase.co
     VITE_SUPABASE_ANON_KEY = (from frontend/.env.local)
6. Deploy
```

### Step 4 — Add GitHub Actions secrets
```
GitHub repo → Settings → Secrets and variables → Actions → New repository secret

SUPABASE_URL        = https://rmebcckenesgzhtshrcb.supabase.co
SUPABASE_SERVICE_KEY = (from pipeline/.env)

Then: Actions tab → weekly.yml → Run workflow  (seeds data immediately)
```

After Step 4, the dashboard is fully live and self-updating.

---

## Gotchas

### ABS API dimension codes may need adjustment
`abs_labour_force.py` and `abs_wpi.py` use SDMX-JSON dimension keys that were written from ABS API documentation without a live test run. If the scripts return empty datasets, the dimension key strings (measure, industry, region) need to be verified against the ABS API Explorer at `https://api.data.abs.gov.au/`. The scripts have comments indicating which variables to adjust.

### SEEK scraper may be blocked
`seek_scraper.py` hits SEEK's internal search API endpoint. SEEK has no public API and this endpoint may return 403 or break without notice. If blocked:
- Check SEEK Labour Market Insights for manually downloadable data
- Or skip SEEK and remove it from `run_all.py` FETCHERS list temporarily

### `vercel.json` root vs `frontend/` root
`vercel.json` is in the repo root but the actual Vite project is in `frontend/`. When importing to Vercel, explicitly set the **root directory** to `frontend` — otherwise Vercel will try to build from the repo root and fail.

### `.env.local` and `.env` are gitignored — they exist on disk only
These files are on disk in the Codex environment but will not appear in a fresh `git clone`. If working in a new environment, recreate them:
```
frontend/.env.local:
  VITE_SUPABASE_URL=https://rmebcckenesgzhtshrcb.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon key — get from Supabase dashboard: Settings → API>

pipeline/.env:
  SUPABASE_URL=https://rmebcckenesgzhtshrcb.supabase.co
  SUPABASE_SERVICE_KEY=<service role key — get from Supabase dashboard: Settings → API>
```

### `useQuery` dependency array is manual
`src/hooks/useQuery.js` takes a `deps` array as second argument (mirrors `useEffect`). The `eslint-disable` comment suppresses the exhaustive-deps warning deliberately — the hook is designed this way so callers control re-fetch triggers (e.g. care type filter changes).

### Care type filter affects only two sections
`CareTypeFilter` in `App.jsx` re-fetches `fetchEmploymentTrend(careType)` and `fetchJobAdTrend(careType)` on toggle. The WPI chart, shortage table, and news ticker are not affected by the filter — this is intentional (ABS and JSA data is not broken out by care type in the source data).

### AIHW and JSA fallback data is hardcoded for 2023
The fallback rows in `aihw_scraper.py` and `jsa_scraper.py` use period `2023-01-01`. Once a live pipeline run inserts newer rows, the UI will prefer those. The fallbacks are only there so the UI isn't completely empty on first load.

---

## V2 backlog (not started)

- Provider intelligence section — manual data entry form for headcount, turnover, wage expense per provider
- Annual report PDF agent — automated extraction from provider PDF annual reports
- Geographic heatmap — state-level job ad volume (data model already has `job_ads.state` column)
- Role-level salary benchmarks — SEEK salary data or recruitment agency guides
- Mobile-optimised layout
- LinkedIn / Indeed job ad data as SEEK fallback
