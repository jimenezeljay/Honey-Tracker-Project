// Beekeeper dashboard (wireframe 13). Needs js/components.js and js/data.js first.
// Every keeper loads this same page; getKeeperDashboard() only returns their own records.

const CERTIFICATION_LABELS = { pending: 'Pending', certified: 'Certified', suspended: 'Suspended' };

function formatDate(isoDate) {
  return new Date(isoDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// The keeper's own farms on the real map (js/maps.js): a pin and forage circle per hive
// at exact farms, one dashed area at approximate farms (they never reveal their hive spots).
function apiaryMap(farms) {
  const hasExact = farms.some(farm => farm.precision === 'exact');
  const hasArea = farms.some(farm => farm.precision !== 'exact');
  const legend = [
    hasExact ? '<span><i class="key-pin"></i>Hive</span><span><i class="key-radius"></i>Forage area</span>' : '',
    hasArea ? '<span><i class="key-area"></i>Approximate area</span>' : ''
  ].join('');

  return `
    <div class="map-box dash-map">
      <div class="dash-map__canvas" id="apiaryCanvas" aria-label="Map of your apiaries: ${escapeHtml(farms.map(farm => farm.name).join(', '))}"></div>
      <div class="map-legend">${legend}</div>
    </div>`;
}

// Runs after apiaryMap's markup is on the page and the page is visible.
function drawApiaryMap(farms, hives) {
  const el = document.getElementById('apiaryCanvas');
  if (!el || typeof HTMap === 'undefined' || !farms.length) return;

  const map = HTMap.create(el, { center: [farms[0].lat, farms[0].lng], zoom: 10 });
  if (!map) return;

  const layers = farms.flatMap(farm => {
    const { markers, circles, areas, exact } = HTMap.farmMarkers(farm, { hives: hives.filter(hive => hive.farmId === farm.id) });
    return exact ? [...circles, ...markers] : areas;
  });
  const group = L.featureGroup(layers).addTo(map);
  map.fitBounds(group.getBounds(), { padding: [24, 24], maxZoom: 12 });
}

// "1 Farm", "3 Farms"
const counted = (n, word) => `${word}${n === 1 ? '' : 's'}`;

// Honey and amount up top; batch and date underneath (the date never splits across lines).
// Suspended keepers can't print labels, so the QR label button goes away.
function harvestItem(batch, suspended) {
  const label = suspended ? '' : `
      <a class="btn btn-sm btn-outline-secondary" href="qr-label.html?batch=${encodeURIComponent(batch.id)}" aria-label="QR label for batch ${escapeHtml(batch.batchNumber)}">
        <i class="bi bi-qr-code" aria-hidden="true"></i> QR label
      </a>`;
  return `
    <li>
      <div class="dash-list__main">
        <span class="dash-list__title">${escapeHtml(batch.honeyType)} &middot; ${escapeHtml(batch.quantityLb)} lb</span>
        <span class="dash-list__meta">Batch ${escapeHtml(batch.batchNumber)} &middot; <span class="text-nowrap">${formatDate(batch.harvestDate)}</span></span>
      </div>${label}
    </li>`;
}

function listingItem(listing, suspended) {
  const stock = suspended
    ? '<span class="badge badge-status-suspended">Hidden</span>'
    : listing.stock > 0
      ? `${escapeHtml(listing.stock)} in stock`
      : '<span class="badge badge-status-pending">Sold out</span>';
  return `
    <li>
      <div class="dash-list__main">
        <a class="dash-list__title" href="product.html?id=${encodeURIComponent(listing.id)}">${escapeHtml(listing.title)} &middot; ${escapeHtml(listing.jarOz)} oz</a>
        <span class="dash-list__meta">$${Number(listing.price).toFixed(2)} &middot; ${stock}</span>
      </div>
      <div class="product-card__badges">${listing.badges.filter(key => !(suspended && key === 'certified')).map(badgeIcon).join('')}</div>
    </li>`;
}

function renderDashboard({ keeper, farms, hives, batches, listings }) {
  document.getElementById('welcome').textContent = `Welcome back, ${keeper.displayName.split(' ')[0]}`;
  document.getElementById('certification').innerHTML =
    `<span class="text-soft me-2">Certification</span><span class="badge badge-status-${escapeHtml(keeper.certification)}">${escapeHtml(CERTIFICATION_LABELS[keeper.certification])}</span>`;
  const suspended = keeper.certification === 'suspended';
  document.getElementById('suspendedNotice').hidden = !suspended;
  document.getElementById('logHarvestButton').hidden = suspended;

  // Brand-new keeper: one clear next step instead of a page of zeros
  if (farms.length === 0) {
    document.getElementById('dashboardContent').hidden = true;
    document.getElementById('newKeeperIcon').innerHTML = icon('hive-box', 'empty-icon__svg');
    document.getElementById('newKeeper').hidden = false;
    return;
  }

  document.getElementById('stats').innerHTML = [
    statTile(counted(farms.length, 'Farm'), farms.length, 'barn'),
    statTile(counted(hives.length, 'Hive'), hives.length, 'hive-box'),
    statTile(counted(batches.length, 'Harvest'), batches.length, 'drop'),
    statTile(counted(listings.length, 'Listing'), listings.length, 'jar')
  ].map(tile => `<div class="col-6 col-xl-3">${tile}</div>`).join('');

  document.getElementById('apiaryMap').innerHTML = apiaryMap(farms);

  const recent = [...batches].sort((a, b) => b.harvestDate.localeCompare(a.harvestDate)).slice(0, 3);
  document.getElementById('recentHarvests').innerHTML = recent.length
    ? recent.map(batch => harvestItem(batch, suspended)).join('')
    : '<li class="dash-list__meta">No harvests yet. <a href="log-harvest.html">Log your first</a></li>';

  document.getElementById('myListings').innerHTML = listings.length
    ? listings.map(listing => listingItem(listing, suspended)).join('')
    : '<li class="dash-list__meta">Nothing for sale yet.</li>';
  initTooltips(document.getElementById('myListings'));
}

getKeeperDashboard().then(data => {
  // These redirects guide people to the right page. They are not the security:
  // the backend must refuse dashboard data to anyone but an approved keeper.
  if (!data) {
    location.replace('signin.html');
    return;
  }
  if (data.keeper.applicationStatus !== 'approved') {
    location.replace('keeper-pending.html');
    return;
  }
  renderDashboard(data);
  document.getElementById('keeperPage').hidden = false;
  drawApiaryMap(data.farms, data.hives); // after the page shows, so Leaflet can measure the box

  // The page was hidden when the browser tried to jump to #farms or #listings, so do it now.
  // Wait for load, or the browser's own attempt can cancel this one.
  const jumpToSection = () => {
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  };
  if (document.readyState === 'complete') jumpToSection();
  else window.addEventListener('load', jumpToSection);

  // Highlight the sidebar item for the section in the address (#farms, #listings)
  syncSidebar();
  window.addEventListener('hashchange', syncSidebar);
});

function syncSidebar() {
  const current = `dashboard.html${location.hash === '#farms' || location.hash === '#listings' ? location.hash : ''}`;
  document.querySelectorAll('.keeper-sidebar .nav-link').forEach(link => {
    const on = link.getAttribute('href') === current;
    link.classList.toggle('active', on);
    if (on) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
