"""
SEEK job ad volume scraper for aged care roles.

Uses SEEK's public search endpoint to retrieve job counts by classification.
SEEK classification 6317 = Aged Care & Community Services.
This is not an official API -- treat counts as indicative.

Run: python seek_scraper.py
"""
from datetime import date, timedelta
import requests
from db import upsert

SEEK_SEARCH_URL = "https://www.seek.com.au/api/chalice-search/v4/search"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "X-Seek-Site": "chalice-seek",
    "Accept": "application/json",
}

ROLE_QUERIES = [
    {"label": "Personal Care Worker", "care_type": "home_care",
     "keywords": "personal care worker aged care", "classification": "6317"},
    {"label": "Registered Nurse Aged Care", "care_type": "residential",
     "keywords": "registered nurse aged care", "classification": "6317"},
    {"label": "Care Coordinator", "care_type": "home_care",
     "keywords": "care coordinator home care", "classification": "6317"},
    {"label": "Case Manager", "care_type": "home_care",
     "keywords": "case manager aged care", "classification": "6317"},
    {"label": "All Aged Care (SEEK category)", "care_type": "sector_wide",
     "keywords": None, "classification": "6317"},
]

STATES = ["VIC", "NSW", "QLD", "WA", "SA", "TAS", "ACT", "NT"]


def fetch_seek_count(keywords: str | None, classification: str, where: str | None = None) -> int | None:
    params = {
        "siteKey": "AU-Main",
        "sourcesystem": "houston",
        "classification": classification,
        "pageSize": "1",
        "locale": "en-AU",
    }
    if keywords:
        params["keywords"] = keywords
    if where:
        params["where"] = where
    try:
        resp = requests.get(SEEK_SEARCH_URL, headers=HEADERS, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("totalCount") or data.get("data", {}).get("totalCount")
    except Exception as e:
        print(f"[seek] WARNING: search failed ({keywords or 'all'}, {where or 'national'}): {e}")
        return None


def run():
    today = date.today()
    period = today - timedelta(days=today.weekday())
    rows = []

    for role in ROLE_QUERIES:
        label = role["label"]
        print(f"[seek] Fetching: {label}...")
        count = fetch_seek_count(role["keywords"], role["classification"])
        if count is not None:
            rows.append({
                "period": period.isoformat(),
                "care_type": role["care_type"],
                "platform": "seek",
                "role_category": label,
                "ad_count": count,
                "state": None,
                "source_url": "https://www.seek.com.au",
            })
            print(f"[seek]   National: {count} ads")

        if role["label"] == "All Aged Care (SEEK category)":
            for state_code in STATES:
                state_count = fetch_seek_count(None, role["classification"], where=state_code)
                if state_count is not None:
                    rows.append({
                        "period": period.isoformat(),
                        "care_type": "sector_wide",
                        "platform": "seek",
                        "role_category": "All Aged Care (SEEK category)",
                        "ad_count": state_count,
                        "state": state_code,
                        "source_url": "https://www.seek.com.au",
                    })

    if rows:
        upsert("job_ads", rows, "period,care_type,platform,role_category,state")
        print(f"[seek] Upserted {len(rows)} rows.")
    else:
        print("[seek] No data retrieved -- SEEK may have blocked the request.")
    print("[seek] Done.")


if __name__ == "__main__":
    run()
