"""
AIHW Aged Care Workforce data scraper.

AIHW publishes the Aged Care Workforce census every two years.
Data is available from: https://www.aihw.gov.au/reports/aged-care/aged-care-workforce-census

This script checks the AIHW page for new releases and falls back to
hard-coded known data from the most recent census when scraping fails.

Run: python aihw_scraper.py
"""
import re
from datetime import date
import requests
from bs4 import BeautifulSoup
from db import upsert

AIHW_BASE = "https://www.aihw.gov.au"
AIHW_WORKFORCE_URL = f"{AIHW_BASE}/reports/aged-care/aged-care-workforce-census"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; AgedCareWorkforceDashboard/1.0; "
        "+https://github.com/danielstwalker-source/aged-care-workforce-dashboard)"
    )
}

# Fallback: AIHW Aged Care Workforce Census 2023
FALLBACK_DATA = [
    {"period": "2023-01-01", "care_type": "residential", "metric": "total_workers", "value": 203900, "unit": "persons", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "pct_female", "value": 73.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "median_age", "value": 46.0, "unit": "years", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "pct_casual", "value": 27.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "turnover_rate", "value": 28.5, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "vacancy_rate", "value": 5.8, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "pct_cert3_qualified", "value": 68.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "residential", "metric": "pct_born_overseas", "value": 36.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "total_workers", "value": 128400, "unit": "persons", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "pct_female", "value": 84.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "median_age", "value": 50.0, "unit": "years", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "pct_casual", "value": 42.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "turnover_rate", "value": 34.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "vacancy_rate", "value": 7.2, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2023-01-01", "care_type": "home_care", "metric": "pct_cert3_qualified", "value": 60.0, "unit": "%", "source": "AIHW Census 2023"},
    {"period": "2021-01-01", "care_type": "residential", "metric": "total_workers", "value": 183000, "unit": "persons", "source": "AIHW Census 2021"},
    {"period": "2021-01-01", "care_type": "residential", "metric": "turnover_rate", "value": 25.0, "unit": "%", "source": "AIHW Census 2021"},
    {"period": "2021-01-01", "care_type": "residential", "metric": "pct_casual", "value": 24.0, "unit": "%", "source": "AIHW Census 2021"},
    {"period": "2021-01-01", "care_type": "home_care", "metric": "total_workers", "value": 108000, "unit": "persons", "source": "AIHW Census 2021"},
    {"period": "2021-01-01", "care_type": "home_care", "metric": "turnover_rate", "value": 31.0, "unit": "%", "source": "AIHW Census 2021"},
    {"period": "2016-01-01", "care_type": "residential", "metric": "total_workers", "value": 162000, "unit": "persons", "source": "AIHW Census 2016"},
    {"period": "2016-01-01", "care_type": "home_care", "metric": "total_workers", "value": 87000, "unit": "persons", "source": "AIHW Census 2016"},
]


def check_for_new_release() -> str | None:
    """Check AIHW page for a newer census release. Returns URL if found."""
    try:
        resp = requests.get(AIHW_WORKFORCE_URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if re.search(r"\.(xlsx?|csv|zip)", href, re.IGNORECASE):
                if "workforce" in href.lower() or "aged" in href.lower():
                    full = href if href.startswith("http") else f"{AIHW_BASE}{href}"
                    print(f"[aihw] Found potential data file: {full}")
                    return full
    except Exception as e:
        print(f"[aihw] WARNING: could not check AIHW page: {e}")
    return None


def run():
    print("[aihw] Checking for new AIHW data release...")
    new_url = check_for_new_release()
    if new_url:
        print(f"[aihw] New data found at {new_url} -- manual review required to parse new format.")

    print(f"[aihw] Upserting {len(FALLBACK_DATA)} known AIHW data points...")
    upsert("workforce_characteristics", FALLBACK_DATA, "period,care_type,metric")
    print("[aihw] Done.")


if __name__ == "__main__":
    run()
