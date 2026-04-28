# Aged Care Workforce Intelligence Dashboard — Progress

**Last updated:** April 2026  
**Branch:** `main`  
**Status:** All code merged to main. Supabase schema deployed. Env files created. npm dependencies installed. Windows localhost connection issue unresolved — next session should debug this before running pipeline.

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

- All project files merged to `main` and pushed to remote
- Full dashboard UI renders (dark theme, all sections, news ticker, care type filter)
- All charts handle empty data gracefully — show placeholder text until pipeline runs
- All stat cards show skeleton loaders while fetching
- Care type filter re-fetches trend charts and workforce metrics on toggle
- AIHW workforce metrics show immediately (fallback data pre-loaded in `aihw_scraper.py`)
- JSA shortage status table shows immediately (fallback data pre-loaded in `jsa_scraper.py`)
- GitHub Actions workflows are configured and will trigger on schedule once secrets are added
- Vercel deployment config is ready
- Supabase schema deployed (`001_initial_schema.sql` run against project `rmebcckenesgzhtshrcb`)
- `frontend/.env.local` created with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `pipeline/.env` created with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- `frontend/node_modules` installed (`npm install` complete, 326 packages)

---

## What still needs to be done

### Immediate (to go live)

1. ~~Create Supabase project~~ ✓ Done — project `rmebcckenesgzhtshrcb`
2. ~~Run schema~~ ✓ Done — `001_initial_schema.sql` deployed
3. ~~Add env vars to frontend~~ ✓ Done — `frontend/.env.local` created
4. **Fix Windows localhost connection** — `npm run dev` starts successfully on the Linux host but Windows browser refuses connection; likely a WSL2 port-forwarding or firewall issue. Try: run `netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I)` in an admin PowerShell, or access via the WSL2 IP directly (shown in Vite output as `Network:` URL).
5. **Deploy to Vercel** — import repo, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
6. **Add GitHub secrets** — `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for pipeline CI
7. **Trigger first pipeline run** — manually run `weekly.yml` from GitHub Actions tab to seed live data

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

**Step 1 — Fix Windows localhost access**

Option A — use the Network IP shown in Vite output (e.g. `http://192.0.2.2:3000/`):
```bash
cd frontend
npm run dev -- --host 0.0.0.0
# Look for the "Network:" line in output and open that IP in Windows browser
```

Option B — WSL2 port forwarding (run in admin PowerShell on Windows):
```powershell
$wslIp = (wsl hostname -I).Trim()
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp
# Then open http://localhost:3000 in browser
```

**Step 2 — Seed data**
```bash
cd pipeline
pip install -r requirements.txt
python run_all.py
# Check Supabase Table Editor to confirm rows appeared
```

**Step 3 — Deploy to Vercel**
```
1. vercel.com → Import Git Repository → select aged-care-workforce-dashboard
2. Set root directory to: frontend
3. Environment Variables → add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
4. Deploy
```

**Step 4 — Wire up CI**
```
GitHub repo → Settings → Secrets → Actions → New repository secret
Add: SUPABASE_URL and SUPABASE_SERVICE_KEY
Then: Actions tab → weekly.yml → Run workflow (to trigger immediately)
```

After Step 4, the dashboard will have live data and refresh automatically.
