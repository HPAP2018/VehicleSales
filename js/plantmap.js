/* plantmap.js — Ford North America Plant Map (2026 production data) */

/* ── Plant data (from 2026 Jan–Mar Monthly Production By Plant report) ─────── */
const PLANTS = [
  {
    id: "flat-rock",
    name: "Flat Rock Assembly",
    city: "Flat Rock, MI",
    country: "USA",
    lat: 42.0968, lng: -83.2744,
    vehicles: ["Ford Mustang"]
  },
  {
    id: "chicago",
    name: "Chicago Assembly",
    city: "Chicago, IL",
    country: "USA",
    lat: 41.6584, lng: -87.5823,
    vehicles: ["Ford Explorer", "Lincoln Aviator"]
  },
  {
    id: "cuautitlan",
    name: "Cuautitlan Assembly",
    city: "Cuautitlan Izcalli, Mexico",
    country: "Mexico",
    lat: 19.647, lng: -99.202,
    vehicles: ["Mustang Mach-E"]
  },
  {
    id: "dearborn-truck",
    name: "Dearborn Truck Plant",
    city: "Dearborn, MI",
    country: "USA",
    lat: 42.3078, lng: -83.188,
    vehicles: ["Ford F-Series (F-150)"]
  },
  {
    id: "detroit-chassis",
    name: "Detroit Chassis Plant",
    city: "Detroit, MI",
    country: "USA",
    lat: 42.3826, lng: -82.9876,
    vehicles: ["Stripped Chassis"]
  },
  {
    id: "hermosillo",
    name: "Hermosillo Stamping & Assembly",
    city: "Hermosillo, Sonora",
    country: "Mexico",
    lat: 29.063, lng: -110.948,
    vehicles: ["Bronco Sport", "Maverick"]
  },
  {
    id: "kansas-city",
    name: "Kansas City Assembly",
    city: "Claycomo, MO",
    country: "USA",
    lat: 39.2253, lng: -94.5178,
    vehicles: ["Ford Transit", "Ford F-Series (F-150)"]
  },
  {
    id: "kentucky-truck",
    name: "Kentucky Truck Plant",
    city: "Louisville, KY",
    country: "USA",
    lat: 38.1766, lng: -85.7432,
    vehicles: ["Ford F-Series (Super Duty)", "Ford Expedition", "Lincoln Navigator"]
  },
  {
    id: "michigan-assembly",
    name: "Michigan Assembly Plant",
    city: "Wayne, MI",
    country: "USA",
    lat: 42.2791, lng: -83.3878,
    vehicles: ["Ranger", "Bronco"]
  },
  {
    id: "multimatic",
    name: "Multimatic",
    city: "Markham, Ontario",
    country: "Canada",
    lat: 43.8561, lng: -79.2624,
    vehicles: ["Mustang GTD"]
  },
  {
    id: "ohio-assembly",
    name: "Ohio Assembly Plant",
    city: "Avon Lake, OH",
    country: "USA",
    lat: 41.504, lng: -82.035,
    vehicles: ["Ford Econoline", "Medium Truck", "Super Duty"]
  }
];

/* ── State ──────────────────────────────────────────────────────────────────── */
let _map           = null;
let _mapReady      = false;
let _activeId      = null;

/* ── Entry point called by tab switcher ─────────────────────────────────────── */
function onPlantMapTabShown() {
  buildPlantPanel();
  if (!_mapReady) {
    _mapReady = true;
    initLeafletMap();
  } else {
    // Leaflet needs a size refresh after being hidden
    setTimeout(() => _map && _map.invalidateSize(), 60);
  }
}

/* ── Build right-side panel ─────────────────────────────────────────────────── */
function buildPlantPanel() {
  const panel = document.getElementById("plant-panel");
  if (!panel || panel.dataset.built) return;
  panel.dataset.built = "1";

  panel.innerHTML = `
    <div class="plant-panel-header">
      <h2>Ford Production Plants</h2>
      <p class="plant-panel-sub">Source: 2026 Jan–Mar Production Report · Click a plant or map marker</p>
    </div>

    <div class="map-legend">
      <div class="legend-item">
        <div class="legend-dot" style="background:#003499"></div> USA
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#c8102e"></div> Canada
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#e67e22"></div> Mexico
      </div>
    </div>

    <div class="plant-list" id="plant-list">
      ${PLANTS.map(p => plantCardHTML(p)).join("")}
    </div>
  `;

  // Attach click listeners
  panel.querySelectorAll(".plant-card").forEach(card => {
    card.addEventListener("click", () => selectPlant(card.dataset.id));
  });
}

function plantCardHTML(p) {
  const cc = p.country.toLowerCase();
  const tags = p.vehicles.map(v => `<span class="vehicle-tag">${v}</span>`).join("");
  return `
    <div class="plant-card" data-id="${p.id}">
      <div class="plant-card-top">
        <div class="plant-dot ${cc}"></div>
        <div class="plant-card-info">
          <div class="plant-name">${p.name}</div>
          <div class="plant-city">${p.city}</div>
        </div>
        <span class="country-badge ${cc}">${p.country}</span>
      </div>
      <div class="vehicle-tags">${tags}</div>
    </div>`;
}

/* ── Init Leaflet ────────────────────────────────────────────────────────────── */
function initLeafletMap() {
  _map = L.map("plant-map", {
    center: [40, -97],
    zoom: 4,
    minZoom: 3,
    maxZoom: 13,
    zoomControl: true,
  });

  // CartoDB Positron — clean, light, no API key
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors ' +
        '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(_map);

  // Add a plant markers
  PLANTS.forEach(p => {
    const icon = makeIcon(p, false);
    const marker = L.marker([p.lat, p.lng], { icon, title: p.name }).addTo(_map);

    // Popup content
    const vehicleLines = p.vehicles.map(v => `• ${v}`).join("<br>");
    marker.bindPopup(`
      <div class="popup-plant-name">${p.name}</div>
      <div class="popup-city">${p.city} &nbsp;·&nbsp; ${p.country}</div>
      <div class="popup-vehicles">${vehicleLines}</div>
    `, { maxWidth: 220 });

    marker.on("click", () => selectPlant(p.id));
    p._marker = marker;
  });
}

/* ── Custom circular divIcon ─────────────────────────────────────────────────── */
function makeIcon(plant, active) {
  const cc  = plant.country.toLowerCase();
  const cls = `map-marker ${cc}${active ? " active" : ""}`;
  return L.divIcon({
    className: "map-marker-wrap",
    html: `<div class="${cls}"></div>`,
    iconSize:   active ? [22, 22] : [16, 16],
    iconAnchor: active ? [11, 11] : [8, 8],
    popupAnchor: [0, -10],
  });
}

/* ── Select a plant (from map click or panel click) ──────────────────────────── */
function selectPlant(id) {
  // Deactivate previous
  if (_activeId) {
    const prev = PLANTS.find(p => p.id === _activeId);
    if (prev?._marker) prev._marker.setIcon(makeIcon(prev, false));
    const prevCard = document.querySelector(`.plant-card[data-id="${_activeId}"]`);
    if (prevCard) prevCard.classList.remove("active");
  }

  _activeId = id;
  const plant = PLANTS.find(p => p.id === id);
  if (!plant) return;

  // Activate marker
  if (plant._marker) {
    plant._marker.setIcon(makeIcon(plant, true));
    plant._marker.openPopup();
    _map.setView([plant.lat, plant.lng], Math.max(_map.getZoom(), 7), { animate: true });
  }

  // Activate panel card + scroll into view
  const card = document.querySelector(`.plant-card[data-id="${id}"]`);
  if (card) {
    card.classList.add("active");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
