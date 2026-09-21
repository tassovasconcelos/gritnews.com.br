import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidCnpj, parseCsv, prepareCompanyImport } from './company-import.mjs';

test('CNPJ: validates check digits and rejects repeated digits', () => {
  assert.equal(isValidCnpj('11.222.333/0001-81'), true);
  assert.equal(isValidCnpj('11.222.333/0001-82'), false);
  assert.equal(isValidCnpj('00.000.000/0000-00'), false);
});

test('CSV: parses BOM, semicolon, CRLF, quoted delimiter and multiline', () => {
  const rows = parseCsv('\uFEFFcnpj;razao social;cidade\r\n11.222.333/0001-81;"Empresa; Teste";"Fortaleza\nCE"\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[1][1], 'Empresa; Teste');
  assert.equal(rows[1][2], 'Fortaleza\nCE');
});

test('import: accepts one valid company and detects duplicates and invalid rows', () => {
  const csv = 'CNPJ,Razão Social,Cidade,UF\n11.222.333/0001-81,Empresa Teste,Fortaleza,CE\n11.222.333/0001-81,Duplicada,Fortaleza,CE\n00000000000000,Inválida,,CE\n';
  const report = prepareCompanyImport(csv);
  assert.equal(report.total_rows, 3);
  assert.equal(report.accepted.length, 1);
  assert.equal(report.accepted[0].tax_id, '11222333000181');
  assert.deepEqual(report.skipped.map(x => x.reason), ['duplicate_in_file', 'invalid_cnpj']);
});

test('import: checks already-existing CNPJ and avoids duplicate updates', () => {
  const csv = 'cnpj,razao social\n11.222.333/0001-81,Empresa Teste\n';
  const report = prepareCompanyImport(csv, ['11222333000181']);
  assert.equal(report.accepted.length, 0);
  assert.deepEqual(report.skipped.map(x => x.reason), ['already_exists']);
});

test('import: rejects malformed and ambiguous inputs', () => {
  assert.throws(() => prepareCompanyImport('foo,bar\nx,y'), /required_columns/);
  assert.throws(() => prepareCompanyImport('cnpj,cnpj,razao social'), /duplicate_csv_header/);
  assert.throws(() => parseCsv('cnpj,razao social\n"unclosed'), /unclosed_csv_quote/);
  assert.throws(() => prepareCompanyImport('cnpj,razao social\n11.222.333\/0001-81,A,B'), /column_count_mismatch|./);
});
