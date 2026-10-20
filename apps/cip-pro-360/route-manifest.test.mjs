import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_MANIFEST, allowedRoutesFor, canAccessRoute, resolveRoutePath, routeModuleOwners } from './route-manifest.mjs';

test('all current menu routes have an explicit unique page module', () => {
  const owners = routeModuleOwners();
  assert.equal(Object.keys(ROUTE_MANIFEST).length, 17);
  assert.ok([...owners.values()].every(routes => routes.length === 1));
  for (const route of Object.keys(ROUTE_MANIFEST)) assert.equal(new Set(ROUTE_MANIFEST[route].modules).size, ROUTE_MANIFEST[route].modules.length);
  const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.html'), 'utf8');
  const menuRoutes = [...new Set([...html.matchAll(/data-route="([^"]+)"/g)].map(match => match[1]))].sort();
  assert.deepEqual(menuRoutes, Object.keys(ROUTE_MANIFEST).sort());
  assert.match(html, /window\.cipRouteTitle\?\.\(page\)/);
});

test('route permissions preserve company and role boundaries', () => {
  assert.ok(canAccessRoute('estoque', { role: 'gestor', companies: ['shopping_prohospital'] }));
  assert.ok(canAccessRoute('estoque', { role: 'gestor', companies: ['distribuidora_prohospital'] }));
  assert.ok(canAccessRoute('estoque', { role: 'gestor', companies: ['distribuidora_prohospital'] }));
  assert.ok(canAccessRoute('precos', { role: 'precificacao', companies: ['distribuidora_prohospital'] }));
  assert.ok(canAccessRoute('caderninho', { role: 'vendedor', companies: ['shopping_prohospital'] }));
  assert.ok(canAccessRoute('caderninho', { role: 'comercial', companies: ['distribuidora_prohospital'] }));
  assert.ok(canAccessRoute('caderninho', { role: 'diretoria', companies: ['shopping_prohospital', 'distribuidora_prohospital'] }));
  assert.ok(!canAccessRoute('caderninho', { role: 'vendedor', companies: [] }));
  assert.ok(!canAccessRoute('integracoes', { role: 'diretoria', companies: ['shopping_prohospital'] }));
  assert.ok(canAccessRoute('procfit', { role: 'diretoria', companies: [] }));
  assert.deepEqual(allowedRoutesFor({ role: 'superadm', companies: [] }).includes('integracoes'), true);
});

test('deep links resolve to an authorized route target and retain SKU path segments', () => {
  assert.deepEqual(resolveRoutePath('#/estoque/sku/XYZ?loja=07'), { route: 'estoque', segments: ['sku', 'XYZ'], params: { loja: '07' } });
  assert.deepEqual(resolveRoutePath('#/precos/acao/MP-17'), { route: 'precos', segments: ['acao', 'MP-17'], params: {} });
  assert.deepEqual(resolveRoutePath('#/central?filtro=alto-custo'), { route: 'estoque', segments: [], params: { filtro: 'alto-custo' } });
  assert.deepEqual(resolveRoutePath('#/rota-inexistente'), { route: 'inicio', segments: [], params: {} });
});

test('mock route navigation loads only the owning module set', () => {
  const calls = [];
  const mockMount = route => ROUTE_MANIFEST[route].modules.forEach(module => calls.push({ route, module }));
  for (const route of Object.keys(ROUTE_MANIFEST)) mockMount(route);
  assert.equal(calls.length, Object.values(ROUTE_MANIFEST).reduce((total, route) => total + route.modules.length, 0));
  assert.equal(calls.filter(call => call.module === 'stock-actions').length, 1);
  assert.equal(calls.filter(call => call.module === 'shopping-position').length, 1);
  assert.equal(calls.filter(call => call.module === 'stock-reference').length, 1);
  assert.equal(calls.filter(call => call.module === 'pricing').length, 1);
});

test('only the stock route mounts the shared stock modules', () => {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const auth = fs.readFileSync(path.join(root, 'cip-auth.js'), 'utf8');
  const pricing = fs.readFileSync(path.join(root, 'pricing-ui.mjs'), 'utf8');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(auth, /routeHasModule\(page,'stock-actions'\)\)mountStockActions/);
  assert.match(auth, /routeHasModule\(page,'shopping-position'\)&&companies\.has\(V\)\)mountShoppingPosition/);
  assert.match(auth, /routeHasModule\(page,'stock-reference'\)&&companies\.has\(V\)\)mountStockReference/);
  assert.match(auth, /\.eq\("company_id",companyId\)/);
  assert.match(auth, /insert\(\{company_id:companyId,created_by:user\.id/);
  assert.match(index, /Caderninho Inteligente','Foco principal no varejo; também registra demandas não atendidas da Distribuidora/);
  assert.match(index, /demandCompany.*shopping_prohospital.*distribuidora_prohospital/);
  assert.doesNotMatch(pricing, /stock-actions-ui|shopping-position\.mjs|mountStockActions|mountShoppingPosition|stockActionsFrame|shoppingPositionFrame/);
  for (const route of ['varejo', 'b2b', 'doquita']) {
    const branch = index.match(new RegExp(`else if\\(page==='${route}'\\)\\{([\\s\\S]*?)(?=else if\\(|\\n document\\.getElementById)`))?.[1] || '';
    assert.doesNotMatch(branch, /cipRenderStock|cipRenderStockActions/);
  }
});
