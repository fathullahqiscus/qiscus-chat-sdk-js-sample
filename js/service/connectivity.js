define([], function () {
  var statusElement;
  var sdkState = 'unknown';

  function render() {
    statusElement = statusElement || document.getElementById('connectivity-status');
    if (!statusElement) return;
    if (!navigator.onLine) {
      statusElement.textContent = 'Anda sedang offline. Live chat membutuhkan koneksi internet.';
      statusElement.className = 'connectivity-status connectivity-status-offline';
    } else if (sdkState === 'failed' || sdkState === 'disconnected') {
      statusElement.textContent = 'Koneksi live chat tidak tersedia. Periksa jaringan atau muat ulang halaman.';
      statusElement.className = 'connectivity-status connectivity-status-warning';
    } else {
      statusElement.textContent = 'Online. Live chat siap digunakan.';
      statusElement.className = 'connectivity-status connectivity-status-online';
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
