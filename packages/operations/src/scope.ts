export function resolveOperationScope<T extends { id: string }>(available: T[], requested: string | null): T | null {
  return requested ? available.find(item => item.id === requested) || null : available[0] || null;
}
