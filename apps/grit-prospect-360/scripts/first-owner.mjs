// Isolated Supabase first-owner operator CLI. Never run in CI or a browser.
// No password, service role key or invitation token is printed or stored.
// Requires explicit, externally verified Auth redirect and SMTP before 'invite'.
const EXPECTED_HOST = 'qspluchjhnnzgbbgmsro.supabase.co';
const EXPECTED_REDIRECT = 'https://prospect.gritnews.com.br/';
const ORG_SLUG = 'grit-solucoes-e-negocios';

export function validateFirstOwnerConfig(env, mode) {
  if (!['status','invite','activate'].includes(mode)) throw new Error('invalid_operator_mode');
  let project;
  try { project = new URL(env.PROSPECT_SUPABASE_URL || ''); }
  catch { throw new Error('missing_dedicated_project_url'); }
  if (project.protocol !== 'https:' || project.hostname !== EXPECTED_HOST ||
      project.pathname !== '/' || project.search || project.hash) {
    throw new Error('refusing_shared_or_malformed_supabase_url');
  }
  const key = env.PROSPECT_SUPABASE_SERVICE_ROLE_KEY || '';
  if (key.length < 24) throw new Error('secure_service_role_key_required');
  const email = (env.PROSPECT_FIRST_ADMIN_EMAIL || '').trim().toLowerCase();
  const approved = (env.PROSPECT_FIRST_ADMIN_APPROVED_EMAIL || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email !== approved) {
    throw new Error('first_admin_email_requires_explicit_approval');
  }
  if (mode === 'invite' && (
    env.PROSPECT_INVITE_REDIRECT_URL !== EXPECTED_REDIRECT ||
    env.PROSPECT_INVITE_REDIRECT_VERIFIED !== 'yes' ||
    env.PROSPECT_AUTH_SMTP_VERIFIED !== 'yes')) {
    throw new Error('site_url_redirect_and_email_delivery_must_be_verified_first');
  }
  if (mode === 'activate' && env.PROSPECT_OWNER_ACTIVATION_APPROVED !== 'yes') {
    throw new Error('owner_activation_needs_explicit_approval');
  }
  return { email, projectUrl: project.origin, key, redirect: EXPECTED_REDIRECT };
}

export async function getFirstOwnerStatus(adminClient, db, email) {
  let target = null, total = 0;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await adminClient.listUsers({ page, perPage: 100 });
    if (error) throw new Error('auth_user_inventory_failed');
    const users = data?.users ?? [];
    total += users.length;
    for (const user of users) {
      if (String(user.email || '').trim().toLowerCase() === email) {
        if (target) throw new Error('duplicate_auth_identity');
        target = user;
      }
    }
    if (users.length < 100) break;
    if (page === 100) throw new Error('auth_user_inventory_exceeds_limit');
  }
  const { data: org, error: orgErr } = await db.from('organizations')
    .select('id,slug').eq('slug', ORG_SLUG).maybeSingle();
  if (orgErr) throw new Error('organization_inventory_failed');
  let membership = null;
  if (target && org?.id) {
    const { data, error } = await db.from('memberships')
      .select('role,active').eq('organization_id',org.id)
      .eq('user_id',target.id).maybeSingle();
    if (error) throw new Error('membership_inventory_failed');
    membership = data;
  }
  return {
    total_auth_users: total,
    user_id: target?.id ?? null,
    invited: Boolean(target?.invited_at),
    email_confirmed: Boolean(target?.email_confirmed_at),
    organization_id: org?.id ?? null,
    membership: membership ? { role: membership.role, active: membership.active } : null
  };
}

export async function performFirstOwnerAction({ adminClient, db, mode, email, redirect }) {
  const status = await getFirstOwnerStatus(adminClient, db, email);
  if (mode === 'status') return { action: 'status', ...status };
  if (mode === 'invite') {
    if (status.user_id) return { action: 'invite', status: 'existing_identity_no_invitation_sent', ...status };
    if (status.total_auth_users !== 0 || status.organization_id || status.membership) {
      throw new Error('first_owner_not_empty_manual_review_required');
    }
    const { data, error } = await adminClient.inviteUserByEmail(email, { redirectTo: redirect });
    if (error || !data?.user?.id) throw new Error('invitation_request_failed');
    return { action: 'invite', status: 'provider_accepted_request_delivery_not_verified', user_id: data.user.id };
  }
  if (!status.user_id || !status.email_confirmed) throw new Error('confirmed_auth_identity_required');
  if (status.membership?.active && status.membership.role === 'owner') {
    return { action: 'activate', status: 'existing_active_owner', organization_id: status.organization_id };
  }
  if (status.total_auth_users !== 1) throw new Error('first_owner_auth_inventory_unexpected');
  const { data, error } = await db.rpc('bootstrap_first_owner', { p_user_id: status.user_id });
  if (error) throw new Error('first_owner_bootstrap_failed_' + String(error.code || 'unknown'));
  const verify = await getFirstOwnerStatus(adminClient, db, email);
  if (!verify.membership?.active || verify.membership.role !== 'owner' ||
      verify.organization_id !== data?.organization_id) {
    throw new Error('first_owner_verification_failed');
  }
  return { action: 'activate', status: data.status, organization_id: verify.organization_id, verified: true };
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const mode = process.argv[2];
  try {
    const config = validateFirstOwnerConfig(process.env, mode);
    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(config.projectUrl, config.key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const result = await performFirstOwnerAction({
      adminClient: db.auth.admin, db, mode, email: config.email, redirect: config.redirect
    });
    // Output intentionally excludes email, password, token and provider secrets.
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('First-owner operation stopped:', error.message);
    process.exitCode = 1;
  }
}
