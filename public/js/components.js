// Reusable UI pieces, written once and used on any page.
// Every page loads this file, and it builds the shared navbar and footer, so
// those are edited HERE only. Put it before Bootstrap and the page's own script:
//   <script src="js/components.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
//   <script src="js/marketplace.js"></script>
// See components.html for every component and how to use it.

// Escape text before putting it into HTML, so data from the backend
// (farm names, bios) can't inject tags into the page.
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Hand-drawn line icons (24px grid, 2px round strokes). They use currentColor,
// so each icon takes the color its CSS gives it. icon('pure') -> <svg>...</svg>
const ICONS = {
  'certified':   '<path d="M12 2.8 19.9 7.4v9.2L12 21.2 4.1 16.6V7.4Z"/><path d="m8.4 12.2 2.5 2.5 4.8-5"/>',
  'comb':        '<path d="M7.7 3.2 11.5 5.4v4.4L7.7 12 3.9 9.8V5.4Z"/><path d="M16.3 3.2 20.1 5.4v4.4L16.3 12 12.5 9.8V5.4Z"/><path d="M12 11.6l3.8 2.2v4.4L12 20.4l-3.8-2.2v-4.4Z"/>',
  'drop':        '<path d="M12 2.8c-3.6 4.6-6.3 8.3-6.3 11.6a6.3 6.3 0 0 0 12.6 0c0-3.3-2.7-7-6.3-11.6Z"/><path d="M9.2 15.1a3 3 0 0 0 2.3 2.6"/>',
  'jar':         '<path d="M7 3.5h10"/><path d="M8 3.5v2.2C6 6.8 5 8.6 5 11v6.5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V11c0-2.4-1-4.2-3-5.3V3.5"/><path d="M5.2 12.5c1.4-1.3 2.9-1.3 4.3 0s2.9 1.3 4.3 0 2.9-1.3 4.3 0"/>',
  'hive-box':    '<path d="M2.5 5.5h19v3h-19Z"/><path d="M4 8.5h16v8H4Z"/><path d="M10 12h4"/><path d="M2.5 16.5h19"/><path d="M5.5 16.5v3M18.5 16.5v3"/>',
  'magnifier-check': '<circle cx="10" cy="10" r="7"/><path d="m15.1 15.1 5.4 5.4"/><path d="m7.2 10.2 2 2 3.8-4"/>',
  // Beekeeper pages: the hat that opens the menu, and the farm count
  'keeper-hat':  '<path d="M2 11.5c3 1.5 6.3 2.2 10 2.2s7-.7 10-2.2"/><path d="M8 12.6V6a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 16 6v6.6"/><path d="M5.5 13v7h13v-7"/><path d="M9.5 16.5h5"/>',
  'barn':        '<path d="M4 20.5V10l8-6.5 8 6.5v10.5Z"/><path d="M9 20.5v-6h6v6"/><path d="m9 14.5 6 6M15 14.5l-6 6"/>',
  // Learn page only (not badges): Crystallized and Liquid
  'crystals':    '<path d="M3 21h18"/><path d="M9.8 21V7.8L12 4.2l2.2 3.6V21"/><path d="M9.8 7.8 12 9.2l2.2-1.4M12 9.2V21"/><path d="M5.4 21 2.9 11.9 4 9.5l2.1 1.6L8.6 21"/><path d="M2.9 11.9l3.2-.8"/><path d="M18.6 21l2.5-9.1L20 9.5l-2.1 1.6L15.4 21"/><path d="M21.1 11.9l-3.2-.8"/>',
  'waves':       '<path d="M3 7.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/><path d="M3 12.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/><path d="M3 17.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0"/>'
};

function icon(name, className = 'icon') {
  if (!ICONS[name]) return '';
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}

// Colors for each badge live in scss/components/_badges.scss
const BADGES = {
  'certified':          { label: 'Certified',          icon: 'certified' },
  'raw':                { label: 'Raw',                icon: 'comb' },
  'pure':               { label: 'Pure',               icon: 'drop' },
  'creamed':            { label: 'Creamed',            icon: 'jar' },
  'single-hive':        { label: 'Single-hive',        icon: 'hive-box' },
  'volunteer-verified': { label: 'Volunteer-Verified', icon: 'magnifier-check' }
};

// badge('certified') -> <span class="badge badge-certified"><svg ...></svg>Certified</span>
// In plain HTML, write <span data-badge="certified"></span> and it's filled in on load.
function badge(key) {
  const b = BADGES[key];
  if (!b) return '';
  return `<span class="badge badge-${key}">${icon(b.icon, 'badge-icon')}${b.label}</span>`;
}

// badgeIcon('raw') -> just the icon in the badge's colors, for tight spaces like product cards.
// The name is still there for screen readers, and shows in a tooltip on hover (see initTooltips).
function badgeIcon(key) {
  const b = BADGES[key];
  if (!b) return '';
  return `<span class="badge badge-${key} badge--icon" data-bs-toggle="tooltip" data-bs-title="${b.label}">${icon(b.icon, 'badge-icon')}<span class="visually-hidden">${b.label}</span></span>`;
}

// Turn on Bootstrap tooltips (e.g. icon badge names) inside an element.
// Call after adding content; call disposeTooltips first if you replace that content.
function initTooltips(root = document) {
  if (typeof bootstrap === 'undefined') return;
  root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    bootstrap.Tooltip.getOrCreateInstance(el, { trigger: 'hover', placement: 'top' });
  });
}

function disposeTooltips(root = document) {
  if (typeof bootstrap === 'undefined') return;
  root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
    bootstrap.Tooltip.getInstance(el)?.dispose();
  });
}

// productCard({ id, title, farmName, price, photo, badges: ['certified', 'raw'] })
function productCard(listing) {
  const photo = listing.photo
    ? `<img class="product-card__img" src="${escapeHtml(listing.photo)}" alt="">`
    : `<div class="product-card__img" aria-hidden="true"><i class="bi bi-image"></i></div>`;
  const price = Number(listing.price).toFixed(2);

  return `
    <article class="product-card">
      ${photo}
      <div class="product-card__body">
        <h3 class="product-card__title">
          <a class="stretched-link" href="product.html?id=${encodeURIComponent(listing.id)}">${escapeHtml(listing.title)}</a>
        </h3>
        <p class="product-card__meta">${escapeHtml(listing.farmName)} &middot; $${price}</p>
        <div class="product-card__badges">${(listing.badges || []).map(badgeIcon).join('')}</div>
        <a class="product-card__map" href="map.html?farm=${encodeURIComponent(listing.farmId ?? '')}">View on map</a>
      </div>
    </article>`;
}

// Cart and Saved for later, kept in this browser until the backend has accounts.
//   HTCart.cart()          -> [{ listingId, qty }]
//   HTCart.add(id, qty, max)  adds to a line (never past max)
//   HTCart.saved()         -> [listingId, ...]
// Later these become calls to the backend's cart; pages only use HTCart, so only this changes.
const HTCart = (function () {
  const CART_KEY = 'ht-cart';
  const SAVED_KEY = 'ht-saved';

  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return []; // storage blocked or broken: start empty
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { /* storage blocked */ }
    updateNavCount();
  }

  const cart = () => read(CART_KEY).filter(line => line && Number(line.qty) > 0);
  const saved = () => read(SAVED_KEY).map(Number).filter(Boolean);
  const count = () => cart().reduce((sum, line) => sum + Number(line.qty), 0);

  function add(listingId, qty = 1, max = 10) {
    const lines = cart();
    const line = lines.find(l => l.listingId === Number(listingId));
    if (line) line.qty = Math.min(max, line.qty + qty);
    else lines.push({ listingId: Number(listingId), qty: Math.min(max, qty) });
    write(CART_KEY, lines);
  }

  function setQty(listingId, qty) {
    write(CART_KEY, cart().map(l => l.listingId === Number(listingId) ? { ...l, qty } : l));
  }

  function remove(listingId) {
    write(CART_KEY, cart().filter(l => l.listingId !== Number(listingId)));
  }

  function saveForLater(listingId) {
    remove(listingId);
    write(SAVED_KEY, [...new Set([Number(listingId), ...saved()])]);
  }

  function unsave(listingId) {
    write(SAVED_KEY, saved().filter(id => id !== Number(listingId)));
  }

  function moveToCart(listingId, max) {
    unsave(listingId);
    add(listingId, 1, max);
  }

  // The navbar's "Cart (3)"
  function updateNavCount() {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      const n = count();
      el.textContent = n ? `(${n})` : '';
    });
  }

  return { cart, saved, count, add, setQty, remove, saveForLater, unsave, moveToCart, updateNavCount };
})();

// siteNav('map')            -> the top bar, with "Map" marked as the current page
// siteNav(null, 'keeper')    -> signed in as a beekeeper; 'shopper' -> signed in as a shopper.
// Signed in, the bar shows a round account button that opens the account panel (accountPanel
// below) from the right. Signed out, it shows Sign in and Get started.
// Until real login exists, the role comes from data-role on the placeholder or HTSession.
function siteNav(active, role) {
  const link = (page, label) =>
    `<li class="nav-item"><a class="nav-link${active === page ? ' active' : ''}" href="${page}.html"${active === page ? ' aria-current="page"' : ''}>${label}</a></li>`;

  const signedIn = role === 'keeper' || role === 'shopper';

  // Stays outside the collapsing menu so it's always one tap away on phones
  const accountButton = signedIn
    ? `<button class="btn btn-outline-secondary btn-icon account-button order-lg-last ms-auto ms-lg-2 me-2 me-lg-0" type="button"
         data-bs-toggle="offcanvas" data-bs-target="#accountPanel" aria-controls="accountPanel"
         aria-label="Your account" title="Your account">${role === 'keeper' ? icon('keeper-hat') : '<i class="bi bi-person" aria-hidden="true"></i>'}</button>`
    : '';

  const actions = signedIn
    ? ''
    : `<a class="btn btn-outline-secondary" href="signin.html">Sign in</a>
            <a class="btn btn-primary" href="get-started.html">Get started</a>`;

  // Everyone gets the Cart link, shoppers and beekeepers alike.
  const cartLink = `<a class="btn btn-link nav-cart${active === 'cart' ? ' active' : ''}" href="cart.html"${active === 'cart' ? ' aria-current="page"' : ''}><i class="bi bi-bag" aria-hidden="true"></i> Cart <span data-cart-count></span></a>`;

  return `
    <nav class="navbar navbar-expand-lg site-nav">
      <div class="container">
        <a class="navbar-brand" href="index.html"><span class="brand-mark"><img src="images/honey-tracker-logo.png" alt="" class="brand-logo"></span> Honey Tracker</a>
        ${accountButton}
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Open menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto">
            ${link('map', 'Map')}
            ${link('marketplace', 'Marketplace')}
            ${link('learn', 'Learn')}
          </ul>
          <div class="d-flex gap-2">${cartLink}${actions}</div>
        </div>
      </div>
    </nav>`;
}

// accountPanel('keeper', 'dashboard') -> the panel the account button opens, from the right.
//   keeper:  the beekeeper menu (Dashboard, farms, harvests, listings) plus cart and sign out
//   shopper: orders, saved for later, cart, sign out
// `active` marks the current page (data-account-active on the site-nav placeholder).
// Items without a page yet show "Soon" instead of being dead links.
function accountPanel(role, active) {
  const items = role === 'keeper'
    ? [
        { key: 'dashboard', label: 'Dashboard',        icon: 'bi-speedometer2', href: 'dashboard.html' },
        { key: 'farms',     label: 'My Farms & Hives', icon: 'bi-geo-alt',      href: 'dashboard.html#farms' },
        { key: 'harvest',   label: 'Log Harvest',      icon: 'bi-journal-plus', href: 'log-harvest.html' },
        { key: 'listings',  label: 'My Listings',      icon: 'bi-shop',         href: 'dashboard.html#listings' },
        { key: 'profile',   label: 'Profile',          icon: 'bi-person' },
        'divider',
        { key: 'cart',      label: 'Cart',             icon: 'bi-bag',          href: 'cart.html' }
      ]
    : [
        { key: 'orders',    label: 'Past orders',      icon: 'bi-receipt' },
        { key: 'saved',     label: 'Saved for later',  icon: 'bi-bookmark',     href: 'cart.html#saved' },
        { key: 'cart',      label: 'Cart',             icon: 'bi-bag',          href: 'cart.html' },
        { key: 'profile',   label: 'Profile',          icon: 'bi-person' }
      ];

  const rows = items.map(item => {
    if (item === 'divider') return '<li class="account-panel__divider" role="separator"></li>';
    const on = active === item.key;
    const inner = `<i class="bi ${item.icon}" aria-hidden="true"></i> ${escapeHtml(item.label)}`;
    return item.href
      ? `<li class="nav-item"><a class="nav-link${on ? ' active' : ''}" href="${item.href}"${on ? ' aria-current="page"' : ''}>${inner}</a></li>`
      : `<li class="nav-item"><span class="nav-link is-soon" aria-disabled="true">${inner} <span class="soon-tag">Soon</span></span></li>`;
  }).join('');

  return `
    <aside class="offcanvas offcanvas-end account-panel" tabindex="-1" id="accountPanel" aria-labelledby="accountPanelTitle">
      <div class="offcanvas-header">
        <div>
          <p class="eyebrow mb-1">${role === 'keeper' ? 'Beekeeper' : 'Shopper'}</p>
          <h2 class="offcanvas-title" id="accountPanelTitle">Your account</h2>
        </div>
        <button class="btn-close" type="button" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <ul class="nav flex-column">${rows}</ul>
        <a class="btn btn-outline-secondary w-100 mt-auto" href="signin.html?signed-out">Sign out</a>
      </div>
    </aside>`;
}

function siteFooter() {
  return `
    <footer class="site-footer mt-5">
      <div class="container py-4 d-flex flex-wrap gap-3 justify-content-between">
        <span>&copy; ${new Date().getFullYear()} Honey Tracker</span>
        <nav class="d-flex flex-wrap gap-3" aria-label="Footer">
          <a href="#">About</a>
          <a href="learn.html">Learn</a>
          <a href="find-your-honey.html">Trace a jar</a>
          <a href="get-started.html?role=keeper">Become a keeper</a>
          <a href="volunteer.html">Volunteer</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>`;
}

// statTile('Hives', 3, 'hive-box') -> a number with a label (dashboard counts).
// The icon is a name from ICONS above.
function statTile(label, value, iconName) {
  return `
    <div class="stat-tile">
      <span class="stat-tile__icon">${icon(iconName, 'stat-tile__svg')}</span>
      <span class="stat-tile__value">${escapeHtml(value)}</span>
      <span class="stat-tile__label">${escapeHtml(label)}</span>
    </div>`;
}

// Account panel: close it after a link is picked, so jumps on the same page
// (My Farms & Hives, My Listings) aren't hidden behind it
document.addEventListener('click', event => {
  const link = event.target.closest('#accountPanel a');
  const panel = document.getElementById('accountPanel');
  if (!link || !panel || typeof bootstrap === 'undefined') return;

  // A section on this same page: wait for the panel to close (it locks scrolling while open), then jump
  const url = new URL(link.href, location.href);
  if (url.hash && url.pathname === location.pathname) {
    event.preventDefault();
    panel.addEventListener('hidden.bs.offcanvas', () => {
      if (location.hash === url.hash) document.querySelector(url.hash)?.scrollIntoView();
      else location.hash = url.hash;
    }, { once: true });
  }
  bootstrap.Offcanvas.getInstance(panel)?.hide();
});

// Quantity selector: makes the − / + buttons inside any .qty-stepper work.
// Listens on the whole document, so it also works for cart lines added later by JS.
// Respects the input's min / max, and fires "change" so cart.js can react:
//   input.addEventListener('change', () => updateCart(...))
document.addEventListener('click', event => {
  const button = event.target.closest('.qty-stepper [data-qty]');
  if (!button) return;

  const input = button.closest('.qty-stepper').querySelector('input');
  const before = input.value;
  button.dataset.qty === 'up' ? input.stepUp() : input.stepDown();
  if (input.value !== before) {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
});

// Sliding highlight for .seg-tabs (Learn, Cart): moves the amber thumb to the open tab.
function initSegTabs(bar) {
  const thumb = bar?.querySelector('.seg-tabs__thumb');
  if (!thumb) return () => {};

  const place = () => {
    const active = bar.querySelector('.nav-link.active');
    if (!active) return;
    thumb.style.left = `${active.offsetLeft}px`;
    thumb.style.width = `${active.offsetWidth}px`;
  };

  // First placement jumps straight there; after that it slides
  thumb.style.transition = 'none';
  place();
  bar.classList.add('is-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => { thumb.style.transition = ''; }));

  bar.addEventListener('shown.bs.tab', place);
  window.addEventListener('resize', place);   // labels get shorter on phones
  document.fonts?.ready.then(place);          // tab widths change once Inter loads
  return place;                               // call again if a tab's label changes
}

// Pretend sign-in until real login exists (HC-113). Sign in (js/signin.js) remembers
// "keeper" in this browser so every page shows the beekeeper navbar, not just keeper pages.
// Sign out goes to signin.html?signed-out, which forgets it.
const HTSession = {
  KEY: 'ht-signed-in-role',
  role() {
    try { return localStorage.getItem(this.KEY); } catch (error) { return null; }
  },
  signIn(role) {
    try { localStorage.setItem(this.KEY, role); } catch (error) { /* storage blocked */ }
  },
  signOut() {
    try { localStorage.removeItem(this.KEY); } catch (error) { /* storage blocked */ }
  }
};
if (new URLSearchParams(location.search).has('signed-out')) HTSession.signOut();

// Fill placeholders on the page:
//   <div data-component="site-nav" data-active="map"></div>
//   <div data-component="site-nav" data-role="keeper" data-account-active="dashboard"></div>
//   <div data-component="site-footer"></div>
//   <span data-badge="certified"></span>
document.querySelectorAll('[data-component="site-nav"]').forEach(el => {
  const role = el.dataset.role || HTSession.role();
  const panel = role === 'keeper' || role === 'shopper'
    ? accountPanel(role, el.dataset.accountActive || el.dataset.active)
    : '';
  el.outerHTML = siteNav(el.dataset.active, role) + panel;
});
document.querySelectorAll('[data-component="site-footer"]').forEach(el => {
  el.outerHTML = siteFooter();
});
HTCart.updateNavCount();
document.querySelectorAll('[data-badge]').forEach(el => {
  el.outerHTML = badge(el.dataset.badge);
});
