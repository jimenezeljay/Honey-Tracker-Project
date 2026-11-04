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

// siteNav('map')         -> the top bar, with "Map" marked as the current page
// siteNav(null, 'keeper') -> the signed-in beekeeper version: hat icon + Account menu.
// Until sign-in is connected, a page picks this with data-role="keeper" on its placeholder.
function siteNav(active, role) {
  const link = (page, label) =>
    `<li class="nav-item"><a class="nav-link${active === page ? ' active' : ''}" href="${page}.html"${active === page ? ' aria-current="page"' : ''}>${label}</a></li>`;

  // The hat stays outside the collapsing menu so it's always visible on phones.
  // It opens the beekeeper menu where there is one; elsewhere it links to the dashboard.
  const keeperHat = role === 'keeper'
    ? `<a class="btn btn-outline-secondary btn-icon keeper-hat order-lg-last ms-auto ms-lg-2 me-2 me-lg-0" href="dashboard.html" data-keeper-menu-toggle aria-label="Beekeeper menu" title="Beekeeper menu">${icon('keeper-hat')}</a>`
    : '';

  const actions = role === 'keeper'
    ? `<div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Account</button>
            <ul class="dropdown-menu dropdown-menu-lg-end">
              <li><a class="dropdown-item" href="dashboard.html">Dashboard</a></li>
              <li><a class="dropdown-item" href="#">Profile</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="signin.html">Sign out</a></li>
            </ul>
          </div>`
    : `<div class="d-flex gap-2">
            <a class="btn btn-outline-secondary" href="signin.html">Sign in</a>
            <a class="btn btn-primary" href="get-started.html">Get started</a>
          </div>`;

  return `
    <nav class="navbar navbar-expand-lg site-nav">
      <div class="container">
        <a class="navbar-brand" href="index.html"><span class="brand-mark"><img src="images/honey-tracker-logo.png" alt="" class="brand-logo"></span> Honey Tracker</a>
        ${keeperHat}
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Open menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <ul class="navbar-nav me-auto">
            ${link('map', 'Map')}
            ${link('marketplace', 'Marketplace')}
            ${link('learn', 'Learn')}
          </ul>
          ${actions}
        </div>
      </div>
    </nav>`;
}

function siteFooter() {
  return `
    <footer class="site-footer mt-5">
      <div class="container py-4 d-flex flex-wrap gap-3 justify-content-between">
        <span>&copy; ${new Date().getFullYear()} Honey Tracker</span>
        <nav class="d-flex flex-wrap gap-3" aria-label="Footer">
          <a href="#">About</a>
          <a href="learn.html">Learn</a>
          <a href="get-started.html">Become a keeper</a>
          <a href="volunteer.html">Volunteer</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </footer>`;
}

// keeperSidebar('dashboard') -> the beekeeper menu (wireframes 13, 15, 16).
// A column on large screens, a slide-in drawer on phones. The hat in the top bar toggles it.
// My Farms & Hives and My Listings have no pages of their own yet, so they jump to
// their dashboard sections. Profile is a placeholder until it has a page.
function keeperSidebar(active) {
  const items = [
    { key: 'dashboard', label: 'Dashboard',        icon: 'bi-speedometer2', href: 'dashboard.html' },
    { key: 'farms',     label: 'My Farms & Hives', icon: 'bi-geo-alt',      href: 'dashboard.html#farms' },
    { key: 'harvest',   label: 'Log Harvest',      icon: 'bi-journal-plus', href: 'log-harvest.html' },
    { key: 'listings',  label: 'My Listings',      icon: 'bi-shop',         href: 'dashboard.html#listings' },
    { key: 'profile',   label: 'Profile',          icon: 'bi-person',       href: '#' }
  ];
  const links = items.map(item => `
          <li class="nav-item">
            <a class="nav-link${active === item.key ? ' active' : ''}" href="${item.href}"${active === item.key ? ' aria-current="page"' : ''}>
              <i class="bi ${item.icon}" aria-hidden="true"></i> ${escapeHtml(item.label)}
            </a>
          </li>`).join('');

  return `
    <aside class="offcanvas-lg offcanvas-start keeper-sidebar" tabindex="-1" id="keeperMenu" aria-labelledby="keeperMenuLabel">
      <div class="offcanvas-header">
        <h2 class="offcanvas-title h5" id="keeperMenuLabel">Beekeeper menu</h2>
        <button class="btn-close" type="button" data-bs-dismiss="offcanvas" data-bs-target="#keeperMenu" aria-label="Close"></button>
      </div>
      <div class="offcanvas-body">
        <ul class="nav flex-column">${links}
        </ul>
      </div>
    </aside>`;
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

// The hat icon: hides or shows the menu column on large screens, opens the drawer on phones.
// On a page with no menu it stays a normal link to the dashboard.
document.addEventListener('click', event => {
  const hat = event.target.closest('[data-keeper-menu-toggle]');
  const layout = document.querySelector('.keeper-layout');
  if (!hat || !layout) return;

  event.preventDefault();
  if (window.matchMedia('(min-width: 992px)').matches) {
    layout.classList.toggle('menu-hidden');
  } else {
    bootstrap.Offcanvas.getOrCreateInstance('#keeperMenu').toggle();
  }
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

// Fill placeholders on the page:
//   <div data-component="site-nav" data-active="map"></div>
//   <div data-component="site-nav" data-role="keeper"></div>
//   <div data-component="keeper-sidebar" data-active="dashboard"></div>
//   <div data-component="site-footer"></div>
//   <span data-badge="certified"></span>
document.querySelectorAll('[data-component="site-nav"]').forEach(el => {
  el.outerHTML = siteNav(el.dataset.active, el.dataset.role);
});
document.querySelectorAll('[data-component="keeper-sidebar"]').forEach(el => {
  el.innerHTML = keeperSidebar(el.dataset.active);
});
document.querySelectorAll('[data-component="site-footer"]').forEach(el => {
  el.outerHTML = siteFooter();
});
document.querySelectorAll('[data-badge]').forEach(el => {
  el.outerHTML = badge(el.dataset.badge);
});
