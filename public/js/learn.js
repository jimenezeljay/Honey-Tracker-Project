// Learn page (wireframe 9): side tabs, label tiles with a definition panel, purity stat, sources.
// Needs js/components.js (icon, badge, escapeHtml) and js/learn-sources.js loaded first.
//
// Links into the page:
//   learn.html#raw        opens Honey definitions with the Raw tile selected (any term key works)
//   learn.html#purity     opens Why purity matters
//   learn.html#deeper     opens Go deeper
// Product and trace pages can link a badge to learn.html#<badge key>.

// One-line definitions, kept short for the 22-words-per-screen rule.
// Certified and Volunteer-Verified are our own program terms: keep them in step with
// the certification framework (Jira HC-16). "Raw" and "pure" have no federal definition,
// so those lines are our standard (see fda-labeling-2018 in learn-sources.js).
const LEARN_TERMS = [
  { key: 'certified',          label: 'Certified',          icon: 'certified',       text: 'Keeper passed our checks and accepts random spot checks.' },
  { key: 'volunteer-verified', label: 'Volunteer-Verified', icon: 'magnifier-check', text: "A trained volunteer visited and confirmed the keeper's reports." },
  { key: 'single-hive',        label: 'Single-hive',        icon: 'hive-box',        text: 'Every drop came from one hive. No blending.' },
  { key: 'raw',                label: 'Raw',                icon: 'comb',            text: 'Never heated or fine-filtered, so the pollen stays in.' },
  { key: 'pure',               label: 'Pure',               icon: 'drop',            text: 'Honey and nothing else. No syrups added.' },
  { key: 'creamed',            label: 'Creamed',            icon: 'jar',             text: 'Crystallized on purpose, then whipped smooth.' },
  { key: 'crystallized',       label: 'Crystallized',       icon: 'crystals',        text: 'Natural graininess as honey cools. Still good.' },
  { key: 'liquid',             label: 'Liquid',             icon: 'waves',           text: "Fresh, clear honey that hasn't crystallized yet." }
];

// "Our process to ensure purity" steps on the Why purity matters tab (opens on tap,
// so these can run longer than the 22-word first view)
const PURITY_STEPS = [
  { title: 'Bloom', text: "Keepers pin each hive on our map. We note the flowers within the bees' forage range and any spraying nearby." },
  { title: 'Hive',  text: 'Keepers log every harvest: which hives, when, and how the bees were fed and treated. Volunteers visit to confirm.' },
  { title: 'Jar',   text: 'Each batch gets its own trace page and QR code, so you can follow your jar back to the hive it came from.' }
];

(function () {
  const tiles = document.getElementById('termTiles');
  const detail = document.getElementById('termDetail');
  if (!tiles || !detail) return;

  const TAB_IDS = ['definitions', 'purity', 'deeper'];

  // ---------- Build ----------

  tiles.innerHTML = LEARN_TERMS.map(t => `
    <div class="col-6 col-md-3">
      <button type="button" class="term-tile term-${t.key}" data-term="${t.key}" aria-pressed="false" aria-controls="termDetail">
        ${icon(t.icon, 'term-tile__icon')}
        <span class="term-tile__label">${escapeHtml(t.label)}</span>
      </button>
    </div>`).join('');

  // Site badges show their real badge; Crystallized and Liquid aren't badges, so they get a plain pill
  function pill(t) {
    return BADGES[t.key]
      ? badge(t.key)
      : `<span class="badge badge-term term-${t.key}">${icon(t.icon, 'badge-icon')}${escapeHtml(t.label)}</span>`;
  }

  function selectTerm(key, updateHash) {
    const term = LEARN_TERMS.find(t => t.key === key);
    if (!term) return;
    tiles.querySelectorAll('.term-tile').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.term === key));
    });
    detail.innerHTML = `${pill(term)}<p>${escapeHtml(term.text)}</p>`;
    detail.classList.remove('is-empty');
    if (updateHash) history.replaceState(null, '', `#${key}`);
  }

  tiles.addEventListener('click', event => {
    const btn = event.target.closest('.term-tile');
    if (btn) selectTerm(btn.dataset.term, true);
  });

  // Purity stat
  const stat = document.getElementById('purityStat');
  if (stat && typeof PURITY_STAT !== 'undefined') {
    const src = LEARN_SOURCES.find(s => s.id === PURITY_STAT.sourceId);
    stat.innerHTML = `
      <div class="purity-stat__value">${escapeHtml(PURITY_STAT.value)}</div>
      <p class="purity-stat__text">${escapeHtml(PURITY_STAT.text)}</p>
      ${src ? `<p class="purity-stat__source">Source: <a href="${escapeHtml(src.url)}" target="_blank" rel="noopener">${escapeHtml(src.publisher)}, ${escapeHtml(src.date.split(' ').pop())}</a> (${escapeHtml(PURITY_STAT.sourceNote)})</p>` : ''}`;
  }

  // Process steps
  const steps = document.getElementById('puritySteps');
  if (steps) {
    steps.innerHTML = PURITY_STEPS.map((step, i) => `
      <li class="purity-step">
        <span class="purity-step__num" aria-hidden="true">${i + 1}</span>
        <h3 class="purity-step__title">${escapeHtml(step.title)}</h3>
        <p>${escapeHtml(step.text)}</p>
      </li>`).join('');
  }

  // Go deeper cards
  const sources = document.getElementById('sourceCards');
  if (sources && typeof LEARN_SOURCES !== 'undefined') {
    sources.innerHTML = LEARN_SOURCES.map(s => `
      <div class="col-md-6">
        <a class="source-card" href="${escapeHtml(s.url)}" target="_blank" rel="noopener">
          <span class="eyebrow">${escapeHtml(s.kind)}</span>
          <span class="source-card__title">${escapeHtml(s.title)}</span>
          <span class="source-card__meta">${escapeHtml(s.publisher)}${s.date ? `, ${escapeHtml(s.date)}` : ''}</span>
        </a>
      </div>`).join('');
  }

  // ---------- Tabs and the URL hash ----------

  function showTab(id) {
    const btn = document.querySelector(`[data-bs-target="#tab-${id}"]`);
    if (btn) bootstrap.Tab.getOrCreateInstance(btn).show();
  }

  document.querySelectorAll('.learn-tabs [data-bs-toggle="pill"]').forEach(btn => {
    btn.addEventListener('shown.bs.tab', () => {
      const id = btn.dataset.bsTarget.replace('#tab-', '');
      history.replaceState(null, '', id === 'definitions' ? window.location.pathname : `#${id}`);
    });
  });

  function applyHash() {
    const hash = window.location.hash.slice(1);
    if (TAB_IDS.includes(hash)) {
      showTab(hash);
    } else if (LEARN_TERMS.some(t => t.key === hash)) {
      showTab('definitions');
      selectTerm(hash, false);
      document.querySelector(`.term-tile[data-term="${hash}"]`)?.focus({ preventScroll: true });
    }
  }

  window.addEventListener('hashchange', applyHash);
  applyHash();
})();
