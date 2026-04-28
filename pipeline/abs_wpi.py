"""
Fetch ABS Wage Price Index (WPI) data.

Dataset: WAGE_PRICE_INDEX (ABS cat. 6345.0)
We pull index values for:
  - Health Care & Social Assistance
  - All industries (total)

Run: python abs_wpi.py
"""
import requests
from db import upsert

ABS_API = "https://api.data.abs.gov.au/data"
DATAFLOW_WPI = "ABS,WAGE_PRICE_INDEX/1.0.0"

HEADERS = {
    "Accept": "application/vnd.sdmx.data+json;version=1.0",
}

INDUSTRIES = {
    "Q": "health_social",
    "TOT": "all_industries",
}


def _parse_quarter(period_str: str):
    """Convert '2024-Q3' to date string '2024-07-01'."""
    from datetime import date
    try:
        year, q = period_str.split("-Q")
        month = (int(q) - 1) * 3 + 1
        return date(int(year), month, 1).isoformat()
    except Exception:
        return None


def fetch_wpi_for_industry(abs_industry_code: str, industry_label: str) -> list[dict]:
    rows = []
    params = {
        "startPeriod": "2020-Q1",
        "detail": "dataonly",
        "dimensionAtObservation": "AllDimensions",
    }

    for measure_code, col in [("1", "wpi_index"), ("3", "wpi_annual_change")]:
        key = f"{DATAFLOW_WPI}/{measure_code}.20.1.{abs_industry_code}.1.AUS"
        url = f"{ABS_API}/{key}"
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[abs_wpi] WARNING: {industry_label} measure {measure_code} failed: {e}")
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
            period = _parse_quarter(period_str)
            if period is None:
                continue
            value = obs_val[0]
            if value is None:
                continue
            rows.append({
                "period": period,
                "industry": industry_label,
                "measure": col,
                "value": float(value),
            })

    merged: dict[str, dict] = {}
    for r in rows:
        key = r["period"]
        if key not in merged:
            merged[key] = {
                "period": r["period"],
                "industry": industry_label,
                "source": "ABS WPI",
            }
        merged[key][r["measure"]] = r["value"]

    return list(merged.values())


def run():
    all_rows = []
    for abs_code, label in INDUSTRIES.items():
        print(f"[abs_wpi] Fetching WPI for {label}...")
        rows = fetch_wpi_for_industry(abs_code, label)
        print(f"[abs_wpi]   Got {len(rows)} quarters")
        all_rows.extend(rows)

    if all_rows:
        upsert("wage_data", all_rows, "period,industry")
    print("[abs_wpi] Done.")


if __name__ == "__main__":
    run()
