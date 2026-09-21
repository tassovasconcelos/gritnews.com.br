import test from 'node:test';
import assert from 'node:assert/strict';
import { createCompanyImportService } from './company-service.mjs';

const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER = '11111111-1111-4111-8111-111111111111';
const CSV = 'cnpj,razao social,cidade,uf\n11.222.333/0001-81,Empresa Teste,Fortaleza,CE\n';

function setup({ role = 'operator', memberOrg = A, dbExisting = [], userId = USER } = {}) {
  const calls = [];
  const service = createCompanyImportService({
    authenticate: async token => token === 'valid-token' ? { id: userId } : null,
    membershipFor: async (organizationId, id) =>
      organizationId === memberOrg && id === userId ? { role, active: true } : null,
    existingCnpjs: async (organizationId, cnpjs) => {
      assert.equal(organizationId, memberOrg);
      return dbExisting.filter(id => cnpjs.includes(id));
    },
    applyAtomic: async params => {
      calls.push(params);
      return { status: 'applied', batch_id: 'batch', total_rows: params.p_total_rows };
    },
    clock: () => 1000
  });
  return { service, calls };
}

test('preview: authenticated operator sees valid count and stable hash, no persistence', async () => {
  const { service, calls } = setup();
  const res = await service.preview({ authorization: 'Bearer valid-token', organizationId: A, csv: CSV });
  assert.equal(res.status, 'preview');
  assert.match(res.file_sha256, /^[a-f0-9]{64}$/);
  assert.equal(res.accepted_count, 1);
  assert.equal(res.skipped_count, 0);
  assert.equal(calls.length, 0);
});

test('apply: delegates atomic write only after authentication and membership', async () => {
  const { service, calls } = setup();
  const preview = await service.preview({ authorization: 'Bearer valid-token', organizationId: A, csv: CSV });
  const res = await service.apply({ authorization: 'Bearer valid-token', organizationId: A, csv: CSV, expectedSha256: preview.file_sha256 });
  assert.equal(res.status, 'applied');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].p_actor_id, USER);
  assert.equal(calls[0].p_organization_id, A);
  assert.equal(calls[0].p_accepted[0].tax_id, '11222333000181');
});

test('denies anonymous, invalid token, wrong tenant and viewer writes', async () => {
  const { service, calls } = setup();
  await assert.rejects(service.apply({ organizationId: A, csv: CSV }), { status: 401 });
  await assert.rejects(service.apply({ authorization: 'Bearer other-token', organizationId: A, csv: CSV }), { status: 401 });
  await assert.rejects(service.apply({ authorization: 'Bearer valid-token', organizationId: B, csv: CSV }), { status: 403 });
  const viewer = setup({ role: 'viewer' }).service;
  await assert.rejects(viewer.preview({ authorization: 'Bearer valid-token', organizationId: A, csv: CSV }), { status: 403 });
  assert.equal(calls.length, 0);
});

test('preview indicates existing companies; apply passes record to DB for race-safe deduplication', async () => {
  const { service, calls } = setup({ dbExisting: ['11222333000181'] });
  const request = { authorization: 'Bearer valid-token', organizationId: A, csv: CSV };
  const preview = await service.preview(request);
  assert.equal(preview.accepted_count, 0);
  assert.equal(preview.skipped_count, 1);
  assert.deepEqual(preview.skipped, [{ line: 2, reason: 'already_exists' }]);
  await service.apply({ ...request, expectedSha256: preview.file_sha256 });
  assert.equal(calls[0].p_accepted.length, 1);
});

test('rate limiting prevents more than twelve submissions per user per minute', async () => {
  const { service, calls } = setup();
  const request = { authorization: 'Bearer valid-token', organizationId: A, csv: CSV };
  for (let i = 0; i < 12; i++) await service.preview(request);
  await assert.rejects(service.apply(request), { status: 429 });
  assert.equal(calls.length, 0);
});

test('rejects invalid organization ID and oversize input', async () => {
  const { service } = setup();
  await assert.rejects(service.preview({ authorization: 'Bearer valid-token', organizationId: 'bad', csv: CSV }), { status: 400 });
  await assert.rejects(service.preview({ authorization: 'Bearer valid-token', organizationId: A, csv: 'x'.repeat(2_000_001) }), /invalid_csv_size/);
});


test('apply: file hash mismatch or missing preview blocks persistence', async () => {
  const { service, calls } = setup();
  const input = { authorization: 'Bearer valid-token', organizationId: A, csv: CSV };
  const preview = await service.preview(input);
  await assert.rejects(service.apply(input), { status: 409 });
  await assert.rejects(service.apply({ ...input, expectedSha256: '0'.repeat(64) }), { status: 409 });
  await assert.rejects(service.apply({
    ...input, csv: CSV.replace('Empresa Teste', 'Empresa Alterada'),
    expectedSha256: preview.file_sha256
  }), { status: 409 });
  assert.equal(calls.length, 0);
});
