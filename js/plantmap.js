/* plantmap.js — Drive Data · Global Assembly Atlas
   Vector SVG world map (d3-geo + topojson) — Natural Earth projection,
   region-tinted countries, custom markers, smooth zoom-to-plant.
*/

/* ── Plant data ─────────────────────────────────────────────────────────── */
const PLANTS = [

  /* ── United States ── */
  { id: "chicago",            name: "Chicago Assembly",            city: "Chicago, IL", country: "USA",         region: "americas", lat: 41.6584, lng: -87.5823, vehicles: ["Ford Explorer", "Lincoln Aviator"] },
  { id: "dearborn-truck",     name: "Dearborn Truck Plant",        city: "Dearborn, MI", country: "USA",        region: "americas", lat: 42.3078, lng: -83.188,  vehicles: ["Ford F-150"] },
  { id: "flat-rock",          name: "Flat Rock Assembly Plant",    city: "Flat Rock, MI", country: "USA",       region: "americas", lat: 42.0968, lng: -83.2744, vehicles: ["Ford Mustang"] },
  { id: "kansas-city",        name: "Kansas City Assembly",        city: "Claycomo, MO", country: "USA",        region: "americas", lat: 39.2253, lng: -94.5178, vehicles: ["Ford F-150", "Ford Transit"] },
  { id: "kentucky-truck",     name: "Kentucky Truck Plant",        city: "Louisville, KY", country: "USA",      region: "americas", lat: 38.1766, lng: -85.7432, vehicles: ["Ford Super Duty", "Ford Expedition", "Lincoln Navigator"] },
  { id: "louisville-assembly",name: "Louisville Assembly Plant",   city: "Louisville, KY", country: "USA",      region: "americas", lat: 38.1450, lng: -85.7680, vehicles: ["(Idle — retooling)"] },
  { id: "michigan-assembly",  name: "Michigan Assembly Plant",     city: "Wayne, MI", country: "USA",           region: "americas", lat: 42.2791, lng: -83.3878, vehicles: ["Ford Ranger", "Ford Bronco"] },
  { id: "ohio-assembly",      name: "Ohio Assembly Plant",         city: "Avon Lake, OH", country: "USA",       region: "americas", lat: 41.504,  lng: -82.035,  vehicles: ["Ford E-Series", "Ford F-650/750", "Ford F-350/450/550 Chassis Cab"] },

  /* ── Canada ── */
  { id: "oakville",           name: "Oakville Assembly",           city: "Oakville, Ontario", country: "Canada", region: "americas", lat: 43.4675, lng: -79.6877, vehicles: ["(Idle — retooling)"] },

  /* ── Mexico ── */
  { id: "cuautitlan",         name: "Cuautitlan Assembly",         city: "Cuautitlán Izcalli, Mexico", country: "Mexico", region: "americas", lat: 19.647, lng: -99.202,  vehicles: ["Ford Mustang Mach-E"] },
  { id: "hermosillo",         name: "Hermosillo Assembly",         city: "Hermosillo, Sonora, Mexico", country: "Mexico", region: "americas", lat: 29.063, lng: -110.948, vehicles: ["Ford Bronco Sport", "Ford Maverick"] },

  /* ── South America ── */
  { id: "pacheco",            name: "Pacheco Assembly",            city: "General Pacheco, Argentina", country: "Argentina", region: "americas", lat: -34.4622, lng: -58.6547, vehicles: ["Ford Ranger"] },
  { id: "valencia",           name: "Valencia Assembly",           city: "Valencia, Venezuela",        country: "Venezuela", region: "americas", lat: 10.162,   lng: -68.0077, vehicles: ["Ford Explorer"] },

  /* ── Germany ── */
  { id: "cologne",            name: "Cologne Assembly",            city: "Cologne, Germany",  country: "Germany", region: "europe", lat: 50.9859, lng: 6.9267,  vehicles: ["Ford Explorer EV", "Ford Capri EV"] },

  /* ── Romania ── */
  { id: "craiova",            name: "Craiova Assembly",            city: "Craiova, Romania",  country: "Romania", region: "europe", lat: 44.3302, lng: 23.7948, vehicles: ["Ford Puma", "Ford Transit Courier"] },

  /* ── Turkey ── */
  { id: "golcuk",             name: "Ford Otosan Gölcük Plant",    city: "Gölcük, Turkey",    country: "Turkey",  region: "europe", lat: 40.7021, lng: 29.8225, vehicles: ["Ford Transit", "Ford Transit Custom", "Ford Tourneo Custom"] },
  { id: "yeni-koy",           name: "Ford Otosan Yeniköy Plant",   city: "Kocaeli, Turkey",   country: "Turkey",  region: "europe", lat: 40.7500, lng: 29.9800, vehicles: ["Ford Transit Courier"] },

  /* ── China ── */
  { id: "chongqing",          name: "Changan Ford Chongqing",      city: "Chongqing, China", country: "China",  region: "asia", lat: 29.563,  lng: 106.552,  vehicles: ["Ford Escape", "Ford Mondeo", "Mustang Mach-E", "Lincoln Corsair", "Lincoln Z"] },
  { id: "hangzhou",           name: "Changan Ford Hangzhou",       city: "Hangzhou, China",  country: "China",  region: "asia", lat: 30.2741, lng: 120.1551, vehicles: ["Ford Edge L", "Ford Explorer", "Lincoln Aviator", "Lincoln Nautilus"] },
  { id: "harbin",             name: "Changan Ford Harbin",         city: "Harbin, China",    country: "China",  region: "asia", lat: 45.8038, lng: 126.5349, vehicles: ["Ford Focus"] },
  { id: "nanchang",           name: "JMC Nanchang Assembly",       city: "Nanchang, China",  country: "China",  region: "asia", lat: 28.682,  lng: 115.858,  vehicles: ["Ford Transit", "Ford Everest", "Ford Territory", "Ford Equator"] },

  /* ── Thailand ── */
  { id: "thailand",           name: "Ford Thailand Manufacturing", city: "Rayong, Thailand",  country: "Thailand", region: "asia", lat: 12.7987, lng: 101.3233, vehicles: ["Ford Ranger", "Ford Everest"] },

  /* ── Taiwan ── */
  { id: "taoyuan",            name: "Ford Lio Ho Assembly",        city: "Taoyuan, Taiwan",   country: "Taiwan",   region: "asia", lat: 24.9936, lng: 121.301,  vehicles: ["Ford Focus", "Ford Kuga", "Ford Territory"] },

  /* ── Vietnam ── */
  { id: "hai-duong",          name: "Ford Vietnam Assembly",       city: "Hai Duong, Vietnam", country: "Vietnam", region: "asia", lat: 20.9373, lng: 106.3147, vehicles: ["Ford Transit", "Ford Ranger"] },

  /* ── South Africa ── */
  { id: "silverton",          name: "Silverton Assembly Plant",    city: "Pretoria, South Africa", country: "South Africa", region: "africa", lat: -25.7478, lng: 28.3231, vehicles: ["Ford Ranger", "Ford Everest"] },
];

/* Map country name (TopoJSON) → region for tinted highlight */
const COUNTRY_REGION = {
  "United States of America": "americas",
  "Canada":         "americas",
  "Mexico":         "americas",
  "Argentina":      "americas",
  "Venezuela":      "americas",
  "Germany":        "europe",
  "Romania":        "europe",
  "Turkey":         "europe",
  "China":          "asia",
  "Thailand":       "asia",
  "Taiwan":         "asia",
  "Vietnam":        "asia",
  "South Africa":   "africa",
};

const REGION_COLORS = {
  americas: "#1F3FE0",
  europe:   "#FF4A1C",
  asia:     "#0F7A6E",
  africa:   "#FF7AA8",
};

const TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ── State ──────────────────────────────────────────────────────────────── */
let _svg, _zoom, _zoomLayer, _markerLayer, _projection;
let _mapReady = false;
let _activeId = null;

/* ── Entry point ────────────────────────────────────────────────────────── */
function onPlantMapTabShown() {
  buildPlantPanel();
  if (!_mapReady) {
    _mapReady = true;
    setTimeout(initSvgMap, 60);
  }
}

/* ── Build right-side panel ─────────────────────────────────────────────── */
function buildPlantPanel() {
  const panel = document.getElementById("plant-panel");
  if (!panel || panel.dataset.built) return;
  panel.dataset.built = "1";

  panel.innerHTML = `
    <div class="plant-panel-header">
      <div class="plant-panel-title-row">
        <h2>Global Assembly Atlas</h2>
        <button class="reset-map-btn" id="reset-map-btn" title="Reset to world view">↺ Reset</button>
      </div>
      <p class="plant-panel-sub">${PLANTS.length} plants · 5 continents — click a card or marker to focus</p>
    </div>

    <div class="map-legend">
      <div class="legend-item"><div class="legend-dot"></div> Americas</div>
      <div class="legend-item"><div class="legend-dot"></div> Europe</div>
      <div class="legend-item"><div class="legend-dot"></div> Asia-Pacific</div>
      <div class="legend-item"><div class="legend-dot"></div> Africa</div>
    </div>

    <div class="plant-list" id="plant-list">
      ${PLANTS.map(p => plantCardHTML(p)).join("")}
    </div>
  `;

  panel.querySelectorAll(".plant-card").forEach(card => {
    card.addEventListener("click", () => selectPlant(card.dataset.id));
  });

  document.getElementById("reset-map-btn").addEventListener("click", resetMap);
}

function plantCardHTML(p) {
  const tags = p.vehicles.map(v => `<span class="vehicle-tag">${v}</span>`).join("");
  return `
    <div class="plant-card" data-id="${p.id}">
      <div class="plant-card-top">
        <div class="plant-dot ${p.region}"></div>
        <div class="plant-card-info">
          <div class="plant-name">${p.name}</div>
          <div class="plant-city">${p.city}</div>
        </div>
        <span class="country-badge ${p.region}">${p.country}</span>
      </div>
      <div class="vehicle-tags">${tags}</div>
    </div>`;
}

/* ── Build vector world map ─────────────────────────────────────────────── */
async function initSvgMap() {
  const container = document.getElementById("plant-map");
  if (!container) return;
  container.innerHTML = "";

  // Build chrome
  const chrome = document.createElement("div");
  chrome.className = "atlas-chrome";
  chrome.innerHTML = `
    <div class="atlas-corner atlas-corner-tl">
      <div class="atlas-corner-label">N 40° 30′</div>
      <div class="atlas-corner-sub">Atlas of Assembly</div>
    </div>
    <div class="atlas-corner atlas-corner-tr">
      <div class="atlas-corner-label">Plate 01</div>
      <div class="atlas-corner-sub">1:80,000,000</div>
    </div>
    <div class="atlas-corner atlas-corner-bl">
      <div class="atlas-corner-label">Natural Earth Projection</div>
      <div class="atlas-corner-sub">Drive Data Cartography</div>
    </div>
    <div class="atlas-corner atlas-corner-br">
      <div class="atlas-corner-label">${PLANTS.length} sites</div>
      <div class="atlas-corner-sub">13 countries</div>
    </div>
    <div class="atlas-zoom-controls">
      <button class="atlas-zoom-btn" id="atlas-zoom-in" title="Zoom in">+</button>
      <button class="atlas-zoom-btn" id="atlas-zoom-out" title="Zoom out">−</button>
    </div>
    <div class="atlas-tooltip" id="atlas-tooltip"></div>
  `;
  container.appendChild(chrome);

  const width  = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3.select(container)
    .append("svg")
    .attr("class", "atlas-svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid slice");

  // Defs: ocean dot pattern + drop shadow
  const defs = svg.append("defs");

  const oceanPattern = defs.append("pattern")
    .attr("id", "ocean-pattern")
    .attr("width", 14).attr("height", 14)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(0)");
  oceanPattern.append("rect").attr("width", 14).attr("height", 14).attr("fill", "#E8DBBF");
  oceanPattern.append("circle").attr("cx", 7).attr("cy", 7).attr("r", 0.9).attr("fill", "#16130E").attr("opacity", 0.16);

  const shadow = defs.append("filter").attr("id", "marker-shadow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
  shadow.append("feDropShadow").attr("dx", 0).attr("dy", 1.5).attr("stdDeviation", 1.2).attr("flood-color", "#16130E").attr("flood-opacity", 0.45);

  // Ocean
  svg.append("rect").attr("width", width).attr("height", height).attr("fill", "url(#ocean-pattern)");

  const zoomLayer = svg.append("g").attr("class", "zoom-layer");

  // Projection — Natural Earth
  const projection = d3.geoNaturalEarth1()
    .scale(width / 6.1)
    .translate([width / 2, height / 1.8]);
  const path = d3.geoPath(projection);

  // Soft glow halo behind landmasses
  const glow = zoomLayer.append("g").attr("class", "land-glow");
  glow.append("path")
    .datum({ type: "Sphere" })
    .attr("d", path)
    .attr("fill", "none");

  // Graticule
  const graticule = d3.geoGraticule().step([15, 15]);
  zoomLayer.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

  zoomLayer.append("path")
    .datum(graticule.outline())
    .attr("class", "graticule-outline")
    .attr("d", path);

  // Load world topology
  let world;
  try {
    world = await fetch(TOPO_URL).then(r => r.json());
  } catch (e) {
    console.error("Atlas failed to load world data", e);
    return;
  }
  const countries = topojson.feature(world, world.objects.countries);

  // Country fills (tinted if home to a plant)
  zoomLayer.append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(countries.features)
    .join("path")
      .attr("class", d => "country " + (COUNTRY_REGION[d.properties.name] || "neutral"))
      .attr("data-name", d => d.properties.name)
      .attr("d", path);

  // Mesh borders (interior + exterior)
  zoomLayer.append("path")
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    .attr("class", "border-interior")
    .attr("d", path);

  zoomLayer.append("path")
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a === b))
    .attr("class", "border-exterior")
    .attr("d", path);

  // Markers
  const markerLayer = zoomLayer.append("g").attr("class", "markers");
  PLANTS.forEach(p => {
    const xy = projection([p.lng, p.lat]);
    if (!xy) return;
    const [x, y] = xy;
    const g = markerLayer.append("g")
      .attr("class", `atlas-marker atlas-marker-${p.region}`)
      .attr("transform", `translate(${x}, ${y})`)
      .attr("data-id", p.id)
      .style("cursor", "pointer");

    g.append("circle").attr("class", "m-halo").attr("r", 11).attr("fill", REGION_COLORS[p.region]).attr("opacity", 0.18);
    g.append("circle").attr("class", "m-ring").attr("r", 7).attr("fill", "#FFFBF1").attr("stroke", "#16130E").attr("stroke-width", 1.5).attr("filter", "url(#marker-shadow)");
    g.append("circle").attr("class", "m-dot").attr("r", 4).attr("fill", REGION_COLORS[p.region]);

    g.on("click", () => selectPlant(p.id));
    g.on("mouseenter", (event) => showTooltip(p, event));
    g.on("mousemove",  (event) => moveTooltip(event));
    g.on("mouseleave", () => hideTooltip());

    p._svgNode = g;
  });

  // Zoom behavior
  _zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", (event) => {
      zoomLayer.attr("transform", event.transform);
      // Keep marker chrome readable at all zooms
      const k = event.transform.k;
      const s = 1 / Math.pow(k, 0.55);
      markerLayer.selectAll(".atlas-marker > circle.m-halo").attr("r", 11 * s);
      markerLayer.selectAll(".atlas-marker > circle.m-ring").attr("r", 7 * s).attr("stroke-width", 1.5 * s);
      markerLayer.selectAll(".atlas-marker > circle.m-dot").attr("r", 4 * s);
      markerLayer.selectAll(".atlas-marker.active > circle.m-halo").attr("r", 18 * s);
      markerLayer.selectAll(".atlas-marker.active > circle.m-ring").attr("r", 10 * s).attr("stroke-width", 2 * s);
      markerLayer.selectAll(".atlas-marker.active > circle.m-dot").attr("r", 5.5 * s);
    });
  svg.call(_zoom);
  svg.on("dblclick.zoom", null); // disable zoom-on-doubleclick

  // Zoom buttons
  document.getElementById("atlas-zoom-in").addEventListener("click", () =>
    svg.transition().duration(280).call(_zoom.scaleBy, 1.6));
  document.getElementById("atlas-zoom-out").addEventListener("click", () =>
    svg.transition().duration(280).call(_zoom.scaleBy, 1 / 1.6));

  _svg = svg;
  _zoomLayer = zoomLayer;
  _markerLayer = markerLayer;
  _projection = projection;

  // Handle resize
  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(rebuildOnResize, 220);
  });
}

function rebuildOnResize() {
  const tab = document.getElementById("tab-plantmap");
  if (!tab || !tab.classList.contains("active")) return;
  // Re-init for new size
  _mapReady = false;
  _activeId = null;
  initSvgMap();
}

/* ── Tooltip ────────────────────────────────────────────────────────────── */
function showTooltip(plant, event) {
  const tip = document.getElementById("atlas-tooltip");
  if (!tip) return;
  const vehicleLines = plant.vehicles.map(v => `<li>${v}</li>`).join("");
  tip.innerHTML = `
    <div class="tt-title">${plant.name}</div>
    <div class="tt-sub">${plant.city} · ${plant.country}</div>
    <ul class="tt-vehicles">${vehicleLines}</ul>`;
  tip.classList.add("is-visible");
  moveTooltip(event);
}
function moveTooltip(event) {
  const tip = document.getElementById("atlas-tooltip");
  if (!tip) return;
  const container = document.getElementById("plant-map");
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const tipW = tip.offsetWidth || 220;
  const tipH = tip.offsetHeight || 80;
  let left = x + 14;
  let top  = y + 14;
  if (left + tipW > rect.width  - 8) left = x - tipW - 14;
  if (top  + tipH > rect.height - 8) top  = y - tipH - 14;
  tip.style.left = left + "px";
  tip.style.top  = top  + "px";
}
function hideTooltip() {
  const tip = document.getElementById("atlas-tooltip");
  if (tip) tip.classList.remove("is-visible");
}

/* ── Selection / zoom-to-plant ──────────────────────────────────────────── */
function selectPlant(id) {
  if (_activeId === id) return;

  // Deactivate previous
  if (_activeId) {
    const prev = PLANTS.find(p => p.id === _activeId);
    if (prev?._svgNode) prev._svgNode.classed("active", false);
    const prevCard = document.querySelector(`.plant-card[data-id="${_activeId}"]`);
    if (prevCard) prevCard.classList.remove("active");
  }

  _activeId = id;
  const plant = PLANTS.find(p => p.id === id);
  if (!plant) return;

  if (plant._svgNode) {
    plant._svgNode.classed("active", true).raise();
  }

  // Smooth pan + zoom into the plant
  if (_svg && _projection && _zoom) {
    const xy = _projection([plant.lng, plant.lat]);
    if (xy) {
      const [x, y] = xy;
      const w = _svg.node().clientWidth;
      const h = _svg.node().clientHeight;
      const k = 4;
      const tx = w / 2 - x * k;
      const ty = h / 2 - y * k;
      _svg.transition().duration(750).ease(d3.easeCubicOut)
        .call(_zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    }
  }

  const card = document.querySelector(`.plant-card[data-id="${id}"]`);
  if (card) {
    card.classList.add("active");
    const panel = document.getElementById("plant-panel");
    if (panel) {
      const cardTop = card.offsetTop;
      panel.scrollTo({ top: cardTop - 200, behavior: "smooth" });
    }
  }
}

function resetMap() {
  if (_svg && _zoom) {
    _svg.transition().duration(700).ease(d3.easeCubicOut)
      .call(_zoom.transform, d3.zoomIdentity);
  }
  if (_activeId) {
    const prev = PLANTS.find(p => p.id === _activeId);
    if (prev?._svgNode) prev._svgNode.classed("active", false);
    const prevCard = document.querySelector(`.plant-card[data-id="${_activeId}"]`);
    if (prevCard) prevCard.classList.remove("active");
    _activeId = null;
  }
  hideTooltip();
}
