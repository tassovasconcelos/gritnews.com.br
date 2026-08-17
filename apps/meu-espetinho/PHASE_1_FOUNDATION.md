# Fase 1 — Fundação do Meu Espetinho

Objetivo: reduzir risco operacional antes de acelerar identidade, aquisição e Super Admin 2.0.

## Concluído

- branch isolada `feat/meu-espetinho-fase-1-foundation`;
- migrations versionadas para estruturas já utilizadas pela aplicação;
- RPC `current_user_tenants()` criada e conectada ao frontend;
- resolução explícita do tenant autenticado;
- RPC `close_order_atomic()` criada e conectada ao fechamento da venda;
- pedido + pagamento/fiado persistidos de forma transacional;
- cache local isolado por `tenant_id`;
- chave local legada compartilhada deixou de ser lida pela aplicação;
- Supabase mantido como fonte oficial dos dados;
- limpeza de policies duplicadas relevantes;
- view `tenant_user_seat_summary` ajustada para `security_invoker`;
- índices de apoio adicionados conforme Advisors;
- workflow de deploy GitHub → Hostinger restaurado;
- documentação de migrations e arquitetura atualizada.

## Validação antes do merge

- Meu Espetinho CI: build + smoke test;
- CI geral do repositório;
- revisar resultado dos checks do PR;
- confirmar secrets do environment `production-meu-espetinho` antes de qualquer deploy;
- não realizar upload manual na Hostinger.

## Pendências não bloqueantes para a próxima fase

- ampliar E2E autenticado com cenário real de cadastro/login/tenant/venda/fechamento;
- habilitar proteção contra senhas vazadas no Supabase Auth;
- continuar saneamento dos avisos de performance/RLS antigos sem alterar comportamento da produção;
- preparar staging dedicado quando houver volume maior de mudanças.

## Próxima fase

Após o PR estabilizar e ficar verde:

1. Brand System oficial do manual Meu Espetinho;
2. favicon/ícones/logo únicos em toda a aplicação;
3. Super Admin 2.0 com Cliente 360;
4. saúde do assinante, billing, comunicação e upsell;
5. cadastro/onboarding orientado à conversão;
6. analytics e aquisição com dados reais.
