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

Aplicadas em 24/08/2026 para escala multicanal responsável:

- `compliant_multichannel_lead_growth` — atribuição de origem, consentimento por canal, fila protegida, limites de frequência e pausa em resposta;
- `expand_outreach_queue_guards` — canais Meta e estados operacionais de conformidade.

Aplicada em produção em 25/08/2026:

- `atomic_lead_dispatch_claim` — reserva atômica dos itens da fila, estado `processing`, limite de cinco tentativas, recuperação de reservas travadas após 15 minutos e proteção dos estados finais contra retorno indevido a `ready`.

A Edge Function `lead-dispatch` correspondente foi publicada no projeto `gritnews`. Teste sem `x-dispatch-secret` retornou `401 unauthorized`, confirmando execução ativa e bloqueio de chamadas não autorizadas sem consumir a fila.

Frontend da branch `feat/meu-espetinho-fase-1-foundation` já conectado a:

- `current_user_tenants()` para resolução explícita do ambiente autenticado;
- `close_order_atomic()` para fechamento financeiro transacional;
- cache local isolado por `tenant_id`, sem reaproveitar a chave legada compartilhada.

A aplicação continua usando o Supabase como fonte oficial e o cache local apenas como contingência de interface.
