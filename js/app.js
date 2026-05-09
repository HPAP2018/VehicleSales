/* Ford Vehicle Production Explorer — app.js */

const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];


const PALETTE = [
  "#003499","#e63946","#2a9d8f","#f4a261","#8338ec",
  "#06d6a0","#e9c46a","#264653","#ff6b6b","#4cc9f0",
  "#f77f00","#7209b7","#4361ee","#b5838d","#0066cc","#3a0ca3"
];

let DATA  = null;
let chart = null;

/* ── State ─────────────────────────────────────────────────────────────── */
const state = {
  years:   ["2025"],   // array — one or more years selected
  vehicle: "all",
  month:   "all",      // "all" = Full Year
  view:    "chart",
};

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

/* ── Controls setup ──────────────────────────────────────────────────────── */
function buildControls() {
  buildYearPills();

  // Vehicle
  const vSel = document.getElementById("sel-vehicle");
  vSel.addEventListener("change", () => { state.vehicle = vSel.value; render(); });

  // Month
  const mSel = document.getElementById("sel-month");
  MONTHS.forEach((m, i) => mSel.appendChild(new Option(MONTH_FULL[i], m)));
  mSel.addEventListener("change", () => { state.month = mSel.value; render(); });

  // Search
  document.getElementById("inp-search").addEventListener("input", e => {
    populateVehicleSelect(e.target.value.toLowerCase());
  });

  // View toggle
  document.getElementById("btn-chart").addEventListener("click", () => setView("chart"));
  document.getElementById("btn-table").addEventListener("click", () => setView("table"));

  populateVehicleSelect("");
}

function buildYearPills() {
  const container = document.getElementById("year-pills");
  container.innerHTML = "";
  const years = Object.keys(DATA.production).sort();

  // Default: select the latest full year
  if (state.years.length === 0) state.years = [years[years.length - 1]];

  years.forEach(y => {
    const btn = document.createElement("button");
    btn.className = "year-pill" + (state.years.includes(y) ? " active" : "");
    btn.textContent = y;
    btn.dataset.year = y;
    btn.title = y;
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
  populateVehicleSelect(document.getElementById("inp-search").value.toLowerCase());
  render();
}

function populateVehicleSelect(search = "") {
  // Union of vehicles across all selected years
  const all = new Set();
  state.years.forEach(y => Object.keys(DATA.production[y] || {}).forEach(v => all.add(v)));
  const vehicles = [...all].sort().filter(v => !search || v.toLowerCase().includes(search));

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
  tblTitle.innerHTML = buildTitle() + `<span class="badge">Production</span>`;
  tablePanel.appendChild(tblTitle);
  const tblWrap = el("div", "table-wrap");
  tblWrap.appendChild(buildTable());
  tablePanel.appendChild(tblWrap);
  root.appendChild(tablePanel);

  setView(state.view);

  // Draw chart after DOM is ready
  requestAnimationFrame(() => drawChart());
}

/* ── Summary cards ───────────────────────────────────────────────────────── */
function buildSummaryCards() {
  const cards = el("div", "summary-cards");
  const activeMths  = state.month === "all" ? MONTHS : [state.month];
  const vehicles    = getFilteredVehicles();
  const multiYear   = state.years.length > 1;

  if (multiYear) {
    // One card per year showing total units
    state.years.forEach(y => {
      const total = vehicles.reduce((s, v) =>
        s + activeMths.reduce((ms, m) => ms + (DATA.production[y]?.[v]?.[m] ?? 0), 0), 0);
      const sub = state.month === "all" ? "full year" : MONTH_FULL[MONTHS.indexOf(state.month)];
      cards.appendChild(summaryCard(y, total.toLocaleString(), sub));
    });
    // Top vehicle across all selected years combined
    const topV = vehicles.reduce((best, v) => {
      const sum = state.years.reduce((s, y) =>
        s + activeMths.reduce((ms, m) => ms + (DATA.production[y]?.[v]?.[m] ?? 0), 0), 0);
      return sum > best.sum ? { name: v, sum } : best;
    }, { name: "", sum: -1 });
    if (topV.name) cards.appendChild(summaryCard("Top Model (all yrs)", shortName(topV.name), topV.sum.toLocaleString() + " units"));
  } else {
    const y     = state.years[0];
    const yData = DATA.production[y] || {};
    const total = vehicles.reduce((s, v) =>
      s + activeMths.reduce((ms, m) => ms + (yData[v]?.[m] ?? 0), 0), 0);
    const topV  = vehicles.reduce((best, v) => {
      const sum = activeMths.reduce((s, m) => s + (yData[v]?.[m] ?? 0), 0);
      return sum > best.sum ? { name: v, sum } : best;
    }, { name: "", sum: -1 });
    cards.appendChild(summaryCard("Year", y, "Production data"));
    cards.appendChild(summaryCard("Vehicles", vehicles.length.toString(), state.vehicle === "all" ? "all models" : state.vehicle));
    cards.appendChild(summaryCard("Total Units", total.toLocaleString(),
      state.month === "all" ? "full year" : MONTH_FULL[MONTHS.indexOf(state.month)]));
    if (topV.name) cards.appendChild(summaryCard("Top Model", shortName(topV.name), topV.sum.toLocaleString() + " units"));
  }
  return cards;
}

/* ── Table builder ───────────────────────────────────────────────────────── */
function buildTable() {
  const multiYear = state.years.length > 1;
  const vehicles  = getFilteredVehicles();
  const activeMths = state.month === "all" ? MONTHS : [state.month];

  /* ── Multi-year, specific vehicle: rows=months, cols=years ── */
  if (multiYear && state.vehicle !== "all") {
    return buildTableMonthsXYears(vehicles[0] || state.vehicle);
  }

  /* ── Multi-year, all vehicles: rows=vehicles, cols=years (Full Year or chosen month) ── */
  if (multiYear) {
    return buildTableVehiclesXYears(vehicles, activeMths);
  }

  /* ── Single year: rows=vehicles, cols=months ── */
  return buildTableVehiclesXMonths(vehicles, activeMths);
}

function buildTableMonthsXYears(vehicle) {
  const table = document.createElement("table");
  // Header
  const tr = document.createElement("tr");
  addTh(tr, "Month", true);
  state.years.forEach(y => addTh(tr, y));
  table.appendChild(tr);
  // Rows
  const totals = {};
  MONTHS.forEach(m => {
    const row = document.createElement("tr");
    addTd(row, MONTH_FULL[MONTHS.indexOf(m)], true);
    state.years.forEach(y => {
      const v = DATA.production[y]?.[vehicle]?.[m];
      addTd(row, v != null ? v.toLocaleString() : "—", false, v == null);
      if (v != null) totals[y] = (totals[y] || 0) + v;
    });
    table.appendChild(row);
  });
  // Total row
  const tRow = document.createElement("tr"); tRow.className = "total-row";
  addTd(tRow, "Total", true);
  state.years.forEach(y => addTd(tRow, (totals[y] || 0).toLocaleString()));
  table.appendChild(tRow);
  return table;
}

function buildTableVehiclesXYears(vehicles, activeMths) {
  const colLabel = state.month === "all" ? "Full Year" : MONTH_FULL[MONTHS.indexOf(state.month)];
  const table = document.createElement("table");
  const tr = document.createElement("tr");
  addTh(tr, "Vehicle", true);
  state.years.forEach(y => addTh(tr, `${y} ${colLabel}`));
  table.appendChild(tr);
  const totals = {};
  vehicles.forEach(v => {
    const row = document.createElement("tr");
    addTd(row, v, true);
    state.years.forEach(y => {
      const val = activeMths.reduce((s, m) => s + (DATA.production[y]?.[v]?.[m] ?? 0), 0);
      // If all months for this vehicle in this year are null, show —
      const allNull = activeMths.every(m => DATA.production[y]?.[v]?.[m] == null);
      addTd(row, allNull ? "—" : val.toLocaleString(), false, allNull);
      if (!allNull) totals[y] = (totals[y] || 0) + val;
    });
    table.appendChild(row);
  });
  // Total
  const tRow = document.createElement("tr"); tRow.className = "total-row";
  addTd(tRow, "Total", true);
  state.years.forEach(y => addTd(tRow, (totals[y] || 0).toLocaleString()));
  table.appendChild(tRow);
  return table;
}

function buildTableVehiclesXMonths(vehicles, activeMths) {
  const y     = state.years[0];
  const yData = DATA.production[y] || {};
  const cols  = state.month === "all" ? [...MONTHS, "Full Year"] : [state.month];
  const table = document.createElement("table");
  const tr    = document.createElement("tr");
  addTh(tr, "Vehicle", true);
  cols.forEach(c => addTh(tr, c));
  table.appendChild(tr);
  const totals = {};
  vehicles.forEach(v => {
    const row = document.createElement("tr");
    addTd(row, v, true);
    cols.forEach(m => {
      const val = yData[v]?.[m];
      addTd(row, val != null ? val.toLocaleString() : "—", false, val == null);
      if (val != null) totals[m] = (totals[m] || 0) + val;
    });
    table.appendChild(row);
  });
  if (vehicles.length > 1) {
    const tRow = document.createElement("tr"); tRow.className = "total-row";
    addTd(tRow, "Total", true);
    cols.forEach(m => addTd(tRow, (totals[m] || 0).toLocaleString()));
    table.appendChild(tRow);
  }
  return table;
}

/* ── Chart drawing ───────────────────────────────────────────────────────── */
function drawChart() {
  if (chart) { chart.destroy(); chart = null; }
  const ctx = document.getElementById("main-chart");
  if (!ctx) return;

  const multiYear  = state.years.length > 1;
  const vehicles   = getFilteredVehicles();
  const activeMths = state.month === "all" ? MONTHS : [state.month];

  /* ─ Multi-year, single vehicle: lines=years, x=months ─ */
  if (multiYear && state.vehicle !== "all") {
    const v = state.vehicle;
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: activeMths,
        datasets: state.years.map((y, i) => ({
          label: y,
          data: activeMths.map(m => DATA.production[y]?.[v]?.[m] ?? null),
          borderColor: PALETTE[i % PALETTE.length],
          backgroundColor: PALETTE[i % PALETTE.length] + "22",
          fill: false, tension: .35, pointRadius: 4, spanGaps: true,
        })),
      },
      options: chartOpts(`${v} — Monthly Production by Year`),
    });
    return;
  }

  /* ─ Multi-year, all vehicles: lines=vehicles, x=years (Full Year or month total) ─ */
  if (multiYear) {
    // Top 8 vehicles by combined total across selected years
    const sorted = topVehicles(vehicles, 8);
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: state.years,
        datasets: sorted.map((v, i) => ({
          label: shortName(v),
          data: state.years.map(y =>
            activeMths.reduce((s, m) => s + (DATA.production[y]?.[v]?.[m] ?? 0), 0) || null
          ),
          borderColor: PALETTE[i % PALETTE.length],
          backgroundColor: PALETTE[i % PALETTE.length] + "22",
          fill: false, tension: .3, pointRadius: 5, spanGaps: true,
        })),
      },
      options: chartOpts(
        state.month === "all" ? "Annual Production Trend by Vehicle" :
        `${MONTH_FULL[MONTHS.indexOf(state.month)]} Production Trend by Vehicle`
      ),
    });
    return;
  }

  /* ─ Single year, single vehicle: bar by month ─ */
  if (state.vehicle !== "all") {
    const v     = state.vehicle;
    const yData = DATA.production[state.years[0]] || {};
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: activeMths,
        datasets: [{
          label: v,
          data: activeMths.map(m => yData[v]?.[m] ?? 0),
          backgroundColor: PALETTE[0] + "cc",
          borderColor: PALETTE[0],
          borderWidth: 1.5, borderRadius: 4,
        }],
      },
      options: chartOpts(`${v} — ${state.years[0]} Monthly Production`),
    });
    return;
  }

  /* ─ Single year, all vehicles, single month: bar by vehicle ─ */
  if (state.month !== "all") {
    const m     = state.month;
    const yData = DATA.production[state.years[0]] || {};
    const sorted = [...vehicles].sort((a, b) => (yData[b]?.[m] ?? 0) - (yData[a]?.[m] ?? 0));
    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sorted.map(shortName),
        datasets: [{
          label: MONTH_FULL[MONTHS.indexOf(m)] + " " + state.years[0],
          data: sorted.map(v => yData[v]?.[m] ?? 0),
          backgroundColor: sorted.map((_, i) => PALETTE[i % PALETTE.length] + "cc"),
          borderColor: sorted.map((_, i) => PALETTE[i % PALETTE.length]),
          borderWidth: 1.5, borderRadius: 4,
        }],
      },
      options: chartOpts(`${MONTH_FULL[MONTHS.indexOf(m)]} ${state.years[0]} — All Vehicles`),
    });
    return;
  }

  /* ─ Single year, all vehicles, full year: lines=top vehicles, x=months ─ */
  const sorted  = topVehicles(vehicles, 8);
  const yData   = DATA.production[state.years[0]] || {};
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: sorted.map((v, i) => ({
        label: shortName(v),
        data: MONTHS.map(m => yData[v]?.[m] ?? null),
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: PALETTE[i % PALETTE.length] + "20",
        fill: false, tension: .3, pointRadius: 3, spanGaps: true,
      })),
    },
    options: chartOpts(`${state.years[0]} — Monthly Production (Top 8 Models)`),
  });
}

/* ── Shared chart options ────────────────────────────────────────────────── */
function chartOpts(titleText) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: c => ` ${c.dataset.label}: ${c.raw != null ? c.raw.toLocaleString() : "N/A"}`,
        },
      },
      title: {
        display: !!titleText,
        text: titleText,
        font: { size: 12, weight: "600" },
        color: "#6b7280",
        padding: { bottom: 8 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => v >= 1000 ? (v / 1000).toFixed(0) + "k" : v },
      },
      x: { ticks: { font: { size: 11 } } },
    },
  };
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function getFilteredVehicles() {
  const search = document.getElementById("inp-search")?.value.toLowerCase() || "";
  const all    = new Set();
  state.years.forEach(y => Object.keys(DATA.production[y] || {}).forEach(v => all.add(v)));
  let vehicles = [...all].sort();
  if (search)                  vehicles = vehicles.filter(v => v.toLowerCase().includes(search));
  if (state.vehicle !== "all") vehicles = vehicles.filter(v => v === state.vehicle);
  return vehicles;
}

function topVehicles(vehicles, n) {
  const activeMths = state.month === "all" ? MONTHS : [state.month];
  return [...vehicles]
    .sort((a, b) => {
      const sa = state.years.reduce((s, y) =>
        s + activeMths.reduce((ms, m) => ms + (DATA.production[y]?.[a]?.[m] ?? 0), 0), 0);
      const sb = state.years.reduce((s, y) =>
        s + activeMths.reduce((ms, m) => ms + (DATA.production[y]?.[b]?.[m] ?? 0), 0), 0);
      return sb - sa;
    })
    .slice(0, n);
}

function shortName(name) {
  return name.replace("Ford F-Series ", "").replace("Lincoln ", "").replace("Ford ", "");
}

function buildTitle() {
  const yLabel = state.years.join(", ");
  const vLabel = state.vehicle === "all" ? "All Vehicles" : state.vehicle;
  const mLabel = state.month === "all" ? "Full Year" : MONTH_FULL[MONTHS.indexOf(state.month)];
  return `${yLabel} · ${vLabel} · ${mLabel}`;
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
