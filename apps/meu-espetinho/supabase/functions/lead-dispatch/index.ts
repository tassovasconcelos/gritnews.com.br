import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import nodemailer from 'npm:nodemailer@6.9.16'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

const replaceTokens = (text: string, lead: Record<string, unknown>) => text
  .replaceAll('{{name}}', String(lead.name || ''))
  .replaceAll('{{business_name}}', String(lead.business_name || ''))
  .replaceAll('{{product}}', String(lead.product_key || lead.product || 'soluções GRIT'))

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character] as string))

async function sendEmail(to: string, subject: string, body: string, idempotencyKey: string) {
  const smtpHost = Deno.env.get('SMTP_HOST')
  const smtpPort = Number(Deno.env.get('SMTP_PORT') || '465')
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPassword = Deno.env.get('SMTP_PASSWORD')
  const smtpSecure = (Deno.env.get('SMTP_SECURE') || 'true').toLowerCase() === 'true'
  const from = Deno.env.get('CUSTOMER_EMAIL_FROM') || `GRIT Soluções <${smtpUser}>`
  const replyTo = Deno.env.get('CUSTOMER_EMAIL_REPLY_TO') || smtpUser

  if (smtpHost && smtpUser && smtpPassword) {
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
    const result = await transport.sendMail({
      from,
      to,
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${escapeHtml(body).replace(/\n/g, '<br>')}</div>`,
      replyTo,
      headers: { 'X-GRIT-Idempotency-Key': idempotencyKey },
    })
    if (!result.messageId) throw new Error('smtp_message_id_missing')
    return result.messageId
  }

  const key = Deno.env.get('RESEND_API_KEY')
  if (!key || !from) throw new Error('email_provider_not_configured')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'User-Agent': 'GRIT-Sales-Machine/1.0',
    },
    body: JSON.stringify({
      from, to: [to], subject,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${escapeHtml(body).replace(/\n/g, '<br>')}</div>`,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string }
  if (!response.ok || !result.id) throw new Error(result.message || `email_http_${response.status}`)
  return result.id
}

async function sendWhatsApp(to: string, templateName: string, lead: Record<string, unknown>) {
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const graphVersion = Deno.env.get('META_GRAPH_API_VERSION') || 'v23.0'
  if (!token || !phoneId) throw new Error('whatsapp_provider_not_configured')
  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components: [{ type: 'body', parameters: [
          { type: 'text', text: String(lead.name || 'Cliente').split(' ')[0] },
          { type: 'text', text: String(lead.product_key || lead.product || 'GRIT') },
        ] }],
      },
    }),
  })
  const result = await response.json().catch(() => ({})) as { messages?: Array<{ id: string }>; error?: { message?: string } }
  const messageId = result.messages?.[0]?.id
  if (!response.ok || !messageId) throw new Error(result.error?.message || `whatsapp_http_${response.status}`)
  return messageId
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const dispatchSecret = Deno.env.get('LEAD_DISPATCH_SECRET')
  if (!dispatchSecret) return json({ error: 'dispatcher_not_configured' }, 503)
  if (request.headers.get('x-dispatch-secret') !== dispatchSecret) return json({ error: 'unauthorized' }, 401)

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) return json({ error: 'backend_not_configured' }, 503)
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const claimToken = crypto.randomUUID()
  const { data: queue, error } = await supabase.rpc('grit_claim_outreach_batch', {
    p_limit: 20,
    p_claim_token: claimToken,
  })
  if (error) return json({ error: 'queue_claim_failed' }, 500)

  const leadIds = [...new Set((queue || []).map(item => item.lead_id).filter(Boolean))]
  const { data: leads, error: leadsError } = leadIds.length
    ? await supabase.from('leads').select('*').in('id', leadIds)
    : { data: [], error: null }
  if (leadsError) return json({ error: 'claimed_leads_read_failed' }, 500)
  const leadsById = new Map((leads || []).map(lead => [lead.id, lead]))

  const results: Array<Record<string, unknown>> = []
  for (const item of queue || []) {
    const lead = leadsById.get(item.lead_id) as Record<string, unknown> | undefined
    try {
      if (!lead) throw new Error('claimed_lead_not_found')
      const { data: template } = await supabase.from('lead_message_templates').select('subject,body')
        .eq('template_key', item.template_key).eq('channel', item.channel).eq('active', true)
        .or(`product_key.eq.${lead.product_key || lead.product},product_key.is.null`).limit(1).maybeSingle()
      if (!template?.body) throw new Error('active_template_not_found')
      const body = replaceTokens(template.body, lead)
      const subject = replaceTokens(template.subject || 'GRIT Soluções', lead)
      let providerMessageId: string
      if (item.channel === 'email') {
        if (!lead.email) throw new Error('recipient_email_missing')
        providerMessageId = await sendEmail(String(lead.email), subject, body, item.dedupe_key || item.id)
      } else if (item.channel === 'whatsapp') {
        if (!lead.whatsapp) throw new Error('recipient_whatsapp_missing')
        providerMessageId = await sendWhatsApp(String(lead.whatsapp), item.template_key, lead)
      } else throw new Error('channel_requires_inbound_window_or_human_review')
      const { data: sent, error: sentError } = await supabase.from('lead_outreach_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString(), provider_message_id: providerMessageId, last_error: null, claimed_at: null, claim_token: null })
        .eq('id', item.id).eq('status', 'processing').eq('claim_token', claimToken).select('id').maybeSingle()
      if (sentError || !sent) throw new Error('dispatch_claim_lost_after_send')
      await supabase.from('lead_events').insert({ lead_id: item.lead_id, event_type: 'message_sent', channel: item.channel, direction: 'outbound', summary: 'Mensagem enviada pela máquina de vendas', metadata: { queue_id: item.id, provider_message_id: providerMessageId } })
      results.push({ id: item.id, ok: true, channel: item.channel })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message.slice(0, 500) : 'dispatch_failed'
      await supabase.from('lead_outreach_queue')
        .update({ status: 'failed', last_error: message, claimed_at: null, claim_token: null })
        .eq('id', item.id).eq('status', 'processing').eq('claim_token', claimToken)
      results.push({ id: item.id, ok: false, channel: item.channel, error: message })
    }
  }
  return json({ ok: true, processed: results.length, results })
})
