// Style guide helpers for components.html only.

// Every .sg-example shows its live .sg-preview, then the same HTML as copyable code.
// The code is read from the preview itself, so the two can never drift apart.
document.querySelectorAll('.sg-example').forEach(example => {
  const preview = example.querySelector('.sg-preview');
  const code = example.querySelector('.sg-code code');
  if (!preview || !code || code.textContent.trim()) return; // hand-written snippets are kept

  const lines = preview.innerHTML.replace(/^\n+|\s+$/g, '').split('\n');
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  code.textContent = lines.map(l => l.slice(indent)).join('\n');
});

// Copy buttons
document.querySelectorAll('.sg-copy').forEach(button => {
  button.addEventListener('click', async () => {
    const text = button.closest('.sg-code').querySelector('code').textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select and copy';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 1500);
  });
});

// Demo data for the JS-built components
const sampleListings = [
  { id: 1, farmId: 1, title: 'Wildflower Honey', farmName: 'Sunrise Farm',       price: 14,   badges: ['certified', 'raw'] },
  { id: 2, farmId: 2, title: 'Clover Honey',     farmName: 'Maple Ridge Apiary', price: 12.5, badges: ['certified', 'creamed'] },
  { id: 3, farmId: 3, title: 'Goldenrod Honey',  farmName: 'Clover Hill',        price: 16,   badges: ['volunteer-verified', 'single-hive'] }
];

const cardGrid = document.getElementById('demoCards');
if (cardGrid) {
  cardGrid.innerHTML = sampleListings
    .map(listing => `<div class="col-sm-6 col-lg-4">${productCard(listing)}</div>`)
    .join('');
}

// Toast demo
const toastButton = document.getElementById('demoToastBtn');
if (toastButton) {
  toastButton.addEventListener('click', () => {
    bootstrap.Toast.getOrCreateInstance(document.getElementById('demoToast')).show();
  });
}
