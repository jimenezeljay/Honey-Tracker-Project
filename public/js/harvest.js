// Log harvest. Needs js/components.js, js/data.js and js/forms.js first.
//
//   log-harvest.html?farm=7  starts with that farm chosen
//
// Bee type isn't asked here: the wizard records it per hive, so it comes from the chosen hives.
// The creamed and single-hive flags are worked out from the texture and the hive count.

(async function () {
  const page = document.getElementById('keeperPage');
  const form = document.getElementById('harvestForm');
  if (!page || !form) return;

  const data = await getKeeperDashboard();

  // These redirects guide people to the right page. They are not the security:
  // the backend must refuse to save a batch for anyone but an approved keeper.
  if (!data) {
    location.replace('signin.html');
    return;
  }
  if (data.keeper.applicationStatus !== 'approved') {
    location.replace('keeper-pending.html');
    return;
  }

  page.hidden = false;
  const hivesOf = farmId => data.hives.filter(hive => hive.farmId === Number(farmId));
  const farms = data.farms.filter(farm => hivesOf(farm.id).length);

  if (!farms.length) {
    document.getElementById('harvestNoFarms').hidden = false;
    return;
  }
  document.getElementById('harvestFormArea').hidden = false;

  const ui = {
    farm: document.getElementById('harvestFarm'),
    hives: document.getElementById('harvestHiveChecks'),
    date: document.getElementById('harvestDate'),
    season: document.getElementById('harvestSeason'),
    quantity: document.getElementById('harvestQuantity'),
    type: document.getElementById('harvestType'),
    texture: document.getElementById('harvestTexture'),
    flowers: document.getElementById('harvestFlowers'),
    notes: document.getElementById('harvestNotes'),
    preview: document.getElementById('harvestPreview')
  };

  // ---- Season from the date ----

  // Today in the keeper's own timezone, as YYYY-MM-DD
  function today() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  // A suggestion the keeper can change: Mar-May spring, Jun-Aug summer, Sep-Nov fall.
  function seasonFor(isoDate) {
    const month = Number(isoDate.slice(5, 7));
    if (month >= 3 && month <= 5) return 'Spring';
    if (month >= 6 && month <= 8) return 'Summer';
    if (month >= 9 && month <= 11) return 'Fall';
    return 'Winter';
  }

  function updateSeasons() {
    if (!ui.date.value) return;
    const year = ui.date.value.slice(0, 4);
    ui.season.innerHTML = ['Spring', 'Summer', 'Fall', 'Winter']
      .map(season => `<option value="${season} ${year}">${season} ${year}</option>`).join('');
    ui.season.value = `${seasonFor(ui.date.value)} ${year}`;
  }

  // ---- Farm and hives ----

  function renderHives() {
    const hives = hivesOf(ui.farm.value);
    ui.hives.innerHTML = hives.map(hive => `
      <div class="form-check form-check-inline">
        <input class="form-check-input" id="hive${hive.id}" name="hive" type="checkbox" value="${hive.id}"${hives.length === 1 ? ' checked' : ''}>
        <label class="form-check-label" for="hive${hive.id}">Hive ${escapeHtml(hive.label)}</label>
      </div>`).join('');
  }

  ui.farm.innerHTML = farms.map(farm => `<option value="${farm.id}">${escapeHtml(farm.name)}</option>`).join('');
  const startFarm = new URLSearchParams(location.search).get('farm');
  if (farms.some(farm => farm.id === Number(startFarm))) ui.farm.value = startFarm;
  ui.date.max = today();
  renderHives();

  // ---- Live preview ----

  function chosenHives() {
    return [...ui.hives.querySelectorAll('input:checked')]
      .map(box => data.hives.find(hive => hive.id === Number(box.value)));
  }

  function flowerList() {
    return ui.flowers.value.split(',').map(flower => flower.trim()).filter(Boolean);
  }

  function renderPreview() {
    const hives = chosenHives();
    const bees = [...new Set(hives.map(hive => hive.beeType))].join(', ');
    const lines = [
      ['Hives', hives.map(hive => hive.label).join(', ')],
      ['Season', ui.season.value],
      ['Harvest', [ui.quantity.value && `${ui.quantity.value} lb`, ui.type.value.trim()].filter(Boolean).join(' · ')],
      ['Texture', ui.texture.selectedOptions[0]?.value ? ui.texture.selectedOptions[0].textContent : ''],
      ['Bees', bees],
      ['Flowers', flowerList().join(', ')]
    ];
    ui.preview.innerHTML = lines.map(([label, value]) => `
      <li class="keeper-preview__row">
        <span class="text-soft">${label}</span>
        <span>${value ? escapeHtml(value) : '&mdash;'}</span>
      </li>`).join('');
  }

  ui.farm.addEventListener('change', renderHives);
  ui.date.addEventListener('change', updateSeasons);
  form.addEventListener('input', renderPreview);
  form.addEventListener('change', renderPreview);
  characterCounter(ui.notes, document.getElementById('harvestNotesCount'));
  renderPreview();

  // ---- Save ----

  validateForm(form, async () => {
    const hives = chosenHives();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;

    const batch = await saveHarvest({
      hiveIds: hives.map(hive => hive.id),
      harvestDate: ui.date.value,
      season: ui.season.value,
      quantityLb: Number(ui.quantity.value),
      honeyType: ui.type.value.trim(),
      texture: ui.texture.value,
      flowerTypes: flowerList(),
      flags: [
        ui.texture.value === 'creamed' ? 'creamed' : null,
        hives.length === 1 ? 'single-hive' : null
      ].filter(Boolean),
      notes: ui.notes.value.trim()
    });

    document.getElementById('harvestFormArea').hidden = true;
    document.getElementById('harvestSavedText').textContent = `Batch ${batch.batchNumber} is on your dashboard.`;
    document.getElementById('harvestTraceLink').href = batch.traceUrl;
    const saved = document.getElementById('harvestSaved');
    saved.hidden = false;
    saved.focus();
  });
})();
