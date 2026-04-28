"""Master runner -- called by GitHub Actions to execute all fetchers."""
import sys
import traceback

FETCHERS = [
    ("ABS Labour Force", "abs_labour_force", "run"),
    ("ABS WPI", "abs_wpi", "run"),
    ("AIHW Workforce", "aihw_scraper", "run"),
    ("JSA Shortage Status", "jsa_scraper", "run"),
    ("SEEK Job Ads", "seek_scraper", "run"),
    ("RSS News Ticker", "rss_fetcher", "run"),
]


def main(only: list[str] | None = None):
    errors = []
    for name, module, fn in FETCHERS:
        if only and module not in only:
            continue
        print(f"\n{'='*60}")
        print(f"Running: {name}")
        print(f"{'='*60}")
        try:
            mod = __import__(module)
            getattr(mod, fn)()
        except Exception as e:
            print(f"ERROR in {name}: {e}")
            traceback.print_exc()
            errors.append(name)

    if errors:
        print(f"\nCompleted with errors in: {', '.join(errors)}")
        sys.exit(1)
    else:
        print("\nAll fetchers completed successfully.")


if __name__ == "__main__":
    only = sys.argv[1:] or None
    main(only)
