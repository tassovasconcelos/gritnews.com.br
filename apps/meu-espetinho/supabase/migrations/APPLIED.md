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
- `security_rpc_hardening`
  - execução anônima removida de quatro RPCs privilegiadas;
  - `search_path` determinístico no trigger de campanhas.
- `leads_backend_only`
  - inserção direta anônima/autenticada removida da tabela `leads`;
  - captura pública restrita à Edge Function validada;
  - `service_role` mantido exclusivamente no backend.

Aplicadas em produção em 24/08/2026 e refletidas na base consolidada:

- `grit_lead_intelligence_v41`;
- `lead_cadence_engine_v43`;
- `lead_cadence_automation_worker`;
- `lead_segmentation_conversion_v1`;
- `lead_segment_message_resolution_v1`;
- `expand_leads_products_wave01_clinic`;
- `harden_grit_lead_function_search_paths`;
- `restrict_internal_lead_engine_rpcs`;
- `restrict_marketing_runtime_config_anon`.

Efeito confirmado: processamento interno e cadências restritos ao `service_role`; classificação e resolução de mensagens disponíveis apenas a usuários autenticados e ao backend; execução anônima removida das rotinas internas.

Frontend da branch `feat/meu-espetinho-fase-1-foundation` já conectado a:

- `current_user_tenants()` para resolução explícita do ambiente autenticado;
- `close_order_atomic()` para fechamento financeiro transacional;
- cache local isolado por `tenant_id`, sem reaproveitar a chave legada compartilhada.

A aplicação continua usando o Supabase como fonte oficial e o cache local apenas como contingência de interface.
