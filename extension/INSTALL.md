# TrustBreak AI — Browser Extension Installation

TrustBreak AI Browser Shield is a Manifest V3 extension for Chromium-based browsers.
It provides two features:

- **Real-Time Navigation Shield** — scans top-level navigations and shows an isolated warning banner on high-risk pages.
- **Pre-Click Interceptor** — blocks known phishing domains before the request is sent and shows a containment warning page.

---

## 1. Build the extension

From the repository root:

```bash
npm install
npm run build:extension
```

This validates the manifest and creates a clean, production-ready folder:

```text
dist-extension/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── warning.html
├── warning.js
└── icons/
```

`npm run build:extension` also fails the build if the manifest is missing a referenced
file, an icon is missing, or an extension page contains an inline script that Manifest V3
would block.

> Developers can load `extension/` directly for quick iteration. Use `dist-extension/`
> for a clean build and for sharing with other users.

---

## 2. Install in Chrome

1. Open `chrome://extensions` in the address bar.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `dist-extension/` folder (or `extension/` while developing).
5. Pin **TrustBreak AI** from the toolbar puzzle-piece menu.
6. Open any `http://` or `https://` page and click the TrustBreak AI icon to test a scan.

Chrome 102 or newer is required.

---

## 3. Install in Brave

1. Open `brave://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the `dist-extension/` folder.
5. Pin the extension from the Brave toolbar.

Brave Shields may block third-party requests on some sites. The extension calls
`https://trust-break-ai.vercel.app/api/*`; if scans fail, allow that host in
Brave Shields for the current site or disable Shields for testing.

---

## 4. Install in Microsoft Edge

1. Open `edge://extensions`.
2. Turn on **Developer mode** (left sidebar).
3. Click **Load unpacked**.
4. Select the `dist-extension/` folder.
5. Pin the extension from the Edge toolbar.

Edge may show an “Allow extensions from other stores” prompt only when installing from
the Chrome Web Store. Loading an unpacked folder does not require that setting.

---

## 5. Install in Opera

1. Open `opera://extensions`.
2. Turn on **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select the `dist-extension/` folder.
5. Pin the extension from the Opera toolbar.

Opera uses the same Chromium extension engine. Some Opera builds hide **Load unpacked**
until Developer mode is enabled.

---

## 6. Verify the installation

1. The extension appears in the browser’s extension manager without errors.
2. Open the TrustBreak AI web app and go to **Browser Shield**.
3. The status card should show **Browser Shield active · v1.0.0**.
4. Click the extension icon, paste a suspicious message or URL, and click **Inspect Threat**.
5. Reload the extension after rebuilding:
   - Open the browser’s extension manager.
   - Click the reload icon on the TrustBreak AI card.

### Testing the Pre-Click Interceptor safely

Do **not** visit a real malicious domain. Instead:

1. Enable the endpoint on the server with `ENABLE_PRE_CLICK_INTERCEPTOR=true` and
   deploy the app.
2. Make sure the Supabase `public_blocklist` table has at least one test domain
   (for example `example.test`).
3. Wait for the extension to sync (on install, on browser startup, and every 30 minutes),
   or reload the extension to trigger a sync.
4. Navigate to a URL on that test domain. The extension should redirect to its
   containment page.
5. Click **Proceed anyway (unsafe)** to confirm the one-time bypass works.

You can also point the extension at a local API during development from the extension
service-worker console:

```js
chrome.storage.local.set({ apiBaseUrl: "http://localhost:5173" });
```

Clear it with:

```js
chrome.storage.local.remove("apiBaseUrl");
```

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| “Manifest file is missing or unreadable” | Select the folder that directly contains `manifest.json` (`dist-extension/`, not the repository root). |
| “Could not load icon” | Run `npm run build:extension` again; all three PNG icons must exist. |
| Extension loads but no warning banner | Confirm the page is `http(s)` (not `chrome://`), reload the tab, and check the service-worker console for errors. |
| Pre-click blocking never triggers | The server must return a blocklist. Set `ENABLE_PRE_CLICK_INTERCEPTOR=true`, apply the Supabase schema, and reload the extension to sync. |
| Scans fail with a network error | Check `https://trust-break-ai.vercel.app/api/health` and confirm the deployment has its environment variables configured. |
| Changes do not appear | Click the reload icon for the extension, then reload the page. |

---

## 8. Permissions explained

| Permission | Why it is needed |
|---|---|
| `webNavigation` | Detect top-level navigations for real-time URL scanning. |
| `tabs` | Read the active tab URL for the popup scanner and send overlay messages. |
| `storage` | Store the optional custom API base URL. |
| `declarativeNetRequest` | Apply pre-click block and one-time bypass rules. |
| `alarms` | Refresh the blocklist every 30 minutes and expire bypass rules. |
| `<all_urls>` host access | Scan any page the user visits and fetch the TrustBreak AI API. |
