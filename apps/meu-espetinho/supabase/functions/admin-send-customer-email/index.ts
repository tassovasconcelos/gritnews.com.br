import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

const allowedOrigins = new Set([
  'https://meuespetinho.gritnews.com.br',
  'http://localhost:5173',
])

const json = (body: unknown, status = 200, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://meuespetinho.gritnews.com.br',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  },
})

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[character] as string))

function emailHtml(tenantName: string, message: string) {
  const safeName = escapeHtml(tenantName)
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>')
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden"><tr><td style="padding:24px 28px;background:#172033;color:#fff"><div style="font-size:24px;font-weight:800">Meu <span style="color:#f97316">Espetinho</span></div><div style="margin-top:5px;font-size:12px;letter-spacing:.08em;color:#cbd5e1">SEU NEGÓCIO NO CONTROLE</div></td></tr><tr><td style="padding:32px 28px"><p style="margin:0 0 18px;font-size:16px">Olá, equipe <strong>${safeName}</strong>!</p><div style="font-size:16px;line-height:1.7">${safeMessage}</div><p style="margin:28px 0 0;font-size:14px;color:#64748b">Conte com a equipe Meu Espetinho.</p></td></tr><tr><td style="padding:18px 28px;background:#fff7ed;color:#9a3412;font-size:12px">Mensagem enviada pelo relacionamento Meu Espetinho.</td></tr></table></td></tr></table></body></html>`
}

Deno.serve(async request => {
  const origin = request.headers.get('origin') || ''
  if (request.method === 'OPTIONS') return json({ ok: true }, 200, origin)
  if (request.method !== 'POST') return json({ ok: false, message: 'Método não permitido.' }, 405, origin)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('CUSTOMER_EMAIL_FROM')
  const replyTo = Deno.env.get('CUSTOMER_EMAIL_REPLY_TO')
  if (!supabaseUrl || !serviceKey) return json({ ok: false, message: 'Serviço indisponível.' }, 503, origin)
  if (!resendKey || !from) return json({ ok: false, message: 'Remetente de relacionamento ainda não configurado.' }, 503, origin)

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ ok: false, message: 'Sessão obrigatória.' }, 401, origin)
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  const user = userData.user
  if (userError || !user) return json({ ok: false, message: 'Sessão inválida.' }, 401, origin)
  const { data: adminRow } = await admin.from('admin_users').select('user_id').eq('user_id', user.id).eq('active', true).maybeSingle()
  if (!adminRow) return json({ ok: false, message: 'Acesso restrito ao Super Admin.' }, 403, origin)

  let payload: { tenant_id?: string; kind?: string; subject?: string; message?: string }
  try { payload = await request.json() } catch { return json({ ok: false, message: 'Dados inválidos.' }, 400, origin) }
  const tenantId = payload.tenant_id?.trim()
  const kind = payload.kind?.trim()
  const subject = payload.subject?.trim()
  const message = payload.message?.trim()
  if (!tenantId || !kind || !['birthday','promotion','offer','inactivity','custom'].includes(kind) || !subject || subject.length > 120 || !message || message.length > 3000) return json({ ok: false, message: 'Preencha assunto e mensagem corretamente.' }, 400, origin)

  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
  const { count } = await admin.from('admin_customer_emails').select('id', { count: 'exact', head: true }).eq('sent_by', user.id).gte('created_at', oneHourAgo)
  if ((count || 0) >= 30) return json({ ok: false, message: 'Limite de 30 e-mails por hora atingido.' }, 429, origin)

  const { data: tenant } = await admin.from('tenants').select('id,name,owner_user_id').eq('id', tenantId).maybeSingle()
  if (!tenant) return json({ ok: false, message: 'Cliente não encontrado.' }, 404, origin)
  const { data: ownerData, error: ownerError } = await admin.auth.admin.getUserById(tenant.owner_user_id)
  const recipient = ownerData.user?.email
  if (ownerError || !recipient) return json({ ok: false, message: 'Cliente sem e-mail responsável cadastrado.' }, 422, origin)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({ from, to: [recipient], subject, html: emailHtml(tenant.name, message), ...(replyTo ? { reply_to: replyTo } : {}) }),
  })
  const provider = await response.json().catch(() => ({})) as { id?: string; name?: string }
  await admin.from('admin_customer_emails').insert({ tenant_id: tenant.id, sent_by: user.id, recipient_email: recipient, kind, subject, message, status: response.ok ? 'sent' : 'failed', provider_message_id: provider.id || null, error_code: response.ok ? null : (provider.name || `http_${response.status}`) })
  if (!response.ok) return json({ ok: false, message: 'O provedor recusou o envio. Revise o remetente configurado.' }, 502, origin)
  return json({ ok: true }, 200, origin)
})

