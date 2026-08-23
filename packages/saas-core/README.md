# GRIT SaaS Core

Motor compartilhado para criação e operação dos produtos SaaS da GRIT.

## Princípio
Novo produto deve nascer por configuração + módulos verticais, não por cópia integral de outro app.

## Contratos V1

### Product
Cada aplicação registra:
- `product_key`: identificador estável (`meu-espetinho`, `sr-padeiro`, etc.)
- nome comercial
- domínio
- identidade visual
- módulos habilitados
- plano/trial padrão
- canais comercial/suporte

### Access Status
Padrão único:
- `trial`
- `active`
- `barter` (permuta)
- `suspended`
- `cancelled`

### Roles
Core:
- `superadmin`
- `owner`
- `manager`
- `operator`
- `viewer`

Cada vertical pode mapear aliases (ex.: `cashier`, `stock`) para permissões granulares, sem criar acesso implícito.

### Lead lifecycle
- `new`
- `contacted`
- `qualified`
- `demo`
- `trial`
- `proposal`
- `won`
- `lost`

Campos mínimos: `product_key`, nome, negócio, telefone/email, consentimento, origem, UTM, gclid/fbclid, status, responsável, timestamps.

### Analytics events
Padrão mínimo:
- `landing_view`
- `lead_created`
- `signup_started`
- `signup_completed`
- `tenant_created`
- `first_value_completed`
- `returned_d1`
- `returned_d3`
- `returned_d7`
- `trial_started`
- `subscription_started`
- `subscription_suspended`
- `subscription_cancelled`
- `whatsapp_click`
- `support_requested`

Eventos verticais usam namespace: `srp.sale_completed`, `mes.order_closed` etc.

## Segurança
- Supabase Auth é fonte de identidade.
- Nenhuma senha em tabela de negócio ou código.
- `service_role` nunca no frontend.
- isolamento multi-tenant obrigatório por RLS.
- Super Admin explícito e auditável.
- ações sensíveis geram audit log.
- produção exige teste de isolamento entre tenants.

## Central comercial
Canal institucional: `contato@gritnews.com.br`.

Fluxo: aquisição -> lead -> qualificação -> trial/demo -> proposta -> cliente -> onboarding -> ativação -> retenção -> indicação.

## Gate de lançamento
Produto não recebe status `production-ready` sem:
1. build/CI verde;
2. Auth + recovery testados;
3. RLS/tenant isolation testados;
4. fluxo principal transacional testado;
5. mobile QA;
6. domínio + SSL;
7. landing/formulário/WhatsApp;
8. robots/sitemap/canonical;
9. analytics validado;
10. Super Admin e suspensão de acesso testados.
