"""Fetch a Ford (F) quote snapshot into data/stock.json for the site banner.

Run by .github/workflows/stock.yml. Writes nothing if the fetch fails, so a
bad run leaves the previous snapshot in place rather than blanking the banner.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

SYMBOL = "F"
URL = (f"https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}"
       "?range=5d&interval=1d")
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "stock.json")


def fetch():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)["chart"]["result"][0]


def main():
    result = fetch()
    meta = result["meta"]
    quote = result["indicators"]["quote"][0]

    # Trailing sessions, ignoring any day the feed left blank
    days = [i for i, o in enumerate(quote["open"]) if o is not None]
    today, prev = days[-1], days[-2]

    price = meta["regularMarketPrice"]
    # Not chartPreviousClose: on a multi-day range that is the close before the
    # whole window, not yesterday's.
    prev_close = quote["close"][prev]

    ts = meta["regularMarketTime"]
    offset = meta.get("gmtoffset", 0)
    local = datetime.fromtimestamp(ts, timezone(timedelta(seconds=offset)))

    data = {
        "symbol": meta.get("symbol", SYMBOL),
        "name": meta.get("shortName", "Ford Motor Company"),
        "currency": meta.get("currency", "USD"),
        "price": round(price, 2),
        "change": round(price - prev_close, 2),
        "changePercent": round((price - prev_close) / prev_close * 100, 2),
        "volume": meta.get("regularMarketVolume"),
        "dayHigh": round(meta["regularMarketDayHigh"], 2),
        "dayLow": round(meta["regularMarketDayLow"], 2),
        "fiftyTwoWeekHigh": round(meta["fiftyTwoWeekHigh"], 2),
        "fiftyTwoWeekLow": round(meta["fiftyTwoWeekLow"], 2),
        "open": round(quote["open"][today], 2),
        "previousOpen": round(quote["open"][prev], 2),
        "previousClose": round(prev_close, 2),
        "asOf": "{} {}:{} {}".format(
            local.strftime("%m/%d/%Y"),
            local.strftime("%I").lstrip("0") or "12",
            local.strftime("%M"),
            local.strftime("%p ") + meta.get("timezone", ""),
        ).strip(),
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    # Sanity-check our arithmetic against the percent Yahoo reports itself
    reported = meta.get("regularMarketChangePercent")
    if reported is not None and abs(reported - data["changePercent"]) > 0.05:
        raise ValueError(f"change% {data['changePercent']} disagrees with feed {reported}")

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print(f"{data['symbol']} {data['price']} ({data['changePercent']:+.2f}%) as of {data['asOf']}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:                      # keep the old snapshot on failure
        print(f"stock update failed: {exc}", file=sys.stderr)
        sys.exit(1)
