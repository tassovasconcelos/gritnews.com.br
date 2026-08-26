# Super Admin Global GRIT

## Identidade canônica

- E-mail: `gritsolucoes@gmail.com`
- Papel: `superadmin`
- Escopo: todos os apps, tenants e módulos do ecossistema GRIT.

## Regra de segurança

A identidade é única, mas segredos não são compartilhados em código. A senha de login nunca deve ser igual à `SUPABASE_SERVICE_ROLE_KEY`, senha de banco, token de deploy ou qualquer chave de integração.

## Fonte central de verdade

No Supabase GRIT compartilhado:

- `public.admin_users` registra a identidade administrativa global.
- `auth.users.raw_app_meta_data.grit_role = superadmin`.
- `auth.users.raw_app_meta_data.grit_superadmin = true`.
- `public.is_grit_superadmin(uuid)` é a função padrão para autorização server-side/RLS.

## Contrato para todos os apps

1. Autenticar pelo Supabase Auth do ambiente.
2. Após autenticação, considerar Super Admin quando `public.is_grit_superadmin(auth.uid()) = true`.
3. Super Admin deve ignorar restrições de tenant/organização somente para funções administrativas previstas.
4. Não hardcodar senha ou service role no frontend.
5. Não criar credenciais paralelas por app para a identidade canônica.
6. Ambientes com Supabase próprio devem replicar apenas a identidade e o papel `superadmin` no respectivo Auth/banco, mantendo segredos independentes por ambiente.

## Apps do repositório central

- GRIT News
- GRIT Propostas
- Meu Espetinho
- Meu Orçamento
- Sr. Padeiro

## Projetos externos a alinhar ao mesmo contrato

- Meu Cuidador
- Moacir Rocha
- Procirúrgica Revenue Ops
- SACPROH
- SAC Trial
- DMP

## Regra operacional

`1 identidade GRIT -> 1 Super Admin global -> todos os produtos`, sem reutilizar senha de banco e sem expor chaves de infraestrutura.
