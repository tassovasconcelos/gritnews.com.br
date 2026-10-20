import { readFile } from 'node:fs/promises';
import { prepareCompanyImport } from '../src/company-import.mjs';

// Offline preview only. Never connects to Supabase, imports or sends messages.
// Do not print company or contact fields in CI logs.
const path = process.argv[2];
if (!path || process.argv.length !== 3) {
  console.error('Usage: node scripts/import-dry-run.mjs <local-company-file.csv>');
  process.exitCode = 2;
} else {
  try {
    const csv = await readFile(path, 'utf8');
    const report = prepareCompanyImport(csv);
    console.log(JSON.stringify({
      total_rows: report.total_rows,
      accepted_count: report.accepted.length,
      skipped_count: report.skipped.length,
      skipped_reasons: report.skipped.reduce((acc, item) => {
        acc[item.reason] = (acc[item.reason] ?? 0) + 1;
        return acc;
      }, {})
    }, null, 2));
  } catch (error) {
    console.error('Import preview failed:', error.message);
    process.exitCode = 1;
  }
}
