# Migrations — Meu Espetinho

Este diretório passa a ser a referência versionada das mudanças estruturais do banco do Meu Espetinho.

## Regras

1. Toda alteração de DDL deve nascer como migration versionada antes de evoluir o frontend dependente.
2. O Supabase é a fonte oficial dos dados operacionais e financeiros.
3. Cache local é apenas contingência e deve permanecer isolado por `tenant_id`.
4. Fechamentos financeiros devem ocorrer por operação transacional (`close_order_atomic`).
5. O tenant autenticado deve ser resolvido explicitamente (`current_user_tenants`) e nunca por SELECT genérico com `limit(1)`.
6. Após DDL relevante, executar Advisors de segurança e performance e registrar correções necessárias.
7. Nunca armazenar `service_role`, Access Token do Mercado Pago ou credenciais FTP no frontend/repositório.

## Estado atual

A Fase 1 conecta o frontend às RPCs de resolução de tenant e fechamento atômico, restaura deploy automatizado e isola o cache local por tenant. A próxima camada é ampliar testes de fluxo e evoluir o Design System/Super Admin sem reintroduzir dependência de estado local compartilhado.
