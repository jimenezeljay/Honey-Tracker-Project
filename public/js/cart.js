// Cart page (wireframe 6, v2): Cart and Saved for later.
// Needs js/components.js (HTCart, escapeHtml, initSegTabs, initTooltips) and js/data.js (getListing).
//
// Honey is grouped by keeper, since each keeper ships on their own. Shipping or pickup is
// chosen at checkout, so the cart shows each keeper's shipping cost as the default.
// Money is worked out in cents so totals never pick up rounding errors.

(async function () {
  const page = document.getElementById('cartPage');
  if (!page) return;

  // Estimated service fee: Mr. Gallic's "$1 + credit card fee", using Stripe's standard
  // US card rate (2.9% + 30¢), charged once per order. Not final until Jira HC-110 is answered.
  const FEE_FLAT_CENTS = 100;
  const CARD_RATE = 0.029;
  const CARD_FIXED_CENTS = 30;
  const MAX_QTY = 10;
  const LOW_STOCK = 5;

  const el = {
    sub: document.getElementById('cartSub'),
    full: document.getElementById('cartFull'),
    groups: document.getElementById('cartGroups'),
    rows: document.getElementById('summaryRows'),
    empty: document.getElementById('cartEmpty'),
    savedList: document.getElementById('savedList'),
    savedNote: document.getElementById('savedNote'),
    savedEmpty: document.getElementById('savedEmpty'),
    bar: document.getElementById('cartBar'),
    barTotal: document.getElementById('barTotal'),
    tabs: document.querySelector('.seg-tabs')
  };

  const money = cents => `$${(cents / 100).toFixed(2)}`;
  const cents = dollars => Math.round(Number(dollars) * 100);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const maxFor = listing => Math.min(Math.max(listing.stock, 0), MAX_QTY);

  // Listings are looked up once and reused as the cart changes
  const listings = new Map();
  async function lookUp(ids) {
    await Promise.all(ids.filter(id => !listings.has(id)).map(async id => {
      listings.set(id, await getListing(id));
    }));
  }

  function photo(listing) {
    return listing.photo
      ? `<img class="cart-line__photo" src="${escapeHtml(listing.photo)}" alt="">`
      : `<span class="cart-line__photo" aria-hidden="true"><i class="bi bi-image"></i></span>`;
  }

  function delivery(keeper) {
    const ships = keeper?.shipping?.ships;
    if (!ships) return 'Pickup only';
    return `Ships in ${escapeHtml(keeper.shipping.turnaround)}${keeper.pickup ? ' &middot; Pickup available' : ''}`;
  }

  // ---- Cart tab ----

  function cartLine(line, listing) {
    const soldOut = listing.stock <= 0;
    const max = maxFor(listing);
    const qty = Math.min(line.qty, max);
    const low = !soldOut && listing.stock <= LOW_STOCK ? ` &middot; Only ${listing.stock} left` : '';
    const name = escapeHtml(listing.title);

    return `
      <li class="cart-line${soldOut ? ' is-sold-out' : ''}">
        ${photo(listing)}
        <div class="cart-line__info">
          <a class="cart-line__title" href="product.html?id=${listing.id}">${name}</a>
          <span class="cart-line__meta">${escapeHtml(listing.season)} batch &middot; ${Number(listing.jarOz)} oz${low}</span>
          <span class="cart-line__actions">
            ${soldOut ? '' : `<button type="button" class="link-button" data-action="save" data-id="${listing.id}">Save for later</button>`}
            <button type="button" class="link-button" data-action="remove" data-id="${listing.id}">Remove<span class="visually-hidden"> ${name}</span></button>
          </span>
        </div>
        ${soldOut
          ? '<span class="cart-line__sold-out">Sold out</span>'
          : `<div class="input-group qty-stepper cart-line__qty">
               <button class="btn btn-outline-secondary" type="button" data-qty="down" aria-label="Decrease quantity of ${name}">&minus;</button>
               <input class="form-control" type="number" value="${qty}" min="1" max="${max}" data-id="${listing.id}" aria-label="Quantity of ${name}">
               <button class="btn btn-outline-secondary" type="button" data-qty="up" aria-label="Increase quantity of ${name}">+</button>
             </div>`}
        <span class="cart-line__price">${soldOut ? '' : money(cents(listing.price) * qty)}</span>
      </li>`;
  }

  function renderCart() {
    const lines = HTCart.cart().filter(line => listings.get(line.listingId));

    // Group by farm (one keeper per farm), in the order things were added
    const groups = new Map();
    lines.forEach(line => {
      const listing = listings.get(line.listingId);
      if (!groups.has(listing.farmId)) groups.set(listing.farmId, { listing, lines: [] });
      groups.get(listing.farmId).lines.push(line);
    });

    let honeyCents = 0;
    let shippingCents = 0;
    let jars = 0;
    let shippingKeepers = 0;

    el.groups.innerHTML = [...groups.values()].map(({ listing: first, lines: groupLines }) => {
      const keeper = first.keeper;
      let groupHoney = 0;
      groupLines.forEach(line => {
        const listing = listings.get(line.listingId);
        if (listing.stock <= 0) return;
        const qty = Math.min(line.qty, maxFor(listing));
        groupHoney += cents(listing.price) * qty;
        jars += qty;
      });

      const ships = keeper?.shipping?.ships;
      const groupShipping = ships && groupHoney > 0 ? cents(keeper.shipping.cost) : 0;
      honeyCents += groupHoney;
      shippingCents += groupShipping;
      if (groupShipping) shippingKeepers += 1;

      return `
        <section class="cart-group" aria-label="${escapeHtml(first.farm.name)}">
          <header class="cart-group__head">
            <span class="cart-group__farm">${escapeHtml(first.farm.name)}
              <span class="cart-group__place">&middot; ${escapeHtml(first.farm.county)} County, ${escapeHtml(first.farm.state)}</span></span>
            <span class="cart-group__delivery">${delivery(keeper)}</span>
          </header>
          <ul class="cart-group__lines">${groupLines.map(line => cartLine(line, listings.get(line.listingId))).join('')}</ul>
          <footer class="cart-group__foot">
            <span>${ships ? `Shipping ${money(groupShipping)}` : 'Pickup only'}</span>
            <span class="fw-semibold">Subtotal ${money(groupHoney)}</span>
          </footer>
        </section>`;
    }).join('');

    const hasItems = lines.length > 0;
    el.full.hidden = !hasItems;
    el.empty.hidden = hasItems;

    // Summary
    const beforeFee = honeyCents + shippingCents;
    const feeCents = honeyCents > 0
      ? FEE_FLAT_CENTS + Math.round(beforeFee * CARD_RATE) + CARD_FIXED_CENTS
      : 0;
    const totalCents = beforeFee + feeCents;

    el.rows.innerHTML = `
      <div><dt>Honey (${plural(jars, 'jar')})</dt><dd>${money(honeyCents)}</dd></div>
      <div><dt>Shipping (${plural(shippingKeepers, 'keeper')})</dt><dd>${money(shippingCents)}</dd></div>
      <div><dt>Service fee (est.)
        <button type="button" class="cart-fee-info" data-bs-toggle="tooltip" data-bs-title="$1 + card fee (2.9% + 30¢)" aria-label="How the service fee is worked out: $1 plus the card fee, 2.9% plus 30 cents"><i class="bi bi-info-circle" aria-hidden="true"></i></button></dt>
        <dd>${money(feeCents)}</dd></div>
      <div class="cart-summary__total"><dt>Total (est.)</dt><dd>${money(totalCents)}</dd></div>`;

    page.querySelectorAll('a[href="checkout.html"]').forEach(link => {
      link.classList.toggle('disabled', honeyCents === 0);
      link.setAttribute('aria-disabled', String(honeyCents === 0));
    });
    document.querySelectorAll('.cart-bar a[href="checkout.html"]').forEach(link => {
      link.classList.toggle('disabled', honeyCents === 0);
    });
    el.barTotal.textContent = money(totalCents);

    return { keepers: groups.size, hasItems };
  }

  // ---- Saved for later tab ----

  function renderSaved() {
    const ids = HTCart.saved().filter(id => listings.get(id));
    el.savedEmpty.hidden = ids.length > 0;
    el.savedNote.hidden = ids.length === 0;

    el.savedList.innerHTML = ids.map(id => {
      const listing = listings.get(id);
      const soldOut = listing.stock <= 0;
      const low = !soldOut && listing.stock <= LOW_STOCK ? ` &middot; Only ${listing.stock} left` : '';
      const name = escapeHtml(listing.title);
      return `
        <li class="cart-line saved-line${soldOut ? ' is-sold-out' : ''}">
          ${photo(listing)}
          <div class="cart-line__info">
            <a class="cart-line__title" href="product.html?id=${listing.id}">${name}</a>
            <span class="cart-line__meta">${escapeHtml(listing.farmName)} &middot; ${Number(listing.jarOz)} oz${low}</span>
          </div>
          <span class="cart-line__price">${money(cents(listing.price))}</span>
          <span class="saved-line__actions">
            ${soldOut
              ? '<span class="cart-line__sold-out">Sold out</span>'
              : `<button type="button" class="btn btn-outline-secondary" data-action="to-cart" data-id="${listing.id}">Move to cart</button>`}
            <button type="button" class="link-button" data-action="unsave" data-id="${listing.id}">Remove<span class="visually-hidden"> ${name}</span></button>
          </span>
        </li>`;
    }).join('');

    return ids.length;
  }

  // ---- Everything that depends on both ----

  let placeThumb = () => {};
  const savedTab = document.getElementById('tab-saved');

  function render() {
    disposeTooltips(page);
    const { keepers, hasItems } = renderCart();
    const savedCount = renderSaved();

    const jars = HTCart.count();
    page.querySelector('[data-count="cart"]').textContent = jars ? `(${jars})` : '';
    page.querySelector('[data-count="saved"]').textContent = savedCount ? `(${savedCount})` : '';

    const onSaved = savedTab.classList.contains('active');
    el.sub.textContent = onSaved
      ? 'Saved honey waits here until you’re ready.'
      : hasItems
        ? (keepers === 1 ? 'Honey from 1 keeper.' : `Honey from ${keepers} keepers, shipped separately.`)
        : 'Nothing here yet.';
    el.bar.hidden = onSaved || !hasItems;

    initTooltips(page);
    placeThumb(); // tab labels change width as counts change
  }

  // Re-rendering replaces the buttons, so put keyboard focus back on the same − / + button,
  // or on the first item if the line it was on is gone
  function renderKeepingFocus() {
    const active = document.activeElement;
    const qtyDir = active?.dataset?.qty;
    const id = active?.closest('.qty-stepper')?.querySelector('input')?.dataset.id;
    render();
    const again = id && qtyDir
      ? page.querySelector(`input[data-id="${id}"]`)?.closest('.qty-stepper')?.querySelector(`[data-qty="${qtyDir}"]`)
      : null;
    (again || page.querySelector('.tab-pane.active .cart-line__title') || page.querySelector('.tab-pane.active a, .tab-pane.active h2'))
      ?.focus({ preventScroll: true });
  }

  // ---- Events ----

  page.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = Number(button.dataset.id);
    const listing = listings.get(id);

    if (button.dataset.action === 'remove') HTCart.remove(id);
    if (button.dataset.action === 'save') HTCart.saveForLater(id);
    if (button.dataset.action === 'unsave') HTCart.unsave(id);
    if (button.dataset.action === 'to-cart' && listing) HTCart.moveToCart(id, maxFor(listing));
    renderKeepingFocus();
  });

  // The − / + buttons (components.js) fire "change" on the input; typing a number does too
  page.addEventListener('change', event => {
    const input = event.target.closest('input[data-id]');
    if (!input) return;
    const listing = listings.get(Number(input.dataset.id));
    const qty = Math.max(1, Math.min(maxFor(listing), Math.round(Number(input.value)) || 1));
    HTCart.setQty(input.dataset.id, qty);
    renderKeepingFocus();
  });

  el.tabs.addEventListener('shown.bs.tab', render);

  // ---- Start ----

  const ids = [...new Set([...HTCart.cart().map(l => l.listingId), ...HTCart.saved()])];
  await lookUp(ids);

  // Drop anything that no longer exists (e.g. a listing the keeper took down)
  ids.filter(id => !listings.get(id)).forEach(id => { HTCart.remove(id); HTCart.unsave(id); });

  if (window.location.hash === '#saved' && typeof bootstrap !== 'undefined') {
    bootstrap.Tab.getOrCreateInstance(document.getElementById('btn-saved')).show();
  }

  placeThumb = initSegTabs(el.tabs);
  render();
  page.setAttribute('aria-busy', 'false');
})();
