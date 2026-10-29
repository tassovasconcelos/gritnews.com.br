import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmationRedirect, resendSignupConfirmation } from '../src/authLinks.ts';

test('confirmation returns to the requested company and ignores arbitrary redirect/token parameters', () => {
  const id = '10378360-6534-4bf7-b6ae-85bfaaed0e01';
  const result = new URL(confirmationRedirect('https://srpadeiro.gritnews.com.br', `?organization=${id}&next=https://example.invalid&convite=secret&support_org=other`));
  assert.equal(result.origin, 'https://srpadeiro.gritnews.com.br');
  assert.equal(result.pathname, '/app');
  assert.deepEqual([...result.searchParams], [['operation_scope', id]]);
  assert.equal(confirmationRedirect('https://meuespetinho.gritnews.com.br', '?operation_scope=invalid'), 'https://meuespetinho.gritnews.com.br/app');
});

test('confirmation validates email before contacting Auth and propagates delivery errors', async () => {
  const requests = [];
  const client = { auth: { resend: async request => { requests.push(request); return { error: null }; } } };
  await assert.rejects(resendSignupConfirmation(client, 'invalid', 'https://example.invalid/app'), /invalid_email/);
  assert.equal(requests.length, 0);
  await resendSignupConfirmation(client, ' CUSTOMER@Example.Invalid ', 'https://example.invalid/app');
  assert.deepEqual(requests[0], { type: 'signup', email: 'customer@example.invalid', options: { emailRedirectTo: 'https://example.invalid/app' } });
  const failure = new Error('rate_limit');
  await assert.rejects(resendSignupConfirmation({ auth: { resend: async () => ({ error: failure }) } }, 'customer@example.invalid', 'https://example.invalid/app'), error => error === failure);
});
