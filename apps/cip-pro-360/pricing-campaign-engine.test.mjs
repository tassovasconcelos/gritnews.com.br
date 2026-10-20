import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateSelloutCampaign } from './pricing-campaign-engine.mjs';

const base = {
  cost: 60, current_price: 110, expense_pct: 10, fixed_cost: 0,
  minimum_margin_pct: 15, target_margin_pct: 25, max_change_pct: 30,
  available_units: 100, target_units: 40, campaign_days: 14,
  monthly_carry_rate_pct: 1.5, supplier_funding_per_unit: 2,
  bonus_tiers: [{ minimum_units: 20, bonus_per_unit: 3 }, { minimum_units: 50, bonus_per_unit: 5 }],
  demand_history_complete: true
};

test('prices the per-store goal after net seller bonus and separates supplier funding', () => {
  const r = simulateSelloutCampaign(base, new Date('2026-10-20T12:00:00Z'));
  assert.equal(r.applied_bonus_tier.minimum_units, 20);
  assert.equal(r.gross_bonus_per_unit, 3);
  assert.equal(r.net_bonus_per_unit, 1);
  assert.equal(r.break_even_floor, 81.34);
  assert.equal(r.margin_target_price, 93.85);
  assert.equal(r.suggested_price, 93.85);
  assert.equal(r.company_bonus_cost_total, 40);
  assert.equal(r.supplier_funding_total, 80);
  assert.equal(r.target_units, 40);
  assert.equal(r.remaining_units, 60);
  assert.equal(r.gross_stock_cost_released_scenario, 2400);
  assert.equal(r.status, 'revisao_humana');
});

test('uses the highest reached bonus tier and warns when stock remains outside target', () => {
  const r = simulateSelloutCampaign({ ...base, target_units: 50, supplier_funding_per_unit: 0 });
  assert.equal(r.gross_bonus_per_unit, 5);
  assert.equal(r.company_bonus_cost_total, 250);
  assert.equal(r.remaining_units, 50);
  assert.ok(r.warnings.some(x => x.includes('ficam fora da meta')));
});

test('blocks targets above physical stock and prices below the margin floor within authority', () => {
  assert.throws(() => simulateSelloutCampaign({ ...base, target_units: 101 }), /excede o saldo/);
  const r = simulateSelloutCampaign({ ...base, current_price: 70, max_change_pct: 5, supplier_funding_per_unit: 0, bonus_tiers: [{ minimum_units: 1, bonus_per_unit: 10 }] });
  assert.equal(r.status, 'bloqueado');
  assert.ok(r.blockers.some(x => x.includes('abaixo do piso')));
});

test('competitor references require equivalent unit, dated source, and preserve optional physical evidence', () => {
  const valid = { ...base, reference_price: 82, reference_date: '2026-10-19', reference_source: 'Distribuidor A · cotação em unidade UN', reference_channel: 'distribuidor_fisico', reference_location: 'Fortaleza/CE', reference_contact_role: 'Gerente comercial', reference_evidence: 'Cotação 8812', equivalent: true };
  const r = simulateSelloutCampaign(valid, new Date('2026-10-20T12:00:00Z'));
  assert.equal(r.suggested_price, 82);
  assert.equal(r.reference.age_days, 1);
  assert.equal(r.reference.channel, 'distribuidor_fisico');
  assert.equal(r.reference.location, 'Fortaleza/CE');
  assert.equal(r.reference.contact_role, 'Gerente comercial');
  assert.equal(r.reference.evidence, 'Cotação 8812');
  const invalid = simulateSelloutCampaign({ ...valid, reference_date: '2026-10-01' }, new Date('2026-10-20T12:00:00Z'));
  assert.equal(invalid.status, 'bloqueado');
  assert.ok(invalid.blockers[0].includes('Concorrência exige'));
});

test('does not disguise a target as demand forecast or carrying cost as realized savings', () => {
  const r = simulateSelloutCampaign({ ...base, demand_history_complete: false });
  assert.ok(r.warnings.some(x => x.includes('não está validado')));
  assert.equal(r.carrying_cost_relief_scenario, 16.8);
  assert.equal(r.notice.includes('não representa perda contábil realizada'), true);
});
