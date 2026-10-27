import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const dir = new URL('./', import.meta.url);
const read = name => fs.readFileSync(new URL(name, dir), 'utf8');
const htaccess = read('.htaccess');
const csp = (htaccess.match(/Content-Security-Policy "([^"]+)"/) || [])[1] || '';
const directive = name => (csp.split(';').map(s => s.trim()).find(s => s.startsWith(name + ' ')) || '').split(/\s+/).slice(1);

test('CSP is set with restrictive defaults', () => {
  assert.ok(csp, 'Content-Security-Policy header missing from .htaccess');
  assert.deepEqual(directive('default-src'), ["'self'"]);
  assert.deepEqual(directive('object-src'), ["'none'"]);
  assert.deepEqual(directive('frame-ancestors'), ["'none'"]);
  assert.deepEqual(directive('base-uri'), ["'self'"]);
  assert.deepEqual(directive('form-action'), ["'self'"]);
  assert.ok(csp.includes('upgrade-insecure-requests'));
});

test('scripts load only from the CIP origin', () => {
  assert.deepEqual(directive('script-src').filter(s => !["'self'", "'unsafe-inline'"].includes(s)), []);
  for (const name of fs.readdirSync(dir).filter(n => /\.(m?js|html)$/.test(n) && !n.endsWith('.test.mjs') && !n.startsWith('supabase-js-'))) {
    const source = read(name);
    assert.doesNotMatch(source, /(import\s[^;]*from\s*|import\(\s*|<script[^>]+src=)["']https?:/, `${name} loads code from an external origin`);
  }
});

test('connect-src covers the Supabase project used by the app', () => {
  const urls = new Set();
  for (const name of ['cip-auth.js', 'grit-recovery.js']) for (const m of read(name).matchAll(/https:\/\/[a-z0-9]+\.supabase\.co/g)) urls.add(m[0]);
  assert.ok(urls.size >= 1, 'Supabase URL not found in client code');
  for (const url of urls) {
    assert.ok(directive('connect-src').includes(url), `connect-src missing ${url}`);
    assert.ok(directive('connect-src').includes(url.replace('https://', 'wss://')), `connect-src missing realtime for ${url}`);
  }
});

test('vendored supabase-js matches the pinned bundle', () => {
  const bytes = fs.readFileSync(new URL('supabase-js-2.57.0.mjs', dir));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), '7f440cd50492ef25968229e5fa23ba3b501e4affa7384a75dc3a549f10a39859');
  assert.match(bytes.toString('utf8'), /export\s*\{[^}]*createClient/);
});

test('no leftover Vercel configuration', () => {
  assert.equal(fs.existsSync(new URL('vercel.json', dir)), false);
});

test('credential links never send referrers and sensitive pages forbid inline scripts and caching',()=>{
 assert.match(htaccess,/Referrer-Policy "no-referrer"/);
 const sensitive=htaccess.match(/<FilesMatch "\^\(ativar\|recuperar\)[\s\S]*?<\/FilesMatch>/)?.[0];
 assert.ok(sensitive);assert.match(sensitive,/Cache-Control "no-store"/);
 assert.match(sensitive,/script-src 'self';/);assert.match(sensitive,/base-uri 'none'/);
 for(const page of ['ativar.html','recuperar.html'])assert.doesNotMatch(read(page),/<script(?![^>]*src=)[^>]*>|\son[a-z]+=/i);
});
