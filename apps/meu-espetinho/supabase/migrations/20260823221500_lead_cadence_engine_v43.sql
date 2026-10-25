-- GRIT Lead Cadence Engine V4.3
-- Evolui o CRM existente com cadências e fila auditável, sem disparo externo automático.

create table if not exists public.lead_cadences (
  id uuid primary key default gen_random_uuid(),
  product_key text not null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_cadence_steps (
  id uuid primary key default gen_random_uuid(),
  cadence_id uuid not null references public.lead_cadences(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  delay_hours integer not null default 0 check (delay_hours >= 0),
  channel text not null check (channel in ('whatsapp','email','call','task')),
  template_key text not null,
  target_status text,
  next_action_label text,
  stop_on_reply boolean not null default true,
  created_at timestamptz not null default now(),
  unique(cadence_id, step_order)
);

create table if not exists public.lead_message_templates (
  id uuid primary key default gen_random_uuid(),
  product_key text not null,
  template_key text not null,
  channel text not null check (channel in ('whatsapp','email')),
  subject text,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_key, template_key, channel)
);

create table if not exists public.lead_automation_enrollments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  cadence_id uuid not null references public.lead_cadences(id) on delete cascade,
  current_step integer not null default 0,
  status text not null default 'active' check (status in ('active','paused','completed','stopped')),
  started_at timestamptz not null default now(),
  last_step_at timestamptz,
  next_step_at timestamptz,
  stop_reason text,
  unique(lead_id, cadence_id)
);

create table if not exists public.lead_outreach_queue (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  enrollment_id uuid references public.lead_automation_enrollments(id) on delete set null,
  cadence_step_id uuid references public.lead_cadence_steps(id) on delete set null,
  channel text not null check (channel in ('whatsapp','email','call','task')),
  template_key text,
  payload jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued','ready','sent','failed','cancelled','manual_action')),
  provider_message_id text,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(lead_id, cadence_step_id)
);

create index if not exists idx_lead_outreach_queue_due on public.lead_outreach_queue(status, scheduled_at);
create index if not exists idx_lead_enrollments_due on public.lead_automation_enrollments(status, next_step_at);

alter table public.lead_cadences enable row level security;
alter table public.lead_cadence_steps enable row level security;
alter table public.lead_message_templates enable row level security;
alter table public.lead_automation_enrollments enable row level security;
alter table public.lead_outreach_queue enable row level security;

do $$ begin
  create policy "admins_manage_lead_cadences" on public.lead_cadences for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active)) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins_manage_lead_cadence_steps" on public.lead_cadence_steps for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active)) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins_manage_lead_templates" on public.lead_message_templates for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active)) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins_manage_lead_enrollments" on public.lead_automation_enrollments for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active)) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins_manage_lead_outreach_queue" on public.lead_outreach_queue for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active)) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid() and a.active));
exception when duplicate_object then null; end $$;

insert into public.lead_message_templates(product_key,template_key,channel,subject,body) values
('sr-padeiro','intro','whatsapp',null,'Olá, {{first_name}}! Aqui é da GRIT. Vi que sua empresa atua como {{business_name}}. O Sr. Padeiro foi criado para simplificar PDV, caixa, estoque e fiado pelo celular. Posso te enviar uma apresentação rápida? Se preferir não receber mais contatos, é só me avisar.'),
('sr-padeiro','material','email','Sr. Padeiro | gestão simples para o seu negócio','Olá, {{first_name}}.\n\nSegue uma apresentação do Sr. Padeiro, pensado para pequenos negócios que precisam de PDV, caixa, estoque, clientes e gestão pelo celular com simplicidade.\n\nAcesso: https://srpadeiro.gritnews.com.br\n\nSe fizer sentido, posso te mostrar em poucos minutos como funciona.\n\nEquipe GRIT\ncontato@gritnews.com.br'),
('sr-padeiro','followup','whatsapp',null,'Olá, {{first_name}}! Conseguiu ver o material do Sr. Padeiro? Se quiser, te mostro rapidamente como ficaria a rotina de venda, caixa e estoque no seu negócio.'),
('meu-espetinho','intro','whatsapp',null,'Olá, {{first_name}}! Aqui é da GRIT. O Meu Espetinho ajuda a organizar vendas, caixa, estoque e operação do espetinho pelo celular. Posso te enviar uma apresentação rápida? Se preferir não receber mais contatos, é só me avisar.'),
('meu-espetinho','material','email','Meu Espetinho | controle simples da operação','Olá, {{first_name}}.\n\nSegue uma apresentação do Meu Espetinho para organizar vendas, caixa, estoque e gestão da operação.\n\nAcesso: https://meuespetinho.gritnews.com.br\n\nSe fizer sentido, posso apresentar o sistema rapidamente.\n\nEquipe GRIT\ncontato@gritnews.com.br'),
('meu-espetinho','followup','whatsapp',null,'Olá, {{first_name}}! Conseguiu olhar o material do Meu Espetinho? Posso te mostrar em poucos minutos como funciona na prática.')
on conflict(product_key,template_key,channel) do update set subject=excluded.subject, body=excluded.body, active=true, updated_at=now();

insert into public.lead_cadences(product_key,name)
select p,'Cadência comercial padrão V1' from (values('sr-padeiro'),('meu-espetinho')) v(p)
where not exists(select 1 from public.lead_cadences c where c.product_key=v.p and c.name='Cadência comercial padrão V1');

insert into public.lead_cadence_steps(cadence_id,step_order,delay_hours,channel,template_key,next_action_label)
select c.id,s.step_order,s.delay_hours,s.channel,s.template_key,s.next_action_label
from public.lead_cadences c
join (values
(1,0,'whatsapp','intro','Enviar apresentação / iniciar conversa'),
(2,1,'email','material','Confirmar recebimento do material'),
(3,48,'whatsapp','followup','Qualificar interesse e oferecer demonstração'),
(4,120,'task','manual_review','Revisar oportunidade e próxima ação'),
(5,240,'task','reactivation','Decidir nutrição ou reativação futura')
) s(step_order,delay_hours,channel,template_key,next_action_label) on true
where c.name='Cadência comercial padrão V1'
on conflict(cadence_id,step_order) do nothing;
