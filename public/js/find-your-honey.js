// Find your honey: turns a typed jar code into its trace page.
// Used by find-your-honey.html and by the homepage pop-up (#findHoneyModal in index.html).
// Accepts "HT-0011", "ht 11", "0011" or "11", and also a pasted trace link (...?batch=11).
// Whether the batch exists is checked by product.html, which shows the not-found page if not.

function batchIdFromCode(raw) {
  const text = raw.trim();
  const fromLink = text.match(/[?&]batch=(\d+)/i);
  if (fromLink) return Number(fromLink[1]);
  const fromCode = text.match(/^(?:HT[\s-]*)?(\d{1,9})$/i);
  return fromCode ? Number(fromCode[1]) : null;
}

const codeForm = document.getElementById('codeForm');
const codeInput = document.getElementById('jarCode');
const codeError = document.getElementById('codeError');

codeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = batchIdFromCode(codeInput.value);
  if (!id) {
    codeError.classList.add('d-block');
    codeInput.classList.add('is-invalid');
    codeInput.focus();
    return;
  }
  location.href = `product.html?batch=${id}`;
});

// Clear the error as soon as they start fixing it
codeInput.addEventListener('input', () => {
  codeError.classList.remove('d-block');
  codeInput.classList.remove('is-invalid');
});

// Homepage pop-up: put the cursor in the box as soon as it opens
document.getElementById('findHoneyModal')?.addEventListener('shown.bs.modal', () => codeInput.focus());
