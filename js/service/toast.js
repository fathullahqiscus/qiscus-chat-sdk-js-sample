// Toast Notification System
// Global toast notification for errors, success, info, and warnings
define([], function () {
    var toastContainer = null;
    var toastQueue = [];
    var isShowing = false;

    // Initialize toast container
    function initToastContainer() {
        if (toastContainer) return;

        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // Show toast notification
    function showToast(message, type, duration) {
        initToastContainer();

        type = type || 'info'; // default type
        duration = duration || 3000; // default 3 seconds

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type + ' toast-enter';

        // Icon based on type
        var icon = '';
        switch (type) {
            case 'success':
                icon = '✓';
                break;
            case 'error':
                icon = '✕';
                break;
            case 'warning':
                icon = '⚠';
                break;
            case 'info':
            default:
                icon = 'ℹ';
                break;
        }

        toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-message">${message}</div>
    `;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(function () {
            toast.classList.remove('toast-enter');
            toast.classList.add('toast-show');
        }, 10);

        // Auto hide
        setTimeout(function () {
            hideToast(toast);
        }, duration);
    }

    // Hide toast
    function hideToast(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-exit');

        setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Public API
    return {
        show: showToast,
        success: function (message, duration) {
            showToast(message, 'success', duration);
        },
        error: function (message, duration) {
            showToast(message, 'error', duration);
        },
        warning: function (message, duration) {
            showToast(message, 'warning', duration);
        },
        info: function (message, duration) {
            showToast(message, 'info', duration);
        }
    };
});
