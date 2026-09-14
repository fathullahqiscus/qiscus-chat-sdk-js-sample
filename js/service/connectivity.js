define([], function () {
  var statusElement;
  var sdkState = 'unknown';
  var hideTimer;

  function hide() {
    statusElement = statusElement || document.getElementById('connectivity-status');
    if (statusElement) statusElement.className = 'connectivity-status is-hidden';
  }

  function show(message, className, duration) {
    statusElement = statusElement || document.getElementById('connectivity-status');
    if (!statusElement) return;
    window.clearTimeout(hideTimer);
    statusElement.textContent = message;
    statusElement.className = 'connectivity-status ' + className;
    if (duration) hideTimer = window.setTimeout(hide, duration);
  }

  function render() {
    if (!navigator.onLine) {
      show('Anda sedang offline. Live chat membutuhkan koneksi internet.', 'connectivity-status-offline');
    } else if (sdkState === 'failed' || sdkState === 'disconnected') {
      show('Koneksi live chat tidak tersedia. Periksa jaringan atau muat ulang halaman.', 'connectivity-status-warning');
    } else if (sdkState === 'connected') {
      show('Koneksi live chat tersambung kembali.', 'connectivity-status-online', 4000);
    } else {
      hide();
    }
  }

  function start() {
    window.addEventListener('offline', render);
    window.addEventListener('online', render);
    render();
  }

  return {
    start: start,
    setSdkState: function (state) { sdkState = state; render(); }
  };
});
