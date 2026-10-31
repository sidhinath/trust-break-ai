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

### Enabling the Pre-Click Interceptor in production

The endpoint is enabled by default. Set `ENABLE_PRE_CLICK_INTERCEPTOR=false` in the
deployment environment only to disable it (kill switch).

1. Apply the blocklist schema (idempotent):

   ```bash
   SUPABASE_PAT=... SUPABASE_PROJECT_REF=... \
     SUPABASE_SQL_FILE=supabase/007-pre-click-interceptor.sql npm run supabase:sql
   ```

   Or paste `supabase/007-pre-click-interceptor.sql` into the Supabase SQL Editor.
   `npm run supabase:setup` also creates the table now.

2. Populate the table. The Vercel cron calls `/api/cron/sync-feeds` daily and upserts
   OpenPhish/URLhaus domains. To populate immediately, call it with your `CRON_SECRET`:

   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://trust-break-ai.vercel.app/api/cron/sync-feeds
   ```

3. Verify the deployed endpoint:

   ```bash
   npm run verify:blocklist
   ```

   It must print `PASS` with a non-zero domain count.

4. Reload the extension, then check the service worker console:

   ```js
   chrome.declarativeNetRequest.getDynamicRules().then(r => console.log(r.length))
   // expected: one rule per blocklisted domain
   ```

### Testing the Pre-Click Interceptor safely

Do **not** visit a real malicious domain. Use a reserved `.test` domain:

1. Add a temporary test row (or use any domain returned by the verifier):

   ```sql
   insert into public.public_blocklist (domain_hash, domain, source)
   values ('trustbreak-e2e-test', 'trustbreak-e2e.test', 'manual-e2e')
   on conflict (domain_hash) do nothing;
   ```

2. Wait for the extension to sync (install, startup, every 30 minutes, or extension
   reload), or trigger it in the service worker console:

   ```js
   chrome.runtime.sendMessage({ action: "TRUSTBREAK_SYNC_BLOCKLIST" }).then(console.log)
   ```

3. Confirm a redirect rule exists:

   ```js
   chrome.declarativeNetRequest.getDynamicRules().then(console.log)
   ```

4. Navigate to `http://trustbreak-e2e.test/login`. The extension redirects to the
   containment page before DNS resolution.
5. Click **Proceed anyway (unsafe)** to confirm the one-time bypass works. Navigation
   then fails DNS (expected for a reserved domain), but the warning loop is gone.
6. Remove the test row:

   ```sql
   delete from public.public_blocklist where source = 'manual-e2e';
   ```

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
| Pre-click blocking never triggers | The server must return a blocklist. Confirm `ENABLE_PRE_CLICK_INTERCEPTOR` is not set to `false`, apply `supabase/007-pre-click-interceptor.sql`, run `npm run verify:blocklist`, then reload the extension or send `TRUSTBREAK_SYNC_BLOCKLIST`. |
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
