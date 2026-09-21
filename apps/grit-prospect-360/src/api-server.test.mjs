import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, createConfiguredApi } from './api-server.mjs';

const ORG = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CSV = 'cnpj,razao social\n11.222.333/0001-81,Empresa Exemplo\n';
function fakeSupabase(calls) {
  return {
    auth: { getUser: async token => ({ data: { user: token === 'valid-token'
      ? { id: '11111111-1111-4111-8111-111111111111' } : null }, error: null }) },
    from(name) {
      const where = {};
      return {
        select() { return this; },
        eq(key, value) { where[key] = value; return this; },
        async maybeSingle() {
          assert.equal(name, 'memberships');
          return { data: where.organization_id === ORG ? { role: 'operator', active: true } : null, error: null };
        },
        async in(key, values) {
          assert.equal(name, 'companies'); assert.equal(key, 'tax_id');
          calls.push({ operation: 'lookup', values, organization_id: where.organization_id });
          return { data: [], error: null };
        }
      };
    },
    async rpc(name, params) {
      calls.push({ operation: 'apply', name, params });
      return { data: { status: 'applied', batch_id: 'test-batch', applied_count: 1 }, error: null };
    }
  };
}

async function withServer(callback) {
  const calls = [];
  const api = createApi({ supabase: fakeSupabase(calls), allowedOrigin: 'https://prospect.example.invalid' });
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  try {
    const address = api.address();
    await callback('http://127.0.0.1:' + address.port, calls);
  } finally {
    await new Promise((resolve, reject) => api.close(error => error ? reject(error) : resolve()));
  }
}

test('HTTP process health does not pretend database verification', async () => {
  await withServer(async url => {
    const response = await fetch(url + '/health');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).database_verified, false);
  });
});

test('HTTP rejects unauthenticated writes and unknown routes', async () => {
  await withServer(async (url, calls) => {
    const response = await fetch(url + '/api/v1/company-imports/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: ORG, csv: CSV })
    });
    assert.equal(response.status, 401);
    assert.equal(calls.length, 0);
    assert.equal((await fetch(url + '/unknown')).status, 404);
  });
});

test('HTTP supports preview and transactional apply with verified identity', async () => {
  await withServer(async (url, calls) => {
    const options = {
      method: 'POST', headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
        Origin: 'https://prospect.example.invalid'
      }, body: JSON.stringify({ organization_id: ORG, csv: CSV })
    };
    const preview = await fetch(url + '/api/v1/company-imports/preview', options);
    assert.equal(preview.status, 200);
    assert.equal((await preview.json()).accepted_count, 1);
    const apply = await fetch(url + '/api/v1/company-imports/apply', options);
    assert.equal(apply.status, 200);
    assert.equal((await apply.json()).status, 'applied');
    assert.equal(calls.filter(x => x.operation === 'apply').length, 1);
    assert.equal(calls.find(x => x.operation === 'apply').params.p_organization_id, ORG);
  });
});

test('HTTP blocks unapproved origin and wrong-tenant access', async () => {
  await withServer(async (url, calls) => {
    const request = (org, origin) => fetch(url + '/api/v1/company-imports/apply', {
      method: 'POST', headers: { 'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token', Origin: origin },
      body: JSON.stringify({ organization_id: org, csv: CSV })
    });
    assert.equal((await request(ORG, 'https://unapproved.invalid')).status, 403);
    assert.equal((await request('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'https://prospect.example.invalid')).status, 403);
    assert.equal(calls.length, 0);
  });
});

test('configured runtime rejects shared GRIT Supabase URL before secrets/network are used', async () => {
  await assert.rejects(
    createConfiguredApi({
      PROSPECT_SUPABASE_URL: 'https://pcrwtoddavpvkaxwtstc.supabase.co',
      PROSPECT_SUPABASE_SERVICE_ROLE_KEY: 'fake-secret-with-adequate-length'
    }), /dedicated_supabase_environment_required/
  );
});
