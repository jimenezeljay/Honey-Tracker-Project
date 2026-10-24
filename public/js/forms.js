// Form validation and submits (volunteer application now; sign-in can reuse it later).

// Checks a form with Bootstrap's validation styles, then calls onValid(form) if it passes.
// Supports checkbox groups that need at least one box ticked:
//   <fieldset data-required-group> ...checkboxes... <div class="invalid-feedback">...</div></fieldset>
function validateForm(form, onValid) {
  const groupOk = group => group.querySelector('input:checked') !== null;

  const showGroupState = group => {
    const ok = groupOk(group);
    group.querySelector('.invalid-feedback').classList.toggle('d-block', !ok);
    group.querySelectorAll('input').forEach(input => input.classList.toggle('is-invalid', !ok));
    return ok;
  };

  const groups = [...form.querySelectorAll('[data-required-group]')];

  // After the first submit attempt, re-check a group as soon as a box changes,
  // so its error clears right away
  groups.forEach(group => group.addEventListener('change', () => {
    if (form.classList.contains('was-validated')) showGroupState(group);
  }));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const groupsOk = groups.map(showGroupState).every(Boolean);
    const fieldsOk = form.checkValidity();
    form.classList.add('was-validated');

    if (fieldsOk && groupsOk) {
      onValid(form);
    } else {
      // Move focus to the first problem so keyboard and screen reader users find it
      form.querySelector(':invalid, .is-invalid')?.focus();
    }
  });
}

// Live "123 / 500" counter under a textarea with a maxlength
function characterCounter(textarea, counter) {
  const update = () => { counter.textContent = `${textarea.value.length} / ${textarea.maxLength}`; };
  textarea.addEventListener('input', update);
  update();
}

// ---------- Volunteer application (volunteer.html) ----------

// The one place to swap in the API later (POST /applications/volunteer):
//   const res = await fetch(API_BASE + '/applications/volunteer', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(application)
//   });
//   if (!res.ok) throw new Error('Application failed');
async function submitVolunteerApplication(application) {
  return { status: 'submitted' };
}

const volunteerForm = document.getElementById('volunteerForm');
if (volunteerForm) {
  characterCounter(document.getElementById('reason'), document.getElementById('reasonCount'));

  validateForm(volunteerForm, async form => {
    const data = new FormData(form);
    // Field names match the Volunteer application entity in the handoff doc
    const application = {
      fullName: data.get('fullName').trim(),
      email: data.get('email').trim(),
      city: data.get('city').trim(),
      state: data.get('state'),
      experience: data.get('experience'),
      availability: data.getAll('availability'),
      reason: data.get('reason').trim()
    };

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Sending';

    try {
      await submitVolunteerApplication(application);
      document.getElementById('volunteerFormArea').hidden = true;
      const thanks = document.getElementById('volunteerThanks');
      thanks.hidden = false;
      thanks.focus();
    } catch {
      button.disabled = false;
      button.textContent = 'Submit application';
      alert('Something went wrong. Please try again.');
    }
  });
}
