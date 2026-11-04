// Map page (wireframes 2 and 3). Needs js/components.js, Leaflet + markercluster,
// js/maps.js and js/data.js loaded first.
//
//   map.html?q=clover  starts with that search
//   map.html?farm=3    zooms to that farm and opens its card
//
// Zoomed out, nearby farms group into numbered clusters (the number counts farms,
// not hives). Forage areas only draw once zoomed in far enough to see them.

(async function () {
  const page = document.getElementById('mapPage');
  const el = document.getElementById('bigMap');
  if (!page || !el || typeof HTMap === 'undefined' || typeof L === 'undefined') return;

  const FORAGE_MIN_ZOOM = 9;   // below this, forage circles are too small to mean anything
  const FARM_ZOOM = 12;

  const ui = {
    form: document.getElementById('mapForm'),
    query: document.getElementById('mapQuery'),
    hives: document.getElementById('layerHives'),
    forage: document.getElementById('layerForage'),
    certified: document.getElementById('layerCertified'),
    count: document.getElementById('resultCount'),
    list: document.getElementById('resultList'),
    empty: document.getElementById('resultEmpty'),
    showAll: document.getElementById('showAll'),
    card: document.getElementById('farmCard')
  };

  const map = HTMap.create(el, { center: [39.5, -80], zoom: 5, scrollWheelZoom: true });
  if (!map) return;

  const clusters = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    disableClusteringAtZoom: 11, // zoomed in to a farm: show each hive
    iconCreateFunction: cluster => {
      const farms = new Set(cluster.getAllChildMarkers().map(m => m.options.farmId)).size;
      return L.divIcon({
        className: 'ht-cluster',
        html: `<span>${farms}</span>`,
        iconSize: [40, 40]
      });
    }
  }).addTo(map);
  const forageLayer = L.layerGroup().addTo(map); // forage circles + approximate areas, zoomed in only

  const farms = await getFarms();
  const params = new URLSearchParams(window.location.search);
  ui.query.value = params.get('q') || '';

  // Each farm's markers, built once
  const built = new Map(farms.map(farm => {
    const parts = HTMap.farmMarkers(farm);
    parts.markers.forEach(m => {
      m.options.farmId = farm.id;
      m.on('click', () => openFarm(farm, { zoom: false }));
    });
    return [farm.id, parts];
  }));

  // ---- Filtering ----

  function haystack(farm) {
    return [
      farm.name, farm.keeper?.displayName, farm.county, `${farm.county} County`, farm.state,
      ...farm.listings.map(l => `${l.title} ${l.honeyType}`)
    ].join(' ').toLowerCase();
  }

  function visibleFarms() {
    const words = ui.query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return farms.filter(farm =>
      (!ui.certified.checked || farm.certified) &&
      words.every(word => haystack(farm).includes(word)));
  }

  function draw({ fit = false } = {}) {
    const shown = visibleFarms();
    clusters.clearLayers();
    forageLayer.clearLayers();

    if (ui.hives.checked) {
      shown.forEach(farm => clusters.addLayers(built.get(farm.id).markers));
    }
    if (map.getZoom() >= FORAGE_MIN_ZOOM) {
      shown.forEach(farm => {
        const parts = built.get(farm.id);
        if (ui.hives.checked) parts.areas.forEach(a => forageLayer.addLayer(a));
        if (ui.forage.checked) parts.circles.forEach(c => forageLayer.addLayer(c));
      });
    }

    if (fit && shown.length) {
      const bounds = L.latLngBounds(shown.map(f => [f.lat, f.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
    }
    renderList(shown);
  }

  // ---- Farms in view ----

  function renderList(shown = visibleFarms()) {
    const bounds = map.getBounds();
    const inView = shown
      .filter(farm => bounds.contains([farm.lat, farm.lng]))
      .sort((a, b) => a.name.localeCompare(b.name));

    ui.count.textContent = `${inView.length} ${inView.length === 1 ? 'farm' : 'farms'}`;
    ui.empty.hidden = inView.length > 0;
    ui.list.innerHTML = inView.map(farm => `
      <li>
        <button type="button" class="map-result" data-farm="${farm.id}">
          <span class="map-result__name">${escapeHtml(farm.name)}</span>
          <span class="map-result__place">${escapeHtml(farm.county)} County, ${escapeHtml(farm.state)}</span>
          <span class="map-result__badges">${farm.certified ? badgeIcon('certified') : ''}${farm.verification === 'volunteer' ? badgeIcon('volunteer-verified') : ''}</span>
        </button>
      </li>`).join('');
    disposeTooltips(ui.list);
    initTooltips(ui.list);
  }

  // ---- Farm card (wireframe 3) ----

  function openFarm(farm, { zoom = true } = {}) {
    if (zoom) {
      // Circles can't measure themselves until they're on the map, so use center + radius
      const { markers, circles, areas } = built.get(farm.id);
      const bounds = L.latLngBounds([]);
      [...markers, ...circles, ...areas].forEach(layer => {
        const radius = layer.getRadius ? layer.getRadius() : 0;
        bounds.extend(radius ? layer.getLatLng().toBounds(radius * 2) : layer.getLatLng());
      });
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: FARM_ZOOM });
    }

    const badges = [
      farm.certified ? 'certified' : null,
      farm.verification === 'volunteer' ? 'volunteer-verified' : null
    ].filter(Boolean).map(badge).join('');

    const honey = farm.listings.map(l => `
      <li>
        <a href="product.html?id=${encodeURIComponent(l.id)}">
          <span>${escapeHtml(l.title)}</span>
          <span class="farm-card__price">$${Number(l.price).toFixed(2)}${l.stock <= 0 ? ' &middot; Sold out' : ''}</span>
        </a>
      </li>`).join('');

    ui.card.innerHTML = `
      <button type="button" class="btn-close farm-card__close" aria-label="Close"></button>
      <p class="farm-card__where">${escapeHtml(farm.state)} &rsaquo; ${escapeHtml(farm.county)} County</p>
      <h2 class="farm-card__name" tabindex="-1">${escapeHtml(farm.name)}</h2>
      <p class="farm-card__keeper">Keeper: ${escapeHtml(farm.keeper?.displayName)}</p>
      ${badges ? `<div class="farm-card__badges">${badges}</div>` : ''}
      ${farm.precision === 'exact' ? '' : '<p class="farm-card__note">Approximate area, to protect the hives.</p>'}
      ${honey ? `<h3 class="map-label">Honey from this farm</h3><ul class="farm-card__honey">${honey}</ul>` : ''}`;
    ui.card.hidden = false;
    ui.card.querySelector('.farm-card__name').focus({ preventScroll: true });

    const url = new URL(window.location.href);
    url.searchParams.set('farm', farm.id);
    history.replaceState(null, '', url);
  }

  function closeFarm() {
    ui.card.hidden = true;
    const url = new URL(window.location.href);
    url.searchParams.delete('farm');
    history.replaceState(null, '', url);
  }

  // ---- Events ----

  let typing;
  ui.query.addEventListener('input', () => {
    clearTimeout(typing);
    typing = setTimeout(() => draw({ fit: true }), 250);
  });
  ui.form.addEventListener('submit', event => { event.preventDefault(); draw({ fit: true }); });
  [ui.hives, ui.certified].forEach(box => box.addEventListener('change', () => draw({ fit: box === ui.certified })));
  ui.forage.addEventListener('change', () => draw());

  map.on('zoomend', () => draw());
  map.on('moveend', () => renderList());

  ui.list.addEventListener('click', event => {
    const button = event.target.closest('[data-farm]');
    if (button) openFarm(farms.find(f => f.id === Number(button.dataset.farm)));
  });
  ui.card.addEventListener('click', event => {
    if (event.target.closest('.farm-card__close')) closeFarm();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !ui.card.hidden) closeFarm();
  });
  ui.showAll.addEventListener('click', () => {
    ui.query.value = '';
    ui.certified.checked = false;
    draw({ fit: true });
  });

  // ---- Start ----
  const start = farms.find(f => f.id === Number(params.get('farm')));
  draw({ fit: !start }); // a farm link zooms straight to that farm instead
  if (start) openFarm(start);

})();
