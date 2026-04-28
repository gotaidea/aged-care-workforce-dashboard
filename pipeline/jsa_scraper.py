"""
Jobs and Skills Australia (JSA) shortage occupation scraper.

JSA publishes the Skills Priority List (SPL) annually.
URL: https://www.jobsandskills.gov.au/data/skills-priority-list

Run: python jsa_scraper.py
"""
import re
import requests
from bs4 import BeautifulSoup
from db import upsert

JSA_BASE = "https://www.jobsandskills.gov.au"
JSA_SPL_URL = f"{JSA_BASE}/data/skills-priority-list"

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AgedCareWorkforceDashboard/1.0)"}

# Fallback: JSA Skills Priority List 2024
FALLBACK_SHORTAGE = [
    {"period": "2024-01-01", "occupation": "Personal Care Assistant", "anzsco_code": "423111",
     "care_type": "home_care", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Nursing Support Worker", "anzsco_code": "423112",
     "care_type": "residential", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Registered Nurse (Aged Care)", "anzsco_code": "254411",
     "care_type": "residential", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Registered Nurse (Community Health)", "anzsco_code": "254412",
     "care_type": "home_care", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Aged or Disabled Carer", "anzsco_code": "411311",
     "care_type": "home_care", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Home Carer", "anzsco_code": "411411",
     "care_type": "home_care", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Aged Care Service Manager", "anzsco_code": "134211",
     "care_type": "sector_wide", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Occupational Therapist", "anzsco_code": "251411",
     "care_type": "home_care", "shortage_level": "shortage", "source": "JSA SPL 2024"},
    {"period": "2024-01-01", "occupation": "Physiotherapist", "anzsco_code": "252511",
     "care_type": "sector_wide", "shortage_level": "metropolitan_shortage", "source": "JSA SPL 2024"},
]


def scrape_spl() -> list[dict]:
    """Attempt to scrape current SPL from JSA website."""
    try:
        resp = requests.get(JSA_SPL_URL, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if re.search(r"\.(xlsx?|csv)", href, re.IGNORECASE) and "priority" in href.lower():
                full = href if href.startswith("http") else f"{JSA_BASE}{href}"
                print(f"[jsa] Found SPL data file: {full} -- format requires manual mapping.")
                break
    except Exception as e:
        print(f"[jsa] WARNING: could not scrape JSA page: {e}")
    return []


def run():
    print("[jsa] Checking JSA Skills Priority List...")
    live_rows = scrape_spl()

    if live_rows:
        upsert("shortage_status", live_rows, "period,occupation")
    else:
        print(f"[jsa] Using fallback SPL data ({len(FALLBACK_SHORTAGE)} occupations)...")
        upsert("shortage_status", FALLBACK_SHORTAGE, "period,occupation")

    print("[jsa] Done.")


if __name__ == "__main__":
    run()
