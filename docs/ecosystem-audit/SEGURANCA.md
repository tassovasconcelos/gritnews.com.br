# Segurança do ecossistema

## Controles aplicados em 23/08/2026

- dependências de produção auditadas: zero vulnerabilidades conhecidas;
- quatro RPCs deixaram de aceitar execução anônima;
- `search_path` do trigger de campanhas tornou-se determinístico;
- captura direta na tabela `leads` foi desativada;
- novos leads passam pela Edge Function, com allowlist de origem, honeypot, limites de tamanho e consentimento obrigatório;
- inserção no banco usa `service_role` somente no backend; a chave nunca é enviada ao navegador;
- logs do coletor não incluem nome, telefone, e-mail, token ou payload.

## Exceções revisadas

`get_marketing_runtime_config()` continua público e `SECURITY DEFINER` porque entrega somente IDs públicos de analytics, removendo `updated_by`. As RPCs administrativas autenticadas permanecem privilegiadas porque validam `admin_users`, acesso ao tenant ou concessão temporária de suporte dentro da própria função.

As tabelas internas com RLS e sem políticas são acessadas apenas pelo backend/service role. O aviso do linter é informativo e não justifica criar políticas públicas.

## Pendência no painel

Ativar a proteção contra senhas vazadas nas configurações do Supabase Auth. Essa opção depende do plano e do painel do projeto e deve ser confirmada após ativação.

## Rotina

1. Executar `pnpm audit --prod` antes de releases.
2. Rodar os advisors de segurança e performance após migrations.
3. Bloquear merges que adicionem segredos, `service_role` no frontend ou políticas RLS com `true` para dados privados.
4. Revisar funções `SECURITY DEFINER` e sempre fixar `search_path`.
