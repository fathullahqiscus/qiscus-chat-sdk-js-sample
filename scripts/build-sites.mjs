import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const serverDir = path.join(distDir, "server");

const files = [
  "index.html",
  "service-worker.js",
  "css/chat-list-page.css",
  "css/create-group.css",
  "css/icon.css",
  "css/login-page.css",
  "css/main.css",
  "css/profile.css",
  "css/room-info.css",
  "css/toolbar.css",
  "css/users-page.css",
  "img/bg-pattern.svg",
  "img/icon-add-participant.svg",
  "img/icon-arrow-back.svg",
  "img/icon-arrow-left-green.svg",
  "img/icon-arrow-right-green.svg",
  "img/icon-arrow.svg",
  "img/icon-attachment.svg",
  "img/icon-avatar-group-creation.svg",
  "img/icon-avatar-picker.svg",
  "img/icon-camera.svg",
  "img/icon-cancel.svg",
  "img/icon-check-green.svg",
  "img/icon-check.svg",
  "img/icon-cross-red.svg",
  "img/icon-file-attachment.svg",
  "img/icon-id-card.svg",
  "img/icon-image-attachment.svg",
  "img/icon-logout.svg",
  "img/icon-message-failed.svg",
  "img/icon-message-read.svg",
  "img/icon-message-sending.svg",
  "img/icon-message-sent.svg",
  "img/icon-more.svg",
  "img/icon-new-chat-group.svg",
  "img/icon-new-chat.svg",
  "img/icon-pencil-grey.svg",
  "img/icon-pencil-white.svg",
  "img/icon-power.svg",
  "img/icon-search.svg",
  "img/icon-send.svg",
  "img/icon-trash.svg",
  "img/icon-user.svg",
  "img/img-default-avatar-picker.svg",
  "img/img-empty-avatar.svg",
  "img/img-empty-chat.svg",
  "img/img-empty-message.svg",
  "img/logo.svg",
  "js/app.js",
  "js/jquery-mod.js",
  "js/lib/date_fns.js",
  "js/lib/history.min.js",
  "js/lib/htm.umd.js",
  "js/lib/jquery-3.3.1.min.js",
  "js/lib/lodash.min.js",
  "js/lib/require.js",
  "js/lib/vhtml.min.js",
  "js/main.js",
  "js/pages/chat-list.js",
  "js/pages/chat.js",
  "js/pages/create-group.js",
  "js/pages/login.js",
  "js/pages/profile.js",
  "js/pages/room-info.js",
  "js/pages/users.js",
  "js/service/avatar-helper.js",
  "js/service/content.js",
  "js/service/emitter.js",
  "js/service/html.js",
  "js/service/page.js",
  "js/service/qiscus.js",
  "js/service/route.js",
  "js/service/toast.js"
];

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

const assets = {};

for (const file of files) {
  const bytes = await readFile(path.join(root, file));
  assets[`/${file}`] = {
    body: bytes.toString("base64"),
    contentType: contentTypes[path.extname(file)] ?? "application/octet-stream"
  };
}

await rm(distDir, { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });

const worker = `const assets = ${JSON.stringify(assets)};

function normalizePath(pathname) {
  if (pathname === "/" || pathname === "") return "/index.html";
  return pathname.endsWith("/") ? pathname + "index.html" : pathname;
}

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[normalizePath(url.pathname)];

    if (!asset) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    return new Response(decodeBase64(asset.body), {
      headers: {
        "content-type": asset.contentType,
        "cache-control": asset.contentType.startsWith("text/html")
          ? "no-store"
          : "public, max-age=31536000, immutable"
      }
    });
  }
};
`;

await writeFile(path.join(serverDir, "index.js"), worker);
