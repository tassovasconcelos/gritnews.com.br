-- GRIT Lead Intelligence V4.1
-- Evolui a tabela leads existente; não cria CRM paralelo.

alter table if exists public.leads
  add column if not exists product_key text,
  add column if not exists score_reason text,
  add column if not exists temperature text,
  add column if not exists expected_close_at timestamptz,
  add column if not exists last_touch_at timestamptz,
  add column if not exists first_touch_source text,
  add column if not exists first_touch_medium text,
  add column if not exists first_touch_campaign text,
  add column if not exists last_touch_source text,
  add column if not exists last_touch_medium text,
  add column if not exists last_touch_campaign text,
  add column if not exists normalized_email text,
  add column if not exists normalized_phone text,
  add column if not exists do_not_contact boolean not null default false;

-- Compatibilidade com o campo legado `product`.
update public.leads
set product_key = coalesce(product_key, product)
where product_key is null and product is not null;

-- Preserva first touch usando os dados de aquisição já existentes.
update public.leads
set
  first_touch_source = coalesce(first_touch_source, source),
  first_touch_medium = coalesce(first_touch_medium, medium),
  first_touch_campaign = coalesce(first_touch_campaign, campaign),
  last_touch_source = coalesce(last_touch_source, source),
  last_touch_medium = coalesce(last_touch_medium, medium),
  last_touch_campaign = coalesce(last_touch_campaign, campaign),
  last_touch_at = coalesce(last_touch_at, created_at, now())
where first_touch_source is null
   or last_touch_source is null
   or last_touch_at is null;

-- Normalização simples e determinística para conciliação assistida.
update public.leads
set
  normalized_email = nullif(lower(trim(email)), ''),
  normalized_phone = nullif(regexp_replace(coalesce(whatsapp,''), '[^0-9]', '', 'g'), '')
where normalized_email is null or normalized_phone is null;

-- Não criamos UNIQUE agora: primeiro precisamos revisar duplicidades existentes.
create index if not exists idx_leads_normalized_phone on public.leads(normalized_phone) where normalized_phone is not null;
create index if not exists idx_leads_normalized_email on public.leads(normalized_email) where normalized_email is not null;
create index if not exists idx_leads_product_key on public.leads(product_key);
create index if not exists idx_leads_next_action_at_open on public.leads(next_action_at) where status not in ('won','lost');
create index if not exists idx_leads_last_touch_at on public.leads(last_touch_at desc);
create index if not exists idx_leads_do_not_contact on public.leads(do_not_contact) where do_not_contact = true;

-- Temperatura derivada do score atual, preservando override manual quando já informado.
update public.leads
set temperature = case
  when coalesce(score,0) >= 80 then 'hot'
  when coalesce(score,0) >= 55 then 'qualified'
  when coalesce(score,0) >= 30 then 'nurture'
  else 'low'
end
where temperature is null;

-- Validações leves. Não quebram linhas antigas; passam a proteger novos valores.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_temperature_check') then
    alter table public.leads add constraint leads_temperature_check
      check (temperature is null or temperature in ('hot','qualified','nurture','low')) not valid;
  end if;
end $$;

comment on column public.leads.product_key is 'Produto GRIT roteado para a oportunidade; compatível com product legado.';
comment on column public.leads.normalized_phone is 'Telefone somente dígitos para conciliação e detecção de duplicidade.';
comment on column public.leads.normalized_email is 'E-mail normalizado para conciliação e detecção de duplicidade.';
comment on column public.leads.do_not_contact is 'Bloqueio global de contato comercial; deve ser respeitado por todos os canais.';
comment on column public.leads.score_reason is 'Justificativa auditável para o score comercial atual.';
