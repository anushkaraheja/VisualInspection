export const toast = {
  success: (message: string) => {
    showToast(message, 'success');
  },
  error: (message: string) => {
    showToast(message, 'error');
  },
  info: (message: string) => {
    showToast(message, 'info');
  },
  warning: (message: string) => {
    showToast(message, 'warning');
  },
};

const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' | 'warning'
) => {
  // Create toast element
  const toastContainer =
    document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} m-2 dark:bg-backgroundColor dark:text-textColor`;

  // Create content
  toast.textContent = message;

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.className = 'btn btn-sm btn-ghost dark:text-textColor';
  closeButton.textContent = '✕';
  closeButton.onclick = () => {
    toast.remove();
  };
  toast.appendChild(closeButton);

  // Add to container
  toastContainer.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast toast-end z-50';
  document.body.appendChild(container);
  return container;
};
