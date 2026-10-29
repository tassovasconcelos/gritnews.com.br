type ConfirmationClient = { auth: { resend: (values: {
  type: 'signup'; email: string; options: { emailRedirectTo: string };
}) => Promise<{ error: unknown }> } };

export function confirmationRedirect(origin: string, query: string) {
  const target = new URL('/app', origin);
  const params = new URLSearchParams(query);
  const scope = params.get('operation_scope') || params.get('organization');
  if (scope && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scope)) {
    target.searchParams.set('operation_scope', scope);
  }
  return target.href;
}

export async function resendSignupConfirmation(client: ConfirmationClient, email: string, redirect: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) throw new Error('invalid_email');
  const { error } = await client.auth.resend({ type: 'signup', email: normalized, options: { emailRedirectTo: redirect } });
  if (error) throw error;
}
