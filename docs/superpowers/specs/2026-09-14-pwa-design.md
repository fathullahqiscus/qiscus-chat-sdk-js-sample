# PWA Design

## Goal

Make the Qiscus sample installable and able to show its public shell after a successful online visit, while keeping chat and all user data online-only.

## Architecture

Use a native service worker rather than Workbox. It owns one versioned cache containing a reviewed allowlist of public same-origin shell files and three pinned CDN scripts required to boot the app. Installation caches essential files atomically; optional cosmetic dependencies (fonts and Font Awesome) remain network-only so their failure cannot prevent activation.

The worker uses network-first for same-origin navigations and returns the cached `index.html` shell when navigation fails. It uses cache-first only for allowlisted public shell URLs and fetches everything else directly. This excludes Qiscus APIs, the JWT development endpoint, remote avatars, attachments, credentials, and any arbitrary URL. Activation deletes only prior caches whose names begin with `qiscus-pwa-shell-` and does not call `skipWaiting`, avoiding disruption while a message is being composed.

`index.html` declares the manifest, PWA metadata, and guarded worker registration. A small RequireJS service observes browser online/offline state and SDK bridge events, then renders a persistent accessible connectivity banner. It reports browser offline distinctly from SDK failure. Existing send flows remain SDK-confirmed: they retain their current pending/failed state and do not add offline queuing.

## User-visible behavior

- Online visits preserve `appId`, `baseUrl`, and `brokerUrl` query parsing exactly as today.
- Installed launches start at `/` without query parameters; existing `qiscus_app_id` local storage continues to initialize the SDK.
- An uncached, first offline visit may receive the browser network error. A repeat offline visit gets the cached public shell and a clear offline notice.
- A new worker precaches its own shell before activation. It becomes controlling on the next load and removes old shell versions without touching local storage.

## Assets and browser support

`img/logo.svg` is the approved available source for draft 192px and 512px PNG icons. The manifest uses standalone display, root start URL/scope, and Qiscus colors. The expected support set is Chrome and Edge desktop, Chrome Android, and currently supported iOS/iPadOS Safari Add to Home Screen behavior.

## Validation and rollback

Validation uses a localhost static server and browser DevTools to inspect manifest, service-worker scope, cache names and contents, repeat offline navigation, CDN/SDK failure message, URL configuration, and cache-version cleanup. No test framework exists, so a Node static-contract test validates the manifest and worker’s cache policy. Rollback consists of reverting the PWA commit; an existing client can unregister the worker and clear the `qiscus-pwa-shell-*` cache using the documented reset procedure.
