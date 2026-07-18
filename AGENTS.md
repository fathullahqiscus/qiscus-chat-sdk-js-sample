# AGENTS.md

This file provides guidance to Agents (Claude Code and other AI coding agents) when working with code in this repository.

## Overview

A sample chat UI built on top of the Qiscus Chat SDK for JavaScript (`qiscus-sdk-core`), used by Qiscus support to demo/debug SDK behavior. It is a static site — no build step, no package.json, no tests, no linter. Vanilla JS with RequireJS (AMD modules), jQuery, and htm+vhtml for HTML templating.

## Running

Serve the folder with any static HTTP server, e.g.:

```bash
npx http-server .        # or: php -S localhost:8080
```

Then open it with query params for configuration:

```
http://localhost:8080/?appId=<APP_ID>&baseUrl=<optional>&brokerUrl=<optional>
```

`index.html` parses `appId`, `baseUrl`, `brokerUrl` from the query string into `window.APP_ID` / `window.BASE_URL` / `window.BROKER_URL`. Without an `appId`, SDK initialization is skipped and the login page asks for one.

## Architecture

- **SDK loading**: `index.html` loads `qiscus-sdk-core` from unpkg via a `<script>` tag (currently pinned to `2.14.2`; commented-out lines show how to swap versions or point at a local build). To change SDK version, edit that script tag — there is no dependency manager.
- **Module system**: RequireJS. `js/main.js` configures paths (vendor libs live in `js/lib/`) and boots `js/app.js`.
- **`js/app.js`**: the router/shell. Registers all page objects, listens to `route::change` events, renders the matching page's template into `#widget-content`, and calls its `mount()`.
- **`js/service/qiscus.js`**: the bridge between the raw `QiscusSDKCore` and the app. It wraps SDK callbacks (`newMessagesCallback`, `typingCallback`, etc.) and re-emits them as events on the shared emitter (`qiscus::new-message`, `qiscus::login-success`, ...). It also defines local `Comment`/`Room` wrapper classes, monkey-patches some SDK prototype methods, and exposes `window.initQiscus` for deferred initialization (e.g. appId entered on login page). Also contains an optional JWT auth flow expecting a nonce server at `http://localhost:8000/get-jwt`.
- **`js/service/emitter.js`**: a mitt-style event bus — the main communication channel between the SDK bridge, router, and pages.
- **`js/service/page.js`**: page factory. Each page in `js/pages/` (login, chat-list, chat, users, create-group, profile, room-info) supplies `{ path, template, bindEvents, onMount }`; `bindEvents` is bound once (idempotent), templates are htm/vhtml functions returning HTML strings.
- **`js/service/route.js`**: in-memory history (history.js) — navigation is `route.push('/path')`, no URL changes.
- **Styling**: one plain CSS file per page in `css/`, loaded globally from `index.html`.
- **`service-worker.js`**: Workbox caching for Google Fonts only.

## Conventions

- New pages: create `js/pages/<name>.js` using the `createPage` factory, register it in the `pages` array in `js/app.js`, and add its CSS file to `index.html`.
- Cross-component communication goes through the emitter events (`qiscus::*` for SDK events, `route::change` for navigation) rather than direct calls.
- `window.qiscus`, `window.route`, and `window.toast` are intentionally exposed globally for debugging in the browser console.

## End-of-session workflow

At the end of a conversation, if there are uncommitted changes:

1. Invoke the `smart-conventional-commits` skill to group and commit the changes using Conventional Commits.
2. Deploy via the Coolify MCP (`coolify qiscus` server):
   - Check whether a Coolify app already exists for this repo (`list_apps` / `list_projects`, matching by repo/name).
   - If it does **not** exist yet: create it with `create_app_from_repo`.
   - If it **already** exists: redeploy the existing app with `deploy_app`, passing its existing `uuid` and `force: true`.
