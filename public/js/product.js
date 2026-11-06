// Product / trace page (wireframe 5, v2).
// Needs js/components.js (escapeHtml, icon, BADGES, initTooltips) and js/data.js (getListing, getTrace).
//
//   product.html?id=4      a Marketplace listing
//   product.html?batch=11  a QR label. If that batch isn't sold here, the buy box
//                          becomes "Visit keeper's shop" (QR codes work anywhere a keeper sells).
// Anything missing or unknown goes to the bee-pun No data found page.

(function () {
  const page = document.getElementById('trace');
  if (!page) return;

  const MAX_QTY = 10;
  const STEP_LABELS = { bloom: 'Bloom', harvest: 'Harvest', jarred: 'Jarred' };

  const fill = name => document.querySelector(`[data-fill="${name}"]`);
  const money = n => `$${Number(n).toFixed(2)}`;

  // '2026-06-14' -> 'Jun 14, 2026' (or 'Jun 2026' with monthOnly). Parsed as a local date, so no timezone shift.
  function niceDate(iso, monthOnly = false) {
    const [y, m, d] = iso.split('-').map(Number);
    const opts = monthOnly ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
  }

  function notFound() {
    window.location.replace('not-found.html');
  }

  // ---- Top: breadcrumb, title, farm, badges ----

  function renderHead(t) {
    document.title = `${t.title} | Honey Tracker`;

    fill('breadcrumb').innerHTML = t.listing
      ? `<ol class="breadcrumb">
           <li class="breadcrumb-item"><a href="marketplace.html">Marketplace</a></li>
           <li class="breadcrumb-item active" aria-current="page">${escapeHtml(t.title)}</li>
         </ol>`
      : '';

    fill('title').textContent = t.title;

    // Farm name opens a small card with the farm's description (hover or tap)
    const farm = t.farm;
    fill('from').innerHTML = `from
      <button type="button" class="trace-farm" data-bs-toggle="popover" data-bs-trigger="hover focus"
        data-bs-placement="bottom" data-bs-title="${escapeHtml(farm.name)}"
        data-bs-content="${escapeHtml(farm.description)}">${escapeHtml(farm.name)}</button>
      <span class="text-soft">&middot; ${escapeHtml(farm.county)} County, ${escapeHtml(farm.state)}</span>`;

    // Icon badges, each linking to its definition on the Learn page
    fill('badges').innerHTML = (t.badges || []).filter(key => BADGES[key]).map(key => {
      const b = BADGES[key];
      return `<a class="badge badge-${key} badge--icon" href="learn.html#${key}" data-bs-toggle="tooltip" data-bs-title="${b.label}">
        ${icon(b.icon, 'badge-icon')}<span class="visually-hidden">${b.label}</span></a>`;
    }).join('');
  }

  // ---- Bloom -> Harvest -> Jarred ----

  function renderSteps(t) {
    const steps = ['bloom', 'harvest', 'jarred']
      .map(stage => t.timeline.find(step => step.stage === stage))
      .filter(Boolean);

    fill('steps').innerHTML = steps.map(step => {
      const date = niceDate(step.date, step.stage === 'bloom');
      const extra = step.stage === 'harvest' ? ` &middot; Batch ${escapeHtml(t.batch.batchNumber)}` : '';
      return `<li class="trace-step">
        <span class="trace-step__dot" aria-hidden="true"></span>
        <span class="trace-step__label">${STEP_LABELS[step.stage]}</span>
        <span class="trace-step__date">${date}${extra}</span>
      </li>`;
    }).join('');
  }

  // ---- Where it's from: map, pollen, nearby blooms ----

  function renderWhere(t) {
    const farm = t.farm;
    const radius = t.hives[0]?.forageRadiusMi;
    const exact = farm.precision === 'exact';

    // Real map (js/maps.js), drawn the first time the section opens.
    // Approximate farms only ever show an area, never a pin (keepers' privacy).
    const legend = exact
      ? `<span><span class="key-pin"></span>Hive</span><span><span class="key-radius"></span>${radius} mi forage</span>`
      : `<span><span class="key-area"></span>Approximate area</span>`;

    const pollen = [...t.pollen].sort((a, b) => b.percent - a.percent).map(p => `
      <li class="pollen-row">
        <span class="pollen-row__name">${escapeHtml(p.flower)}</span>
        <span class="pollen-row__track"><span class="pollen-row__bar" style="width:${Number(p.percent)}%"></span></span>
        <span class="pollen-row__pct">${Number(p.percent)}%</span>
      </li>`).join('');

    const flowers = (t.nearbyFlowers?.flowers || [])
      .map(f => `<li class="trace-chip">${escapeHtml(f)}</li>`).join('');

    fill('where').innerHTML = `
      <div class="map-box trace-map">
        <div class="trace-map__canvas" id="hiveMap" aria-label="Map: ${exact ? 'hive locations' : 'approximate hive area'} near ${escapeHtml(farm.county)} County, ${escapeHtml(farm.state)}"></div>
        <div class="map-legend">${legend}</div>
        <a class="trace-map__link" href="map.html?farm=${encodeURIComponent(farm.id)}">Open in map</a>
      </div>
      <div class="trace-where__info">
        <h3 class="trace-label">Pollen</h3>
        <ul class="pollen-list">${pollen}</ul>
        <h3 class="trace-label">Nearby blooms</h3>
        <ul class="trace-chips">${flowers}</ul>
        <p class="trace-note">Not medical advice.</p>
      </div>`;
  }

  // Leaflet needs a visible box to measure, so the map waits for its section to open
  let hiveMap = null;

  function drawHiveMap(t) {
    const el = document.getElementById('hiveMap');
    if (!el || typeof HTMap === 'undefined') return;
    if (hiveMap) { HTMap.refresh(hiveMap); return; }

    hiveMap = HTMap.create(el, { center: [t.farm.lat, t.farm.lng], zoom: 11 });
    if (!hiveMap) return;
    const { markers, circles, areas, exact } = HTMap.farmMarkers(t.farm, { hives: t.hives });
    const group = L.featureGroup(exact ? [...circles, ...markers] : areas).addTo(hiveMap);
    hiveMap.fitBounds(group.getBounds(), { padding: [24, 24], maxZoom: 12 });
  }

  // ---- The keeper ----

  function renderKeeper(t) {
    const keeper = t.keeper;
    const checked = t.farm.verification === 'volunteer'
      ? 'Checked in person by a volunteer'
      : 'Reported by the keeper';
    const photo = keeper.photo
      ? `<img class="trace-keeper__photo" src="${escapeHtml(keeper.photo)}" alt="">`
      : `<span class="trace-keeper__photo" aria-hidden="true"><i class="bi bi-person"></i></span>`;

    fill('keeper').innerHTML = `
      <div class="trace-keeper">
        ${photo}
        <div>
          <p class="trace-keeper__name">${escapeHtml(keeper.displayName)}</p>
          <p class="mb-1">${escapeHtml(keeper.bio)}</p>
          <p class="trace-note mb-0">${checked}</p>
        </div>
      </div>`;
  }

  // ---- How it's made ----

  function renderMade(t) {
    const hiveLabels = t.hives.map(h => h.label).join(', ');
    const bees = [...new Set(t.hives.map(h => h.beeType))].join(' and ');
    const rows = [
      ['Hives', `${hiveLabels} &middot; ${escapeHtml(bees)} bees`],
      ['Feeding', escapeHtml(t.practices?.feedingNotes)],
      ['Mites', escapeHtml(t.practices?.pestNotes)],
      ['Spraying', escapeHtml(t.nearbyFlowers?.pesticideNotes)]
    ].filter(([, value]) => value);

    fill('made').innerHTML = `<dl class="trace-facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  }

  // ---- Photo, buy box and phone bar ----

  function renderBuy(t) {
    fill('photo').innerHTML = t.photo
      ? `<img src="${escapeHtml(t.photo)}" alt="Jar of ${escapeHtml(t.title)}">`
      : `<i class="bi bi-image" aria-hidden="true"></i>`;

    const keeper = t.keeper;
    // Contact goes through the site later (keeper email and phone stay private), so it's off for now
    const contact = `<button class="btn btn-outline-secondary trace-contact" type="button" disabled title="Coming soon">Contact keeper</button>`;
    const contactShort = `<button class="btn btn-outline-secondary" type="button" disabled title="Coming soon">Contact</button>`;

    // Not sold on Honey Tracker: send them to the keeper's own shop, if they have one
    if (!t.listing) {
      const shop = keeper.shopUrl
        ? `<a class="btn btn-primary trace-cta" href="${escapeHtml(keeper.shopUrl)}" target="_blank" rel="noopener">Visit keeper's shop</a>`
        : '';
      fill('buy').innerHTML = `${shop}${contact}`;
      fill('bar').innerHTML = `<div class="trace-bar__inner">${shop}${contactShort}</div>`;
      return;
    }

    const soldOut = t.stock <= 0;
    const maxQty = Math.min(t.stock, MAX_QTY);
    const ships = keeper.shipping?.ships;
    const delivery = [
      ships ? `Ships in ${escapeHtml(keeper.shipping.turnaround)} &middot; ${money(keeper.shipping.cost)}` : '',
      keeper.pickup ? 'Pickup available' : ''
    ].filter(Boolean).map(line => `<span>${line}</span>`).join('');

    const addButton = soldOut
      ? `<button class="btn btn-primary trace-cta" type="button" disabled>Sold out</button>`
      : `<button class="btn btn-primary trace-cta" type="button" data-add-to-cart>Add to cart</button>`;

    fill('buy').innerHTML = `
      <p class="trace-price">${money(t.price)} &middot; ${Number(t.jarOz)} oz</p>
      <p class="text-soft mb-0">${escapeHtml(t.season)} batch${soldOut ? '' : ` &middot; ${Number(t.stock)} in stock`}</p>
      <div class="trace-buy__row">
        ${soldOut ? '' : `
        <div class="input-group qty-stepper">
          <button class="btn btn-outline-secondary" type="button" data-qty="down" aria-label="Decrease quantity">&minus;</button>
          <input class="form-control" type="number" id="qty" value="1" min="1" max="${maxQty}" aria-label="Quantity">
          <button class="btn btn-outline-secondary" type="button" data-qty="up" aria-label="Increase quantity">+</button>
        </div>`}
        ${addButton}
      </div>
      ${contact}
      ${delivery ? `<div class="trace-delivery">${delivery}</div>` : ''}`;

    fill('bar').innerHTML = `
      <div class="trace-bar__inner">
        <div class="trace-bar__price"><strong>${money(t.price)}</strong><span>${Number(t.jarOz)} oz</span></div>
        ${addButton}
        ${contactShort}
      </div>`;

    // Both Add to cart buttons (desktop box and phone bar) do the same thing
    document.querySelectorAll('[data-add-to-cart]').forEach(button => {
      button.addEventListener('click', () => addToCart(t, maxQty));
    });
  }

  // Adds to the cart (HTCart in js/components.js), then opens the Cart page
  function addToCart(t, maxQty) {
    const input = document.getElementById('qty');
    const qty = Math.max(1, Math.min(maxQty, Number(input?.value) || 1));
    HTCart.add(t.id, qty, maxQty);
    window.location.href = 'cart.html';
  }

  // ---- Load ----

  async function load() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const batch = params.get('batch');
    const t = id ? await getListing(id) : batch ? await getTrace(batch) : null;
    if (!t) return notFound();

    renderHead(t);
    renderSteps(t);
    renderWhere(t);
    renderKeeper(t);
    renderMade(t);
    renderBuy(t);

    const where = document.getElementById('secWhere');
    where?.addEventListener('shown.bs.collapse', () => drawHiveMap(t));
    if (where?.classList.contains('show')) drawHiveMap(t);

    initTooltips(page);
    if (typeof bootstrap !== 'undefined') {
      page.querySelectorAll('[data-bs-toggle="popover"]').forEach(el => bootstrap.Popover.getOrCreateInstance(el));
    }
    page.setAttribute('aria-busy', 'false');
  }

  load();
})();
