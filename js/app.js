/* Ford Vehicle Data Explorer — app.js */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const PALETTE = [
  "#003499","#0066cc","#e63946","#2a9d8f","#e9c46a","#f4a261","#264653","#8338ec",
  "#06d6a0","#ff6b6b","#4cc9f0","#f77f00","#7209b7","#3a0ca3","#4361ee","#b5838d"
];

let DATA = null;
let chart = null;

// ── State ─────────────────────────────────────────────────────────────────
const state = {
  dataType: "production",   // "production" | "retail_sales"
  year: "2025",
  vehicle: "all",
  month: "all",
  view: "chart",            // "chart" | "table"
  search: "",
};

// ── Boot ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res  = await fetch("data/sales_data.json");
    DATA = await res.json();
  } catch (e) {
    document.getElementById("app-root").innerHTML =
      `<div class="empty-state"><p>Could not load sales_data.json — make sure the file exists in the data/ folder.</p></div>`;
    return;
  }
  buildUI();
  render();
}

// ── Build controls ────────────────────────────────────────────────────────
function buildUI() {
  // Data-type
  const dtSel = document.getElementById("sel-datatype");
  dtSel.addEventListener("change", () => { state.dataType = dtSel.value; syncYearOptions(); syncVehicleOptions(); render(); });

  // Year
  const yrSel = document.getElementById("sel-year");
  yrSel.addEventListener("change", () => { state.year = yrSel.value; syncVehicleOptions(); render(); });

  // Vehicle
  const vSel = document.getElementById("sel-vehicle");
  vSel.addEventListener("change", () => { state.vehicle = vSel.value; render(); });

  // Month
  const mSel = document.getElementById("sel-month");
  MONTHS.forEach((m, i) => {
    const opt = new Option(MONTH_FULL[i], m);
    mSel.appendChild(opt);
  });
  mSel.addEventListener("change", () => { state.month = mSel.value; render(); });

  // Search
  const srch = document.getElementById("inp-search");
  srch.addEventListener("input", () => { state.search = srch.value.toLowerCase(); syncVehicleOptions(); render(); });

  // View toggle
  document.getElementById("btn-chart").addEventListener("click", () => setView("chart"));
  document.getElementById("btn-table").addEventListener("click", () => setView("table"));

  syncYearOptions();
  syncVehicleOptions();
}

function setView(v) {
  state.view = v;
  document.getElementById("btn-chart").classList.toggle("active", v === "chart");
  document.getElementById("btn-table").classList.toggle("active", v === "table");
  document.getElementById("chart-panel").style.display = v === "chart" ? "" : "none";
  document.getElementById("table-panel").style.display = v === "table" ? "" : "none";
}

function syncYearOptions() {
  const yrSel = document.getElementById("sel-year");
  const years = Object.keys(DATA[state.dataType] || {}).sort();
  yrSel.innerHTML = "";
  years.forEach(y => {
    const opt = new Option(y, y);
    if (y === state.year || (!years.includes(state.year) && y === years[years.length - 1])) {
      opt.selected = true; state.year = y;
    }
    yrSel.appendChild(opt);
  });
  // Disable month filter for retail_sales (not applicable to production months in same way)
  const mSel = document.getElementById("sel-month");
  mSel.disabled = state.dataType === "retail_sales";
  if (state.dataType === "retail_sales") { state.month = "all"; mSel.value = "all"; }
}

function syncVehicleOptions() {
  const vSel = document.getElementById("sel-vehicle");
  const prev = state.vehicle;
  vSel.innerHTML = `<option value="all">All Vehicles</option>`;
  const vehicles = getVehiclesForCurrentContext();
  vehicles.forEach(v => {
    if (!state.search || v.toLowerCase().includes(state.search)) {
      const opt = new Option(v, v);
      if (v === prev) opt.selected = true;
      vSel.appendChild(opt);
    }
  });
  if (!vehicles.includes(state.vehicle)) state.vehicle = "all";
}

function getVehiclesForCurrentContext() {
  if (state.dataType === "production") {
    const yearData = DATA.production[state.year] || {};
    return Object.keys(yearData).sort();
  } else {
    const months = Object.keys(DATA.retail_sales[state.year] || {});
    const all = new Set();
    months.forEach(m => Object.keys(DATA.retail_sales[state.year][m]).forEach(v => all.add(v)));
    return [...all].sort();
  }
}

// ── Render ────────────────────────────────────────────────────────────────
function render() {
  const root = document.getElementById("app-root");
  root.innerHTML = "";

  if (state.dataType === "production") {
    renderProduction(root);
  } else {
    renderRetailSales(root);
  }
}

// ── Production rendering ───────────────────────────────────────────────────
function renderProduction(root) {
  const yearData = DATA.production[state.year] || {};
  const note = DATA._meta?.notes;

  // Filter vehicles
  let vehicles = Object.keys(yearData).sort();
  if (state.search) vehicles = vehicles.filter(v => v.toLowerCase().includes(state.search));
  if (state.vehicle !== "all") vehicles = vehicles.filter(v => v === state.vehicle);

  // Filter months
  const activeMths = state.month === "all" ? MONTHS : [state.month];

  // Notes
  const noteKey = state.year === "2022" ? "2022_production" : state.year === "2026" ? "2026_production" : null;
  if (noteKey && note?.[noteKey]) {
    const bar = el("div", "info-bar");
    bar.innerHTML = `<span>ℹ️</span> <span>${note[noteKey]}</span>`;
    root.appendChild(bar);
  }

  // Summary cards
  const totalVehicles = vehicles.length;
  const totalUnits = vehicles.reduce((s, v) => {
    return s + activeMths.reduce((ms, m) => ms + (yearData[v]?.[m] ?? 0), 0);
  }, 0);
  const topVehicle = vehicles.reduce((best, v) => {
    const sum = activeMths.reduce((s, m) => s + (yearData[v]?.[m] ?? 0), 0);
    return sum > (best.sum ?? -1) ? { name: v, sum } : best;
  }, {});

  const cards = el("div", "summary-cards");
  cards.appendChild(summaryCard("Year", state.year, "Production data"));
  cards.appendChild(summaryCard("Vehicles Shown", totalVehicles.toLocaleString(), state.vehicle === "all" ? "all models" : state.vehicle));
  cards.appendChild(summaryCard("Total Units", totalUnits.toLocaleString(), state.month === "all" ? "full period" : MONTH_FULL[MONTHS.indexOf(state.month)]));
  if (topVehicle.name) {
    cards.appendChild(summaryCard("Top Model", shortName(topVehicle.name), topVehicle.sum.toLocaleString() + " units"));
  }
  root.appendChild(cards);

  // Chart
  const chartPanel = el("div", "chart-panel"); chartPanel.id = "chart-panel";
  const chartTitle = el("h2"); chartTitle.textContent = buildChartTitle();
  chartPanel.appendChild(chartTitle);
  const chartWrap = el("div", "chart-wrap");
  const canvas = document.createElement("canvas"); canvas.id = "main-chart";
  chartWrap.appendChild(canvas);
  chartPanel.appendChild(chartWrap);
  root.appendChild(chartPanel);

  // Table
  const tablePanel = el("div", "table-panel"); tablePanel.id = "table-panel";
  const tblTitle = el("h2");
  tblTitle.innerHTML = `${buildChartTitle()} <span class="badge badge-prod" style="margin-left:.5rem">Production</span>`;
  tablePanel.appendChild(tblTitle);
  const tableWrap = el("div", "table-wrap");

  const cols = state.month === "all" ? [...MONTHS, "Full Year"] : [state.month, "Full Year"];
  const table = buildProdTable(yearData, vehicles, cols);
  tableWrap.appendChild(table);
  tablePanel.appendChild(tableWrap);
  root.appendChild(tablePanel);

  setView(state.view);
  drawProductionChart(yearData, vehicles, activeMths);
}

function buildProdTable(yearData, vehicles, cols) {
  const table = document.createElement("table");
  // Header
  const tr = document.createElement("tr");
  [["Vehicle", "text-align:left"], ...cols.map(c => [c, ""])].forEach(([text, style]) => {
    const th = document.createElement("th");
    th.textContent = text;
    if (style) th.style.cssText = style;
    tr.appendChild(th);
  });
  table.appendChild(tr);

  // Rows
  const totals = {};
  vehicles.forEach(v => {
    const row = document.createElement("tr");
    const nameTd = document.createElement("td");
    nameTd.textContent = v;
    row.appendChild(nameTd);
    cols.forEach(m => {
      const td = document.createElement("td");
      const val = yearData[v]?.[m];
      if (val == null) { td.textContent = "—"; td.className = "null-cell"; }
      else { td.textContent = val.toLocaleString(); totals[m] = (totals[m] || 0) + val; }
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  // Totals row
  if (vehicles.length > 1) {
    const row = document.createElement("tr"); row.className = "total-row";
    const td = document.createElement("td"); td.textContent = "Total"; row.appendChild(td);
    cols.forEach(m => {
      const td = document.createElement("td");
      td.textContent = (totals[m] || 0).toLocaleString();
      row.appendChild(td);
    });
    table.appendChild(row);
  }
  return table;
}

function drawProductionChart(yearData, vehicles, activeMths) {
  if (chart) { chart.destroy(); chart = null; }
  const ctx = document.getElementById("main-chart");
  if (!ctx) return;

  let labels, datasets;

  if (state.vehicle !== "all" || vehicles.length === 1) {
    // Single vehicle: bar by month
    const v = vehicles[0];
    labels = activeMths;
    datasets = [{
      label: v,
      data: activeMths.map(m => yearData[v]?.[m] ?? 0),
      backgroundColor: PALETTE[0] + "cc",
      borderColor: PALETTE[0],
      borderWidth: 1.5,
      borderRadius: 4,
    }];
  } else if (activeMths.length === 1) {
    // Single month: bar by vehicle
    const m = activeMths[0];
    labels = vehicles.map(shortName);
    datasets = [{
      label: m,
      data: vehicles.map(v => yearData[v]?.[m] ?? 0),
      backgroundColor: vehicles.map((_, i) => PALETTE[i % PALETTE.length] + "cc"),
      borderColor: vehicles.map((_, i) => PALETTE[i % PALETTE.length]),
      borderWidth: 1.5,
      borderRadius: 4,
    }];
  } else {
    // Multiple vehicles × months: line per vehicle (top 8 by total)
    const sorted = [...vehicles].sort((a, b) => {
      const sa = activeMths.reduce((s, m) => s + (yearData[a]?.[m] ?? 0), 0);
      const sb = activeMths.reduce((s, m) => s + (yearData[b]?.[m] ?? 0), 0);
      return sb - sa;
    }).slice(0, 8);
    labels = activeMths;
    datasets = sorted.map((v, i) => ({
      label: shortName(v),
      data: activeMths.map(m => yearData[v]?.[m] ?? null),
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length] + "20",
      fill: false,
      tension: .3,
      pointRadius: 3,
      spanGaps: true,
    }));
  }

  chart = new Chart(ctx, {
    type: state.vehicle !== "all" || activeMths.length === 1 ? "bar" : "line",
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${(c.raw ?? 0).toLocaleString()}` } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v } },
        x: { ticks: { font: { size: 11 } } },
      },
    },
  });
}

// ── Retail Sales rendering ─────────────────────────────────────────────────
function renderRetailSales(root) {
  const yearData = DATA.retail_sales[state.year] || {};
  const months   = Object.keys(yearData).sort();

  if (months.length === 0) {
    root.appendChild(emptyState("No retail sales data available for " + state.year));
    return;
  }

  // For now show each available month as a table
  months.forEach(month => {
    const monthData = yearData[month];
    let vehicles = Object.keys(monthData).sort();
    if (state.search) vehicles = vehicles.filter(v => v.toLowerCase().includes(state.search));
    if (state.vehicle !== "all") vehicles = vehicles.filter(v => v === state.vehicle);

    // Summary cards
    const totalCurrent = vehicles.reduce((s, v) => s + (monthData[v].current_month ?? 0), 0);
    const totalPrior   = vehicles.reduce((s, v) => s + (monthData[v].prior_year_month ?? 0), 0);
    const totalYTD     = vehicles.reduce((s, v) => s + (monthData[v].ytd_current ?? 0), 0);
    const pctChg       = totalPrior ? ((totalCurrent - totalPrior) / totalPrior * 100).toFixed(1) : null;

    const cards = el("div", "summary-cards");
    cards.appendChild(summaryCard(month + " " + state.year, totalCurrent.toLocaleString(), "units sold (current)"));
    cards.appendChild(summaryCard(month + " " + (parseInt(state.year)-1), totalPrior.toLocaleString(), "units sold (prior year)"));
    cards.appendChild(summaryCard("YTD " + state.year, totalYTD.toLocaleString(), "year-to-date"));
    if (pctChg !== null) {
      cards.appendChild(summaryCard("Month Change", (pctChg > 0 ? "+" : "") + pctChg + "%", "vs prior year"));
    }
    root.appendChild(cards);

    // Chart
    const chartPanel = el("div", "chart-panel"); chartPanel.id = "chart-panel";
    const chartTitle = el("h2"); chartTitle.textContent = `${month} ${state.year} — U.S. Retail Sales vs Prior Year`;
    chartPanel.appendChild(chartTitle);
    const chartWrap = el("div", "chart-wrap");
    const canvas = document.createElement("canvas"); canvas.id = "main-chart";
    chartWrap.appendChild(canvas);
    chartPanel.appendChild(chartWrap);
    root.appendChild(chartPanel);

    // Table
    const tablePanel = el("div", "table-panel"); tablePanel.id = "table-panel";
    const tblTitle = el("h2");
    tblTitle.innerHTML = `${month} ${state.year} U.S. Retail Sales <span class="badge badge-sales" style="margin-left:.5rem">Retail Sales</span>`;
    tablePanel.appendChild(tblTitle);
    const tableWrap = el("div", "table-wrap");
    tableWrap.appendChild(buildSalesTable(monthData, vehicles, state.year));
    tablePanel.appendChild(tableWrap);
    root.appendChild(tablePanel);

    setView(state.view);
    drawSalesChart(monthData, vehicles, month);
  });
}

function buildSalesTable(monthData, vehicles, year) {
  const table = document.createElement("table");
  const priorYear = parseInt(year) - 1;
  const cols = ["Vehicle", `${year}`, `${priorYear}`, "Chg %", `YTD ${year}`, `YTD ${priorYear}`, "YTD Chg %"];
  const tr = document.createElement("tr");
  cols.forEach((c, i) => {
    const th = document.createElement("th");
    th.textContent = c;
    if (i === 0) th.style.textAlign = "left";
    tr.appendChild(th);
  });
  table.appendChild(tr);

  vehicles.forEach(v => {
    const d = monthData[v];
    const row = document.createElement("tr");
    const nameTd = document.createElement("td"); nameTd.textContent = v; row.appendChild(nameTd);
    row.appendChild(numTd(d.current_month));
    row.appendChild(numTd(d.prior_year_month));
    row.appendChild(pctTd(d.month_change_pct));
    row.appendChild(numTd(d.ytd_current));
    row.appendChild(numTd(d.ytd_prior));
    row.appendChild(pctTd(d.ytd_change_pct));
    table.appendChild(row);
  });
  return table;
}

function drawSalesChart(monthData, vehicles, month) {
  if (chart) { chart.destroy(); chart = null; }
  const ctx = document.getElementById("main-chart");
  if (!ctx) return;

  // Show top 12 by current_month, bar chart current vs prior
  const sorted = [...vehicles]
    .filter(v => (monthData[v].current_month ?? 0) > 0 || (monthData[v].prior_year_month ?? 0) > 0)
    .sort((a, b) => (monthData[b].current_month ?? 0) - (monthData[a].current_month ?? 0))
    .slice(0, 12);

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(v => v.replace(/^Ford\/|^Lincoln\//, "")),
      datasets: [
        { label: "Current", data: sorted.map(v => monthData[v].current_month ?? 0), backgroundColor: PALETTE[0]+"cc", borderColor: PALETTE[0], borderWidth: 1.5, borderRadius: 4 },
        { label: "Prior Year", data: sorted.map(v => monthData[v].prior_year_month ?? 0), backgroundColor: PALETTE[2]+"99", borderColor: PALETTE[2], borderWidth: 1.5, borderRadius: 4 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${(c.raw ?? 0).toLocaleString()}` } },
        title: { display: true, text: `${month} — Top 12 by Volume`, font: { size: 12 }, color: "#6b7280" },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => v >= 1000 ? (v/1000).toFixed(0)+"k" : v } },
        x: { ticks: { font: { size: 10 } } },
      },
    },
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function summaryCard(label, value, sub) {
  const card = el("div", "card");
  const lbl = el("div", "card-label"); lbl.textContent = label; card.appendChild(lbl);
  const val = el("div", "card-value"); val.textContent = value; card.appendChild(val);
  if (sub) { const s = el("div", "card-sub"); s.textContent = sub; card.appendChild(s); }
  return card;
}

function numTd(val) {
  const td = document.createElement("td");
  if (val == null) { td.textContent = "N/A"; td.className = "null-cell"; }
  else td.textContent = val.toLocaleString();
  return td;
}

function pctTd(val) {
  const td = document.createElement("td");
  if (val == null) { td.textContent = "N/A"; td.className = "null-cell"; }
  else {
    td.textContent = (val > 0 ? "+" : "") + val.toFixed(1) + "%";
    td.className = val > 0 ? "pct-pos" : "pct-neg";
  }
  return td;
}

function shortName(name) {
  return name
    .replace("Ford F-Series ", "")
    .replace("Lincoln ", "")
    .replace("Ford ", "");
}

function buildChartTitle() {
  const mLabel = state.month === "all" ? "Full Year" : MONTH_FULL[MONTHS.indexOf(state.month)];
  const vLabel = state.vehicle === "all" ? "All Vehicles" : state.vehicle;
  return `${state.year} — ${vLabel} — ${mLabel}`;
}

function emptyState(msg) {
  const d = el("div", "empty-state");
  d.innerHTML = `<p>${msg}</p>`;
  return d;
}

// ── Go ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
