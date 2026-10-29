# Operações compartilhadas

Componentes comuns a Meu Espetinho e Sr. Padeiro para personalização de recibos, impressão pelo navegador, importação/cadastro de produtos e equipe. Cada aplicativo fornece seu cliente Supabase e identifica `app` + `scopeId`; permissões são verificadas novamente no banco.

`pnpm --filter @gritnews/operations test` executa testes do parser/renderizador e da migração completa em PostgreSQL PGlite. O pacote mantém React 18 como os dois aplicativos.

Migração compartilhada: `apps/meu-espetinho/supabase/migrations/20261029141711_shared_operations_settings_catalog_team.sql`. Requer a fundação existente das duas verticais no mesmo banco e a migração fiscal anterior. Não aplicar independentemente em projetos sem essas tabelas.

Relatório e roteiro de homologação: `apps/meu-espetinho/docs/OPERATIONS-CONFIGURATION-REVIEW.md`.
