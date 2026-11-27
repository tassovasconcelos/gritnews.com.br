import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collect, run } from './collect-provider-costs.mjs';

const now = new Date('2026-11-27T17:13:00Z');
const scope = 'proj_shopping';
const row = (amount, project_id = scope) => ({ project_id, amount: { value: amount, currency: 'usd' } });
const page = (results, next_page = null) => Response.json({
  data: [{ results }], has_more: next_page !== null, next_page
});
const env = {
  CIP_FINOPS_TARGETS: JSON.stringify([{ company: 'shopping_prohospital', provider: 'openai', scope }]),
  OPENAI_FINOPS_ADMIN_KEY: 'test-provider-key',
  CIP_FINOPS_SUPABASE_URL: 'https://example.supabase.co',
  CIP_FINOPS_SERVICE_ROLE_KEY: 'test-database-key'
};

test('collects the scoped report across pages and persists a retry-safe observation', async () => {
  const writes = [];
  const fetcher = async (url, options) => {
    if (url.hostname === 'example.supabase.co') {
      assert.equal(options.headers.prefer, 'resolution=ignore-duplicates,return=minimal');
      assert.match(url.searchParams.get('on_conflict'), /company_id,provider/);
      writes.push(JSON.parse(options.body));
      return new Response(null, { status: 201 });
    }
    assert.equal(url.hostname, 'api.openai.com');
    assert.equal(url.searchParams.get('project_ids[]'), scope);
    assert.equal(url.searchParams.get('group_by[]'), 'project_id');
    assert.equal(options.redirect, 'error');
    return url.searchParams.has('page') ? page([row(1.015)]) : page([row(2.25)], 'next');
  };
  for (const date of [now, new Date('2026-11-27T17:55:00Z')]) {
    assert.equal((await run(env, fetcher, date))[0].status, 'collected');
  }
  assert.deepEqual(writes[0], writes[1]);
  assert.equal(writes[0].month_spend_usd, '3.2650');
  assert.equal(writes[0].period_month, '2026-11-01');
  assert.equal(writes[0].source, 'provider_api');
  assert.equal(writes[0].credit_balance_usd, undefined);
});

test('empty, throttled and out-of-scope reports never write a snapshot', async () => {
  const cases = [
    [() => page([]), 'report_unavailable'],
    [() => new Response('confidential provider response', { status: 429 }), 'collection_failed'],
    [() => page([row(99, 'proj_other')]), 'collection_failed']
  ];
  for (const [response, status] of cases) {
    const results = await run(env, async url => {
      assert.equal(url.hostname, 'api.openai.com');
      return response();
    }, now);
    assert.equal(results[0].status, status);
  }
});

test('duplicate assignment is rejected before network access', async () => {
  const targets = JSON.parse(env.CIP_FINOPS_TARGETS);
  targets.push({ ...targets[0], company: 'distribuidora_prohospital' });
  await assert.rejects(run({ ...env, CIP_FINOPS_TARGETS: JSON.stringify(targets) },
    () => assert.fail('no network request expected'), now), /invalid_targets/);
});

test('Claude converts cents to dollars and withholds reports with incomplete coverage', async () => {
  const report = async refreshed => collect({
    provider: 'anthropic', scope: 'wrkspc_example', key: 'test-key', now,
    fetcher: async (url, options) => {
      assert.equal(url.searchParams.get('workspace_ids[]'), 'wrkspc_example');
      assert.equal(options.headers['anthropic-beta'], 'analytics-usage-cost-2026-08-24');
      return Response.json({
        data_refreshed_at: refreshed, has_more: false,
        data: [{ group: { workspace_id: 'wrkspc_example' }, cost: { amount: '41280.000000', currency: 'USD' } }]
      });
    }
  });
  assert.equal((await report('2026-11-27T02:00:00Z')).month_spend_usd, '412.8000');
  assert.equal(await report('2026-11-26T23:00:00Z'), null);
});
