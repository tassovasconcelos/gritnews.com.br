// Pure, side-effect-free foundation for the GRIT Prospect 360 company CSV importer.
// This module NEVER connects to a database, external service, or outbound channel.
export const MAX_CSV_BYTES = 2_000_000;
export const MAX_COMPANIES = 5_000;

export function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeName(value) {
  return String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function normalizeHeader(value) {
  return normalizeName(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isValidCnpj(value) {
  const number = digits(value);
  if (number.length !== 14 || /^(\d)\1{13}$/.test(number)) return false;
  const digit = (length, weights) => {
    const sum = [...number.slice(0, length)].reduce((s, n, i) => s + Number(n) * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  return digit(12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(number[12])
    && digit(13, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(number[13]);
}

function detectDelimiter(input) {
  let quoted = false, commas = 0, semicolons = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { i++; continue; }
      quoted = !quoted;
    } else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted && char === ',') commas++;
    else if (!quoted && char === ';') semicolons++;
  }
  return semicolons > commas ? ';' : ',';
}

export function parseCsv(input) {
  if (typeof input !== 'string' || Buffer.byteLength(input, 'utf8') > MAX_CSV_BYTES) {
    throw new Error('invalid_csv_size');
  }
  const source = input.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(source);
  let rows = [], row = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (!quoted && cell.length === 0) quoted = true;
      else if (quoted) quoted = false;
      else throw new Error('invalid_csv_quote');
    } else if (!quoted && char === delimiter) {
      row.push(cell); cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(x => x.trim())) rows.push(row);
      row = []; cell = '';
      if (rows.length > MAX_COMPANIES + 1) throw new Error('csv_row_limit');
    } else cell += char;
  }
  if (quoted) throw new Error('unclosed_csv_quote');
  row.push(cell);
  if (row.some(x => x.trim())) rows.push(row);
  if (rows.length > MAX_COMPANIES + 1) throw new Error('csv_row_limit');
  return rows;
}

const ALIASES = {
  cnpj: ['cnpj', 'taxid', 'documento'],
  legal_name: ['razaosocial', 'razao', 'legalname', 'nomeempresarial', 'empresa'],
  trade_name: ['nomefantasia', 'tradename'],
  city: ['cidade', 'municipio', 'city'],
  state: ['uf', 'estado', 'state']
};

export function prepareCompanyImport(csv, existingCnpjs = []) {
  const rows = parseCsv(csv);
  if (rows.length < 1) throw new Error('csv_header_required');
  const header = rows[0].map(normalizeHeader);
  const indexes = Object.fromEntries(Object.entries(ALIASES).map(([field, aliases]) =>
    [field, header.findIndex(x => aliases.includes(x))]
  ));
  if (indexes.cnpj < 0 || indexes.legal_name < 0) throw new Error('required_columns_cnpj_legal_name');
  if (new Set(header.filter(Boolean)).size !== header.filter(Boolean).length) {
    throw new Error('duplicate_csv_header');
  }
  const existing = new Set([...existingCnpjs].map(digits));
  const seen = new Set();
  const accepted = [], skipped = [];
  for (const [index, row] of rows.slice(1).entries()) {
    const line = index + 2;
    const field = key => indexes[key] < 0 ? '' : normalizeName(row[indexes[key]]);
    const taxId = digits(field('cnpj'));
    const legalName = field('legal_name');
    const state = field('state').toUpperCase();
    let reason = '';
    if (row.length !== header.length) reason = 'column_count_mismatch';
    else if (!isValidCnpj(taxId)) reason = 'invalid_cnpj';
    else if (!legalName) reason = 'missing_legal_name';
    else if (state && !/^[A-Z]{2}$/.test(state)) reason = 'invalid_state';
    else if (seen.has(taxId)) reason = 'duplicate_in_file';
    else if (existing.has(taxId)) reason = 'already_exists';
    if (reason) { skipped.push({ line, reason }); continue; }
    seen.add(taxId);
    accepted.push({
      tax_id: taxId, legal_name: legalName, trade_name: field('trade_name') || null,
      city: field('city') || null, state: state || null, source_line: line
    });
  }
  return { total_rows: rows.length - 1, accepted, skipped };
}
