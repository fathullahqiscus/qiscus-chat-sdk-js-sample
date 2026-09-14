const CACHE_PREFIX = 'qiscus-pwa-shell-';
const CACHE_NAME = 'qiscus-pwa-shell-v3';
const SHELL_URL = '/';

// Only public shell URLs are eligible for Cache Storage. All unknown URLs,
// including SDK/API traffic and user content, are fetched from the network.
const SHELL_ASSETS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/css/main.css', '/css/icon.css', '/css/login-page.css', '/css/chat-list-page.css',
  '/css/users-page.css', '/css/toolbar.css', '/css/create-group.css', '/css/profile.css', '/css/room-info.css',
  '/js/main.js', '/js/app.js', '/js/jquery-mod.js',
  '/js/lib/require.js', '/js/lib/jquery-3.3.1.min.js', '/js/lib/lodash.min.js', '/js/lib/date_fns.js',
  '/js/lib/history.min.js', '/js/lib/vhtml.min.js', '/js/lib/htm.umd.js',
  '/js/pages/login.js', '/js/pages/chat-list.js', '/js/pages/chat.js', '/js/pages/users.js',
  '/js/pages/create-group.js', '/js/pages/profile.js', '/js/pages/room-info.js',
  '/js/service/qiscus.js', '/js/service/route.js', '/js/service/emitter.js', '/js/service/content.js',
  '/js/service/toast.js', '/js/service/page.js', '/js/service/html.js', '/js/service/avatar-helper.js',
  '/js/service/connectivity.js',
  '/img/logo.svg', '/img/bg-pattern.svg', '/img/pwa-icon-192.png', '/img/pwa-icon-512.png',
  '/img/icon-more.svg', '/img/icon-power.svg', '/img/icon-message-sent.svg', '/img/icon-pencil-grey.svg',
  '/img/icon-arrow-right-green.svg', '/img/icon-message-sending.svg', '/img/icon-arrow-left-green.svg',
  '/img/icon-arrow.svg', '/img/icon-camera.svg', '/img/icon-new-chat.svg', '/img/icon-check-green.svg',
  '/img/img-empty-message.svg', '/img/icon-pencil-white.svg', '/img/icon-send.svg', '/img/icon-check.svg',
  '/img/icon-message-read.svg', '/img/icon-image-attachment.svg', '/img/icon-id-card.svg', '/img/icon-message-failed.svg',
  '/img/icon-cancel.svg', '/img/icon-logout.svg', '/img/img-empty-avatar.svg', '/img/img-default-avatar-picker.svg',
  '/img/icon-trash.svg', '/img/icon-avatar-group-creation.svg', '/img/icon-search.svg', '/img/icon-avatar-picker.svg',
  '/img/icon-add-participant.svg', '/img/icon-user.svg', '/img/img-empty-chat.svg', '/img/icon-file-attachment.svg',
  '/img/icon-new-chat-group.svg', '/img/icon-arrow-back.svg', '/img/icon-attachment.svg', '/img/icon-cross-red.svg',
  'https://unpkg.com/lodash@4.17.21/lodash.min.js', 'https://unpkg.com/qiscus-sdk-core@2.14.2',
  'https://unpkg.com/showdown@1.9.1/dist/showdown.js'
];
const PUBLIC_ASSET_URLS = SHELL_ASSETS.map(function (asset) {
  return new URL(asset, self.location.origin).href;
});

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(SHELL_ASSETS);
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) return caches.delete(key);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(function () {
      return caches.match(SHELL_URL);
    }));
    return;
  }

  if (PUBLIC_ASSET_URLS.indexOf(request.url) !== -1) {
    event.respondWith(caches.match(request).then(function (cached) {
      return cached || fetch(request);
    }));
  }
});
