// Add farm and hive wizard. Needs js/components.js, Leaflet, js/data.js, js/maps.js and
// js/forms.js first. Each step is its own <form class="wizard-step">, checked by validateForm.

(async function () {
  const page = document.getElementById('keeperPage');
  const stepForms = [...document.querySelectorAll('.wizard-step')];
  if (!page || !stepForms.length) return;

  const data = await getKeeperDashboard();

  // These redirects guide people to the right page. They are not the security:
  // the backend must refuse to save a farm for anyone but an approved keeper.
  if (!data) {
    location.replace('signin.html');
    return;
  }
  if (data.keeper.applicationStatus !== 'approved') {
    location.replace('keeper-pending.html');
    return;
  }
  page.hidden = false;

  const BEE_TYPES = ['Italian', 'Carniolan', 'Russian', 'Buckfast', 'Other'];
  const DEFAULT_FORAGE_MI = 2;
  const PIN_ZOOM = 13; // close enough to place a pin on the right spot

  const value = id => document.getElementById(id).value.trim();
  const precision = () => document.querySelector('input[name="precision"]:checked').value;

  // Hives being placed: { key, lat, lng, forageRadiusMi, beeType, marker, circle }
  let hives = [];
  let nextKey = 1;
  const labelOf = hive => `H${hives.indexOf(hive) + 1}`;

  // ---- Steps ----

  const stepList = document.getElementById('wizardSteps');
  let current = 0;

  function showStep(index) {
    current = index;
    stepForms.forEach((form, i) => { form.hidden = i !== index; });
    stepList.innerHTML = stepForms.map((form, i) => {
      const state = i < index ? ' class="is-done"' : i === index ? ' class="is-current" aria-current="step"' : '';
      return `<li${state}>${form.dataset.title}</li>`;
    }).join('');

    if (index === 1) openMap();
    if (index === 2) renderBeeTypes();
    if (index === 5) renderReview();

    stepForms[index].querySelector('h2').focus({ preventScroll: true });
    page.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  stepForms.forEach((form, index) => {
    form.querySelector('[data-wizard-back]')?.addEventListener('click', () => showStep(index - 1));
    if (index === 1) validateForm(form, () => { if (checkHives()) showStep(2); });
    else if (index === 5) validateForm(form, saveWizard);
    else validateForm(form, () => showStep(index + 1));
  });

  // ---- Step 1: Farm ----

  characterCounter(document.getElementById('farmDescription'), document.getElementById('farmDescriptionCount'));

  // The photo is only previewed: there's nowhere to store it until the backend decides
  document.getElementById('farmPhoto').addEventListener('change', event => {
    const preview = document.getElementById('farmPhotoPreview');
    const file = event.target.files[0];
    if (preview.src) URL.revokeObjectURL(preview.src);
    preview.hidden = !file;
    if (file) preview.src = URL.createObjectURL(file);
    else preview.removeAttribute('src');
  });

  // ---- Step 2: Hive pins ----

  const hiveList = document.getElementById('hiveList');
  const hiveError = document.getElementById('hiveError');
  let map = null;
  let areaLayer = null;

  // Leaflet can't measure a hidden box, so the map is built when this step first shows
  function openMap() {
    if (map) {
      HTMap.refresh(map);
      return;
    }
    const home = data.farms[0];
    map = HTMap.create(document.getElementById('wizardMap'), home
      ? { center: [home.lat, home.lng], zoom: 9 }
      : { center: [39.5, -80], zoom: 5 });
    if (!map) return; // Leaflet didn't load: coordinates can still be typed in
    map.on('click', event => addHive(event.latlng.lat, event.latlng.lng));
  }

  function addHive(lat, lng) {
    const hive = { key: nextKey++, lat, lng, forageRadiusMi: DEFAULT_FORAGE_MI, beeType: '' };
    hives.push(hive);
    if (map) {
      // Uses the shared .ht-pin look; dragging is the only thing added here
      hive.marker = L.marker([lat, lng], {
        draggable: true,
        keyboard: true,
        icon: L.divIcon({ className: 'ht-pin', iconSize: [18, 18], iconAnchor: [9, 9] })
      }).addTo(map);
      hive.circle = HTMap.forage(lat, lng, hive.forageRadiusMi).addTo(map);
      hive.marker.on('drag', () => {
        const spot = hive.marker.getLatLng();
        hive.lat = spot.lat;
        hive.lng = spot.lng;
        hive.circle.setLatLng(spot);
      });
      hive.marker.on('dragend', () => { updateMapExtras(); renderHiveList(); });
      if (hives.length === 1 || map.getZoom() < PIN_ZOOM) map.setView([lat, lng], Math.max(map.getZoom(), PIN_ZOOM));
    }
    renderHiveList();
    updateMapExtras();
    checkHivesQuietly();
  }

  function removeHive(key) {
    const hive = hives.find(h => h.key === key);
    if (!hive) return;
    hive.marker?.remove();
    hive.circle?.remove();
    hives = hives.filter(h => h !== hive);
    renderHiveList();
    updateMapExtras();
  }

  function renderHiveList() {
    hiveList.hidden = !hives.length;
    hiveList.innerHTML = hives.map(hive => `
      <li>
        <div class="dash-list__main">
          <span class="dash-list__title">Hive ${labelOf(hive)}</span>
          <span class="dash-list__meta">${hive.lat.toFixed(4)}, ${hive.lng.toFixed(4)}</span>
        </div>
        <div class="wizard-radius">
          <label class="form-label mb-0 small" for="radius${hive.key}">Forage (miles)</label>
          <input class="form-control form-control-sm" id="radius${hive.key}" data-radius="${hive.key}" type="number" min="0.5" max="10" step="0.5" value="${hive.forageRadiusMi}" required>
          <div class="invalid-feedback">0.5 to 10.</div>
        </div>
        <button class="btn btn-sm btn-outline-secondary" type="button" data-remove="${hive.key}" aria-label="Remove hive ${labelOf(hive)}">Remove</button>
      </li>`).join('');
  }

  hiveList.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (button) removeHive(Number(button.dataset.remove));
  });

  hiveList.addEventListener('input', event => {
    const hive = hives.find(h => h.key === Number(event.target.dataset.radius));
    const miles = Number(event.target.value);
    if (!hive || !event.target.checkValidity()) return;
    hive.forageRadiusMi = miles;
    hive.circle?.setRadius(miles * 1609.34);
  });

  // Shows what shoppers will get: forage circles, or a dashed area for an approximate farm
  function updateMapExtras() {
    const approximate = precision() === 'approximate';
    document.getElementById('wizardLegend').innerHTML = approximate
      ? '<span><i class="key-pin"></i>Your hive</span><span><i class="key-area"></i>What shoppers see</span>'
      : '<span><i class="key-pin"></i>Hive</span><span><i class="key-radius"></i>Forage area</span>';
    if (!map) return;

    hives.forEach(hive => {
      if (approximate) hive.circle?.remove();
      else hive.circle?.addTo(map);
    });
    areaLayer?.remove();
    areaLayer = null;
    if (approximate && hives.length) {
      const average = key => hives.reduce((sum, hive) => sum + hive[key], 0) / hives.length;
      areaLayer = HTMap.area(average('lat'), average('lng'), 'What shoppers see').addTo(map);
    }
  }

  document.querySelectorAll('input[name="precision"]').forEach(radio => {
    radio.addEventListener('change', updateMapExtras);
  });
  updateMapExtras();

  function checkHives() {
    const ok = hives.length > 0;
    hiveError.classList.toggle('d-block', !ok);
    if (!ok) hiveError.scrollIntoView({ block: 'center' });
    return ok;
  }

  function checkHivesQuietly() {
    if (hives.length) hiveError.classList.remove('d-block');
  }

  // Use my location: moves the map only. The keeper still chooses where each pin goes.
  const locationMessage = document.getElementById('locationMessage');
  document.getElementById('useLocation').addEventListener('click', () => {
    const say = text => {
      locationMessage.textContent = text;
      locationMessage.hidden = !text;
    };
    if (!navigator.geolocation) {
      say("This browser can't share your location. Move the map by hand.");
      return;
    }
    say('Finding you…');
    navigator.geolocation.getCurrentPosition(
      position => {
        say('');
        map?.setView([position.coords.latitude, position.coords.longitude], PIN_ZOOM);
      },
      () => say("Couldn't get your location. Move the map by hand.")
    );
  });

  // Typed coordinates: for keyboard users, or anyone who already knows the spot
  document.getElementById('manualAdd').addEventListener('click', () => {
    const lat = document.getElementById('manualLat');
    const lng = document.getElementById('manualLng');
    [lat, lng].forEach(input => { input.required = true; });
    const ok = [lat, lng].every(input => input.reportValidity());
    [lat, lng].forEach(input => { input.required = false; });
    if (!ok) return;
    addHive(Number(lat.value), Number(lng.value));
    lat.value = '';
    lng.value = '';
    lat.focus();
  });

  // ---- Step 3: Bee type ----

  function renderBeeTypes() {
    document.getElementById('beeTypes').innerHTML = hives.map(hive => `
      <div class="mb-3">
        <label class="form-label" for="bee${hive.key}">Hive ${labelOf(hive)}</label>
        <select class="form-select" id="bee${hive.key}" data-bee="${hive.key}" required>
          <option value="" disabled${hive.beeType ? '' : ' selected'}>Choose…</option>
          ${BEE_TYPES.map(type => `<option value="${type}"${hive.beeType === type ? ' selected' : ''}>${type}</option>`).join('')}
        </select>
        <div class="invalid-feedback">Choose a bee type.</div>
      </div>`).join('');
  }

  document.getElementById('beeTypes').addEventListener('change', event => {
    const hive = hives.find(h => h.key === Number(event.target.dataset.bee));
    if (hive) hive.beeType = event.target.value;
  });

  // ---- Step 6: Review ----

  const flowerList = () => value('nearbyFlowers').split(',').map(flower => flower.trim()).filter(Boolean);
  const countyName = () => value('farmCounty').replace(/\s+county$/i, '');

  function renderReview() {
    const stateName = document.getElementById('farmState').selectedOptions[0].textContent;
    const rows = [
      ['Farm', value('farmName')],
      ['About', value('farmDescription')],
      ['Location', `${countyName()} County, ${stateName}`],
      ['Shoppers see', precision() === 'exact' ? 'Exact hive locations' : 'Only an approximate area'],
      ['Hives', hives.map(hive => `${labelOf(hive)} (${hive.beeType}, ${hive.forageRadiusMi} mi)`).join(', ')],
      ['Feeding', value('feedingNotes')],
      ['Pest treatment', value('pestNotes')],
      ['Flowers', flowerList().join(', ')],
      ['Pesticides nearby', value('pesticideNotes')]
    ];
    document.getElementById('wizardReview').innerHTML = rows.map(([label, text]) => `
      <div class="keeper-preview__row">
        <span class="text-soft">${label}</span>
        <span>${escapeHtml(text)}</span>
      </div>`).join('');
  }

  // ---- Save ----

  async function saveWizard(form) {
    form.querySelector('[type="submit"]').disabled = true;

    const farm = await saveFarm({
      farm: {
        name: value('farmName'),
        description: value('farmDescription'),
        county: countyName(),
        state: value('farmState'),
        precision: precision()
      },
      hives: hives.map(hive => ({
        label: labelOf(hive),
        lat: hive.lat,
        lng: hive.lng,
        forageRadiusMi: hive.forageRadiusMi,
        beeType: hive.beeType
      })),
      practices: { feedingNotes: value('feedingNotes'), pestNotes: value('pestNotes') },
      nearbyFlowers: { flowers: flowerList(), pesticideNotes: value('pesticideNotes') }
    });

    document.getElementById('wizardArea').hidden = true;
    document.getElementById('wizardSavedText').textContent = `${farm.name} is on your dashboard and the map.`;
    document.getElementById('wizardHarvestLink').href = `log-harvest.html?farm=${encodeURIComponent(farm.id)}`;
    const saved = document.getElementById('wizardSaved');
    saved.hidden = false;
    saved.focus();
  }

  showStep(0);
})();
