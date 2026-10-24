// Marketplace (wireframe 4): filter and sort the honey listings.
// Needs js/components.js (productCard, BADGES) and js/data.js (getListings) loaded first.
//
// Filters live in the URL (?type=Clover&state=OH&verified=1&badges=certified,raw&sort=price)
// so a filtered view can be shared or linked to, e.g. from a farm on the map.

(function () {
  const form = document.getElementById('filterForm');
  const grid = document.getElementById('listingGrid');
  if (!form || !grid) return;

  const el = {
    type: document.getElementById('typeSelect'),
    verified: document.getElementById('verifiedOnly'),
    badgeChecks: document.getElementById('badgeChecks'),
    state: document.getElementById('stateSelect'),
    min: document.getElementById('priceMin'),
    max: document.getElementById('priceMax'),
    season: document.getElementById('seasonSelect'),
    sort: document.getElementById('sortSelect'),
    count: document.getElementById('resultCount'),
    filterCount: document.getElementById('filterCount'),
    showResults: document.getElementById('showResults'),
    noResults: document.getElementById('noResults'),
    nearNote: document.getElementById('nearNote'),
    nearPlace: document.getElementById('nearPlace'),
    useLocation: document.getElementById('useLocation')
  };

  // Where "nearest" measures from until the shopper shares their location.
  // Placeholder: Steubenville, OH. Later this could come from a ZIP the shopper enters.
  let origin = { lat: 40.36, lng: -80.63, label: 'Steubenville, OH' };

  // Volunteer-Verified has its own switch, so it isn't repeated in the badge list.
  const BADGE_FILTERS = Object.keys(BADGES).filter(key => key !== 'volunteer-verified');

  let listings = [];

  // ---------- Setup ----------

  function addOptions(select, values) {
    values.forEach(value => select.add(new Option(value, value)));
  }

  // "Spring 2026" -> sortable number, so seasons list in calendar order
  const SEASON_ORDER = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };
  function seasonKey(season) {
    const [name, year] = season.split(' ');
    return Number(year) * 10 + (SEASON_ORDER[name] || 0);
  }

  function buildFilterOptions() {
    const unique = key => [...new Set(listings.map(l => l[key]))];

    addOptions(el.type, unique('honeyType').sort());
    addOptions(el.state, unique('state').sort());
    addOptions(el.season, unique('season').sort((a, b) => seasonKey(b) - seasonKey(a)));

    el.badgeChecks.innerHTML = BADGE_FILTERS.map(key => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" name="badges" value="${key}" id="badge-${key}">
        <label class="form-check-label" for="badge-${key}">${badge(key)}</label>
      </div>`).join('');
  }

  // ---------- Reading and writing filters ----------

  function readFilters() {
    const data = new FormData(form);
    const number = name => (data.get(name) === '' || data.get(name) === null ? null : Number(data.get(name)));
    return {
      type: data.get('type') || '',
      verified: data.has('verified'),
      badges: data.getAll('badges'),
      state: data.get('state') || '',
      min: number('min'),
      max: number('max'),
      season: data.get('season') || '',
      sort: data.get('sort') || 'nearest'
    };
  }

  // Fill the form from the URL on first load
  function applyUrl() {
    const params = new URLSearchParams(window.location.search);
    const setSelect = (select, value) => {
      if (value && [...select.options].some(o => o.value === value)) select.value = value;
    };
    setSelect(el.type, params.get('type'));
    setSelect(el.state, params.get('state'));
    setSelect(el.season, params.get('season'));
    setSelect(el.sort, params.get('sort'));
    el.verified.checked = params.get('verified') === '1';
    el.min.value = params.get('min') || '';
    el.max.value = params.get('max') || '';
    (params.get('badges') || '').split(',').forEach(key => {
      const box = document.getElementById(`badge-${key}`);
      if (box) box.checked = true;
    });
  }

  // Keep the URL in step with the form, leaving out empty filters and the default sort
  function writeUrl(f) {
    const params = new URLSearchParams();
    if (f.type) params.set('type', f.type);
    if (f.verified) params.set('verified', '1');
    if (f.badges.length) params.set('badges', f.badges.join(','));
    if (f.state) params.set('state', f.state);
    if (f.min !== null) params.set('min', f.min);
    if (f.max !== null) params.set('max', f.max);
    if (f.season) params.set('season', f.season);
    if (f.sort !== 'nearest') params.set('sort', f.sort);
    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }

  // ---------- Filtering and sorting ----------

  // Straight-line distance in miles (haversine)
  function milesBetween(a, b) {
    const rad = d => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 3959 * 2 * Math.asin(Math.sqrt(h));
  }

  function matches(listing, f) {
    if (listing.stock <= 0) return false; // sold out listings stay off the marketplace
    if (f.type && listing.honeyType !== f.type) return false;
    if (f.verified && !listing.badges.includes('volunteer-verified')) return false;
    if (f.badges.some(key => !listing.badges.includes(key))) return false; // must have every checked badge
    if (f.state && listing.state !== f.state) return false;
    if (f.min !== null && listing.price < f.min) return false;
    if (f.max !== null && listing.price > f.max) return false;
    if (f.season && listing.season !== f.season) return false;
    return true;
  }

  const SORTS = {
    nearest: (a, b) => milesBetween(origin, a) - milesBetween(origin, b),
    price: (a, b) => a.price - b.price,
    newest: (a, b) => b.harvestDate.localeCompare(a.harvestDate)
  };

  // How many filters are on (sort doesn't count), for the mobile Filters button
  function activeFilterCount(f) {
    return [f.type, f.verified, f.state, f.min !== null, f.max !== null, f.season].filter(Boolean).length + f.badges.length;
  }

  // ---------- Render ----------

  function render() {
    const f = readFilters();
    const results = listings.filter(l => matches(l, f)).sort(SORTS[f.sort] || SORTS.nearest);

    grid.innerHTML = results
      .map(listing => `<div class="col-sm-6 col-xl-4">${productCard(listing)}</div>`)
      .join('');

    const label = `${results.length} ${results.length === 1 ? 'honey' : 'honeys'}`;
    el.count.textContent = `${label} found`;
    el.noResults.hidden = results.length > 0;
    if (el.showResults) el.showResults.textContent = `Show ${label}`;

    const active = activeFilterCount(f);
    el.filterCount.textContent = active;
    el.filterCount.classList.toggle('d-none', active === 0);

    el.nearNote.hidden = f.sort !== 'nearest';
    el.nearPlace.textContent = origin.label;

    writeUrl(f);
  }

  // ---------- Events ----------

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  el.sort.addEventListener('change', render); // lives outside the form element (form="filterForm")
  form.addEventListener('submit', event => event.preventDefault());
  // "reset" fires before the fields clear, so render on the next tick
  form.addEventListener('reset', () => setTimeout(render));
  document.getElementById('clearFromEmpty').addEventListener('click', () => form.reset());

  el.useLocation.addEventListener('click', () => {
    if (!('geolocation' in navigator)) return;
    el.useLocation.disabled = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        origin = { lat: position.coords.latitude, lng: position.coords.longitude, label: 'you' };
        el.useLocation.hidden = true;
        render();
      },
      () => { el.useLocation.disabled = false; }, // declined: keep the default spot
      { maximumAge: 600000, timeout: 10000 }
    );
  });

  // ---------- Start ----------

  getListings().then(all => {
    listings = all;
    buildFilterOptions();
    applyUrl();
    render();
  });
})();
