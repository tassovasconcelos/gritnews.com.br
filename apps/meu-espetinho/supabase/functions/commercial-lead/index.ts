import { createClient } from 'jsr:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://gritnews.com.br',
  'https://www.gritnews.com.br',
  'https://meuespetinho.gritnews.com.br',
  'https://srpadeiro.gritnews.com.br',
]);

const cors = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://gritnews.com.br',
  'Access-Control-Allow-Headers': 'content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

const clean = (value: unknown, max = 300) =>
  typeof value === 'string' ? value.trim().slice(0, max) : null;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const headers = cors(origin);
  const json = (body: unknown, status: number) => new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (origin && !allowedOrigins.has(origin)) return json({ ok: false, error: 'origin_not_allowed' }, 403);

  try {
    const body = await req.json();
    if (body?.website) return json({ ok: true }, 200);

    const name = clean(body?.name, 120);
    const email = clean(body?.email, 180)?.toLowerCase() || null;
    const whatsapp = clean(body?.whatsapp, 40);
    const businessName = clean(body?.business_name, 160);
    if (!name || (!email && !whatsapp) || body?.consent_lgpd !== true) {
      return json({ ok: false, error: 'invalid_payload' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );
    const { error } = await supabase.from('leads').insert({
      name,
      email,
      whatsapp,
      business_name: businessName,
      city: clean(body?.city, 120),
      source: clean(body?.source, 80) || 'gritnews',
      campaign: clean(body?.campaign, 120),
      medium: clean(body?.medium, 80),
      content: clean(body?.content, 160),
      landing_page: clean(body?.landing_page, 500),
      product: clean(body?.product, 80) || 'grit',
      utm_term: clean(body?.utm_term, 160),
      gclid: clean(body?.gclid, 300),
      fbclid: clean(body?.fbclid, 300),
      referral_code: clean(body?.referral_code, 100),
      consent_lgpd: true,
      consent_at: new Date().toISOString(),
      status: 'new',
      score: 0,
      notes: clean(body?.message, 1200),
    });
    if (error) throw error;
    return json({ ok: true }, 201);
  } catch (error) {
    console.error('commercial-lead', error instanceof Error ? error.message : 'unknown_error');
    return json({ ok: false, error: 'internal_error' }, 500);
  }
});
