"""
RSS feed fetcher for the news ticker.

Fetches aged care / workforce headlines from:
  - ABS media releases
  - RBA statements
  - Google News RSS (aged care workforce)
  - ACQSC (Aged Care Quality and Safety Commission)
  - DSS Aged Care news
  - Google News (care worker shortage)

Run: python rss_fetcher.py
"""
from datetime import datetime, timezone, timedelta
import feedparser
import requests
from db import upsert

FEEDS = [
    {
        "name": "ABS Media Releases",
        "url": "https://www.abs.gov.au/rss/media-releases.xml",
        "filter_keywords": ["labour", "workforce", "wage", "employment", "health"],
    },
    {
        "name": "RBA Statements",
        "url": "https://www.rba.gov.au/rss/rss-cb-speeches.xml",
        "filter_keywords": ["labour", "wages", "employment", "workforce", "care"],
    },
    {
        "name": "Google News - Aged Care Workforce",
        "url": "https://news.google.com/rss/search?q=aged+care+workforce+australia&hl=en-AU&gl=AU&ceid=AU:en",
        "filter_keywords": None,
    },
    {
        "name": "ACQSC News",
        "url": "https://www.agedcarequality.gov.au/news/rss",
        "filter_keywords": None,
    },
    {
        "name": "DSS Aged Care News",
        "url": "https://www.dss.gov.au/rss/aged-care",
        "filter_keywords": None,
    },
    {
        "name": "Google News - Care Worker Shortage",
        "url": "https://news.google.com/rss/search?q=care+worker+shortage+australia&hl=en-AU&gl=AU&ceid=AU:en",
        "filter_keywords": None,
    },
]

CUTOFF_DAYS = 30


def parse_date(entry) -> datetime | None:
    for attr in ["published_parsed", "updated_parsed"]:
        val = getattr(entry, attr, None)
        if val:
            try:
                return datetime(*val[:6], tzinfo=timezone.utc)
            except Exception:
                pass
    return None


def passes_filter(entry, keywords: list[str] | None) -> bool:
    if not keywords:
        return True
    text = f"{entry.get('title', '')} {entry.get('summary', '')}".lower()
    return any(kw.lower() in text for kw in keywords)


def run():
    cutoff = datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)
    all_rows = []

    for feed_config in FEEDS:
        name = feed_config["name"]
        url = feed_config["url"]
        keywords = feed_config.get("filter_keywords")
        print(f"[rss] Fetching: {name}...")
        try:
            resp = requests.get(url, timeout=15)
            resp.raise_for_status()
            parsed = feedparser.parse(resp.content)
            count = 0
            for entry in parsed.entries:
                if not passes_filter(entry, keywords):
                    continue
                pub_date = parse_date(entry)
                if pub_date and pub_date < cutoff:
                    continue
                link = entry.get("link") or entry.get("id")
                if not link:
                    continue
                all_rows.append({
                    "title": entry.get("title", "")[:500],
                    "url": link[:2000],
                    "source": name,
                    "published_at": pub_date.isoformat() if pub_date else None,
                })
                count += 1
            print(f"[rss]   {count} articles kept")
        except Exception as e:
            print(f"[rss] WARNING: failed to fetch {name}: {e}")

    if all_rows:
        upsert("news_items", all_rows, "url")
        print(f"[rss] Upserted {len(all_rows)} news items.")
    print("[rss] Done.")


if __name__ == "__main__":
    run()
