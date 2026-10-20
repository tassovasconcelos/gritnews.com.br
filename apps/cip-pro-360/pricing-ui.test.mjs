import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pricingFrame, recommendCampaignDecision } from './pricing-ui.mjs';

test('puts live opportunities and campaign decisions before detailed mobile tools', () => {
  const frame = pricingFrame();
  assert.ok(frame.indexOf('Oportunidades para decidir') < frame.indexOf('Simular campanha por loja'));
  assert.ok(frame.indexOf('Planejar campanha em cesta') < frame.indexOf('Simular campanha por loja'));
  assert.match(frame, /Lojas do piloto/);
  assert.match(frame, /Lojas de controle/);
  assert.match(frame, /Premissa conservadora/);
  assert.ok(frame.indexOf('Simular campanha por loja') < frame.indexOf('Simulador detalhado de preço e contribuição'));
  assert.match(frame, /Concorrência e evidências \(opcional\)/);
  assert.match(frame, /RESULTADOS SIMULADOS/);
});

test('recommends approval only when the floor is met and simulated contribution is preserved', () => {
  const result = recommendCampaignDecision({ candidate_margin_pct: 22, contribution_delta: 0.01, blockers: [] }, 18);
  assert.equal(result.label, 'APROVAR');
  assert.match(result.reason, /Piso atendido/);
});

test('recommends rejection for a blocker or margin below the approved floor', () => {
  assert.equal(recommendCampaignDecision({ candidate_margin_pct: 22, contribution_delta: 100, blockers: ['price below floor'] }, 18).label, 'REPROVAR');
  assert.equal(recommendCampaignDecision({ candidate_margin_pct: 17.99, contribution_delta: 100, blockers: [] }, 18).label, 'REPROVAR');
});

test('asks for review when the scenario reduces contribution or comparative values are missing', () => {
  assert.equal(recommendCampaignDecision({ candidate_margin_pct: 22, contribution_delta: -0.01, blockers: [] }, 18).label, 'REVISAR');
  assert.equal(recommendCampaignDecision({ candidate_margin_pct: 22, blockers: [] }, 18).label, 'REVISAR');
  assert.equal(recommendCampaignDecision({ candidate_margin_pct: null, contribution_delta: 1, blockers: [] }, 0).label, 'REPROVAR');
});

test('does not recommend approval when the store demand history is not reconciled', () => {
  const result = recommendCampaignDecision({ candidate_margin_pct: 22, contribution_delta: 10, blockers: [] }, 18, { demandHistoryComplete: false });
  assert.equal(result.label, 'REVISAR');
  assert.match(result.reason, /histórico de vendas/);
});
