const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validCustomerSlug(value: string) {
  return value.length >= 2 && value.length <= 80 && slugPattern.test(value);
}

/** null means generic entry; malformed named entries must never select a default company. */
export function customerRoute(path: string): { slug: string | null; invalid: boolean } {
  if (path === '/app' || path === '/app/') return { slug: null, invalid: false };
  if (!path.startsWith('/app/')) return { slug: null, invalid: false };
  const slug = path.slice(5).replace(/\/$/, '');
  return validCustomerSlug(slug) ? { slug, invalid: false } : { slug: null, invalid: true };
}

/** A standalone installation remembers its chosen company; authorization still happens on the server. */
export function installedCustomerPath(path: string, installed: boolean, remembered: string | null) {
  return installed && (path === '/app' || path === '/app/') && remembered && validCustomerSlug(remembered)
    ? `/app/${remembered}` : path;
}

export function currentCustomerPath() {
  const query = new URLSearchParams(location.search);
  if (['operation_scope','organization','support_org','support_tenant'].some(key => query.has(key))) return location.pathname;
  let remembered: string | null = null;
  try { remembered = localStorage.getItem('operation-customer'); } catch { /* Storage can be disabled. */ }
  const installed = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installedCustomerPath(location.pathname, installed, remembered);
}

export function rememberCustomer(slug: string | null) {
  if (!slug || !validCustomerSlug(slug)) return;
  try { localStorage.setItem('operation-customer', slug); } catch { /* The direct address remains usable. */ }
}

export function operationLinks(origin: string, scopeId: string, slug?: string | null) {
  const named = Boolean(slug && validCustomerSlug(slug));
  const access = new URL(named ? `/app/${slug}` : '/app', origin);
  if (!named) access.searchParams.set('operation_scope', scopeId);
  const install = new URL('/instalar', origin);
  if (named) install.searchParams.set('cliente', slug!);
  else install.searchParams.set('operation_scope', scopeId);
  return { access: access.href, install: install.href };
}
