import {test} from 'node:test';
import assert from 'node:assert/strict';
import {consumptionFrame} from './ops-consumption-ui.mjs';

test('organization-wide costs have a separate panel, initially hidden',()=>{
 const html=consumptionFrame();
 assert.match(html,/<section class="ops-org" data-ops-org hidden>/);
 assert.match(html,/Nunca são duplicados entre Shopping e Distribuidora/);
 assert.match(html,/data-ops-org-cards/);
 assert.match(html,/data-ops-services/);
 assert.match(html,/data-ops-alerts/);
});
test('the presentation never asks for administrative keys or displays fake credit amounts',()=>{
 const html=consumptionFrame();
 assert.doesNotMatch(html,/CIP_OPENAI_ADMIN_KEY|CIP_BILLING_SYNC_SECRET|api_key\s*=/);
 assert.doesNotMatch(html,/Créditos: \\\$0/);
 assert.match(html,/A tela reconsulta os registros/);
});
