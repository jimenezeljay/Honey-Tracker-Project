// QR label page (wireframe 16, HC-70). One label on plain paper, or a page of labels:
// how many to print, and which spot to start at on a half-used sheet. Plus a copy-link button.
// Needs js/components.js, the qrcode-generator library, and js/data.js (getKeeperDashboard, qrLink, batchCode).
//
//   qr-label.html?batch=1                              a label for one of the signed-in keeper's batches
//   qr-label.html                                      no batch given: their most recent harvest
//   qr-label.html?batch=1&sheet=letter9&count=12&start=4   12 labels, starting at spot 4
//   qr-label.html?state=suspended                      (mock) what a suspended keeper sees

(function () {
  const fill = name => document.querySelector(`[data-fill="${name}"]`);
  const picker = document.getElementById('batchPick');
  const copyButton = document.getElementById('copyLink');
  let batch = null;

  // Print layouts. The cells' sizes are set in scss/pages/_qr-label.scss (.qr-sheet--<key>).
  // To add a sticker sheet once the team picks one: add an entry here and a matching
  // .qr-sheet--<key> rule, measured from the sheet maker's own template.
  const SHEETS = {
    single:  { name: 'One label (plain paper)', perPage: 1, cols: 1 },
    letter9: { name: 'Letter page, 9 labels to cut out', perPage: 9, cols: 3 }
  };
  const MAX_LABELS = 90;   // 10 pages of 9

  const sheet = {
    pick: document.getElementById('sheetPick'),
    options: document.getElementById('sheetOptions'),
    count: document.getElementById('labelCount'),
    start: document.getElementById('startSpot'),
    map: document.getElementById('sheetMap'),
    summary: document.getElementById('sheetSummary'),
    printText: document.getElementById('printText')
  };

  // What prints, built from the preview label. Only shown when printing a page of labels.
  const printSheets = document.createElement('div');
  printSheets.className = 'qr-sheets';
  printSheets.setAttribute('aria-hidden', 'true');
  document.body.appendChild(printSheets);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, Math.round(Number(value)) || min));
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function sheetChoice() {
    const key = sheet.pick.value;
    const layout = SHEETS[key];
    const count = key === 'single' ? 1 : clamp(sheet.count.value, 1, MAX_LABELS);
    const start = key === 'single' ? 1 : clamp(sheet.start.value, 1, layout.perPage);
    return { key, layout, count, start };
  }

  // Keeps the batch and the print settings in the address, so a set-up page can be reopened
  function updateUrl() {
    const { key, count, start } = sheetChoice();
    const params = new URLSearchParams({ batch: batch.id });
    if (key !== 'single') {
      params.set('sheet', key);
      params.set('count', count);
      params.set('start', start);
    }
    history.replaceState(null, '', `?${params}`);
  }

  function updateSheets() {
    const { key, layout, count, start } = sheetChoice();
    const many = key !== 'single';
    document.body.classList.toggle('qr-print-sheet', many);
    sheet.options.hidden = !many;
    sheet.printText.textContent = many ? `Print ${plural(count, 'label')}` : 'Print label';
    if (!many) {
      printSheets.innerHTML = '';
      return;
    }

    // Spots before `start` on the first page are skipped (already used); labels fill the rest in order
    const spots = start - 1 + count;
    const pages = Math.ceil(spots / layout.perPage);
    const label = `<div class="qr-label">${document.getElementById('qrLabel').innerHTML}</div>`;
    let html = '';
    for (let page = 0; page < pages; page++) {
      let cells = '';
      for (let spot = 0; spot < layout.perPage; spot++) {
        const n = page * layout.perPage + spot;
        cells += n >= start - 1 && n < spots ? `<div class="qr-sheet__spot">${label}</div>` : '<div class="qr-sheet__spot is-empty"></div>';
      }
      html += `<div class="qr-sheet qr-sheet--${key}">${cells}</div>`;
    }
    printSheets.innerHTML = html;

    // On-screen map of the first page: used spots, labels, and spots left blank
    sheet.map.style.setProperty('--cols', layout.cols);
    sheet.map.innerHTML = Array.from({ length: layout.perPage }, (_, spot) => {
      const state = spot < start - 1 ? 'is-used' : spot < spots ? 'is-label' : '';
      return `<span class="qr-sheet-map__spot ${state}"></span>`;
    }).join('');
    sheet.summary.textContent =
      `${plural(count, 'label')} on ${plural(pages, 'page')}${start > 1 ? `, starting at spot ${start}` : ''}. Print on Letter paper at 100%.`;
  }

  // The QR as one SVG path in the site's ink color, with the standard 4-module quiet zone
  function qrSvg(text) {
    if (typeof qrcode === 'undefined') {
      return '<p class="qr-label__error">The QR code couldn\'t load. Try refreshing.</p>';
    }
    const qr = qrcode(0, 'M');   // 0 = pick the smallest size that fits; M = medium error correction
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const quiet = 4;
    const size = count + quiet * 2;
    let path = '';
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
    return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code for ${escapeHtml(text)}" shape-rendering="crispEdges">
      <rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#2A2117"/></svg>`;
  }

  function batchName(b) {
    return `${b.batchNumber} · ${b.honeyType} · ${b.season}`;   // short enough to fit the menu
  }

  function render(farmsById, hivesById) {
    const farm = farmsById.get(hivesById.get(batch.hiveIds[0]).farmId);
    fill('farm').textContent = farm.name;
    fill('qr').innerHTML = qrSvg(qrLink(batch));
    fill('code').textContent = batchCode(batch);
    fill('honey').textContent = `${batch.honeyType} · ${batch.season}`;
    document.title = `QR label ${batchCode(batch)} · Honey Tracker`;
    updateSheets();   // the printed page copies this label
  }

  async function copyLink() {
    const label = copyButton.querySelector('span');
    try {
      await navigator.clipboard.writeText(qrLink(batch));
      label.textContent = 'Copied';
    } catch {
      // Clipboard blocked (some browsers, http pages): show the link so it can be copied by hand
      window.prompt('Copy this link:', qrLink(batch));
    }
    setTimeout(() => { label.textContent = 'Copy trace link'; }, 2000);
  }

  getKeeperDashboard().then(data => {
    // Same redirects as the dashboard. They guide people; the backend is the security.
    if (!data) { location.replace('signin.html'); return; }
    if (data.keeper.applicationStatus !== 'approved') { location.replace('keeper-pending.html'); return; }

    document.getElementById('keeperPage').hidden = false;

    if (data.keeper.certification === 'suspended') {
      document.getElementById('suspendedNotice').hidden = false;
      document.getElementById('labelArea').hidden = true;
      return;
    }

    // Only the keeper's own batches, newest first
    const batches = [...data.batches].sort((a, b) => b.harvestDate.localeCompare(a.harvestDate));
    if (!batches.length) { location.replace('log-harvest.html'); return; }

    const wanted = new URLSearchParams(location.search).get('batch');
    batch = wanted ? batches.find(b => b.id === Number(wanted)) : batches[0];
    if (!batch) { location.replace('not-found.html'); return; }   // not theirs, or doesn't exist

    const farmsById = new Map(data.farms.map(f => [f.id, f]));
    const hivesById = new Map(data.hives.map(h => [h.id, h]));

    picker.innerHTML = batches.map(b =>
      `<option value="${b.id}"${b.id === batch.id ? ' selected' : ''}>${escapeHtml(batchName(b))}</option>`).join('');
    picker.addEventListener('change', () => {
      batch = batches.find(b => b.id === Number(picker.value));
      updateUrl();
      render(farmsById, hivesById);
    });

    // Print settings: from the address if given, otherwise one label
    const params = new URLSearchParams(location.search);
    sheet.pick.innerHTML = Object.entries(SHEETS)
      .map(([key, layout]) => `<option value="${key}">${escapeHtml(layout.name)}</option>`).join('');
    sheet.pick.value = SHEETS[params.get('sheet')] ? params.get('sheet') : 'single';
    if (params.has('count')) sheet.count.value = clamp(params.get('count'), 1, MAX_LABELS);
    if (params.has('start')) sheet.start.value = clamp(params.get('start'), 1, SHEETS[sheet.pick.value].perPage);

    const onSettings = () => { updateSheets(); updateUrl(); };
    sheet.pick.addEventListener('change', () => {
      sheet.start.max = SHEETS[sheet.pick.value].perPage;
      onSettings();
    });
    [sheet.count, sheet.start].forEach(input => {
      input.addEventListener('input', onSettings);
      // Tidy an out-of-range or empty box when leaving it, so what shows is what prints
      input.addEventListener('change', () => {
        const { count, start } = sheetChoice();
        sheet.count.value = count;
        sheet.start.value = start;
      });
    });

    document.getElementById('printLabel').addEventListener('click', () => window.print());
    copyButton.addEventListener('click', copyLink);

    render(farmsById, hivesById);
  });
})();
