/**
 * Display a premium, animated toast notification on screen.
 * @param {string} message - Notification text
 * @param {string} type - Notification level ('success', 'error', 'info', 'warning')
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('Toast container element not found.');
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Select icon based on toast type
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-xmark';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    </div>
    <button style="background: none; border: none; color: inherit; cursor: pointer; opacity: 0.6; display: flex; align-items: center;" aria-label="Close">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  // Attach close event
  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hide');
    toast.addEventListener('animationend', () => toast.remove());
  });

  container.appendChild(toast);

  // Automatically fade out and remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('hide');
      toast.addEventListener('animationend', () => toast.remove());
    }
  }, 3000);
}
