# Migrations — Meu Espetinho

As mudanças de banco do Meu Espetinho devem ser versionadas nesta pasta e aplicadas ao projeto Supabase `gritnews` na mesma ordem lógica.

## Convenção

- um objetivo por migration;
- nomes descritivos;
- preferir operações idempotentes quando possível;
- validar RLS e advisors de segurança/performance após DDL;
- nunca armazenar segredos, tokens ou credenciais SQL neste diretório.

## Estado atual

- `001_foundation_hardening.sql`: consolida estruturas consumidas pela aplicação, resolução explícita do tenant e fechamento atômico.
- `002_security_policy_cleanup.sql`: remove duplicações de policies e corrige itens de segurança/performance identificados pelos advisors.
