#!/usr/bin/env node
/**
 * Builds a clean, production-ready Chrome MV3 extension into dist-extension/.
 * Validates the manifest, referenced files, MV3 CSP constraints, and icons.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "extension");
const outDir = path.join(root, "dist-extension");
const manifestPath = path.join(sourceDir, "manifest.json");

const RUNTIME_FILES = [
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.js",
  "warning.html",
  "warning.js",
];

const ICONS = ["icons/icon16.png", "icons/icon48.png", "icons/icon128.png"];
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function assertFile(relativePath, label) {
  const absolute = path.join(sourceDir, relativePath);
  if (!fs.existsSync(absolute)) {
    fail(`${label} is missing: extension/${relativePath}`);
  }
}

function scanHtml(relativePath) {
  const absolute = path.join(sourceDir, relativePath);
  const html = fs.readFileSync(absolute, "utf8");
  const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>/i.exec(html);
  if (inlineScript) {
    fail(
      `extension/${relativePath} contains an inline <script> block, which Manifest V3 CSP blocks. Move it to an external .js file.`
    );
  }
}

function scanJs(relativePath) {
  const absolute = path.join(sourceDir, relativePath);
  const source = fs.readFileSync(absolute, "utf8");
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(source)) {
    fail(`extension/${relativePath} uses eval/new Function, which Manifest V3 CSP blocks.`);
  }
}

const manifest = readJson(manifestPath);

if (!manifest) {
  console.error("Extension build failed:");
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

if (manifest.manifest_version !== 3) {
  fail(`manifest_version must be 3 (found ${manifest.manifest_version}).`);
}

RUNTIME_FILES.forEach((file) => assertFile(file, "Runtime file"));
ICONS.forEach((file) => assertFile(file, "Icon"));

const backgroundFile = manifest.background?.service_worker;
if (!backgroundFile) {
  fail("manifest.background.service_worker is required for MV3.");
} else {
  assertFile(backgroundFile, "Background service worker");
}

const popupFile = manifest.action?.default_popup;
if (popupFile) assertFile(popupFile, "Popup page");

const contentScripts = manifest.content_scripts || [];
if (contentScripts.length === 0) {
  fail("manifest.content_scripts is empty; no overlay script would be injected.");
}
contentScripts.forEach((entry) => {
  (entry.js || []).forEach((file) => assertFile(file, "Content script"));
  (entry.css || []).forEach((file) => assertFile(file, "Content stylesheet"));
});

const webResources = (manifest.web_accessible_resources || []).flatMap(
  (entry) => entry.resources || []
);
webResources.forEach((file) => {
  if (!file.includes("*")) assertFile(file, "Web accessible resource");
});

Object.keys(manifest.icons || {}).forEach((size) =>
  assertFile(manifest.icons[size], "Manifest icon")
);
Object.keys(manifest.action?.default_icon || {}).forEach((size) =>
  assertFile(manifest.action.default_icon[size], "Action icon")
);

["popup.html", "warning.html"].forEach((file) => {
  if (fs.existsSync(path.join(sourceDir, file))) scanHtml(file);
});
["background.js", "content.js", "popup.js", "warning.js"].forEach((file) => {
  if (fs.existsSync(path.join(sourceDir, file))) scanJs(file);
});

if (errors.length > 0) {
  console.error("Extension build failed:");
  errors.forEach((error) => console.error(` - ${error}`));
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
function copy(relativePath) {
  const from = path.join(sourceDir, relativePath);
  const to = path.join(outDir, relativePath);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied += 1;
}

RUNTIME_FILES.forEach(copy);
ICONS.forEach(copy);
webResources
  .filter((file) => !file.includes("*") && fs.existsSync(path.join(sourceDir, file)))
  .forEach((file) => {
    if (!RUNTIME_FILES.includes(file) && !ICONS.includes(file)) copy(file);
  });

console.log(`TrustBreak AI extension built successfully.`);
console.log(`  Source: extension/`);
console.log(`  Output: ${path.relative(root, outDir)}/`);
console.log(`  Version: ${manifest.version}`);
console.log(`  Files: ${copied}`);
console.log(`  Load unpacked: chrome://extensions -> Developer mode -> Load unpacked -> dist-extension/`);
