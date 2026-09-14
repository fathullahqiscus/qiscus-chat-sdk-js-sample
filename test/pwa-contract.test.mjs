import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('manifest declares standalone root launch and required icon sizes', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));

  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512']);
  await Promise.all(manifest.icons.map((icon) => stat(new URL(icon.src.replace(/^\//, ''), root))));
});

test('HTML links the manifest and safely registers the root worker', async () => {
  const html = await read('index.html');

  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /'serviceWorker' in navigator/);
  assert.match(html, /navigator\.serviceWorker\.register\('\/service-worker\.js'/);
});

test('worker only owns a versioned public shell cache and provides navigation fallback', async () => {
  const worker = await read('service-worker.js');

  assert.match(worker, /const CACHE_NAME = 'qiscus-pwa-shell-v3';/);
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /caches\.match\(SHELL_URL\)/);
  assert.match(worker, /key\.startsWith\(CACHE_PREFIX\)/);
  assert.match(worker, /PUBLIC_ASSET_URLS\.indexOf\(request\.url\) !== -1/);
  assert.doesNotMatch(worker, /workbox|registerRoute|StaleWhileRevalidate|CacheFirst/);
  assert.doesNotMatch(worker, /api\.qiscus|\/get-jwt/i);
});

test('connectivity service and accessible status banner are wired into the application', async () => {
  const [html, app, service] = await Promise.all([
    read('index.html'),
    read('js/app.js'),
    read('js/service/connectivity.js'),
  ]);

  assert.match(html, /id="connectivity-status"/);
  assert.match(html, /role="status"/);
  assert.match(app, /'service\/connectivity'/);
  assert.match(app, /connectivity\.setSdkState\('failed'/);
  assert.match(service, /window\.addEventListener\('offline'/);
  assert.match(service, /window\.addEventListener\('online'/);
});

test('normal connectivity stays quiet while recovery is a temporary snackbar', async () => {
  const [html, service] = await Promise.all([
    read('index.html'),
    read('js/service/connectivity.js'),
  ]);

  assert.doesNotMatch(html, /connectivity-status-online/);
  assert.doesNotMatch(service, /Online\. Live chat siap digunakan/);
  assert.match(service, /window\.setTimeout/);
  assert.match(service, /sdkState === 'connected'/);
});

test('README documents installation, public-cache audit, offline limits, and reset', async () => {
  const readme = await read('README.md');

  assert.match(readme, /Progressive Web App/i);
  assert.match(readme, /Cache Storage/i);
  assert.match(readme, /offline/i);
  assert.match(readme, /unregister/i);
});
