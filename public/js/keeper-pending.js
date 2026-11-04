// Keeper application status (wireframe 12). Needs js/data.js first.

const APPLICATION_STEPS = [
  { status: 'submitted',    label: 'Submitted' },
  { status: 'under-review', label: 'Under review' },
  { status: 'approved',     label: 'Approved' }
];

const APPLICATION_COPY = {
  'submitted':    { title: 'Application received',     message: "We'll start reviewing it soon. Browse honey while you wait." },
  'under-review': { title: 'Application under review', message: "We'll email you when your keeper account is approved. Browse honey while you wait." },
  'approved':     { title: "You're approved!",         message: 'Your keeper account is ready. Time to add your hives.' }
};

function renderApplication(status) {
  const copy = APPLICATION_COPY[status];
  if (!copy) return;

  document.getElementById('applicationTitle').textContent = copy.title;
  document.getElementById('applicationMessage').textContent = copy.message;

  const current = APPLICATION_STEPS.findIndex(step => step.status === status);
  document.getElementById('applicationSteps').innerHTML = APPLICATION_STEPS.map((step, index) => {
    if (index < current || status === 'approved') return `<li class="is-done">${step.label}</li>`;
    if (index === current) return `<li class="is-current" aria-current="step">${step.label}</li>`;
    return `<li>${step.label}</li>`;
  }).join('');

  if (status === 'approved') {
    document.getElementById('applicationActions').innerHTML =
      '<a class="btn btn-primary" href="dashboard.html">Go to my dashboard</a>';
    document.getElementById('applicationEdit').hidden = true;
  }
}

getKeeperApplication().then(application => renderApplication(application.status));
