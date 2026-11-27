import { pathToFileURL } from 'node:url';

const providers = {
  openai: {
    host: 'https://api.openai.com/v1/organization/costs',
    scope: /^proj_[a-zA-Z0-9_-]+$/,
    query: (start, end, scope) => ({
      start_time: start.getTime() / 1000, end_time: end.getTime() / 1000,
      'project_ids[]': scope, 'group_by[]': 'project_id', limit: 31
    }),
    headers: key => ({ authorization: 'Bearer ' + key }),
    rows: page => page.data.flatMap(bucket => {
      if (!Array.isArray(bucket.results)) throw new Error('invalid_bucket');
      return bucket.results;
    }),
    read: row => [row.project_id, row.amount?.value, row.amount?.currency],
    label: 'OpenAI Costs · projeto'
  },
  anthropic: {
    host: 'https://api.anthropic.com/v1/organizations/analytics/cost',
    scope: /^wrkspc_[a-zA-Z0-9_-]+$/,
    query: (start, end, scope) => ({
      starting_at: start.toISOString(), ending_at: end.toISOString(),
      'workspace_ids[]': scope, 'group_by[]': 'workspace_id'
    }),
    headers: key => ({
      'x-api-key': key, 'anthropic-version': '2023-06-01',
      'anthropic-beta': 'analytics-usage-cost-2026-08-24'
    }),
    rows: page => page.data,
    read: row => [
      row.group?.workspace_id,
      typeof row.cost?.amount === 'string' && /^-?\d+(\.\d+)?$/.test(row.cost.amount)
        ? Number(row.cost.amount) / 100 : null,
      row.cost?.currency
    ],
    label: 'Claude Cost Analytics · workspace'
  }
};

export async function collect({ provider, scope, key, now = new Date(), fetcher = fetch }) {
  const config = Object.hasOwn(providers, provider) && providers[provider];
  if (!config || typeof scope !== 'string' || !config.scope.test(scope) || !key) {
    throw new Error('invalid_configuration');
  }
  const end = new Date(Math.floor(now.getTime() / 86400000) * 86400000);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  if (start.getTime() === end.getTime()) return null;
  const url = new URL(config.host);
  for (const [name, value] of Object.entries(config.query(start, end, scope))) {
    url.searchParams.set(name, value);
  }
  const cursors = new Set();
  let count = 0;
  let total = 0;
  for (;;) {
    const response = await fetcher(url, {
      headers: config.headers(key), redirect: 'error', signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('provider_http_' + response.status);
    const page = await response.json();
    if (!Array.isArray(page.data) || typeof page.has_more !== 'boolean') {
      throw new Error('invalid_report');
    }
    if (provider === 'anthropic' && !(Date.parse(page.data_refreshed_at) >= end.getTime())) {
      return null;
    }
    for (const row of config.rows(page)) {
      const [rowScope, amount, currency] = config.read(row);
      if (rowScope !== scope || String(currency).toUpperCase() !== 'USD' || !Number.isFinite(amount)) {
        throw new Error('invalid_cost_attribution');
      }
      total += amount;
      count++;
    }
    if (!page.has_more) break;
    if (typeof page.next_page !== 'string' || !page.next_page ||
        cursors.has(page.next_page) || cursors.size >= 99) {
      throw new Error('invalid_pagination');
    }
    cursors.add(page.next_page);
    url.searchParams.set('page', page.next_page);
  }
  if (!Number.isFinite(total) || total < 0 || total >= 1e12) throw new Error('unrepresentable_total');
  if (!count) return null;
  const through = new Date(end.getTime() - 86400000).toISOString().slice(0, 10);
  return {
    period_month: start.toISOString().slice(0, 10),
    month_spend_usd: total.toFixed(4),
    reference_label: config.label + ' · UTC até ' + through
  };
}

export async function run(env, fetcher = fetch, now = new Date()) {
  const targets = JSON.parse(env.CIP_FINOPS_TARGETS || '[]');
  if (!Array.isArray(targets) || !targets.length || targets.length > 4) {
    throw new Error('invalid_targets');
  }
  const keys = { openai: env.OPENAI_FINOPS_ADMIN_KEY, anthropic: env.ANTHROPIC_FINOPS_ADMIN_KEY };
  const pairs = new Set();
  const scopes = new Set();
  for (const { company, provider, scope } of targets) {
    const pair = company + ':' + provider;
    const scopeKey = provider + ':' + scope;
    if (!['shopping_prohospital', 'distribuidora_prohospital'].includes(company) ||
        !Object.hasOwn(providers, provider) || !keys[provider] ||
        typeof scope !== 'string' || !providers[provider].scope.test(scope) ||
        pairs.has(pair) || scopes.has(scopeKey)) {
      throw new Error('invalid_targets');
    }
    pairs.add(pair);
    scopes.add(scopeKey);
  }
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(env.CIP_FINOPS_SUPABASE_URL || '') ||
      !env.CIP_FINOPS_SERVICE_ROLE_KEY) throw new Error('invalid_database_configuration');
  const endpoint = new URL('/rest/v1/cip_ops_billing_snapshots', env.CIP_FINOPS_SUPABASE_URL);
  endpoint.searchParams.set('on_conflict', 'company_id,provider,source,observed_at,period_month');
  const observed = new Date(Math.floor(now.getTime() / 3600000) * 3600000).toISOString();
  const results = [];
  for (const { company, provider, scope } of targets) {
    try {
      const report = await collect({ provider, scope, key: keys[provider], now, fetcher });
      if (!report) {
        results.push({ company, provider, status: 'report_unavailable' });
        continue;
      }
      const response = await fetcher(endpoint, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: {
          apikey: env.CIP_FINOPS_SERVICE_ROLE_KEY,
          authorization: 'Bearer ' + env.CIP_FINOPS_SERVICE_ROLE_KEY,
          'content-type': 'application/json',
          prefer: 'resolution=ignore-duplicates,return=minimal'
        },
        body: JSON.stringify({
          ...report, company_id: company, provider, observed_at: observed,
          currency: 'USD', source: 'provider_api'
        })
      });
      results.push({ company, provider, status: response.ok ? 'collected' : 'write_failed' });
    } catch {
      results.push({ company, provider, status: 'collection_failed' });
    }
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const results = await run(process.env);
    console.log(JSON.stringify(results));
    if (results.some(row => row.status.endsWith('_failed'))) process.exitCode = 1;
  } catch {
    console.error('Configuração do coletor FinOps inválida.');
    process.exitCode = 1;
  }
}
