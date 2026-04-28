"""
Fetch ABS Labour Force data for Health Care & Social Assistance.

ABS Data API docs: https://api.data.abs.gov.au/
Dataset: LABOUR_FORCE_DETAILED  (series 6291.0.55.001)
We pull:
  - Employed total, Health Care & Social Assistance (industry division)
  - Unemployment rate, Health Care & Social Assistance
  - Full-time / part-time split

Run: python abs_labour_force.py
"""
from datetime import date
import requests
from db import upsert

ABS_API = "https://api.data.abs.gov.au/data"
DATAFLOW_LF = "ABS,LABOUR_FORCE/1.0.0"

HEADERS = {
    "Accept": "application/vnd.sdmx.data+json;version=1.0",
}


def _parse_period(period_str: str) -> date | None:
    """Convert ABS period strings like '2024-M10' or '2024-Q3' to date."""
    try:
        if "-M" in period_str:
            year, m = period_str.split("-M")
            return date(int(year), int(m), 1)
        if "-Q" in period_str:
            year, q = period_str.split("-Q")
            month = (int(q) - 1) * 3 + 1
            return date(int(year), month, 1)
    except Exception:
        pass
    return None


def fetch_employment_level() -> list[dict]:
    """Employed persons -- Health Care & Social Assistance, monthly."""
    params = {
        "startPeriod": "2022-M01",
        "detail": "dataonly",
        "dimensionAtObservation": "AllDimensions",
    }

    rows = []
    for measure, col in [("1", "employed_total"), ("2", "employed_fulltime"), ("3", "employed_parttime")]:
        key = f"{DATAFLOW_LF}/1.{measure}.Q.3.TT.AUS"
        url = f"{ABS_API}/{key}"
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[abs_lf] WARNING: could not fetch {measure}: {e}")
            continue

        datasets = data.get("data", {}).get("dataSets", [])
        structure = data.get("data", {}).get("structure", {})
        if not datasets:
            continue

        obs = datasets[0].get("observations", {})
        time_dim = None
        for dim in structure.get("dimensions", {}).get("observation", []):
            if dim.get("id") == "TIME_PERIOD":
                time_dim = [v.get("id") for v in dim.get("values", [])]
                break

        for obs_key, obs_val in obs.items():
            indices = [int(i) for i in obs_key.split(":")]
            if time_dim:
                period_str = time_dim[indices[-1]]
            else:
                continue
            period = _parse_period(period_str)
            if period is None:
                continue
            value = obs_val[0]
            if value is None:
                continue
            rows.append({
                "period": period.isoformat(),
                "care_type": "sector_wide",
                "measure": col,
                "value": int(value),
            })

    merged: dict[str, dict] = {}
    for r in rows:
        key = r["period"]
        if key not in merged:
            merged[key] = {
                "period": r["period"],
                "care_type": "sector_wide",
                "source": "ABS Labour Force",
            }
        merged[key][r["measure"]] = r["value"]

    return list(merged.values())


def fetch_unemployment_rate() -> list[dict]:
    """Unemployment rate -- all industries headline, monthly."""
    params = {
        "startPeriod": "2022-M01",
        "detail": "dataonly",
        "dimensionAtObservation": "AllDimensions",
    }
    key = f"{DATAFLOW_LF}/11.20.TOT.3.TT.AUS"
    url = f"{ABS_API}/{key}"
    rows = []
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[abs_lf] WARNING: unemployment rate fetch failed: {e}")
        return rows

    datasets = data.get("data", {}).get("dataSets", [])
    structure = data.get("data", {}).get("structure", {})
    if not datasets:
        return rows

    obs = datasets[0].get("observations", {})
    time_dim = None
    for dim in structure.get("dimensions", {}).get("observation", []):
        if dim.get("id") == "TIME_PERIOD":
            time_dim = [v.get("id") for v in dim.get("values", [])]
            break

    for obs_key, obs_val in obs.items():
        indices = [int(i) for i in obs_key.split(":")]
        if time_dim:
            period_str = time_dim[indices[-1]]
        else:
            continue
        period = _parse_period(period_str)
        if period is None:
            continue
        value = obs_val[0]
        if value is None:
            continue
        rows.append({
            "period": period.isoformat(),
            "care_type": "sector_wide",
            "unemployment_rate": float(value),
            "source": "ABS Labour Force",
        })
    return rows


def run():
    print("[abs_lf] Fetching employment levels...")
    employment_rows = fetch_employment_level()
    print(f"[abs_lf] Got {len(employment_rows)} employment records")

    print("[abs_lf] Fetching unemployment rate...")
    unemp_rows = fetch_unemployment_rate()
    print(f"[abs_lf] Got {len(unemp_rows)} unemployment records")

    unemp_by_period = {r["period"]: r["unemployment_rate"] for r in unemp_rows}
    for r in employment_rows:
        r["unemployment_rate"] = unemp_by_period.get(r["period"])

    emp_periods = {r["period"] for r in employment_rows}
    standalone_unemp = [r for r in unemp_rows if r["period"] not in emp_periods]
    all_rows = employment_rows + standalone_unemp

    if all_rows:
        upsert("employment_data", all_rows, "period,care_type,source")
    print("[abs_lf] Done.")


if __name__ == "__main__":
    run()
