# Dossiê do ecossistema GRIT

Atualizado em 23/08/2026 a partir da branch `agent/remote-ops-kit` (PR #76), dos domínios públicos e da configuração operacional validada.

## Conteúdo

- `RESUMO-ATUALIZACOES.md`: melhorias entregues e estado atual.
- `COMPARATIVO-LOCAL-PUBLICADO.md`: diferenças entre repositório, branch da PR e produção.
- `MANUAL-OPERACIONAL.md`: rotina segura de operação, publicação e growth.
- `MANUAL-APPS.md`: finalidade, entrada, saída e próximos passos de cada produto.
- `INTEGRACOES-E-CREDENCIAIS.md`: conexões Meta, Google, WhatsApp e Supabase sem expor segredos.
- `CATALOGO-DE-MARCA.md`: inventário dos logos e regras mínimas de uso.
- `assets/`: cópias organizadas dos ativos oficiais já versionados.

## Fonte de verdade

O código versionado é a fonte técnica. O Supabase `gritnews` é a fonte operacional de leads e atribuição. Produção deve ser comparada com ambos antes de qualquer deploy. Segredos permanecem exclusivamente no Vault/backend.
