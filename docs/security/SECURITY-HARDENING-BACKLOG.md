# GRIT Security Hardening Backlog

Baseado em validação real do projeto Supabase `gritnews` em 2026-08-23.

## Prioridade P0 — revisar antes de ampliar acesso administrativo

1. SECURITY DEFINER exposto ao papel `anon`
   - `public.get_marketing_runtime_config()`
   - Ação: confirmar necessidade pública. Se não for necessária, revogar `EXECUTE` de `anon` e expor apenas leitura segura necessária.

2. SECURITY DEFINER exposto a qualquer `authenticated`
   - `admin_clear_tenant_courtesy(uuid)`
   - `admin_customer_overview()`
   - `admin_customer_overview_period(timestamptz,timestamptz)`
   - `admin_grant_tenant_courtesy(uuid,text,integer,boolean)`
   - `admin_set_tenant_access(uuid,text)`
   - `admin_support_context(uuid)`
   - `admin_update_tenant_profile(uuid,text,text,text,text)`
   - `admin_waive_tenant_activation(uuid,text)`
   - `cancellation_eligibility(uuid)`
   - `customer_operation_history(uuid,uuid)`
   - `evaluate_growth_campaigns(boolean)`
   - `get_marketing_runtime_config()`
   - `manage_tenant_user_status(uuid,uuid,boolean)`
   - `set_marketing_runtime_config(...)`
   - Ação: inspecionar cada função antes de revogar. Funções administrativas devem validar explicitamente `admin_users`/papel privilegiado ou ter `EXECUTE` removido de `authenticated`.

## Prioridade P1 — RLS habilitado sem policy

Tabelas detectadas:
- `admin_customer_emails`
- `billing_webhook_events`
- `marketing_runtime_config`
- `tenant_courtesy_grants`

Ação: confirmar se são tabelas exclusivamente service-role/backend. Se houver acesso de usuário legítimo, criar policies mínimas por tenant/admin. Se forem backend-only, manter bloqueadas e documentar explicitamente.

## Regras de mudança

- Não revogar permissões em produção sem identificar consumidores atuais.
- Toda alteração de função/RLS deve ser feita via migration versionada.
- Executar testes positivos e negativos por perfil/tenant.
- `service_role` permanece exclusivamente server-side.
- Mudanças sensíveis devem gerar auditoria e rollback documentado.

## Critérios de aceite

- Supabase Security Advisor sem WARN externo não justificado.
- Nenhuma função administrativa executável por usuário comum sem autorização interna.
- Nenhum tenant consegue ler/escrever dados de outro tenant.
- Funções públicas documentadas e com menor privilégio possível.
