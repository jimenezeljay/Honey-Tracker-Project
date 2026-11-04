// Shared map code: Leaflet + OpenStreetMap (Mr. Gallic's pick). Used by the homepage,
// the Map page and the product page. Load Leaflet first:
//   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css">
//   <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
//   <script src="js/maps.js"></script>
//
// Privacy rule (10/2 meeting): a farm with precision 'approximate' only ever shows a
// dashed area, never a pin. The backend should send those farms' coordinates already
// rounded, so the real spot never reaches the browser.
//
// Tiles come from tile.openstreetmap.org, which is free for light use with the
// attribution shown in the corner. If traffic grows, swap TILE_URL for a paid or
// self-hosted tile server; nothing else changes.

const HTMap = (function () {
  const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const METERS_PER_MILE = 1609.34;
  const AREA_MILES = 3; // size of the dashed area for approximate farms

  // Colors match scss/_variables.scss
  const AMBER = '#E0A030';
  const SAGE = '#8A9A7B';

  const maps = [];

  // A map in `el` with OpenStreetMap tiles. Scroll-wheel zoom stays off by default
  // so the page still scrolls when the mouse passes over the map.
  function create(el, options = {}) {
    if (typeof L === 'undefined' || !el) return null;
    const map = L.map(el, {
      center: options.center || [39.5, -80],
      zoom: options.zoom || 5,
      scrollWheelZoom: options.scrollWheelZoom ?? false,
      zoomControl: options.zoomControl ?? true
    });
    L.tileLayer(TILE_URL, { maxZoom: 18, attribution: ATTRIBUTION }).addTo(map);
    el.classList.add('ht-map');
    applyStyle(el);
    maps.push(map);
    return map;
  }

  // An exact hive pin
  function pin(lat, lng, title) {
    return L.marker([lat, lng], {
      title,
      alt: title,
      keyboard: true,
      icon: L.divIcon({ className: 'ht-pin', iconSize: [18, 18], iconAnchor: [9, 9] })
    });
  }

  // Solid sage circle: how far the bees fly
  function forage(lat, lng, miles) {
    return L.circle([lat, lng], {
      radius: miles * METERS_PER_MILE,
      color: SAGE, weight: 2, opacity: .8, fillColor: SAGE, fillOpacity: .15,
      interactive: false
    });
  }

  // Approximate farm, zoomed out: a dashed ring that stays the same size on screen
  function areaIcon(lat, lng, title) {
    return L.marker([lat, lng], {
      title,
      alt: title,
      keyboard: true,
      icon: L.divIcon({ className: 'ht-area', iconSize: [28, 28], iconAnchor: [14, 14] })
    });
  }

  // Approximate farm, zoomed in: the real dashed area on the ground
  function area(lat, lng, title) {
    return L.circle([lat, lng], {
      radius: AREA_MILES * METERS_PER_MILE,
      color: AMBER, weight: 2, dashArray: '6 6', fillColor: AMBER, fillOpacity: .15
    }).bindTooltip(title, { direction: 'top' });
  }

  // Everything for one farm:
  //   markers  pins (exact hives) or one dashed ring (approximate farm); clickable, clusterable
  //   circles  forage circles around exact hives (when radii is true)
  //   areas    the real dashed area of an approximate farm (draw when zoomed in)
  //   hives: which hives to show (the product page passes just the batch's hives)
  function farmMarkers(farm, { hives = farm.hives, radii = true } = {}) {
    if (farm.precision !== 'exact') {
      return {
        markers: [areaIcon(farm.lat, farm.lng, farm.name)],
        circles: [],
        areas: [area(farm.lat, farm.lng, farm.name)],
        exact: false
      };
    }
    const shown = (hives || []).filter(h => h && h.lat != null);
    const markers = (shown.length ? shown : [farm]).map(h =>
      pin(h.lat, h.lng, shown.length ? `${farm.name} · Hive ${h.label}` : farm.name));
    const circles = radii
      ? shown.map(h => forage(h.lat, h.lng, h.forageRadiusMi))
      : [];
    return { markers, circles, areas: [], exact: true };
  }

  // ---- TEMPORARY: Standard / Softened switch (bottom left) ----
  // Softened tints the same OpenStreetMap tiles toward the site's cream and sage.
  // Remembered in this browser; ?mapstyle=softened also works.
  // Delete this block, .map-style-switch and .ht-map--soft once one is picked.
  const STYLE_KEY = 'ht-map-style';
  let style = 'standard';
  try {
    style = new URLSearchParams(window.location.search).get('mapstyle')
      || localStorage.getItem(STYLE_KEY) || 'standard';
  } catch (error) { /* storage blocked */ }

  function applyStyle(el) {
    el.classList.toggle('ht-map--soft', style === 'softened');
  }

  function setStyle(next) {
    style = next;
    document.querySelectorAll('.ht-map').forEach(applyStyle);
    document.querySelectorAll('.map-style-switch [data-map-style]').forEach(button => {
      const on = button.dataset.mapStyle === style;
      button.classList.toggle('active', on);
      button.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem(STYLE_KEY, style); } catch (error) { /* storage blocked */ }
  }

  function addStyleSwitch() {
    if (document.querySelector('.map-style-switch')) return;
    const box = document.createElement('div');
    box.className = 'map-style-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Map style');
    box.innerHTML = `
      <button type="button" class="btn btn-sm" data-map-style="standard">Standard</button>
      <button type="button" class="btn btn-sm" data-map-style="softened">Softened</button>`;
    document.body.appendChild(box);
    box.addEventListener('click', event => {
      const button = event.target.closest('[data-map-style]');
      if (button) setStyle(button.dataset.mapStyle);
    });
    setStyle(style);
  }

  // Leaflet measures its box once; call this after a map's container changes size
  // (e.g. a collapsed section opening).
  function refresh(map) {
    if (map) setTimeout(() => map.invalidateSize(), 0);
  }

  return { create, pin, forage, area, areaIcon, farmMarkers, addStyleSwitch, refresh, AMBER, SAGE };
})();
