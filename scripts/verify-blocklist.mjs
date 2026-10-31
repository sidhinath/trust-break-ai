#!/usr/bin/env node
/**
 * TrustBreak AI — Feature 8 production verifier.
 *
 * Checks that the deployed blocklist endpoint is enabled, reachable, and
 * returning valid domains that the extension can convert into DNR rules.
 *
 * Usage:
 *   node scripts/verify-blocklist.mjs
 *   node scripts/verify-blocklist.mjs https://your-deployment.vercel.app
 */

const apiBase = (process.argv[2] || process.env.TRUSTBREAK_API_BASE || "https://trust-break-ai.vercel.app").replace(/\/+$/, "");

function isValidDomain(domain) {
  if (domain.length < 4 || domain.length > 253) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  return labels.every(
    (label) =>
      label.length >= 1 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRule(domain) {
  return {
    regexFilter: `^https?:\\/\\/([^\\/]+\\.)?${escapeRegExp(domain)}(\\/.*)?$`,
    resourceTypes: ["main_frame"],
  };
}

async function main() {
  const endpoint = `${apiBase}/api/blocklist-lite`;
  console.log(`Checking ${endpoint}`);

  const response = await fetch(endpoint, { cache: "no-store" });
  const body = await response.text();
  const count = response.headers.get("x-blocklist-count");

  console.log(`HTTP status: ${response.status}`);
  console.log(`X-Blocklist-Count: ${count ?? "not set"}`);

  if (response.status === 404) {
    console.error("FAIL: endpoint is disabled. Set ENABLE_PRE_CLICK_INTERCEPTOR=true or deploy the updated default.");
    console.error(body.trim());
    process.exit(1);
  }

  if (!response.ok) {
    console.error(`FAIL: endpoint returned ${response.status}.`);
    console.error(body.trim());
    process.exit(1);
  }

  const domains = body
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.startsWith("#"));

  if (domains.length === 0) {
    console.error("FAIL: endpoint returned zero domains. Create the public_blocklist table and add rows.");
    process.exit(1);
  }

  const invalid = domains.filter((domain) => !isValidDomain(domain));
  if (invalid.length > 0) {
    console.error(`FAIL: ${invalid.length} invalid domain(s), e.g. ${invalid.slice(0, 5).join(", ")}`);
    process.exit(1);
  }

  console.log(`PASS: ${domains.length} valid domain(s) returned.`);
  console.log(`Sample: ${domains.slice(0, 5).join(", ")}`);

  const rule = buildRule(domains[0]);
  const regex = new RegExp(rule.regexFilter);
  const checks = {
    "matches https URL": regex.test(`https://${domains[0]}/login?x=1`),
    "matches http URL": regex.test(`http://${domains[0]}/`),
    "matches subdomain": regex.test(`https://evil.${domains[0]}/path`),
    "rejects lookalike": !regex.test(`https://not${domains[0]}/path`),
  };

  console.log("Rule shape checks:", checks);
  if (Object.values(checks).some((value) => !value)) {
    console.error("FAIL: generated DNR regex does not behave as expected.");
    process.exit(1);
  }

  console.log("Feature 8 endpoint is production-ready.");
}

main().catch((error) => {
  console.error("FAIL:", error?.message || error);
  process.exit(1);
});
