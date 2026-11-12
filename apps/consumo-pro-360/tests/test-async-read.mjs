import test from 'node:test';
import assert from 'node:assert/strict';
import {readWithDeadline, createReadScope} from '../src/lib/async-read.mjs';

test('a stalled read releases the waiting UI with an actionable error', async () => {
  await assert.rejects(readWithDeadline(new Promise(() => {}), 5), /tente atualizar/);
});
test('read failures and successful responses propagate', async () => {
  assert.equal(await readWithDeadline(Promise.resolve(42)), 42);
  await assert.rejects(readWithDeadline(Promise.reject(new Error('offline'))), /offline/);
});
test('late responses cannot overwrite a newer company or signed-out session', () => {
  const scope = createReadScope();
  const companyA = scope.begin();
  const companyB = scope.begin();
  assert.equal(companyA(), false);
  assert.equal(companyB(), true);
  scope.cancel();
  assert.equal(companyB(), false);
});
