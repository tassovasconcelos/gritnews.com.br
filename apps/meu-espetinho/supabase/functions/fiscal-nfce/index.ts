import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { simulateCeara } from './simulator.mjs';

// Simulation is opt-in at deployment. This function has NO live provider adapter.
Deno.serve(async (req: Request) => {
  const origin = Deno.env.get('FISCAL_ALLOWED_ORIGIN') || '';
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
  if (Deno.env.get('FISCAL_SIMULATION_ENABLED') !== 'true') return reply(503, { error: 'simulation_disabled' });
  const authorization = req.headers.get('Authorization');
  if (!authorization) return reply(401, { error: 'authentication_required' });
  const url = Deno.env.get('SUPABASE_URL')!;
  const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return reply(401, { error: 'invalid_session' });
  let body;
  try { body = await req.json(); } catch { return reply(400, { error: 'invalid_json' }); }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(body?.tenant_id) || !uuid.test(body?.order_id)) return reply(400, { error: 'invalid_identifiers' });
  const { data: document, error } = await client.rpc('claim_fiscal_simulation', { t: body.tenant_id, o: body.order_id });
  if (error) return reply(error.code === '42501' ? 403 : 409, { error: 'fiscal_request_denied', detail: error.message });
  if (document.status === 'simulated') return reply(200, { status: 'simulated', obligation_pending: true });
  let result;
  try { result = await simulateCeara(document, Deno.env.get('FISCAL_SIMULATION_SCENARIO') || 'success'); }
  catch { result = { status: 'unknown', code: 'COMMUNICATION_UNKNOWN' }; }
  const server = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: saveError } = await server.rpc('finish_fiscal_simulation', {
    d: document.id, a: document.attempt_id, s: result.status, c: result.code,
  });
  // If persisting fails, preserve processing: subsequent calls reconcile the SAME attempt.
  if (saveError) return reply(503, { error: 'result_persistence_unknown', obligation_pending: true });
  return reply(200, { status: result.status, obligation_pending: true });
});
