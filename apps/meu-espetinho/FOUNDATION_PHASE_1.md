# Meu Espetinho — Fase 1: Fundação

Esta etapa consolida a base técnica antes da evolução visual e do Super Admin 2.0.

## Entregue

- migrations versionadas no GitHub;
- estruturas de fiado e auditoria alinhadas ao código atual;
- função `current_user_tenants()` para resolução explícita do tenant autenticado;
- função transacional `close_order_atomic()` para fechamento financeiro atômico;
- limpeza de policies duplicadas;
- view `tenant_user_seat_summary` configurada como `security_invoker`;
- índices adicionais de FKs indicados pelo Supabase Advisor;
- workflow de deploy GitHub → Hostinger restaurado, com build, smoke test e artifact antes do FTPS.

## Regras para produção

1. Não publicar arquivos manualmente na Hostinger.
2. Toda alteração deve passar por branch + PR + CI.
3. O deploy de produção sai exclusivamente da `main`.
4. Credenciais ficam em GitHub Environment Secrets / Supabase Vault, nunca no repositório.
5. Mudanças de banco passam por migrations versionadas.

## Próximas tarefas da Fundação

- ligar o frontend a `current_user_tenants()`;
- trocar o fechamento atual por `close_order_atomic()`;
- namespacear/remover o LocalStorage operacional por tenant;
- ampliar smoke tests para autenticação e fluxo de venda;
- revisar policies antigas sinalizadas pelo Advisor;
- habilitar proteção contra senhas vazadas no Supabase Auth;
- confirmar os secrets do environment `production-meu-espetinho` antes do merge do workflow de deploy.
