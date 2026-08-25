import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const encoder = new TextEncoder()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

async function validSignature(body: string, signature: string | null, secret: string) {
  if (!signature?.startsWith('sha256=')) return false
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expected = `sha256=${Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')}`
  return safeEqual(expected, signature)
}

const productFromText = (text: string) => {
  const normalized = text.toLowerCase()
  if (/padeiro|padaria|panifica/.test(normalized)) return 'sr_padeiro'
  if (/espetinho|espeto|comanda/.test(normalized)) return 'meu_espetinho'
  if (/sac|p[oó]s-venda|garantia|qualidade/.test(normalized)) return 'sac_4_0'
  return 'grit_ecosystem'
}

type Inbound = {
  channel: 'instagram' | 'facebook'
  senderId: string
  senderName: string
  messageId: string
  text: string
  kind: 'message' | 'comment'
  payload: Record<string, unknown>
}

const extractInbound = (payload: Record<string, any>): Inbound[] => {
  const channel: 'instagram' | 'facebook' = payload.object === 'instagram' ? 'instagram' : 'facebook'
  const events: Inbound[] = []
  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) {
      if (!event.sender?.id || !event.message?.mid || event.message?.is_echo) continue
      events.push({
        channel,
        senderId: String(event.sender.id),
        senderName: 'Contato das redes sociais',
        messageId: String(event.message.mid),
        text: String(event.message.text || ''),
        kind: 'message',
        payload: event,
      })
    }
    for (const change of entry.changes || []) {
      const value = change.value || {}
      if (change.field !== 'feed' || value.item !== 'comment' || !value.from?.id || !value.comment_id) continue
      events.push({
        channel,
        senderId: String(value.from.id),
        senderName: String(value.from.name || 'Contato das redes sociais').slice(0, 120),
        messageId: String(value.comment_id),
        text: String(value.message || ''),
        kind: 'comment',
        payload: value,
      })
    }
  }
  return events
}

Deno.serve(async request => {
  const verifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')
  if (request.method === 'GET') {
    const url = new URL(request.url)
    if (url.searchParams.get('hub.mode') !== 'subscribe' || !verifyToken || !safeEqual(url.searchParams.get('hub.verify_token') || '', verifyToken)) {
      return new Response('forbidden', { status: 403 })
    }
    return new Response(url.searchParams.get('hub.challenge') || '', { status: 200 })
  }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const appSecrets = [Deno.env.get('META_APP_SECRET'), Deno.env.get('INSTAGRAM_APP_SECRET')].filter(Boolean) as string[]
  if (!appSecrets.length) return json({ error: 'webhook_not_configured' }, 503)
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')
  const signatures = await Promise.all(appSecrets.map(secret => validSignature(rawBody, signature, secret)))
  if (!signatures.some(Boolean)) {
    return json({ error: 'invalid_signature' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ error: 'backend_not_configured' }, 503)
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const payload = JSON.parse(rawBody) as Record<string, any>
  const events = extractInbound(payload)
  let accepted = 0

  for (const event of events) {
    const { data: duplicate } = await supabase.from('lead_inbound_messages').select('id').eq('channel', event.channel).eq('provider_message_id', event.messageId).maybeSingle()
    if (duplicate) continue

    const { data: existing } = await supabase.from('leads').select('id').eq('source_platform', event.channel).eq('source_lead_id', event.senderId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    let leadId = existing?.id as string | undefined
    if (!leadId) {
      const { data: lead, error } = await supabase.from('leads').insert({
        name: event.senderName,
        source: event.channel,
        source_platform: event.channel,
        source_type: event.kind === 'message' ? 'social_message' : 'social_comment',
        source_form_id: 'meta-organic',
        source_lead_id: event.senderId,
        campaign: 'organic-social-keywords',
        content: event.text.slice(0, 160),
        product: productFromText(event.text),
        product_key: productFromText(event.text),
        status: event.kind === 'message' ? 'contacted' : 'new',
        score: event.kind === 'message' ? 45 : 25,
        consent_lgpd: false,
        notes: event.text.slice(0, 1200),
      }).select('id').single()
      if (error) throw error
      leadId = lead.id
    }

    if (event.kind === 'message') {
      await supabase.from('lead_channel_consents').upsert({
        lead_id: leadId,
        channel: event.channel,
        purpose: 'sales_followup',
        status: 'granted',
        legal_basis: 'requested_contact',
        evidence: { provider: 'meta', message_id: event.messageId, captured_at: new Date().toISOString() },
        granted_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'lead_id,channel,purpose' })
    }

    const { error: inboundError } = await supabase.from('lead_inbound_messages').insert({
      lead_id: leadId,
      channel: event.channel,
      provider_message_id: event.messageId,
      received_at: new Date().toISOString(),
      payload: { kind: event.kind, text: event.text, provider: event.payload },
    })
    if (inboundError) throw inboundError
    accepted += 1
  }
  return json({ ok: true, accepted })
})
