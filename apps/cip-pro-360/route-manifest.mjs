export const ROUTE_MANIFEST = Object.freeze({
  inicio: { title: 'Visão geral', modules: ['executive-overview'] },
  cronograma: { title: 'Cronograma', modules: ['implementation-schedule'] },
  doquita: { title: 'Doquita', modules: ['doquita-briefing'] },
  varejo: { title: 'Shopping Prohospital', companies: ['shopping_prohospital'], modules: ['retail-summary'] },
  estoque: { title: 'Estoque Inteligente', anyCompanies: ['shopping_prohospital', 'distribuidora_prohospital'], modules: ['stock-actions', 'shopping-position', 'stock-reference', 'stock-simulator'] },
  precos: { title: 'Marca-passo de Preços', anyCompanies: ['shopping_prohospital', 'distribuidora_prohospital'], modules: ['pricing'] },
  b2b: { title: 'Distribuidora Prohospital', companies: ['distribuidora_prohospital'], modules: ['b2b-summary'] },
  cotacoes: { title: 'Cotações e Conversão', companies: ['distribuidora_prohospital'], modules: ['quotes'] },
  caderninho: { title: 'Caderninho Inteligente', anyCompanies: ['shopping_prohospital', 'distribuidora_prohospital'], modules: ['demand-notebook'] },
  quartel: { title: 'Quartel dos Agentes', modules: ['agent-operations'] },
  escola: { title: 'Escola dos Agentes', modules: ['agent-academy'] },
  processos: { title: 'Processos vivos', modules: ['process-builder'] },
  mensageiro: { title: 'Doquita no Telegram', modules: ['telegram-console'] },
  'radar-b2g': { title: 'Radar B2G · Íris', companies: ['distribuidora_prohospital'], modules: ['b2g-radar'] },
  procfit: { title: 'Procfit & relatórios', roles: ['superadm', 'diretoria'], modules: ['procfit-reports', 'procfit-reference-importer'] },
  integracoes: { title: 'Integrações e Acessos', roles: ['superadm'], modules: ['integrations-admin'] },
  apresentacao: { title: 'CIP 360 para a diretoria', roles: ['superadm', 'diretoria'], modules: ['executive-presentation'] }
});

export const ROUTE_ALIASES = Object.freeze({ central: 'estoque' });

export function canAccessRoute(route, { role, companies = [] } = {}) {
  const definition = ROUTE_MANIFEST[route];
  if (!definition || !role) return false;
  if (definition.roles && !definition.roles.includes(role)) return false;
  const memberships = new Set(companies);
  if (definition.companies && !definition.companies.every(company => memberships.has(company))) return false;
  if (definition.anyCompanies && !definition.anyCompanies.some(company => memberships.has(company))) return false;
  return true;
}

export function allowedRoutesFor({ role, companies = [] } = {}) {
  return Object.keys(ROUTE_MANIFEST).filter(route => canAccessRoute(route, { role, companies }));
}

export function resolveRoutePath(pathname = '') {
  const raw = String(pathname).replace(/^#/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  const routePath = pathPart.replace(/^\/+|\/+$/g, '');
  const [candidate, ...segments] = routePath.split('/').filter(Boolean);
  const route = ROUTE_ALIASES[candidate] || candidate;
  return { route: ROUTE_MANIFEST[route] ? route : 'inicio', segments, params: Object.fromEntries(new URLSearchParams(queryPart)) };
}

export function routeModuleOwners() {
  const owners = new Map();
  for (const [route, definition] of Object.entries(ROUTE_MANIFEST)) {
    for (const module of definition.modules) {
      if (!owners.has(module)) owners.set(module, []);
      owners.get(module).push(route);
    }
  }
  return owners;
}
