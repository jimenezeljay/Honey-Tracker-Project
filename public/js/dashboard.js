// Beekeeper dashboard (wireframe 13). Needs js/components.js and js/data.js first.
// Every keeper loads this same page; getKeeperDashboard() only returns their own records.

const CERTIFICATION_LABELS = { pending: 'Pending', certified: 'Certified', suspended: 'Suspended' };

function formatDate(isoDate) {
  return new Date(isoDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Placeholder map until the shared real map is on main. Places markers in the box
// by lat/lng: a pin per hive at exact farms, one dashed area at approximate farms
// (they never reveal their real hive spots).
function apiaryMap(farms, hives) {
  const markers = farms.flatMap(farm => farm.precision === 'exact'
    ? hives.filter(hive => hive.farmId === farm.id).map(hive => ({ kind: 'map-pin', lat: hive.lat, lng: hive.lng, title: `${farm.name}, hive ${hive.label}` }))
    : [{ kind: 'map-area', lat: farm.lat, lng: farm.lng, title: `${farm.name}, approximate area` }]);

  const lats = markers.map(marker => marker.lat);
  const lngs = markers.map(marker => marker.lng);
  // A value's place between lo% and hi% (the middle if every marker shares it)
  const place = (value, values, lo, hi) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max === min ? (lo + hi) / 2 : lo + ((value - min) / (max - min)) * (hi - lo);
  };

  const spans = markers.map(marker => {
    const left = place(marker.lng, lngs, 20, 80);
    const top = place(marker.lat, lats, 62, 22); // north is up; stays clear of the legend
    return `<span class="${marker.kind}" style="left: ${left}%; top: ${top}%" title="${escapeHtml(marker.title)}"></span>`;
  }).join('');

  return `
    <div class="map-box" role="img" aria-label="Map of your apiaries: ${escapeHtml(farms.map(farm => farm.name).join(', '))}">
      ${spans}
      <div class="map-legend">
        <span><i class="key-pin"></i>Exact hive</span>
        <span><i class="key-area"></i>Approximate area</span>
      </div>
    </div>`;
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

  document.getElementById('apiaryMap').innerHTML = apiaryMap(farms, hives);

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

  // The page was hidden when the browser tried to jump to #farms or #listings, so do it now.
  // Wait for load, or the browser's own attempt can cancel this one.
  const jumpToSection = () => {
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  };
  if (document.readyState === 'complete') jumpToSection();
  else window.addEventListener('load', jumpToSection);
});
