const LAUNCH = new Date('2026-11-14T09:00:00+01:00');
const MINUTE = 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const pad = (n) => String(n).padStart(2, '0');

export function setupCountdown(root) {
  if (!root) return;
  const cells = {
    days: root.querySelector('[data-unit="days"]'),
    hours: root.querySelector('[data-unit="hours"]'),
    minutes: root.querySelector('[data-unit="minutes"]'),
  };

  const render = () => {
    const remaining = Math.max(0, LAUNCH.getTime() - Date.now());
    const totalMinutes = Math.floor(remaining / MINUTE);
    cells.days.textContent = String(Math.floor(totalMinutes / 1440));
    cells.hours.textContent = pad(Math.floor((totalMinutes % 1440) / 60));
    cells.minutes.textContent = pad(totalMinutes % 60);
  };

  render();
  window.setInterval(render, 30 * 1000);
}

// Concept page: validates the address and confirms, but sends nothing anywhere.
export function setupWaitlist(form, status) {
  if (!form || !status) return;
  const input = form.querySelector('input[type="email"]');

  const show = (message, isError) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
    input.setAttribute('aria-invalid', String(isError));
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!email) {
      show('Enter an email address to join the drop.', true);
      input.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      show('That address looks incomplete. Check it has an @ and a domain, like you@studio.com.', true);
      input.focus();
      return;
    }
    show(`Thanks. STRATA is a concept, so ${email} was not sent or stored anywhere.`, false);
    form.reset();
  });
}
