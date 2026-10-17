/* Ford Vehicle Production Explorer — app.js */

const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];


/* Drive Data — brand-aligned chart palette */
const PALETTE = [
  "#FF4A1C", // orange
  "#1F3FE0", // cobalt
  "#D8F048", // acid lime
  "#FF7AA8", // rose
  "#0F7A6E", // ocean
  "#5B2E91", // plum
  "#F5C843", // amber
  "#2EBEB2", // teal
  "#E53E6A", // raspberry
  "#3E78FF", // sky cobalt
  "#9DC22B", // moss
  "#FF9560", // peach
  "#7A5BFF", // violet
  "#1AB394", // mint
  "#FF3B3B", // red
  "#0E3578", // ink-blue
];

let DATA  = null;
let chart = null;

/* ── State ─────────────────────────────────────────────────────────────── */
const state = {
  years:   ["2025"],   // array — one or more years selected
  vehicle: "all",
  month:   "all",      // "all" = Full Year, "Q1".."Q4", or a month key
  dataset: "production",  // "production" | "sales" | "both"
  view:    "table",
};

const QUARTERS = {
  Q1: ["Jan","Feb","Mar"], Q2: ["Apr","May","Jun"],
  Q3: ["Jul","Aug","Sep"], Q4: ["Oct","Nov","Dec"],
};
const DATASET_LABEL = { production: "Production", sales: "Sales" };
const F_SERIES_COMBINED = "F-Series";

/* Months covered by the current period selection */
function activeMonths() {
  if (state.month === "all") return MONTHS;
  return QUARTERS[state.month] || [state.month];
}

function periodLabel() {
  if (state.month === "all") return "Full Year";
  if (QUARTERS[state.month]) return state.month;
  return MONTH_FULL[MONTHS.indexOf(state.month)];
}

function activeDatasets() {
  return state.dataset === "both" ? ["production", "sales"] : [state.dataset];
}

/* One cell; null when the month is not reported for that vehicle/year */
function cell(ds, y, v, m) {
  const x = DATA[ds]?.[y]?.[v]?.[m];
  return x == null ? null : x;
}

/* Sum across months; null when nothing in the range is reported */
function sumMonths(ds, y, v, mths) {
  let total = 0, any = false;
  mths.forEach(m => { const x = cell(ds, y, v, m); if (x != null) { total += x; any = true; } });
  return any ? total : null;
}

/* Production writes "Ford Explorer" where sales writes "Explorer". Strip the
   marque from both so the same vehicle carries one key in either dataset.
   Genuinely different breakdowns (F-150 vs F-Series) stay separate. */
function normaliseVehicleKeys() {
  const ALIAS = {
    "Econoline": "E-Series",
    "MKC / Corsair": "Corsair",
    // F-650/750: production calls these Medium Truck, sales calls them Heavy Trucks
    "Medium Truck": "Medium/Heavy Trucks",
    "Heavy Trucks": "Medium/Heavy Trucks",
  };
  ["production", "sales"].forEach(ds => {
    Object.keys(DATA[ds] || {}).forEach(y => {
      const out = {};
      Object.entries(DATA[ds][y]).forEach(([v, row]) => {
        const k = shortName(v);
        out[ALIAS[k] || k] = row;
      });
      DATA[ds][y] = out;
    });
  });
  // Sales reports one F-Series line, production splits it. Pre-compute the
  // combined row so compare mode has something to put against the sales line.
  Object.keys(DATA.production || {}).forEach(y => {
    const yr = DATA.production[y];
    if (!yr["F-150"] || !yr["Super Duty"]) return;
    const row = {};
    [...MONTHS, "Full Year"].forEach(m => {
      const a = yr["F-150"][m], b = yr["Super Duty"][m];
      row[m] = a == null && b == null ? null : (a ?? 0) + (b ?? 0);
    });
    yr[F_SERIES_COMBINED] = row;
  });
}

/* Which vehicles a dataset exposes: production shows its own F-150 and Super
   Duty split on its own, but the combined F-Series row when comparing. */
function vehicleKeys(ds, y) {
  const keys = Object.keys(DATA[ds]?.[y] || {});
  if (ds !== "production") return keys;
  return state.dataset === "both"
    ? keys.filter(v => v !== "F-150" && v !== "Super Duty")
    : keys.filter(v => v !== F_SERIES_COMBINED);
}

/* ── Boot ───────────────────────────────────────────────────────────────── */
async function init() {
  try {
    const res = await fetch("data/sales_data.json");
    DATA = await res.json();
  } catch (e) {
    document.getElementById("app-root").innerHTML =
      `<div style="padding:3rem;text-align:center;color:#6b7280">
         Could not load sales_data.json — make sure it exists in the data/ folder.
       </div>`;
    return;
  }
  normaliseVehicleKeys();
  showLastUpdated();
  buildControls();
  render();

  // ── Tab switching ────────────────────────────────────────────────────────
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.toggle("active", c.id === `tab-${tab}`));
      if (tab === "plantmap") onPlantMapTabShown();
    });
  });
}

function showLastUpdated() {
  const el = document.getElementById("meta-updated");
  const iso = DATA._meta?.lastUpdated;
  if (!el || !iso) return;
  const [y, m, d] = iso.split("-").map(Number);
  el.textContent = `${d} ${MONTH_FULL[m - 1].slice(0, 3)} ${y}`;
}

/* ── Controls setup ──────────────────────────────────────────────────────── */
function buildControls() {
  buildYearPills();

  // Vehicle
  const vSel = document.getElementById("sel-vehicle");
  vSel.addEventListener("change", () => { state.vehicle = vSel.value; render(); });

  // Dataset — three segmented buttons rather than a dropdown
  document.querySelectorAll("#dataset-tabs button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.ds === state.dataset);
    btn.addEventListener("click", () => {
      state.dataset = btn.dataset.ds;
      document.querySelectorAll("#dataset-tabs button").forEach(b2 =>
        b2.classList.toggle("active", b2 === btn));
      buildYearPills();
      populateVehicleSelect();
      render();
    });
  });

  // Period — quarters first, then individual months
  const mSel = document.getElementById("sel-month");
  Object.keys(QUARTERS).forEach(q =>
    mSel.appendChild(new Option(`${q} (${QUARTERS[q].join(", ")})`, q)));
  MONTHS.forEach((m, i) => mSel.appendChild(new Option(MONTH_FULL[i], m)));
  mSel.addEventListener("change", () => { state.month = mSel.value; render(); });

  // View toggle
  document.getElementById("btn-chart").addEventListener("click", () => setView("chart"));
  document.getElementById("btn-table").addEventListener("click", () => setView("table"));

  populateVehicleSelect();
}

function buildYearPills() {
  const container = document.getElementById("year-pills");
  container.innerHTML = "";
  const years = [...new Set(Object.keys(DATA.production).concat(Object.keys(DATA.sales || {})))].sort();
  // Sales only starts in 2023, so some years have nothing for the current dataset
  const has = y => activeDatasets().some(ds => DATA[ds]?.[y]);

  state.years = state.years.filter(has);
  if (state.years.length === 0) state.years = [years.filter(has).pop()];

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.className = "year-pill" + (state.years.includes(y) ? " active" : "");
    btn.textContent = y;
    btn.dataset.year = y;
    btn.disabled = !has(y);
    btn.title = has(y) ? y : `${y} — no ${DATASET_LABEL[state.dataset] || "sales"} data`;
    btn.addEventListener("click", () => toggleYear(y));
    container.appendChild(btn);
  });
}

function toggleYear(year) {
  if (state.years.includes(year)) {
    if (state.years.length === 1) return; // always keep ≥ 1
    state.years = state.years.filter(y => y !== year);
  } else {
    state.years = [...state.years, year].sort();
  }
  // Refresh pill styles
  document.querySelectorAll(".year-pill").forEach(btn =>
    btn.classList.toggle("active", state.years.includes(btn.dataset.year))
  );
  populateVehicleSelect();
  render();
}

function populateVehicleSelect() {
  // Union of vehicles across all selected years and active datasets
  const all = new Set();
  activeDatasets().forEach(ds =>
    state.years.forEach(y => vehicleKeys(ds, y).forEach(v => all.add(v))));
  const vehicles = [...all].sort();

  const vSel = document.getElementById("sel-vehicle");
  const prev = vSel.value;
  vSel.innerHTML = `<option value="all">All Vehicles</option>`;
  vehicles.forEach(v => {
    const opt = new Option(v, v);
    if (v === prev) opt.selected = true;
    vSel.appendChild(opt);
  });
  if (!vehicles.includes(state.vehicle)) state.vehicle = "all";
  vSel.value = state.vehicle;
}

function setView(v) {
  state.view = v;
  document.getElementById("btn-chart").classList.toggle("active", v === "chart");
  document.getElementById("btn-table").classList.toggle("active", v === "table");
  document.getElementById("chart-panel").style.display = v === "chart" ? "" : "none";
  document.getElementById("table-panel").style.display = v === "table" ? "" : "none";
  // Chart.js cannot size a canvas inside a hidden panel, so draw once visible.
  if (v === "chart") drawChart();
}

/* ── Render dispatcher ───────────────────────────────────────────────────── */
function render() {
  const root = document.getElementById("app-root");
  root.innerHTML = "";

  const multiYear = state.years.length > 1;



  // ── Summary cards ─────────────────────────────────────────────────────
  root.appendChild(buildSummaryCards());

  // ── Chart panel ───────────────────────────────────────────────────────
  const chartPanel = el("div", "chart-panel"); chartPanel.id = "chart-panel";
  const chartTitle = el("h2"); chartTitle.textContent = buildTitle();
  chartPanel.appendChild(chartTitle);
  const chartWrap = el("div", "chart-wrap");
  const canvas = document.createElement("canvas"); canvas.id = "main-chart";
  chartWrap.appendChild(canvas);
  chartPanel.appendChild(chartWrap);
  root.appendChild(chartPanel);

  // ── Table panel ───────────────────────────────────────────────────────
  const tablePanel = el("div", "table-panel"); tablePanel.id = "table-panel";
  const tblTitle = el("h2");
  tblTitle.innerHTML = buildTitle() +
    `<span class="badge">${state.dataset === "both" ? "Compare" : DATASET_LABEL[state.dataset]}</span>`;
  tablePanel.appendChild(tblTitle);
  const tblWrap = el("div", "table-wrap");
  tblWrap.appendChild(buildTable());
  tablePanel.appendChild(tblWrap);
  root.appendChild(tablePanel);

  // Draw chart after DOM is ready; setView draws it when the panel is visible
  requestAnimationFrame(() => setView(state.view));
}

/* ── Summary cards ───────────────────────────────────────────────────────── */
function buildSummaryCards() {
  const cards = el("div", "summary-cards");
  const mths  = activeMonths();
  const vehicles = getFilteredVehicles();
  const dss   = activeDatasets();
  const total = (ds, y) => vehicles.reduce((s, v) => s + (sumMonths(ds, y, v, mths) ?? 0), 0);

  if (state.dataset === "both") {
    dss.forEach(ds => {
      const sum = state.years.reduce((s, y) => s + total(ds, y), 0);
      cards.appendChild(summaryCard(DATASET_LABEL[ds], sum.toLocaleString(),
        `${state.years.join(", ")} · ${periodLabel()}`));
    });
    const prod = state.years.reduce((s, y) => s + total("production", y), 0);
    const sold = state.years.reduce((s, y) => s + total("sales", y), 0);
    cards.appendChild(summaryCard("Difference", (prod - sold).toLocaleString(),
      prod >= sold ? "built above sold" : "sold above built"));
    if (sold > 0) cards.appendChild(summaryCard("Sell-through",
      ((sold / prod) * 100).toFixed(1) + "%", "sales ÷ production"));
    return cards;
  }

  const ds = dss[0];
  if (state.years.length > 1) {
    state.years.forEach(y =>
      cards.appendChild(summaryCard(y, total(ds, y).toLocaleString(), periodLabel().toLowerCase())));
    const topV = vehicles.reduce((best, v) => {
      const sum = state.years.reduce((s, y) => s + (sumMonths(ds, y, v, mths) ?? 0), 0);
      return sum > best.sum ? { name: v, sum } : best;
    }, { name: "", sum: -1 });
    if (topV.name) cards.appendChild(summaryCard("Top Model (all yrs)", shortName(topV.name),
      topV.sum.toLocaleString() + " units"));
  } else {
    const y = state.years[0];
    const topV = vehicles.reduce((best, v) => {
      const sum = sumMonths(ds, y, v, mths) ?? 0;
      return sum > best.sum ? { name: v, sum } : best;
    }, { name: "", sum: -1 });
    cards.appendChild(summaryCard("Year", y, DATASET_LABEL[ds] + " data"));
    cards.appendChild(summaryCard("Vehicles", vehicles.length.toString(),
      state.vehicle === "all" ? "all models" : state.vehicle));
    cards.appendChild(summaryCard("Total Units", total(ds, y).toLocaleString(), periodLabel().toLowerCase()));
    if (topV.name) cards.appendChild(summaryCard("Top Model", shortName(topV.name),
      topV.sum.toLocaleString() + " units"));
  }
  return cards;
}

/* ── Table builder ───────────────────────────────────────────────────────── */
/* With both datasets selected we stack one captioned table per dataset rather
   than interleaving them, which keeps each table readable on its own. */
function buildTable() {
  const frag = document.createDocumentFragment();
  const dss  = activeDatasets();
  dss.forEach(ds => {
    if (dss.length > 1) {
      const cap = el("div", "table-caption");
      cap.textContent = DATASET_LABEL[ds];
      frag.appendChild(cap);
    }
    frag.appendChild(buildTableFor(ds));
  });
  return frag;
}

function buildTableFor(ds) {
  const multiYear = state.years.length > 1;
  const vehicles  = getFilteredVehicles();
  const mths      = activeMonths();
  if (multiYear && state.vehicle !== "all") return buildTableMonthsXYears(ds, vehicles[0] || state.vehicle);
  if (multiYear)                            return buildTableVehiclesXYears(ds, vehicles, mths);
  return buildTableVehiclesXMonths(ds, vehicles, mths);
}

function buildTableMonthsXYears(ds, vehicle) {
  const table = document.createElement("table");
  const tr = document.createElement("tr");
  addTh(tr, "Month", true);
  state.years.forEach(y => addTh(tr, y));
  table.appendChild(tr);
  const totals = {};
  activeMonths().forEach(m => {
    const row = document.createElement("tr");
    addTd(row, MONTH_FULL[MONTHS.indexOf(m)], true);
    state.years.forEach(y => {
      const v = cell(ds, y, vehicle, m);
      addTd(row, v != null ? v.toLocaleString() : "—", false, v == null);
      if (v != null) totals[y] = (totals[y] || 0) + v;
    });
    table.appendChild(row);
  });
  const tRow = document.createElement("tr"); tRow.className = "total-row";
  addTd(tRow, "Total", true);
  state.years.forEach(y => addTd(tRow, (totals[y] || 0).toLocaleString()));
  table.appendChild(tRow);
  return table;
}

function buildTableVehiclesXYears(ds, vehicles, mths) {
  const table = document.createElement("table");
  const tr = document.createElement("tr");
  addTh(tr, "Vehicle", true);
  state.years.forEach(y => addTh(tr, `${y} ${periodLabel()}`));
  table.appendChild(tr);
  const totals = {};
  vehicles.forEach(v => {
    const row = document.createElement("tr");
    addTd(row, v, true);
    state.years.forEach(y => {
      const val = sumMonths(ds, y, v, mths);
      addTd(row, val == null ? "—" : val.toLocaleString(), false, val == null);
      if (val != null) totals[y] = (totals[y] || 0) + val;
    });
    table.appendChild(row);
  });
  const tRow = document.createElement("tr"); tRow.className = "total-row";
  addTd(tRow, "Total", true);
  state.years.forEach(y => addTd(tRow, (totals[y] || 0).toLocaleString()));
  table.appendChild(tRow);
  return table;
}

function buildTableVehiclesXMonths(ds, vehicles, mths) {
  const y     = state.years[0];
  const total = state.month === "all" ? "Full Year" : state.month;
  const table = document.createElement("table");
  const tr    = document.createElement("tr");
  addTh(tr, "Vehicle", true);
  mths.forEach(c => addTh(tr, c));
  const showTotal = mths.length > 1;
  if (showTotal) addTh(tr, total);
  table.appendChild(tr);
  const totals = {};
  vehicles.forEach(v => {
    const row = document.createElement("tr");
    addTd(row, v, true);
    mths.forEach(m => {
      const val = cell(ds, y, v, m);
      addTd(row, val != null ? val.toLocaleString() : "—", false, val == null);
      if (val != null) totals[m] = (totals[m] || 0) + val;
    });
    if (showTotal) {
      const rt = sumMonths(ds, y, v, mths);
      addTd(row, rt == null ? "—" : rt.toLocaleString(), false, rt == null);
      if (rt != null) totals[total] = (totals[total] || 0) + rt;
    }
    table.appendChild(row);
  });
  if (vehicles.length > 1) {
    const tRow = document.createElement("tr"); tRow.className = "total-row";
    addTd(tRow, "Total", true);
    mths.forEach(m => addTd(tRow, (totals[m] || 0).toLocaleString()));
    if (showTotal) addTd(tRow, (totals[total] || 0).toLocaleString());
    table.appendChild(tRow);
  }
  return table;
}

/* ── Chart drawing ───────────────────────────────────────────────────────── */
function clearChartArea() {
  if (chart) { chart.destroy(); chart = null; }
  const wrap = document.querySelector("#chart-panel .chart-wrap");
  if (!wrap) return null;
  // Reset the wrap to a fresh canvas
  wrap.innerHTML = '<canvas id="main-chart"></canvas>';
  return wrap;
}

function drawChart() {
  const wrap = clearChartArea();
  if (!wrap) return;

  const vehicles = getFilteredVehicles();
  const mths     = activeMonths();
  const ctx      = document.getElementById("main-chart");

  /* One vehicle: months along the x-axis */
  if (state.vehicle !== "all") {
    const v = state.vehicle;
    buildMixedChart(ctx, mths, mths.map(m => m),
      (ds, y) => mths.map(m => cell(ds, y, v, m)),
      `${v} — ${periodLabel()} by month`);
    return;
  }

  /* All vehicles, single year, single month: ranked horizontal bars */
  if (state.years.length === 1 && state.dataset !== "both" && mths.length === 1) {
    const ds = state.dataset, y = state.years[0], m = mths[0];
    const sorted = [...vehicles].sort((a, b) => (cell(ds, y, b, m) ?? 0) - (cell(ds, y, a, m) ?? 0));
    const title = `${MONTH_FULL[MONTHS.indexOf(m)]} ${y} — Vehicles ranked by ${DATASET_LABEL[ds].toLowerCase()}`;
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map(shortName),
        datasets: [{
          label: `${MONTH_FULL[MONTHS.indexOf(m)]} ${y}`,
          data: sorted.map(v => cell(ds, y, v, m) ?? 0),
          backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length] + "e6"),
          borderColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1.5, borderRadius: 4, borderSkipped: false,
        }],
      },
      options: {
        ...chartOpts(title),
        indexAxis: "y",
        plugins: { ...chartOpts("").plugins, legend: { display: false },
          title: { display: true, text: title,
            font: { family: '"Inter Tight", system-ui, sans-serif', size: 12, weight: "600" },
            color: "rgba(22,19,14,.62)", padding: { bottom: 12 } } },
      },
    });
    return;
  }

  /* All vehicles: vehicles along the x-axis. Comparing both datasets doubles
     the series, and their vehicle lists differ, so cap the axis there too. */
  const capped = state.years.length > 1 || state.dataset === "both";
  const sorted = topVehicles(vehicles, capped ? 10 : vehicles.length);
  buildMixedChart(ctx, sorted, sorted.map(shortName),
    (ds, y) => sorted.map(v => sumMonths(ds, y, v, mths)),
    `${periodLabel()} by Vehicle${capped ? " (top 10)" : ""}`);
}

/* Production draws as bars; sales overlays as a line on the same axis, so the
   two can be read against each other without doubling the bar count. */
function buildMixedChart(ctx, keys, labels, series, title) {
  const datasets = [];
  activeDatasets().forEach(ds => {
    state.years.forEach((y, i) => {
      const many = state.years.length > 1;
      // Sales takes a contrasting hue so the line never matches its bars
      const colour = ds === "sales" && state.dataset === "both"
        ? PALETTE[(i + 4) % PALETTE.length]
        : PALETTE[i % PALETTE.length];
      if (ds === "sales" && state.dataset === "both") {
        datasets.push({
          type: "line", label: `${y} sales`, data: series(ds, y),
          borderColor: colour, backgroundColor: colour,
          borderWidth: 2, borderDash: [5, 3], pointRadius: 3, pointStyle: "rectRot",
          tension: .25, fill: false, spanGaps: false,
        });
      } else {
        datasets.push({
          type: "bar",
          label: many || state.dataset === "both" ? `${y} ${DATASET_LABEL[ds].toLowerCase()}` : y,
          data: series(ds, y),
          backgroundColor: colour + "e6", borderColor: colour,
          borderWidth: 1.5, borderRadius: 3, borderSkipped: false,
        });
      }
    });
  });
  chart = new Chart(ctx, { type: "bar", data: { labels, datasets }, options: chartOpts(title) });
}

/* ── Shared chart options ────────────────────────────────────────────────── */
function chartOpts(titleText) {
  // Panel is light, so axis text and gridlines are ink rather than paper
  const paper      = "#16130E";
  const paperMute  = "rgba(22,19,14,.62)";
  const gridSoft   = "rgba(22,19,14,.10)";
  const fontStack  = '"Inter Tight", system-ui, sans-serif';
  const monoStack  = '"JetBrains Mono", ui-monospace, monospace';

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        align: "start",
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 14,
          color: paper,
          font: { family: fontStack, size: 11, weight: "600" },
          usePointStyle: true,
          pointStyle: "rectRounded",
        },
      },
      tooltip: {
        backgroundColor: "#16130E",
        borderColor: "#FF4A1C",
        borderWidth: 1.5,
        titleColor: "#D8F048",
        titleFont: { family: fontStack, size: 12, weight: "700" },
        bodyColor: paper,
        bodyFont: { family: monoStack, size: 11 },
        padding: 10,
        cornerRadius: 6,
        boxPadding: 6,
        callbacks: {
          label: c => ` ${c.dataset.label}: ${c.raw != null ? c.raw.toLocaleString() : "N/A"}`,
        },
      },
      title: {
        display: !!titleText,
        text: titleText,
        font: { family: fontStack, size: 12, weight: "600" },
        color: paperMute,
        padding: { bottom: 12 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid:   { color: gridSoft, drawBorder: false },
        border: { display: false },
        ticks: {
          color: paperMute,
          font: { family: monoStack, size: 10 },
          callback: v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v,
        },
      },
      x: {
        grid:   { color: gridSoft, drawBorder: false },
        border: { display: false },
        ticks: {
          color: paperMute,
          font: { family: monoStack, size: 10 },
        },
      },
    },
  };
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getFilteredVehicles() {
  const all    = new Set();
  activeDatasets().forEach(ds =>
    state.years.forEach(y => vehicleKeys(ds, y).forEach(v => all.add(v))));
  let vehicles = [...all].sort();
  if (state.vehicle !== "all") vehicles = vehicles.filter(v => v === state.vehicle);
  return vehicles;
}

function topVehicles(vehicles, n) {
  const mths = activeMonths();
  const tot = v => activeDatasets().reduce((s, ds) =>
    s + state.years.reduce((ys, y) => ys + (sumMonths(ds, y, v, mths) ?? 0), 0), 0);
  return [...vehicles].sort((a, b) => tot(b) - tot(a)).slice(0, n);
}

function shortName(name) {
  return name
    .replace(/^Ford F-Series \((.+)\)$/, "$1")
    .replace("Lincoln ", "")
    .replace("Ford ", "");
}

function buildTitle() {
  const yLabel = state.years.join(", ");
  const vLabel = state.vehicle === "all" ? "All Vehicles" : state.vehicle;
  return `${yLabel} · ${vLabel} · ${periodLabel()}`;
}

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function summaryCard(label, value, sub) {
  const card = el("div", "card");
  const lbl  = el("div", "card-label"); lbl.textContent = label; card.appendChild(lbl);
  const val  = el("div", "card-value"); val.textContent = value; card.appendChild(val);
  if (sub) { const s = el("div", "card-sub"); s.textContent = sub; card.appendChild(s); }
  return card;
}

function addTh(row, text, left = false) {
  const th = document.createElement("th");
  th.textContent = text;
  if (left) th.style.textAlign = "left";
  row.appendChild(th);
}

function addTd(row, text, left = false, muted = false) {
  const td = document.createElement("td");
  td.textContent = text;
  if (left)  td.style.textAlign = "left";
  if (muted) td.className = "null-cell";
  row.appendChild(td);
}

/* ── Go ─────────────────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", init);
