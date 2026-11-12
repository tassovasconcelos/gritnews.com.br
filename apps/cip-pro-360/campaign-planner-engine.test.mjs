import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planCampaign } from './campaign-planner-engine.mjs';

const product = { sku: 'SKU-1', role: 'giro', cost: 60, price: 100, expense_pct: 10, baseline_units: 10, available_units: 30, minimum_margin_pct: 15 };
const base = { products: [product], campaign_type: 'giro', hypothesis: 'A combinação acelera o giro', campaign_days: 14, campaign_cost: 100, cannibalization_pct: 10, minimum_margin_pct: 15, scenarios: { conservador: 0, base: 20, otimista: 40 }, baseline_weeks: 8, pilot_stores: 'Loja 1', control_stores: 'Loja 2; Loja 3', source_snapshot_at: '2026-10-20T09:00:00-03:00', success_metric: 'Contribuição incremental positiva' };

test('computes basket scenarios, stock caps, cannibalization, ROI and break-even uplift', () => {
  const result = planCampaign(base);
  assert.equal(result.summary.best_practice_ready, true);
  assert.equal(result.campaign_type, 'giro');
  assert.equal(result.summary.break_even_uplift_pct, 43.33);
  assert.equal(result.scenarios[0].revenue, 1000);
  assert.equal(result.scenarios[0].net_incremental_contribution, -130);
  assert.equal(result.scenarios[1].units, 12);
  assert.equal(result.scenarios[1].net_incremental_contribution, -70);
  assert.equal(result.scenarios[1].roi_pct, -53.85);
  assert.equal(result.notice.includes('simulação'), true);
});

test('caps volume at stock and signals stockout risk without overstating the scenario', () => {
  const result = planCampaign({ ...base, products: [{ ...product, available_units: 11 }] });
  assert.equal(result.scenarios[2].products[0].volume, 11);
  assert.equal(result.scenarios[2].products[0].stock_limited, true);
  assert.equal(result.scenarios[2].stock_limited, true);
});

test('blocks a basket item below the required contribution floor and marks incomplete controls', () => {
  const result = planCampaign({ ...base, products: [{ ...product, price: 79 }], baseline_weeks: 2, pilot_stores: '', control_stores: '', source_snapshot_at: null, success_metric: '' });
  assert.equal(result.summary.blocked, true);
  assert.equal(result.summary.best_practice_ready, false);
  assert.ok(result.checks.some(check => check.status === 'bloqueio'));
});

test('validates input counts, role classification, and ordered assumptions', () => {
  assert.throws(() => planCampaign({ ...base, products: [] }), /Inclua/);
  assert.throws(() => planCampaign({ ...base, products: [{ ...product, role: 'outro' }] }), /Classifique/);
  assert.throws(() => planCampaign({ ...base, campaign_type: '' }), /Escolha o objetivo/);
  assert.throws(() => planCampaign({ ...base, scenarios: { conservador: 30, base: 20, otimista: 40 } }), /Ordene/);
});
