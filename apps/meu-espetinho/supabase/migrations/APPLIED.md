# Estado de aplicação

Projeto Supabase: `gritnews` (`pcrwtoddavpvkaxwtstc`).

Aplicadas em 2026-08-17:

- `meu_espetinho_foundation_hardening`
- `meu_espetinho_security_policy_cleanup`

Após as alterações, os advisors foram executados. O erro de view `security definer` foi tratado configurando `tenant_user_seat_summary` como `security_invoker`.

Pendências operacionais que não devem ser automatizadas sem validação do ambiente:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- confirmar secrets do environment de produção no GitHub;
- conectar o frontend às novas RPCs em PR separado ou continuação desta branch com testes específicos.
