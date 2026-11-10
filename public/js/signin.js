// Sign in (signin.html). Needs js/forms.js (validateForm).
// Until real login exists (HC-113), any email and password opens the sample keeper's
// dashboard, so the keeper pages can be clicked through. Later this becomes
// POST /api/auth/signin, and the server decides where each role lands
// (shopper -> home, keeper -> dashboard, pending keeper -> keeper-pending).

const signinForm = document.getElementById('signinForm');

validateForm(signinForm, () => {
  signinForm.querySelector('[type="submit"]').disabled = true;
  location.href = 'dashboard.html';
});
