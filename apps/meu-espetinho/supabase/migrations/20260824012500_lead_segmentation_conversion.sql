-- GRIT Commercial Intelligence: segment/profile based conversion messaging
-- Applied to production Supabase gritnews on 2026-08-24.

alter table public.leads add column if not exists segment text;
alter table public.leads add column if not exists profile_key text;
alter table public.leads add column if not exists pain_focus text;
alter table public.leads add column if not exists offer_focus text;
alter table public.leads add column if not exists segment_confidence numeric(5,2);
alter table public.leads add column if not exists segment_source text default 'rule';

alter table public.lead_message_templates add column if not exists segment text;
alter table public.lead_message_templates add column if not exists profile_key text;
alter table public.lead_message_templates add column if not exists funnel_stage text;
alter table public.lead_message_templates add column if not exists material_url text;
alter table public.lead_message_templates add column if not exists conversion_goal text;

create table if not exists public.lead_material_catalog (
  id uuid primary key default gen_random_uuid(),
  product_key text not null,
  segment text,
  profile_key text,
  funnel_stage text not null default 'new',
  title text not null,
  material_type text not null default 'landing',
  material_url text not null,
  conversion_goal text not null default 'reply',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_material_catalog enable row level security;
drop policy if exists "admins_manage_lead_material_catalog" on public.lead_material_catalog;
create policy "admins_manage_lead_material_catalog" on public.lead_material_catalog
for all to authenticated
using (exists(select 1 from public.admin_users au where au.user_id=auth.uid() and au.active=true))
with check (exists(select 1 from public.admin_users au where au.user_id=auth.uid() and au.active=true));

create or replace function public.grit_classify_lead_segment(p_product_key text,p_business_name text,p_source text default null,p_landing_page text default null)
returns table(segment text, profile_key text, pain_focus text, offer_focus text, confidence numeric)
language plpgsql stable as $$
declare n text:=lower(coalesce(p_business_name,''));
begin
 if p_product_key='sr-padeiro' then
  if n like '%padaria%' or n like '%padeir%' then return query select 'padaria','proprietario_padaria','caixa, estoque, perdas e velocidade no balcão','PDV simples + estoque + caixa no celular',0.95::numeric;
  elsif n like '%mercad%' or n like '%mercearia%' then return query select 'mercadinho','proprietario_mercadinho','estoque, caixa, fiado e visão diária','estoque + caixa + fiado + gestão pelo celular',0.95::numeric;
  elsif n like '%conveni%' then return query select 'conveniencia','gestor_conveniencia','agilidade no atendimento, caixa e estoque','PDV rápido + estoque + controle gerencial',0.95::numeric;
  else return query select 'varejo_alimentar','pequeno_varejista','controle diário e simplicidade operacional','gestão simples com controle avançado',0.60::numeric; end if;
 elsif p_product_key='meu-espetinho' then
  if n like '%espetaria%' then return query select 'espetaria','dono_espetaria','agilidade no fechamento, estoque e controle do caixa','PDV + conta por WhatsApp + estoque + caixa',0.95::numeric;
  elsif n like '%churrasquinho%' or n like '%churrascaria%' then return query select 'churrasquinho','dono_churrasquinho','vendas rápidas, fechamento e perdas','vendas + fechamento + estoque + controle pelo celular',0.90::numeric;
  elsif n like '%bar%' or n like '%gastro%' or n like '%petisco%' then return query select 'bar_gastro','gestor_bar','comandas, fechamento e visão de vendas','PDV simples + conta + caixa + gestão móvel',0.85::numeric;
  else return query select 'espetinho','dono_espetinho','vendas, caixa, estoque e fechamento','controle completo e simples pelo celular',0.75::numeric; end if;
 elsif p_product_key='sac-4' then return query select 'b2b_sac','gestor_sac','prazo, protocolo, histórico e produtividade','demonstração do SAC 4.0 e diagnóstico do processo',0.70::numeric;
 elsif p_product_key='oportunidades-pro' then return query select 'b2b_comercial','gestor_comercial','pipeline, SLA, forecast e produtividade','diagnóstico comercial + demonstração de gestão de oportunidades',0.70::numeric;
 else return query select 'geral','empreendedor','organização e produtividade','diagnóstico da solução GRIT mais adequada',0.40::numeric; end if;
end $$;

create or replace function public.grit_apply_lead_segmentation() returns trigger language plpgsql as $$
declare c record;
begin
 if new.segment is null or new.segment_source='rule' then
  select * into c from public.grit_classify_lead_segment(coalesce(new.product_key,new.product),coalesce(new.business_name,new.name),new.source,new.landing_page) limit 1;
  new.segment:=c.segment; new.profile_key:=c.profile_key; new.pain_focus:=c.pain_focus; new.offer_focus:=c.offer_focus; new.segment_confidence:=c.confidence; new.segment_source:=coalesce(new.segment_source,'rule');
 end if;
 return new;
end $$;

drop trigger if exists trg_grit_apply_lead_segmentation on public.leads;
create trigger trg_grit_apply_lead_segmentation before insert or update of product_key,product,business_name,name on public.leads for each row execute function public.grit_apply_lead_segmentation();

create or replace function public.grit_resolve_lead_material(p_lead_id uuid)
returns table(title text, material_url text, conversion_goal text)
language sql stable as $$
 select m.title,m.material_url,m.conversion_goal from public.leads l join public.lead_material_catalog m on m.product_key=coalesce(l.product_key,l.product) and m.active=true
 where l.id=p_lead_id and (m.segment=l.segment or m.segment is null) and (m.profile_key=l.profile_key or m.profile_key is null) and (m.funnel_stage=coalesce(l.status,'new') or m.funnel_stage='new')
 order by (m.segment=l.segment)::int desc,(m.profile_key=l.profile_key)::int desc,(m.funnel_stage=coalesce(l.status,'new'))::int desc,m.created_at desc limit 1;
$$;

create index if not exists leads_segment_idx on public.leads(product_key,segment,profile_key,status);
create index if not exists lead_material_catalog_lookup_idx on public.lead_material_catalog(product_key,segment,profile_key,funnel_stage,active);
