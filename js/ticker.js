/* ticker.js — Ford (F) quote strip in the masthead banner.
   Reads data/stock.json, refreshed on a schedule by a GitHub Action.
   If the file is missing the banner simply stays empty. */

(function () {
  const num = n => n == null ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vol = n => {
    if (n == null) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return String(n);
  };

  function items(d) {
    const up = (d.change ?? 0) >= 0;
    const arrow = up ? "▲" : "▼";
    const sign = up ? "+" : "";
    const cls = up ? "up" : "down";
    return [
      `<span class="tk-sym">${d.symbol}</span><span class="tk-name">${d.name}</span>`,
      `<span class="tk-k">Last</span><span class="tk-v tk-last">$${num(d.price)}</span>`,
      `<span class="tk-k">Change</span><span class="tk-v ${cls}">${arrow} ${sign}${num(d.change)}</span>`,
      `<span class="tk-k">%&nbsp;Change</span><span class="tk-v ${cls}">${sign}${num(d.changePercent)}%</span>`,
      `<span class="tk-k">Volume</span><span class="tk-v">${vol(d.volume)}</span>`,
      `<span class="tk-k">Open</span><span class="tk-v">$${num(d.open)}</span>`,
      `<span class="tk-k">Day&nbsp;High</span><span class="tk-v">$${num(d.dayHigh)}</span>`,
      `<span class="tk-k">Day&nbsp;Low</span><span class="tk-v">$${num(d.dayLow)}</span>`,
      `<span class="tk-k">52w&nbsp;High</span><span class="tk-v">$${num(d.fiftyTwoWeekHigh)}</span>`,
      `<span class="tk-k">52w&nbsp;Low</span><span class="tk-v">$${num(d.fiftyTwoWeekLow)}</span>`,
      `<span class="tk-k">Prev&nbsp;Open</span><span class="tk-v">$${num(d.previousOpen)}</span>`,
      `<span class="tk-k">Prev&nbsp;Close</span><span class="tk-v">$${num(d.previousClose)}</span>`,
      `<span class="tk-asof">as of ${d.asOf}</span>`,
    ];
  }

  async function init() {
    const track = document.getElementById("ticker-track");
    if (!track) return;
    let d;
    try {
      const res = await fetch("data/stock.json", { cache: "no-cache" });
      if (!res.ok) return;
      d = await res.json();
    } catch (e) { return; }

    // Rendered twice so the marquee can loop without a visible seam
    const once = items(d).map(h => `<span class="ticker-item">${h}</span>`).join('<span class="ticker-sep">✱</span>');
    track.innerHTML = once + '<span class="ticker-sep">✱</span>' + once + '<span class="ticker-sep">✱</span>';
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
