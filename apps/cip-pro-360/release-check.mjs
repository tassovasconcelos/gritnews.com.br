import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const OFFICIAL_LOGO_SHA256 = '1bdf5e051a137268d2aad2a6db750f53faecf1e590e673c9ed5d3a4e87c29d79';
export const TARGET = 'https://cip.gritnews.com.br';
const REQUIRED_FILES = ['index.html', 'cip-auth.js', 'presentation.mjs', 'presentation.css', 'supabase-js-2.57.0.mjs', 'doquita-insights.mjs', 'erp-ui.mjs', 'stock-reference.mjs', 'procfit-status-ui.mjs', 'procfit-catalog-ui.mjs', 'erp-engine.mjs', 'pricing-ui.mjs', 'pricing-engine.mjs', 'pricing-intelligence.mjs', 'shopping-position.mjs', 'stock-action-engine.mjs', 'stock-actions-ui.mjs', 'agent-capabilities.mjs', 'process-engine.mjs', 'process-consultant.mjs', 'process-ui.mjs', 'bot-ui.mjs', 'agents-data.mjs', 'agents-ui.mjs', 'academy-ui.mjs', 'admin-ui.mjs', 'ativar.html', 'cip-activation.js', 'academy-engine.mjs', 'agents.css', 'b2g-radar.mjs', 'b2g-research.mjs', 'b2g-research-ui.mjs', 'b2g-discovery.mjs', 'b2g-discovery-ui.mjs', 'b2g-sources.mjs', 'b2g-catalog.json', 'b2g-snapshot.json', 'recuperar.html', 'grit-recovery.js', '.htaccess', 'robots.txt', 'health.json'];
const LOGO = 'logo-grupo-prohospital.jpg';
const MANIFEST = 'release-manifest.json';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

function commitSha(value) {
  assert.match(value ?? '', /^[a-f0-9]{40}$/, 'A complete Git commit SHA is required');
  return value;
}

export function checkOfficialLogo(bytes) {
  assert.equal(digest(bytes), OFFICIAL_LOGO_SHA256, 'Official logo SHA-256 mismatch; use the supplied original file');
}

export function prepareRelease(source, output, commit) {
  commitSha(commit);
  assert.notEqual(path.resolve(source), path.resolve(output), 'Source and release directories must differ');
  fs.mkdirSync(output, {recursive: true});
  assert.equal(fs.readdirSync(output).length, 0, 'Release directory must be empty');
  const files = [...REQUIRED_FILES];
  if (fs.existsSync(path.join(source, LOGO))) files.push(LOGO);
  const manifest = {schema: 1, app: 'cip-pro360', commit_sha: commit, files: {}};
  for (const file of files) {
    const bytes = fs.readFileSync(path.join(source, file));
    assert.ok(bytes.length > 0, `Empty release file: ${file}`);
    if (file === LOGO) checkOfficialLogo(bytes);
    fs.writeFileSync(path.join(output, file), bytes);
    manifest.files[file] = {sha256: digest(bytes), bytes: bytes.length};
  }
  fs.writeFileSync(path.join(output, MANIFEST), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

export function validatePackage(directory, expectedCommit, requireLogo = true) {
  commitSha(expectedCommit);
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, MANIFEST), 'utf8'));
  assert.equal(manifest.schema, 1, 'Unsupported release manifest');
  assert.equal(manifest.app, 'cip-pro360', 'Wrong release application');
  assert.equal(manifest.commit_sha, expectedCommit, 'Release commit does not match this workflow');
  const names = Object.keys(manifest.files).sort();
  const expected = [...REQUIRED_FILES];
  if (requireLogo || names.includes(LOGO)) expected.push(LOGO);
  assert.deepEqual(names, expected.sort(), 'Release manifest has missing or unexpected files');
  assert.deepEqual(fs.readdirSync(directory).sort(), [...names, MANIFEST].sort(), 'Release directory has missing or unexpected files');
  for (const file of names) {
    const bytes = fs.readFileSync(path.join(directory, file));
    assert.equal(bytes.length, manifest.files[file].bytes, `Release size mismatch: ${file}`);
    assert.equal(digest(bytes), manifest.files[file].sha256, `Release SHA-256 mismatch: ${file}`);
    if (file === LOGO) checkOfficialLogo(bytes);
  }
  return manifest;
}

export function download(url) {
  assert.equal(url.protocol, 'https:', 'HTTPS is required');
  assert.equal(url.origin, TARGET, 'Only the CIP production origin is allowed');
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {'Cache-Control': 'no-cache, no-store', Pragma: 'no-cache'},
      rejectUnauthorized: true,
      signal: AbortSignal.timeout(20_000),
    }, response => {
      const chunks = [];
      let length = 0;
      response.on('data', chunk => {
        length += chunk.length;
        if (length > 10 * 1024 * 1024) request.destroy(new Error('CIP response exceeds 10 MiB'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('aborted', () => reject(new Error('CIP response was interrupted')));
      response.on('end', () => resolve({status: response.statusCode, bytes: Buffer.concat(chunks)}));
    });
    request.setTimeout(20_000, () => request.destroy(new Error('CIP HTTPS request timed out')));
    request.on('error', reject);
  });
}

export async function requireHttps200(url, request = download) {
  assert.equal(url.origin, TARGET, 'Only the CIP production origin is allowed');
  assert.equal(url.protocol, 'https:', 'HTTPS is required');
  const response = await request(url);
  assert.equal(response.status, 200, `Expected HTTP 200 at ${url.pathname}; redirects are rejected`);
  return response.bytes;
}

export async function preflight(request = download) {
  const response = await request(new URL('/?cip_preflight=1', TARGET));
  // A new, empty document root can return 403/404 until its first upload.
  assert.ok([200, 403, 404].includes(response.status), 'CIP HTTPS preflight expected 200, 403 or 404 without redirects');
}

export function verifyResponseBytes(remote, local, file) {
  assert.ok(Buffer.isBuffer(remote) && remote.equals(local), `Published bytes differ from the release: ${file}`);
}

export async function verifyPublishedFiles(directory, commit, request = download) {
  const manifest = validatePackage(directory, commit, true);
  for (const file of [...Object.keys(manifest.files), MANIFEST]) {
    // Apache configuration is not public. Its hash is recorded in the manifest.
    if (file === '.htaccess') continue;
    const url = new URL(file === 'index.html' ? '/' : `/${file}`, TARGET);
    url.searchParams.set('cip_release', commit);
    const remote = await requireHttps200(url, request);
    const local = fs.readFileSync(path.join(directory, file));
    verifyResponseBytes(remote, local, file);
    console.log(`Verified HTTP 200 and SHA-256: ${file}`);
  }
  console.log(`Verified CIP release ${commit}. Authenticated browser homologation is still required.`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'prepare') {
    const [source, output, commit = process.env.GITHUB_SHA] = args;
    const manifest = prepareRelease(source, output, commit);
    if (!manifest.files[LOGO]) console.log('::warning::Official logo is missing; production publish remains blocked.');
  } else if (command === 'validate') validatePackage(args[0], args[1] ?? process.env.GITHUB_SHA, true);
  else if (command === 'preflight') {
    await preflight();
    console.log('CIP HTTPS preflight passed. Confirm the exclusive document root separately in hPanel.');
  } else if (command === 'smoke') await verifyPublishedFiles(args[0], args[1] ?? process.env.GITHUB_SHA);
  else throw new Error('Usage: release-check.mjs prepare SOURCE OUTPUT COMMIT | validate RELEASE COMMIT | preflight | smoke RELEASE COMMIT');
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  main().catch(error => { console.error(`::error::${error.message}`); process.exitCode = 1; });
}
