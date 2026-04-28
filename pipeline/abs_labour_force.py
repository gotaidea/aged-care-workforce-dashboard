"""
Fetch ABS employment and unemployment data.

ABS Data API docs: https://api.data.abs.gov.au/
Datasets:
  - LABOUR_ACCT_Q for Health Care & Social Assistance employment
  - LF for national unemployment rate
We pull:
  - Labour Account employed persons, Health Care & Social Assistance
  - National unemployment rate

Run: python abs_labour_force.py
"""
from datetime import date
import requests
from db import upsert

ABS_API = "https://data.api.abs.gov.au/rest/data"
DATAFLOW_LABOUR_ACCOUNT = "ABS,LABOUR_ACCT_Q,1.0.0"
DATAFLOW_LF = "ABS,LF,1.0.0"

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
        if len(period_str) == 7 and period_str[4] == "-":
            year, m = period_str.split("-")
            return date(int(year), int(m), 1)
    except Exception:
        pass
    return None


def fetch_employment_level() -> list[dict]:
    """Employed persons -- Health Care & Social Assistance, quarterly."""
    params = {
        "startPeriod": "2022-Q1",
        "detail": "dataonly",
        "dimensionAtObservation": "AllDimensions",
    }

    rows = []
    # Dimensions: MEASURE.ASGS_2016.LABOURACCT_IND.TSEST.FREQ
    # M19 = Labour Account employed persons, Q = Health Care and Social Assistance,
    # 10 = Original, Q = Quarterly.
    key = f"{DATAFLOW_LABOUR_ACCOUNT}/M19.AUS.Q.10.Q"
    url = f"{ABS_API}/{key}"
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[abs_lf] WARNING: could not fetch Labour Account employment: {e}")
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
        if not time_dim:
            continue
        period = _parse_period(time_dim[indices[-1]])
        value = obs_val[0]
        if period is None or value is None:
            continue
        rows.append({
            "period": period.isoformat(),
            "care_type": "sector_wide",
            "employed_total": int(round(value)),
            "source": "ABS Labour Account",
        })

    return rows


def fetch_unemployment_rate() -> list[dict]:
    """Unemployment rate -- all industries headline, monthly."""
    params = {
        "startPeriod": "2022-M01",
        "detail": "dataonly",
        "dimensionAtObservation": "AllDimensions",
    }
    # Dimensions: MEASURE.SEX.AGE.TSEST.REGION.FREQ
    # M13 = unemployment rate, 3 = persons, 1599 = total age,
    # 20 = seasonally adjusted, AUS = Australia, M = monthly.
    key = f"{DATAFLOW_LF}/M13.3.1599.20.AUS.M"
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
