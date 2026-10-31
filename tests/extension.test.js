import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extensionDir = path.join(root, "extension");
const manifest = JSON.parse(
  fs.readFileSync(path.join(extensionDir, "manifest.json"), "utf8")
);

test("Extension manifest is valid Manifest V3", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.match(manifest.name, /TrustBreak AI/);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.background.service_worker, "background.js");
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.ok(Array.isArray(manifest.permissions));
  assert.ok(manifest.permissions.includes("declarativeNetRequest"));
  assert.ok(manifest.permissions.includes("webNavigation"));
  assert.ok(manifest.permissions.includes("alarms"));
  assert.ok(Array.isArray(manifest.host_permissions));
  assert.ok(manifest.host_permissions.includes("<all_urls>"));
});

test("Every file referenced by the manifest exists", () => {
  const referenced = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...manifest.content_scripts.flatMap((entry) => entry.js || []),
    ...(manifest.web_accessible_resources || []).flatMap(
      (entry) => entry.resources || []
    ),
    ...Object.values(manifest.icons || {}),
    ...Object.values(manifest.action?.default_icon || {}),
  ];

  for (const file of referenced) {
    if (file.includes("*")) continue;
    assert.ok(
      fs.existsSync(path.join(extensionDir, file)),
      `manifest references missing file: ${file}`
    );
  }
});

test("Declared icon sizes match the actual PNG dimensions", () => {
  const expected = { 16: "icons/icon16.png", 48: "icons/icon48.png", 128: "icons/icon128.png" };

  for (const [size, file] of Object.entries(expected)) {
    const buffer = fs.readFileSync(path.join(extensionDir, file));
    assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${file} is not a PNG`);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    assert.equal(width, Number(size), `${file} width`);
    assert.equal(height, Number(size), `${file} height`);
  }
});

test("Extension pages comply with the MV3 script CSP", () => {
  for (const file of ["popup.html", "warning.html"]) {
    const html = fs.readFileSync(path.join(extensionDir, file), "utf8");
    assert.doesNotMatch(
      html,
      /<script(?![^>]*\bsrc=)[^>]*>/i,
      `${file} must not contain inline scripts`
    );
  }

  for (const file of ["background.js", "content.js", "popup.js", "warning.js"]) {
    const source = fs.readFileSync(path.join(extensionDir, file), "utf8");
    assert.doesNotMatch(source, /\beval\s*\(|\bnew\s+Function\s*\(/, `${file} uses eval`);
  }
});

test("Pre-click interceptor is wired to declarativeNetRequest", () => {
  const background = fs.readFileSync(path.join(extensionDir, "background.js"), "utf8");
  assert.match(background, /declarativeNetRequest\.updateDynamicRules/);
  assert.match(background, /type:\s*"redirect"/);
  assert.match(background, /type:\s*"allow"/);
  assert.match(background, /priority:\s*100/);
  assert.match(background, /blocklist-lite/);
  assert.match(background, /syncBlocklistAlarm/);
});

test("Warning page bypass requests a one-time allow rule", () => {
  const warning = fs.readFileSync(path.join(extensionDir, "warning.js"), "utf8");
  assert.match(warning, /TRUSTBREAK_ALLOW_ONCE/);
  assert.match(warning, /chrome\.runtime\.sendMessage/);
  assert.match(warning, /location\.replace/);

  const html = fs.readFileSync(path.join(extensionDir, "warning.html"), "utf8");
  assert.match(html, /src="warning\.js"/);
});

test("Content script exposes the Browser Shield detection marker", () => {
  const content = fs.readFileSync(path.join(extensionDir, "content.js"), "utf8");
  assert.match(content, /data-trustbreak-extension/);
  assert.match(content, /trustbreak-extension-ready/);
  assert.match(content, /TRUSTBREAK_SHOW_OVERLAY/);
  assert.match(content, /attachShadow/);
});

test("Browser Shield page listens for the extension marker", () => {
  const page = fs.readFileSync(path.join(root, "src", "pages", "BrowserShield.jsx"), "utf8");
  assert.match(page, /data-trustbreak-extension/);
  assert.match(page, /trustbreak-extension-ready/);
});

test("No legacy branding remains in extension sources", () => {
  for (const file of fs.readdirSync(extensionDir)) {
    const absolute = path.join(extensionDir, file);
    if (!fs.statSync(absolute).isFile() || !/\.(js|json|html)$/.test(file)) continue;
    const source = fs.readFileSync(absolute, "utf8");
    assert.doesNotMatch(source, /ghostnet|ghost net|ghost-net/i, `${file} contains legacy branding`);
  }
});
