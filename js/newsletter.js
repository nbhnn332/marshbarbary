/**
 * MARSH BARBARY - NEWSLETTER FORM
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.newsletter-form');
  const input = document.querySelector('.newsletter-input');
  const feedback = document.querySelector('.newsletter-feedback');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input?.value.trim();

    if (!email || !email.includes('@') || !email.includes('.')) {
      if (feedback) {
        feedback.textContent = 'Please enter a valid email address.';
        feedback.style.color = '#B47154';
        feedback.classList.add('show');
      }
      return;
    }

    // Success state
    if (feedback) {
      feedback.textContent = 'Thank you for joining our circle. A kinder tomorrow awaits.';
      feedback.style.color = '#26201D';
      feedback.classList.add('show');
    }

    if (input) input.value = '';

    setTimeout(() => {
      feedback?.classList.remove('show');
    }, 4500);
  });
});
