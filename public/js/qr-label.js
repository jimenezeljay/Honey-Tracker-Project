// QR label page (wireframe 16). DRAFT: one label on plain paper, a Print button and a copy-link button.
// Needs js/components.js, the qrcode-generator library, and js/data.js (getKeeperDashboard, qrLink, batchCode).
//
//   qr-label.html?batch=1          a label for one of the signed-in keeper's batches
//   qr-label.html                  no batch given: their most recent harvest
//   qr-label.html?state=suspended  (mock) what a suspended keeper sees
//
// Later (QR labels section of the API contract): how many labels, which paper or sticker sheet,
// and a start position for half-used sheets.

(function () {
  const fill = name => document.querySelector(`[data-fill="${name}"]`);
  const picker = document.getElementById('batchPick');
  const copyButton = document.getElementById('copyLink');
  let batch = null;

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
      history.replaceState(null, '', `?batch=${batch.id}`);
      render(farmsById, hivesById);
    });

    document.getElementById('printLabel').addEventListener('click', () => window.print());
    copyButton.addEventListener('click', copyLink);

    render(farmsById, hivesById);
  });
})();
