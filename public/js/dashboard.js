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

function harvestItem(batch) {
  return `
    <li>
      <div class="dash-list__main">
        <span class="dash-list__title">${escapeHtml(batch.season)} &middot; ${escapeHtml(batch.quantityLb)} lb</span>
        <span class="dash-list__meta">${escapeHtml(batch.honeyType)} &middot; Batch ${escapeHtml(batch.batchNumber)} &middot; ${formatDate(batch.harvestDate)}</span>
      </div>
      <a class="btn btn-sm btn-outline-secondary" href="qr-label.html?batch=${encodeURIComponent(batch.id)}">
        <i class="bi bi-qr-code" aria-hidden="true"></i> QR label
      </a>
    </li>`;
}

function listingItem(listing) {
  const stock = listing.stock > 0
    ? `${escapeHtml(listing.stock)} in stock`
    : '<span class="badge badge-status-pending">Sold out</span>';
  return `
    <li>
      <div class="dash-list__main">
        <a class="dash-list__title" href="product.html?id=${encodeURIComponent(listing.id)}">${escapeHtml(listing.title)} &middot; ${escapeHtml(listing.jarOz)} oz</a>
        <span class="dash-list__meta">$${Number(listing.price).toFixed(2)} &middot; ${stock}</span>
      </div>
      <div class="product-card__badges">${listing.badges.map(badgeIcon).join('')}</div>
    </li>`;
}

function renderDashboard({ keeper, farms, hives, batches, listings }) {
  document.getElementById('welcome').textContent = `Welcome back, ${keeper.displayName.split(' ')[0]}`;
  document.getElementById('certification').innerHTML =
    `<span class="text-soft me-2">Certification</span><span class="badge badge-status-${escapeHtml(keeper.certification)}">${escapeHtml(CERTIFICATION_LABELS[keeper.certification])}</span>`;
  document.getElementById('suspendedNotice').hidden = keeper.certification !== 'suspended';

  // Brand-new keeper: one clear next step instead of a page of zeros
  if (farms.length === 0) {
    document.getElementById('dashboardContent').hidden = true;
    document.getElementById('newKeeperIcon').innerHTML = icon('hive-box', 'empty-icon__svg');
    document.getElementById('newKeeper').hidden = false;
    return;
  }

  document.getElementById('stats').innerHTML = [
    statTile('Farms', farms.length, 'barn'),
    statTile('Hives', hives.length, 'hive-box'),
    statTile('Harvests', batches.length, 'drop'),
    statTile('Listings', listings.length, 'jar')
  ].map(tile => `<div class="col-6 col-xl-3">${tile}</div>`).join('');

  document.getElementById('apiaryMap').innerHTML = apiaryMap(farms);

  const recent = [...batches].sort((a, b) => b.harvestDate.localeCompare(a.harvestDate)).slice(0, 3);
  document.getElementById('recentHarvests').innerHTML = recent.length
    ? recent.map(harvestItem).join('')
    : '<li class="dash-list__meta">No harvests yet. <a href="log-harvest.html">Log your first</a></li>';

  document.getElementById('myListings').innerHTML = listings.length
    ? listings.map(listingItem).join('')
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
});
