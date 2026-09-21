import { createHash } from 'node:crypto';
import { prepareCompanyImport } from './company-import.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'operator']);
const MAX_BATCHES_PER_MINUTE = 12;

// Dependency-injected business logic. No global Supabase connection or server.
export function createCompanyImportService({ authenticate, membershipFor, existingCnpjs, applyAtomic, clock = Date.now }) {
  if (![authenticate, membershipFor, existingCnpjs, applyAtomic].every(x => typeof x === 'function')) {
    throw new Error('invalid_company_import_dependencies');
  }
  const windows = new Map();

  async function prepare(input, mode) {
    const { authorization, organizationId, csv } = input ?? {};
    if (!UUID.test(String(organizationId ?? ''))) throw Object.assign(new Error('invalid_organization_id'), { status: 400 });
    if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/i.test(authorization)) {
      throw Object.assign(new Error('authentication_required'), { status: 401 });
    }
    const token = authorization.replace(/^Bearer /i, '');
    const user = await authenticate(token);
    if (!user?.id || !UUID.test(user.id)) {
      throw Object.assign(new Error('invalid_session'), { status: 401 });
    }
    const membership = await membershipFor(organizationId, user.id);
    if (!membership?.active || !PRIVILEGED_ROLES.has(membership.role)) {
      throw Object.assign(new Error('access_denied'), { status: 403 });
    }

    const now = clock();
    const key = user.id + ':' + organizationId;
    const usage = windows.get(key);
    const next = !usage || now - usage.start >= 60_000 ? { start: now, calls: 1 }
      : { start: usage.start, calls: usage.calls + 1 };
    windows.set(key, next);
    if (next.calls > MAX_BATCHES_PER_MINUTE) {
      throw Object.assign(new Error('rate_limited'), { status: 429 });
    }
    if (windows.size > 1000) {
      for (const [id, v] of windows) if (now - v.start >= 60_000) windows.delete(id);
    }

    // Do not write or log the raw CSV. SHA-256 is calculated from the exact bytes.
    const parsed = prepareCompanyImport(csv);
    const hash = createHash('sha256').update(csv, 'utf8').digest('hex');
    const found = parsed.accepted.length
      ? await existingCnpjs(organizationId, parsed.accepted.map(x => x.tax_id))
      : [];
    const existing = new Set(found);
    const previewAccepted = parsed.accepted.filter(x => !existing.has(x.tax_id));
    const previewSkipped = [
      ...parsed.skipped,
      ...parsed.accepted.filter(x => existing.has(x.tax_id))
        .map(x => ({ line: x.source_line, reason: 'already_exists' }))
    ];

    if (mode === 'preview') {
      return {
        status: 'preview', file_sha256: hash, total_rows: parsed.total_rows,
        accepted_count: previewAccepted.length, skipped_count: previewSkipped.length,
        skipped: previewSkipped.map(({ line, reason }) => ({ line, reason }))
      };
    }
    if (mode !== 'apply') throw new Error('invalid_import_mode');

    // Existing rows are passed to the database deliberately: DB unique constraints
    // and a transaction resolve races between preview, other imports and apply.
    return await applyAtomic({
      p_organization_id: organizationId, p_actor_id: user.id, p_file_sha256: hash,
      p_total_rows: parsed.total_rows, p_accepted: parsed.accepted, p_skipped: parsed.skipped
    });
  }

  return {
    preview: input => prepare(input, 'preview'),
    apply: input => prepare(input, 'apply')
  };
}
