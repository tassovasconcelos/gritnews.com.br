export const accountRoles = {
  'meu-espetinho': ['owner', 'manager', 'cashier', 'attendant'],
  'sr-padeiro': ['owner', 'manager', 'cashier', 'stockist', 'viewer'],
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function temporaryPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'Aa9!' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
export async function passwordHash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(v => v.toString(16).padStart(2, '0')).join('');
}
function sessionId(token) {
  try { const value = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).session_id; return uuid.test(value) ? value : null; }
  catch { return null; }
}
const failure = (code, status = 400) => Object.assign(new Error(code), { status });
async function checked(promise) { const r = await promise; if (r.error) throw failure('operation_failed', 503); return r.data; }

export function accountHandler(server, { now = () => new Date(), makePassword = temporaryPassword } = {}) {
  const origins = new Set(['https://srpadeiro.gritnews.com.br', 'https://meuespetinho.gritnews.com.br', 'http://localhost:5173', 'http://localhost:4173']);
  return async request => {
    const origin = request.headers.get('Origin') || '';
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': origins.has(origin) ? origin : 'https://meuespetinho.gritnews.com.br', 'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
    const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
    if (origin && !origins.has(origin)) return reply(403, { error: 'origin_not_allowed' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
    let leaseEmail, leaseToken;
    try {
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer /i, '');
      if (!token) throw failure('authentication_required', 401);
      const auth = await server.auth.getUser(token);
      if (auth.error || !auth.data?.user) throw failure('invalid_session', 401);
      const user = auth.data.user;
      if (Number(request.headers.get('Content-Length') || 0) > 12000) throw failure('request_too_large');
      let body; try { body = await request.json(); } catch { throw failure('invalid_json'); }
      if (!body || !['status', 'complete', 'create', 'reset'].includes(body.action)) throw failure('invalid_action');
      const current = await checked(server.from('operation_password_requirements').select('*').eq('user_id', user.id).maybeSingle());
      if (body.action === 'status') {
        const required = Boolean(current?.required || user.app_metadata?.ops_password_required);
        const fresh = !current || await checked(server.rpc('ops_account_session', { u: user.id, sid: sessionId(token), since: current.issued_at }));
        return reply(200, { required, fresh_session: Boolean(fresh), expires_at: current?.expires_at || null, expired: Boolean(required && (!current || Date.parse(current.expires_at) <= now().getTime())) });
      }
      if (body.action === 'complete') {
        if (!current?.required) throw failure('password_change_not_pending', 409);
        if (Date.parse(current.expires_at) <= now().getTime()) throw failure('temporary_password_expired', 409);
        if (!await checked(server.rpc('ops_account_session', { u: user.id, sid: sessionId(token), since: current.issued_at }))) throw failure('temporary_login_required', 403);
        if (typeof body.new_password !== 'string' || body.new_password.length < 12 || body.new_password.length > 128) throw failure('password_minimum_12');
        if (await passwordHash(body.new_password) === current.temporary_hash) throw failure('choose_different_password');
        leaseEmail = user.email; leaseToken = crypto.randomUUID();
        if (!await checked(server.rpc('ops_account_lease', { e: leaseEmail, k: leaseToken, done: false }))) throw failure('account_busy', 409);
        // Re-read after acquiring the lease: another administrator may have reset this account.
        const latest = await checked(server.from('operation_password_requirements').select('*').eq('user_id', user.id).maybeSingle());
        if (latest?.reset_id !== current.reset_id) throw failure('password_reset_changed', 409);
        await checked(server.auth.admin.updateUserById(user.id, { password: body.new_password, app_metadata: { ...user.app_metadata, ops_password_required: false } }));
        const rows = await checked(server.from('operation_password_requirements').update({ required: false, temporary_hash: null, completed_at: now().toISOString() }).eq('user_id', user.id).eq('reset_id', current.reset_id).select('user_id'));
        if (!rows?.length) throw failure('password_reset_changed', 409);
        await checked(server.from('operation_audit').insert({ app: current.app, scope_id: current.scope_id, actor_id: user.id, action: 'temporary_password_changed', details: { reset_id: current.reset_id } }));
        return reply(200, { ok: true });
      }
      if (current?.required || user.app_metadata?.ops_password_required) throw failure('password_change_required', 403);
      if (current && !await checked(server.rpc('ops_account_session', { u: user.id, sid: sessionId(token), since: current.issued_at }))) throw failure('session_reauthentication_required', 403);
      if (!accountRoles[body.app] || !uuid.test(body.scope_id)) throw failure('invalid_scope');
      if (body.identity_verified !== true || typeof body.reason !== 'string' || body.reason.trim().length < 5 || body.reason.length > 500) throw failure('identity_and_reason_required');
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (body.action === 'create' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !accountRoles[body.app].includes(body.role) || typeof body.full_name !== 'string' || body.full_name.trim().length < 2 || body.full_name.length > 120)) throw failure('invalid_user');
      if (body.action === 'reset' && (!uuid.test(body.user_id) || body.global_reset_ack !== true)) throw failure('reset_confirmation_required');
      const context = await checked(server.rpc('ops_account_context', { actor: user.id, a: body.app, s: body.scope_id, e: email || null, uid: body.user_id || null }));
      if (body.action === 'create' && context.user_id) throw failure('account_exists_use_link', 409);
      if (body.action === 'reset' && (!context.user_id || !context.member_active)) throw failure('active_member_required', 403);
      if (context.protected || context.user_id === user.id) throw failure('protected_account', 403);
      if (body.action === 'reset' && !context.email_confirmed && body.confirm_email !== true) throw failure('email_confirmation_required', 409);
      leaseEmail = context.email || email; leaseToken = crypto.randomUUID();
      if (!await checked(server.rpc('ops_account_lease', { e: leaseEmail, k: leaseToken, done: false }))) throw failure('account_busy', 409);
      const password = makePassword();
      let target = context.user_id;
      if (body.action === 'create') {
        const created = await checked(server.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: body.full_name.trim(), product: body.app }, app_metadata: { ops_password_required: true } }));
        target = created?.user?.id;
        if (!target) throw failure('account_creation_unknown', 503);
      }
      const resetId = crypto.randomUUID(), expires = new Date(now().getTime() + 86400000).toISOString();
      await checked(server.from('operation_password_requirements').upsert({ user_id: target, app: body.app, scope_id: body.scope_id, reset_id: resetId, required: true, temporary_hash: await passwordHash(password), issued_at: now().toISOString(), expires_at: expires, created_by: user.id, completed_at: null }));
      if (body.action === 'reset') {
        const targetUser = await checked(server.auth.admin.getUserById(target));
        await checked(server.auth.admin.updateUserById(target, { password, ...(body.confirm_email === true ? { email_confirm: true } : {}), app_metadata: { ...targetUser.user.app_metadata, ops_password_required: true } }));
      }
      await checked(server.rpc('ops_account_bind_audit', { actor: user.id, a: body.app, s: body.scope_id, u: target, member_role: body.action === 'create' ? body.role : null, full_name: body.action === 'create' ? body.full_name.trim() : null, reason: body.reason.trim(), reset: body.action === 'reset', reset_ref: resetId }));
      // Only sessions created AFTER the Auth password update may complete the change.
      await checked(server.from('operation_password_requirements').update({ issued_at: now().toISOString() }).eq('user_id', target).eq('reset_id', resetId));
      return reply(200, { ok: true, email: leaseEmail, temporary_password: password, expires_at: expires });
    } catch (error) {
      return reply(error?.status || 503, { error: error?.status ? error.message : 'operation_failed' });
    } finally {
      if (leaseEmail && leaseToken) { try { await server.rpc('ops_account_lease', { e: leaseEmail, k: leaseToken, done: true }); } catch { /* Lease expires independently. */ } }
    }
  };
}
