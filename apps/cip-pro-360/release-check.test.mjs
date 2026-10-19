import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {checkOfficialLogo, download, preflight, prepareRelease, requireHttps200, TARGET, validatePackage, verifyResponseBytes} from './release-check.mjs';

const COMMIT = '56a0b7dca94b2616bd8f6fe112fa516ffc9bd253';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cip-release-test-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const source = path.join(root, 'source'), output = path.join(root, 'release');
  fs.mkdirSync(source);
  for (const name of ['index.html', 'cip-auth.js', 'presentation.mjs', 'presentation.css', 'supabase-js-2.57.0.mjs', 'doquita-insights.mjs', 'erp-ui.mjs', 'stock-reference.mjs', 'procfit-status-ui.mjs', 'procfit-catalog-ui.mjs', 'erp-engine.mjs', 'pricing-ui.mjs', 'pricing-engine.mjs', 'pricing-intelligence.mjs', 'shopping-position.mjs', 'stock-action-engine.mjs', 'stock-actions-ui.mjs', 'agent-capabilities.mjs', 'process-engine.mjs', 'process-consultant.mjs', 'process-ui.mjs', 'bot-ui.mjs', 'agents-data.mjs', 'agents-ui.mjs', 'academy-ui.mjs', 'admin-ui.mjs', 'ativar.html', 'cip-activation.js', 'academy-engine.mjs', 'agents.css', 'b2g-radar.mjs', 'b2g-research.mjs', 'b2g-research-ui.mjs', 'b2g-catalog.json', 'b2g-snapshot.json', 'recuperar.html', 'grit-recovery.js', '.htaccess', 'robots.txt', 'health.json']) fs.writeFileSync(path.join(source, name), `fixture:${name}\n`);
  return {source, output};
}

test('creates deterministic manifest with commit, byte sizes and hashes', t => {
  const {source, output} = fixture(t);
  const manifest = prepareRelease(source, output, COMMIT);
  assert.equal(manifest.commit_sha, COMMIT);
  assert.equal(Object.keys(manifest.files).length, 40);
  assert.match(manifest.files['index.html'].sha256, /^[a-f0-9]{64}$/);
  assert.equal(validatePackage(output, COMMIT, false).commit_sha, COMMIT);
});

test('production validation rejects missing original logo', t => {
  const {source, output} = fixture(t);
  prepareRelease(source, output, COMMIT);
  assert.throws(() => validatePackage(output, COMMIT), /missing or unexpected files/);
});

test('rejects any substituted logo despite JPEG-like bytes', t => {
  const {source, output} = fixture(t);
  const wrongLogo = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(30000)]);
  fs.writeFileSync(path.join(source, 'logo-grupo-prohospital.jpg'), wrongLogo);
  assert.throws(() => checkOfficialLogo(wrongLogo), /SHA-256 mismatch/);
  assert.throws(() => prepareRelease(source, output, COMMIT), /SHA-256 mismatch/);
});

test('rejects invalid or mismatched commit', t => {
  const {source, output} = fixture(t);
  assert.throws(() => prepareRelease(source, output, 'main'), /complete Git commit SHA/);
  prepareRelease(source, output, COMMIT);
  assert.throws(() => validatePackage(output, '0'.repeat(40), false), /does not match/);
});

test('rejects changed bytes even when file size stays the same', t => {
  const {source, output} = fixture(t);
  prepareRelease(source, output, COMMIT);
  const file = path.join(output, 'index.html');
  const bytes = fs.readFileSync(file);
  bytes[0] ^= 1;
  fs.writeFileSync(file, bytes);
  assert.throws(() => validatePackage(output, COMMIT, false), /SHA-256 mismatch/);
});

test('rejects unexpected release files', t => {
  const {source, output} = fixture(t);
  prepareRelease(source, output, COMMIT);
  fs.writeFileSync(path.join(output, '.env'), 'fixture only');
  assert.throws(() => validatePackage(output, COMMIT, false), /missing or unexpected files/);
});

test('preflight allows empty first-deploy target 403/404 and successful 200', async () => {
  for (const status of [200, 403, 404]) await preflight(async url => {
    assert.equal(url.origin, TARGET);
    assert.equal(url.protocol, 'https:');
    return {status, bytes: Buffer.alloc(0)};
  });
});

test('preflight rejects redirects, server failures and certificate failures', async () => {
  for (const status of [301, 302, 500]) await assert.rejects(preflight(async () => ({status, bytes: Buffer.alloc(0)})), /without redirects/);
  await assert.rejects(preflight(async () => { throw new Error('certificate mismatch'); }), /certificate mismatch/);
});

test('published resources must return exactly HTTP 200', async () => {
  for (const status of [201, 301, 403, 404, 500]) await assert.rejects(requireHttps200(new URL('/', TARGET), async () => ({status, bytes: Buffer.alloc(0)})), /Expected HTTP 200/);
  assert.deepEqual(await requireHttps200(new URL('/', TARGET), async () => ({status: 200, bytes: Buffer.from('ok')})), Buffer.from('ok'));
});

test('rejects HTTP and foreign origin before making a network request', async () => {
  const noNetwork = () => assert.fail('Network request must not run');
  await assert.rejects(requireHttps200(new URL('http://cip.gritnews.com.br/'), noNetwork), /production origin|HTTPS/);
  await assert.rejects(requireHttps200(new URL('https://gritnews.com.br/'), noNetwork), /production origin/);
  assert.throws(() => download(new URL('http://cip.gritnews.com.br/')), /HTTPS/);
  assert.throws(() => download(new URL('https://gritnews.com.br/')), /production origin/);
});

test('published-byte comparison rejects stale, truncated or modified content', () => {
  const local = Buffer.from('current release');
  verifyResponseBytes(Buffer.from(local), local, 'index.html');
  for (const remote of [Buffer.from('previous release'), Buffer.from('current'), Buffer.from('Current release')]) assert.throws(() => verifyResponseBytes(remote, local, 'index.html'), /Published bytes differ/);
});
