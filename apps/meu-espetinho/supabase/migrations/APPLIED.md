# Migrations aplicadas — Meu Espetinho

Projeto Supabase: `gritnews` (`pcrwtoddavpvkaxwtstc`)

Aplicadas em produção controlada durante a Fase 1:

- `meu_espetinho_foundation_hardening`
  - estruturas de crédito e atividade versionadas;
  - RPC `current_user_tenants()`;
  - RPC `close_order_atomic()`;
  - índices básicos de apoio.
- `meu_espetinho_security_policy_cleanup`
  - remoção de policies duplicadas;
  - view de assentos ajustada para `security_invoker`.
- `meu_espetinho_advisor_followup`
  - índices adicionais indicados pelos Advisors.

Frontend da branch `feat/meu-espetinho-fase-1-foundation` já conectado a:

- `current_user_tenants()` para resolução explícita do ambiente autenticado;
- `close_order_atomic()` para fechamento financeiro transacional;
- cache local isolado por `tenant_id`, sem reaproveitar a chave legada compartilhada.

A aplicação continua usando o Supabase como fonte oficial e o cache local apenas como contingência de interface.
