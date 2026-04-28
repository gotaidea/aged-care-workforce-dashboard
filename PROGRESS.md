# Aged Care Workforce Intelligence Dashboard - Progress

**Last updated:** 28 April 2026  
**Branch:** `main`  
**Status:** Local dashboard running. Supabase seeded with ABS, WPI, AIHW, JSA, and RSS data. GitHub secrets configured. Pipeline runs end-to-end locally. SEEK job ads remain unresolved because the old SEEK endpoint now returns 404.

---

## Current Local Setup

Primary working locations on this machine:

| Path | Purpose |
|------|---------|
| `C:\dev\aged-care-workforce-dashboard` | Running local app copy |
| `C:\dev\aged-care-workforce-dashboard-git` | Clean Git checkout used for commits and pushes |

Local dashboard:

```powershell
http://127.0.0.1:3000/
```

The Vite server is running from `C:\dev\aged-care-workforce-dashboard\frontend`.

Important Windows note: `npm run dev` and `npm run build` may hit a bare `Access is denied` from command shims inside this Codex shell. Running Vite directly through Node works:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\node.exe' node_modules\vite\bin\vite.js --host 127.0.0.1
& 'C:\Program Files\nodejs\node.exe' node_modules\vite\bin\vite.js build
```

---

## Supabase

| Item | Status |
|------|--------|
| Project ID | `rmebcckenesgzhtshrcb` |
| Project URL | `https://rmebcckenesgzhtshrcb.supabase.co` |
| Schema | Deployed |
| Local env files | Created and gitignored |
| GitHub Actions secrets | `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set |

Current row counts after the successful local pipeline run:

| Table | Rows | Status |
|-------|------|--------|
| `employment_data` | 63 | Seeded from ABS Labour Account + Labour Force |
| `wage_data` | 48 | Seeded from ABS WPI |
| `job_ads` | 0 | SEEK endpoint returns 404 |
| `workforce_characteristics` | 22 | Seeded from AIHW fallback data |
| `shortage_status` | 9 | Seeded from JSA fallback data |
| `news_items` | 17 | Seeded from Health Department + Google News RSS |

---

## What Works

- Local React/Vite dashboard loads at `http://127.0.0.1:3000/`.
- Production Vite build succeeds when run directly through Node.
- Supabase client works with the new Supabase publishable/secret key format.
- Pipeline dependencies install with Python 3.12.
- Full local pipeline completes successfully with:

```powershell
cd C:\dev\aged-care-workforce-dashboard\pipeline
& 'C:\Users\danie\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -u run_all.py
```

- GitHub CLI is authenticated as `gotaidea`.
- GitHub repo access confirmed as `ADMIN`.
- Commits pushed to `main`.

Recent pushed commits:

| Commit | Summary |
|--------|---------|
| `e339d64` | Fix pipeline compatibility with Supabase keys |
| `ce5dd1b` | Refresh ABS and RSS data sources |

---

## Data Pipeline Status

| Script | Data source | Status |
|--------|-------------|--------|
| `abs_labour_force.py` | ABS `LABOUR_ACCT_Q` + `LF` | Working |
| `abs_wpi.py` | ABS `WPI` v1.2.0 | Working |
| `aihw_scraper.py` | AIHW page + fallback data | Fallback seeds successfully; page URL currently 404 |
| `jsa_scraper.py` | JSA + fallback data | Fallback seeds successfully |
| `rss_fetcher.py` | Health Department RSS + Google News RSS | Working |
| `seek_scraper.py` | Old SEEK internal endpoint | Not working; endpoint returns 404 |

The full pipeline currently reports SEEK warnings but still exits successfully.

---

## Frontend Status

Working sections with live/seeded data:

- Headline unemployment rate
- Sector employment
- WPI growth
- Care worker shortage
- Employment trend chart
- Wage trend chart
- Workforce profile
- Shortage table
- News ticker

Still empty:

- SEEK job ad volume
- Most in-demand roles

Reason: the old SEEK endpoint `https://www.seek.com.au/api/chalice-search/v4/search` now returns 404.

---

## GitHub Actions

Workflows:

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| `.github/workflows/daily.yml` | Daily | RSS news fetcher |
| `.github/workflows/weekly.yml` | Weekly | Full data pipeline |

Secrets are set in GitHub:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Next session should manually trigger both workflows from GitHub Actions and confirm they pass in the cloud environment.

---

## Next Session Plan

1. **Verify GitHub Actions**
   - Manually run `weekly.yml`.
   - Manually run `daily.yml`.
   - Confirm both pass and rows remain current in Supabase.

2. **Deploy Frontend to Vercel**
   - Import `gotaidea/aged-care-workforce-dashboard`.
   - Set root directory to `frontend`.
   - Add env vars:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Deploy and verify the live site.

3. **Replace SEEK Job Ads Source**
   - SEEK old internal endpoint is gone/blocked.
   - Options:
     - Find a current public endpoint.
     - Use Google/Serp/API search counts if acceptable.
     - Use provider careers pages.
     - Build a manual weekly import/admin flow.
     - Use LinkedIn/Indeed or agency job boards as alternate sources.

4. **Provider Intelligence / Annual Report Agent V2**
   - Build provider target list.
   - Add richer provider/source schema if needed:
     - `providers`
     - `provider_reports`
     - `provider_metrics`
     - `provider_sources`
   - Pilot extraction over 5-10 providers before scaling:
     - Bolton Clarke
     - Bupa Aged Care
     - Estia Health
     - Regis
     - Opal HealthCare
     - Uniting / UnitingCare
     - HammondCare
     - BaptistCare
     - Anglicare
     - Australian Unity
   - Extract: headcount, FTE, turnover, vacancy rate, wage expense, revenue, agency labour spend, care minutes, workforce risk notes, source URL, page number, confidence score.

---

## Useful Commands

Start local dashboard:

```powershell
cd C:\dev\aged-care-workforce-dashboard\frontend
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\node.exe' node_modules\vite\bin\vite.js --host 127.0.0.1
```

Run full pipeline locally:

```powershell
cd C:\dev\aged-care-workforce-dashboard\pipeline
& 'C:\Users\danie\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -u run_all.py
```

Build frontend:

```powershell
cd C:\dev\aged-care-workforce-dashboard\frontend
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\node.exe' node_modules\vite\bin\vite.js build
```

Check Git status:

```powershell
cd C:\dev\aged-care-workforce-dashboard-git
git status --short --branch --ignored
```
