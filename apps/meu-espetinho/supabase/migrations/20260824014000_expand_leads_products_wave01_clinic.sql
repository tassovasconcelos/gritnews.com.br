-- Expand the legacy leads.product constraint for planned GRIT products.
-- Applied to production Supabase gritnews on 2026-08-24.

alter table public.leads drop constraint if exists leads_product_valid;

alter table public.leads add constraint leads_product_valid check (
  product is null or product in (
    'meu-espetinho',
    'sr-padeiro',
    'sac-4',
    'oportunidades-pro',
    'meu-representante',
    'meu-servico',
    'meu-personal',
    'minha-clinica'
  )
);
