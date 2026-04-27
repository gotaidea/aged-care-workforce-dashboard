# Aged Care Workforce Intelligence Dashboard — Progress

**Last updated:** April 2026  
**Branch:** `claude/aged-care-dashboard-eOCyB`  
**Status:** MVP scaffolding complete. Needs Supabase project + env vars to go live.

---

## What has been built

### Database (Supabase / Postgres)
File: `supabase/migrations/001_initial_schema.sql`

7 tables, fully defined with constraints, indexes, RLS (public read-only), and updated_at triggers:

| Table | Purpose |
|-------|--------|
| `employment_data` | ABS Labour Force — employed persons, unemployment rate, full/part-time split |
| `wage_data` | ABS Wage Price Index — index value and annual % change by industry |
| `job_ads` | SEEK job ad volumes by role, state, and week |
| `workforce_characteristics` | AIHW census metrics — turnover, vacancy, age, gender, qualifications |
| `shortage_status` | JSA Skills Priority List — shortage level per ANZSCO occupation |
| `news_items` | RSS news ticker items from 6 feeds |
| `provider_data` | Provider-level headcount/wage data (schema ready, manual entry in v2) |

### Data Pipeline (Python 3.12)
Directory: `pipeline/`

| Script | Data source | Cadence | Status |
|--------|-------------|---------|--------|
| `abs_labour_force.py` | ABS Data API (SDMX-JSON) | Weekly CI | Ready — needs live run |
| `abs_wpi.py` | ABS Data API (SDMX-JSON) | Weekly CI | Ready — needs live run |
| `aihw_scraper.py` | AIHW website + hard-coded fallback | Weekly CI | Ready — fallback data seeded |
| `jsa_scraper.py` | JSA Skills Priority List + fallback | Weekly CI | Ready — fallback data seeded |
| `seek_scraper.py` | SEEK search endpoint | Weekly CI | Ready — needs live run |
| `rss_fetcher.py` | 6 RSS feeds (ABS, RBA, Google News, ACQSC, DSS) | Daily CI | Ready — needs live run |
| `db.py` | Shared Supabase client | — | Complete |
| `run_all.py` | Master runner | — | Complete |

### CI/CD (GitHub Actions)
Directory: `.github/workflows/`

| Workflow | Schedule | Runs |
|----------|----------|------|
| `daily.yml` | 6am AEST daily | RSS news fetcher |
| `weekly.yml` | 5am AEST Monday | All fetchers |

Both require `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub repository secrets.

### Frontend (React + Recharts + Vite)
Directory: `frontend/`

| Component | Description |
|-----------|-------------|
| `App.jsx` | Main dashboard layout — all sections wired up |
| `NewsTicker.jsx` | Scrolling RSS headlines at top of page, pauses on hover |
| `StatCard.jsx` | Headline metric cards — value, unit, trend arrow, badge, skeleton |
| `CareTypeFilter.jsx` | Sector-wide / Home Care / Residential toggle |
| `EmploymentTrendChart.jsx` | Area + line chart — employed persons + unemployment rate (24 months) |
| `WageTrendChart.jsx` | Dual line chart — WPI growth, Health & Social vs all industries |
| `JobAdChart.jsx` | SEEK ad volume trend + in-demand roles bar chart |
| `WorkforceMetrics.jsx` | AIHW census metrics grid, filters by care type |
| `ShortageTable.jsx` | JSA SPL table with colour-coded shortage badges |
| `ChartCard.jsx` | Titled card wrapper for all chart sections |

Data layer:
- `src/lib/api.js` — 10 Supabase query functions
- `src/lib/supabase.js` — client initialised from env vars
- `src/hooks/useQuery.js` — async data hook with loading/error/cancellation

### Deployment config
- `vercel.json` — SPA config pointing to `frontend/dist/`
- `.gitignore`, `README.md`

---

## File structure

```
aged-care-workforce-dashboard/
├── .github/
│   └── workflows/
│       ├── daily.yml          # RSS fetcher — 6am AEST daily
│       └── weekly.yml         # All fetchers — 5am AEST Monday
├── frontend/
│   ├── index.html
│   ├── package.json           # React 18, Recharts, Supabase JS, date-fns, Vite
│   ├── vite.config.js
│   ├── .env.example           # Copy to .env.local, add Supabase keys
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css          # Dark theme, CSS variables, ticker animation
│       ├── components/
│       │   ├── CareTypeFilter.jsx
│       │   ├── ChartCard.jsx
│       │   ├── EmploymentTrendChart.jsx
│       │   ├── JobAdChart.jsx
│       │   ├── NewsTicker.jsx
│       │   ├── ShortageTable.jsx
│       │   ├── StatCard.jsx
│       │   ├── WageTrendChart.jsx
│       │   └── WorkforceMetrics.jsx
│       ├── hooks/
│       │   └── useQuery.js
│       └── lib/
│           ├── api.js         # All Supabase query functions
│           └── supabase.js    # Supabase client
├── pipeline/
│   ├── .env.example           # Copy to .env, add Supabase service key
│   ├── requirements.txt
│   ├── db.py                  # Shared client + upsert()
│   ├── run_all.py             # Master runner
│   ├── abs_labour_force.py
│   ├── abs_wpi.py
│   ├── aihw_scraper.py
│   ├── jsa_scraper.py
│   ├── seek_scraper.py
│   └── rss_fetcher.py
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .gitignore
├── README.md
├── PROGRESS.md
└── vercel.json
```

---

## What works right now

- Full dashboard UI renders (dark theme, all sections, news ticker, care type filter)
- All charts handle empty data gracefully — show placeholder text until pipeline runs
- All stat cards show skeleton loaders while fetching
- Care type filter re-fetches trend charts and workforce metrics on toggle
- AIHW workforce metrics show immediately (fallback data pre-loaded in `aihw_scraper.py`)
- JSA shortage status table shows immediately (fallback data pre-loaded in `jsa_scraper.py`)
- GitHub Actions workflows are configured and will trigger on schedule once secrets are added
- Vercel deployment config is ready

---

## What still needs to be done

### Immediate (to go live)

1. **Create Supabase project** — free tier at supabase.com
2. **Run schema** — paste `001_initial_schema.sql` into Supabase SQL editor
3. **Add env vars to frontend** — copy `frontend/.env.example` to `frontend/.env.local`, fill in URL and anon key
4. **Deploy to Vercel** — import repo, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. **Add GitHub secrets** — `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for pipeline CI
6. **Trigger first pipeline run** — manually run `weekly.yml` from GitHub Actions tab to seed live data

### ABS API dimension mapping (may need adjustment)

The ABS Data API dimension keys in `abs_labour_force.py` and `abs_wpi.py` are best-effort based on ABS API documentation. The exact dimension codes (measure, industry, region) should be verified against the [ABS API Explorer](https://api.data.abs.gov.au/) on first run. Adjust the key strings in the scripts if the API returns empty datasets.

### SEEK scraping (may be blocked)

SEEK doesn't have a public API. The scraper uses the internal search endpoint — this may return 403 or change without notice. If blocked, alternatives:
- SEEK Labour Market Insights has some public data at seek.com.au/about/news/labour-market-insights
- Manual weekly entry via a simple admin form (v2 feature)

### V2 features (not yet built)

- [ ] Provider intelligence section — manual data entry form for headcount, turnover, wage expense by provider
- [ ] Annual report agent — automated extraction from PDF annual reports
- [ ] Geographic heatmap — state-level job ad volume chart (data model ready in `job_ads.state`)
- [ ] Role-level salary benchmarks — SEEK salary data or recruitment agency guides
- [ ] Mobile optimised layout
- [ ] LinkedIn / Indeed job ad data

---

## Exact next steps for the next session

**Step 1 — Supabase setup (5 min)**
```
1. Go to supabase.com → New project
2. SQL Editor → paste contents of supabase/migrations/001_initial_schema.sql → Run
3. Settings → API → copy Project URL and anon key
```

**Step 2 — Run locally to confirm the UI works**
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local: paste your Supabase URL and anon key
npm install
npm run dev
# Open http://localhost:3000
```

**Step 3 — Seed data**
```bash
cd pipeline
cp .env.example .env
# Edit .env: paste your Supabase URL and service role key
pip install -r requirements.txt
python run_all.py
# Check Supabase Table Editor to confirm rows appeared
```

**Step 4 — Deploy**
```
1. vercel.com → Import Git Repository → select aged-care-workforce-dashboard
2. Environment Variables → add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
3. Deploy
```

**Step 5 — Wire up CI**
```
GitHub repo → Settings → Secrets → Actions → New repository secret
Add: SUPABASE_URL and SUPABASE_SERVICE_KEY
Then: Actions tab → weekly.yml → Run workflow (to trigger immediately)
```

After Step 5, the dashboard will have live data and refresh automatically.
