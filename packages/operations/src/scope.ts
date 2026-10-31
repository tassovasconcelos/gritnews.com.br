import { customerRoute } from './customerRoute.ts';
export function resolveOperationScope<T extends { id: string }>(available: T[], requested: string | null): T | null {
  return requested ? available.find(item => item.id === requested) || null : available[0] || null;
}
export function preserveOperationSession(query: string, installed: boolean, path = '/app') {
  const params = new URLSearchParams(query);
  return customerRoute(path).slug !== null || installed || params.has('support_tenant') || params.get('reset') === '1'
    || params.has('mode') || params.has('convite') || params.has('operation_scope');
}
