/* plantmap.js — Ford Global Assembly Plants */

/* ── Plant data ──────────────────────────────────────────────────────────────
   Source: ford.com/operations/locations/global-plants (assembly only)
   Regions → colour coding:
     americas  = Ford Blue  (#003499)
     europe    = Red        (#c8102e)
     asia      = Green      (#27ae60)
     africa    = Orange     (#e67e22)
────────────────────────────────────────────────────────────────────────────── */
const PLANTS = [

  /* ── United States ── */
  {
    id: "chicago",
    name: "Chicago Assembly",
    city: "Chicago, IL", country: "USA", region: "americas",
    lat: 41.6584, lng: -87.5823,
    vehicles: ["Ford Explorer", "Lincoln Aviator"]
  },
  {
    id: "dearborn-truck",
    name: "Dearborn Truck Plant",
    city: "Dearborn, MI", country: "USA", region: "americas",
    lat: 42.3078, lng: -83.188,
    vehicles: ["Ford F-150"]
  },
  {
    id: "flat-rock",
    name: "Flat Rock Assembly Plant",
    city: "Flat Rock, MI", country: "USA", region: "americas",
    lat: 42.0968, lng: -83.2744,
    vehicles: ["Ford Mustang"]
  },
  {
    id: "kansas-city",
    name: "Kansas City Assembly",
    city: "Claycomo, MO", country: "USA", region: "americas",
    lat: 39.2253, lng: -94.5178,
    vehicles: ["Ford F-150", "Ford Transit"]
  },
  {
    id: "kentucky-truck",
    name: "Kentucky Truck Plant",
    city: "Louisville, KY", country: "USA", region: "americas",
    lat: 38.1766, lng: -85.7432,
    vehicles: ["Ford Super Duty", "Ford Expedition", "Lincoln Navigator"]
  },
  {
    id: "louisville-assembly",
    name: "Louisville Assembly Plant",
    city: "Louisville, KY", country: "USA", region: "americas",
    lat: 38.1450, lng: -85.7680,
    vehicles: ["Ford Escape", "Lincoln Corsair"]
  },
  {
    id: "michigan-assembly",
    name: "Michigan Assembly Plant",
    city: "Wayne, MI", country: "USA", region: "americas",
    lat: 42.2791, lng: -83.3878,
    vehicles: ["Ford Ranger", "Ford Bronco"]
  },
  {
    id: "ohio-assembly",
    name: "Ohio Assembly Plant",
    city: "Avon Lake, OH", country: "USA", region: "americas",
    lat: 41.504, lng: -82.035,
    vehicles: ["Ford E-Series", "Ford F-650/750", "Ford F-350/450/550 Chassis Cab"]
  },

  /* ── Canada ── */
  {
    id: "oakville",
    name: "Oakville Assembly",
    city: "Oakville, Ontario", country: "Canada", region: "americas",
    lat: 43.4675, lng: -79.6877,
    vehicles: ["(Idle — retooling)"]
  },

  /* ── Mexico ── */
  {
    id: "cuautitlan",
    name: "Cuautitlan Assembly",
    city: "Cuautitlán Izcalli, Mexico", country: "Mexico", region: "americas",
    lat: 19.647, lng: -99.202,
    vehicles: ["Ford Mustang Mach-E"]
  },
  {
    id: "hermosillo",
    name: "Hermosillo Assembly",
    city: "Hermosillo, Sonora, Mexico", country: "Mexico", region: "americas",
    lat: 29.063, lng: -110.948,
    vehicles: ["Ford Bronco Sport", "Ford Maverick"]
  },

  /* ── South America ── */
  {
    id: "pacheco",
    name: "Pacheco Assembly",
    city: "General Pacheco, Argentina", country: "Argentina", region: "americas",
    lat: -34.4622, lng: -58.6547,
    vehicles: ["Ford Ranger"]
  },
  {
    id: "valencia",
    name: "Valencia Assembly",
    city: "Valencia, Venezuela", country: "Venezuela", region: "americas",
    lat: 10.162, lng: -68.0077,
    vehicles: ["Ford Explorer"]
  },

  /* ── Germany ── */
  {
    id: "cologne",
    name: "Cologne Assembly",
    city: "Cologne, Germany", country: "Germany", region: "europe",
    lat: 50.9859, lng: 6.9267,
    vehicles: ["Ford Explorer EV", "Ford Capri EV"]
  },

  /* ── Romania ── */
  {
    id: "craiova",
    name: "Craiova Assembly",
    city: "Craiova, Romania", country: "Romania", region: "europe",
    lat: 44.3302, lng: 23.7948,
    vehicles: ["Ford Puma", "Ford Transit Courier"]
  },

  /* ── Turkey ── */
  {
    id: "golcuk",
    name: "Ford Otosan Gölcük Plant",
    city: "Gölcük, Turkey", country: "Turkey", region: "europe",
    lat: 40.7021, lng: 29.8225,
    vehicles: ["Ford Transit", "Ford Transit Custom", "Ford Tourneo Custom"]
  },
  {
    id: "yeni-koy",
    name: "Ford Otosan Yeniköy Plant",
    city: "Kocaeli, Turkey", country: "Turkey", region: "europe",
    lat: 40.7500, lng: 29.9800,
    vehicles: ["Ford Transit Courier"]
  },

  /* ── China ── */
  {
    id: "chongqing",
    name: "Changan Ford Chongqing Assembly",
    city: "Chongqing, China", country: "China", region: "asia",
    lat: 29.563, lng: 106.552,
    vehicles: ["Ford Escape", "Ford Mondeo", "Mustang Mach-E", "Lincoln Corsair", "Lincoln Z"]
  },
  {
    id: "hangzhou",
    name: "Changan Ford Hangzhou Assembly",
    city: "Hangzhou, China", country: "China", region: "asia",
    lat: 30.2741, lng: 120.1551,
    vehicles: ["Ford Edge L", "Ford Explorer", "Lincoln Aviator", "Lincoln Nautilus"]
  },
  {
    id: "harbin",
    name: "Changan Ford Harbin Assembly",
    city: "Harbin, China", country: "China", region: "asia",
    lat: 45.8038, lng: 126.5349,
    vehicles: ["Ford Focus"]
  },
  {
    id: "nanchang",
    name: "JMC Nanchang Assembly",
    city: "Nanchang, China", country: "China", region: "asia",
    lat: 28.682, lng: 115.858,
    vehicles: ["Ford Transit", "Ford Everest", "Ford Territory", "Ford Equator"]
  },

  /* ── Thailand ── */
  {
    id: "thailand",
    name: "Ford Thailand Manufacturing",
    city: "Rayong, Thailand", country: "Thailand", region: "asia",
    lat: 12.7987, lng: 101.3233,
    vehicles: ["Ford Ranger", "Ford Everest"]
  },

  /* ── Taiwan ── */
  {
    id: "taoyuan",
    name: "Ford Lio Ho Assembly",
    city: "Taoyuan, Taiwan", country: "Taiwan", region: "asia",
    lat: 24.9936, lng: 121.301,
    vehicles: ["Ford Focus", "Ford Kuga", "Ford Territory"]
  },

  /* ── Vietnam ── */
  {
    id: "hai-duong",
    name: "Ford Vietnam Assembly",
    city: "Hai Duong, Vietnam", country: "Vietnam", region: "asia",
    lat: 20.9373, lng: 106.3147,
    vehicles: ["Ford Transit", "Ford Ranger"]
  },

  /* ── South Africa ── */
  {
    id: "silverton",
    name: "Silverton Assembly Plant",
    city: "Pretoria, South Africa", country: "South Africa", region: "africa",
    lat: -25.7478, lng: 28.3231,
    vehicles: ["Ford Ranger", "Ford Everest"]
  },
];

/* ── State ──────────────────────────────────────────────────────────────────── */
let _map      = null;
let _mapReady = false;
let _activeId = null;

/* ── Entry point called by tab switcher ─────────────────────────────────────── */
function onPlantMapTabShown() {
  buildPlantPanel();
  if (!_mapReady) {
    _mapReady = true;
    // Small delay so the container is painted before Leaflet measures it
    setTimeout(initLeafletMap, 80);
  } else {
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
      <h2>Ford Global Assembly Plants</h2>
      <p class="plant-panel-sub">Source: ford.com/operations/locations/global-plants · Click a plant or marker</p>
    </div>

    <div class="map-legend">
      <div class="legend-item">
        <div class="legend-dot" style="background:#003499"></div> Americas
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#c8102e"></div> Europe
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#27ae60"></div> Asia-Pacific
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background:#e67e22"></div> Africa
      </div>
    </div>

    <div class="plant-list" id="plant-list">
      ${PLANTS.map(p => plantCardHTML(p)).join("")}
    </div>
  `;

  panel.querySelectorAll(".plant-card").forEach(card => {
    card.addEventListener("click", () => selectPlant(card.dataset.id));
  });
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

/* ── Init Leaflet ────────────────────────────────────────────────────────────── */
function initLeafletMap() {
  _map = L.map("plant-map", {
    center: [25, 15],
    zoom: 2,
    minZoom: 2,
    maxZoom: 13,
    zoomControl:      false,
    dragging:         false,
    scrollWheelZoom:  false,
    doubleClickZoom:  false,
    touchZoom:        false,
    boxZoom:          false,
    keyboard:         false,
  });

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

  PLANTS.forEach(p => {
    const icon   = makeIcon(p, false);
    const marker = L.marker([p.lat, p.lng], { icon, title: p.name }).addTo(_map);

    const vehicleLines = p.vehicles.map(v => `• ${v}`).join("<br>");
    marker.bindPopup(`
      <div class="popup-plant-name">${p.name}</div>
      <div class="popup-city">${p.city} &nbsp;·&nbsp; ${p.country}</div>
      <div class="popup-vehicles">${vehicleLines}</div>
    `, { maxWidth: 230 });

    marker.on("click", () => selectPlant(p.id));
    p._marker = marker;
  });
}

/* ── Custom circular divIcon ─────────────────────────────────────────────────── */
function makeIcon(plant, active) {
  const cls = `map-marker ${plant.region}${active ? " active" : ""}`;
  return L.divIcon({
    className: "map-marker-wrap",
    html: `<div class="${cls}"></div>`,
    iconSize:   active ? [22, 22] : [16, 16],
    iconAnchor: active ? [11, 11] : [8, 8],
    popupAnchor: [0, -10],
  });
}

/* ── Select a plant ──────────────────────────────────────────────────────────── */
function selectPlant(id) {
  if (_activeId) {
    const prev = PLANTS.find(p => p.id === _activeId);
    if (prev?._marker) prev._marker.setIcon(makeIcon(prev, false));
    const prevCard = document.querySelector(`.plant-card[data-id="${_activeId}"]`);
    if (prevCard) prevCard.classList.remove("active");
  }

  _activeId = id;
  const plant = PLANTS.find(p => p.id === id);
  if (!plant) return;

  if (plant._marker) {
    plant._marker.setIcon(makeIcon(plant, true));
    plant._marker.openPopup();
    _map.setView([plant.lat, plant.lng], Math.max(_map.getZoom(), 6), { animate: true });
  }

  const card = document.querySelector(`.plant-card[data-id="${id}"]`);
  if (card) {
    card.classList.add("active");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}
