// Checkout page (wireframe 7, HC-63).
// Needs js/components.js (HTCart, escapeHtml), js/data.js (getListing, isSuspended,
// estimateServiceFeeCents, placeOrder, STRIPE_PUBLISHABLE_KEY) and js/forms.js (validateForm).
//
// Mr. Gallic's rules: checkout happens on Honey Tracker; each keeper sets ship or pickup,
// shipping cost and turnaround; their address stays private. The shopper picks ship or pickup
// per keeper here (the cart shows shipping as the default). Fee: $1 + card fee, estimated.
//
// Payment: Stripe Payment Element in TEST MODE, in "deferred" mode, so it needs no backend to
// show the card form. On Place order we ask Stripe for a ConfirmationToken (card details go to
// Stripe, never to us) and send its id to placeOrder(). The backend later charges with it.
// Money is in cents, like the cart.

(async function () {
  const page = document.getElementById('checkoutPage');
  if (!page) return;

  const MAX_QTY = 10;
  const money = cents => `$${(cents / 100).toFixed(2)}`;
  const cents = dollars => Math.round(Number(dollars) * 100);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const maxFor = listing => Math.min(Math.max(listing.stock, 0), MAX_QTY);
  const buyable = listing => listing && listing.stock > 0 && !isSuspended(listing.keeper);

  const el = {
    form: document.getElementById('checkoutForm'),
    keepers: document.getElementById('checkoutKeepers'),
    rows: document.getElementById('summaryRows'),
    addressSection: document.getElementById('addressSection'),
    addressFields: document.getElementById('addressFields'),
    skipped: document.getElementById('checkoutSkipped'),
    empty: document.getElementById('checkoutEmpty'),
    done: document.getElementById('checkoutDone'),
    placeOrder: document.getElementById('placeOrder'),
    paymentError: document.getElementById('paymentError')
  };

  // ---- Load the cart ----
  const cartLines = HTCart.cart();
  const listings = new Map();
  await Promise.all(cartLines.map(async line => listings.set(line.listingId, await getListing(line.listingId))));

  // Group buyable lines by farm (one keeper per farm), like the cart
  const groups = new Map();
  let skippedCount = 0;
  cartLines.forEach(line => {
    const listing = listings.get(line.listingId);
    if (!buyable(listing)) { if (listing) skippedCount += 1; return; }
    const qty = Math.min(line.qty, maxFor(listing));
    if (!groups.has(listing.farmId)) {
      groups.set(listing.farmId, { farm: listing.farm, keeper: listing.keeper, lines: [] });
    }
    groups.get(listing.farmId).lines.push({ listing, qty });
  });

  page.setAttribute('aria-busy', 'false');

  if (groups.size === 0) {
    el.empty.hidden = false;
    return;
  }
  el.form.hidden = false;
  if (skippedCount) {
    el.skipped.hidden = false;
    el.skipped.textContent = `${plural(skippedCount, 'item')} in your cart can't be bought right now, so ${skippedCount === 1 ? 'it isn\'t' : 'they aren\'t'} included.`;
  }

  // ---- Delivery choice per keeper ----
  const groupList = [...groups.values()];
  const groupHoneyCents = group => group.lines.reduce((sum, l) => sum + cents(l.listing.price) * l.qty, 0);
  const groupJars = group => group.lines.reduce((sum, l) => sum + l.qty, 0);

  function deliveryOption(group, value) {
    const k = group.keeper;
    const id = `delivery-${group.farm.id}-${value}`;
    const offered = value === 'ship' ? k.shipping?.ships : k.pickup;
    if (!offered) return '';
    const title = value === 'ship' ? `Ship &middot; ${money(cents(k.shipping.cost))}` : 'Pickup &middot; Free';
    const text = value === 'ship'
      ? `Ships in ${escapeHtml(k.shipping.turnaround)}`
      : `${escapeHtml(group.farm.county)} County, ${escapeHtml(group.farm.state)}. The keeper emails a time and place.`;
    return `
      <div class="col-sm-6">
        <input class="btn-check" type="radio" name="delivery-${group.farm.id}" id="${id}" value="${value}" required>
        <label class="role-card delivery-card" for="${id}">
          <span class="delivery-card__title">${title}</span>
          <span class="role-card__text">${text}</span>
        </label>
      </div>`;
  }

  el.keepers.innerHTML = groupList.map(group => `
    <fieldset class="checkout-keeper">
      <legend class="checkout-keeper__head">
        <span class="cart-group__farm">${escapeHtml(group.farm.name)}</span>
        <span class="cart-group__place">&middot; ${plural(groupJars(group), 'jar')} &middot; ${money(groupHoneyCents(group))}</span>
      </legend>
      <div class="row g-2">
        ${deliveryOption(group, 'ship')}${deliveryOption(group, 'pickup')}
      </div>
    </fieldset>`).join('');

  // Default: ship when the keeper ships (what the cart showed), otherwise pickup
  groupList.forEach(group => {
    const prefer = group.keeper.shipping?.ships ? 'ship' : 'pickup';
    const input = document.getElementById(`delivery-${group.farm.id}-${prefer}`);
    if (input) input.checked = true;
  });

  const deliveryFor = group =>
    el.form.querySelector(`input[name="delivery-${group.farm.id}"]:checked`)?.value || 'pickup';

  // ---- Totals ----
  function totals() {
    let honeyCents = 0, shippingCents = 0, jars = 0, shippingKeepers = 0;
    groupList.forEach(group => {
      honeyCents += groupHoneyCents(group);
      jars += groupJars(group);
      if (deliveryFor(group) === 'ship') {
        shippingCents += cents(group.keeper.shipping.cost);
        shippingKeepers += 1;
      }
    });
    const feeCents = estimateServiceFeeCents(honeyCents + shippingCents);
    return { honeyCents, shippingCents, feeCents, totalCents: honeyCents + shippingCents + feeCents, jars, shippingKeepers };
  }

  function render() {
    const t = totals();
    el.rows.innerHTML = `
      <div><dt>Honey (${plural(t.jars, 'jar')})</dt><dd>${money(t.honeyCents)}</dd></div>
      <div><dt>Shipping (${plural(t.shippingKeepers, 'keeper')})</dt><dd>${money(t.shippingCents)}</dd></div>
      <div><dt>Service fee (est.)
        <button type="button" class="cart-fee-info" data-bs-toggle="tooltip" data-bs-title="$1 + card fee (2.9% + 30¢)" aria-label="How the service fee is worked out: $1 plus the card fee, 2.9% plus 30 cents"><i class="bi bi-info-circle" aria-hidden="true"></i></button></dt>
        <dd>${money(t.feeCents)}</dd></div>
      <div class="cart-summary__total"><dt>Total</dt><dd>${money(t.totalCents)}</dd></div>`;
    el.rows.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(node => {
      if (window.bootstrap) bootstrap.Tooltip.getOrCreateInstance(node);
    });

    // Address only matters when something ships
    const anyShipping = t.shippingKeepers > 0;
    el.addressSection.hidden = !anyShipping;
    el.addressFields.disabled = !anyShipping;

    if (elements) elements.update({ amount: t.totalCents });
    return t;
  }

  // ---- Stripe (test mode) ----
  let stripe = null;
  let elements = null;
  const key = typeof STRIPE_PUBLISHABLE_KEY === 'string' ? STRIPE_PUBLISHABLE_KEY.trim() : '';

  if (key.startsWith('pk_test_') && window.Stripe) {
    stripe = Stripe(key);
    elements = stripe.elements({
      mode: 'payment',
      amount: totals().totalCents,
      currency: 'usd',
      paymentMethodTypes: ['card'],
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap' }],
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#8F5508',   // $amber-deep (readable amber)
          colorText: '#2A2117',      // $ink
          colorTextSecondary: '#6A5A45',
          colorBackground: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px'        // 0.5rem corners
        }
      }
    });
    elements.create('payment').mount('#paymentElement');
    document.getElementById('paymentTestCard').hidden = false;
  } else {
    // No test key yet (or a live key by mistake): show the note and keep Place order off
    document.getElementById('paymentSetup').hidden = false;
    el.placeOrder.disabled = true;
  }

  render();
  el.keepers.addEventListener('change', render);

  // ---- Place order ----
  validateForm(el.form, async form => {
    if (!stripe) return;
    el.paymentError.textContent = '';
    const data = new FormData(form);
    const t = render();

    el.placeOrder.disabled = true;
    el.placeOrder.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Placing order';

    const fail = message => {
      el.paymentError.textContent = message;
      el.placeOrder.disabled = false;
      el.placeOrder.textContent = 'Place order';
    };

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) return fail(submitError.message);

      const shipping = t.shippingKeepers > 0 ? {
        name: data.get('fullName').trim(),
        line1: data.get('line1').trim(),
        line2: data.get('line2').trim(),
        city: data.get('city').trim(),
        state: data.get('state'),
        zip: data.get('zip').trim()
      } : null;

      const { error, confirmationToken } = await stripe.createConfirmationToken({
        elements,
        params: {
          payment_method_data: {
            billing_details: { email: data.get('email').trim(), name: shipping?.name || undefined }
          }
        }
      });
      if (error) return fail(error.message);

      // The order the backend receives (POST /api/orders). The server re-checks prices,
      // stock and keeper status and works out the real total; "estimate" is only what we showed.
      const order = {
        contact: { email: data.get('email').trim(), phone: data.get('phone').trim() || null },
        shippingAddress: shipping,
        keepers: groupList.map(group => ({
          keeperId: group.keeper.id,
          farmId: group.farm.id,
          delivery: deliveryFor(group),
          lines: group.lines.map(l => ({ listingId: l.listing.id, qty: l.qty }))
        })),
        estimate: { honeyCents: t.honeyCents, shippingCents: t.shippingCents, serviceFeeCents: t.feeCents, totalCents: t.totalCents },
        payment: { provider: 'stripe', confirmationTokenId: confirmationToken.id }
      };

      const result = await placeOrder(order);

      // Bought lines leave the cart; anything unavailable stays there
      groupList.forEach(group => group.lines.forEach(l => HTCart.remove(l.listing.id)));
      el.form.hidden = true;
      el.skipped.hidden = true;
      document.getElementById('orderId').textContent = result.orderId;
      el.done.hidden = false;
      el.done.focus();
    } catch (err) {
      fail('Something went wrong. Please try again.');
    }
  });
})();
