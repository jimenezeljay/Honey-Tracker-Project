// Sign-up (get-started.html): one form for shoppers and beekeepers. Needs js/forms.js.
// Picking "I keep bees" shows and requires the beekeeper fields.
// Until real accounts exist (HC-113), nothing is sent: shoppers are signed in (HTSession
// in js/components.js) and go to the Marketplace; beekeepers wait for approval on
// keeper-pending.html. Later: POST /api/auth/signup with the role.

const signupForm = document.getElementById('signupForm');
const keeperFields = document.getElementById('keeperFields');
const keeperInputs = keeperFields.querySelectorAll('[data-keeper-required]');

function showRoleFields() {
  const keeper = document.getElementById('roleKeeper').checked;
  keeperFields.hidden = !keeper;
  keeperInputs.forEach(input => { input.required = keeper; });
  document.getElementById('signupSubmit').textContent = keeper ? 'Apply as a beekeeper' : 'Create account';
}

// get-started.html?role=keeper (footer "Become a keeper") starts on "I keep bees"
if (new URLSearchParams(location.search).get('role') === 'keeper') {
  document.getElementById('roleKeeper').checked = true;
}
signupForm.querySelectorAll('input[name="role"]').forEach(radio => radio.addEventListener('change', showRoleFields));
showRoleFields();

validateForm(signupForm, () => {
  const keeper = document.getElementById('roleKeeper').checked;
  document.getElementById('signupSubmit').disabled = true;
  HTSession.signIn(keeper ? 'keeper' : 'shopper');
  location.href = keeper ? 'keeper-pending.html?state=submitted' : 'marketplace.html';
});
