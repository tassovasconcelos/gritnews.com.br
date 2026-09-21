# GP-021 — Bootstrap seguro e homologação do primeiro acesso

Estado: **procedimento preparado; nenhum usuário Auth nem membership criado**.

Alvo exclusivo: Supabase \`grit-prospect-360\`, ID \`qspluchjhnnzgbbgmsro\`, região \`sa-east-1\`.
Não reutilizar usuários, senhas, service_role keys ou tabelas de outros projetos.

## Gate de identificação

O proprietário informa explicitamente o e-mail profissional do primeiro administrador e confirma a organização comercial que possuirá os dados. Não inferir o e-mail a partir de outros projetos. Definir MFA para a conta administrativa e confirmar proteção contra senhas vazadas.

## Procedimento

1. Registrar baseline de migrations (\`0001\`, \`0002\`, \`0003\`) e verificar que o alvo é \`qspluchjhnnzgbbgmsro\`.
2. No Auth **exclusivo**, convidar o e-mail informado mediante canal seguro, sem armazenar senha nos arquivos ou URL.
3. Verificar no painel que o usuário foi criado; obter seu \`auth.users.id\` do mesmo projeto, sem copiar identificadores dos outros bancos.
4. No backend privilegiado, criar organização \`GRIT Soluções e Negócios\` se ainda não existir, e vincular o usuário ao papel \`owner\` em \`memberships\`. Não usar SQL com UUID inventado nem permitir autoatribuição pelo frontend.
5. Confirmar que o login devolve sessão do projeto correto; verificar SELECT de \`organizations\` e \`companies\` com o token do usuário (RLS). Confirmar que \`anon\` não possui privilégios.
6. Para homologar dois tenants, criar fixtures **sintéticas** somente em ambiente descartável de teste. Executar \`db/tests/0001_rls_isolation.sql\` com rollback e revisar o resultado. A tentativa anterior pela ferramenta foi bloqueada; execução ainda pendente.
7. Validar fluxo CSV preview → apply e repetir o arquivo. Conferir retorno \`already_applied\`, totais e auditoria. Testar tentativa de escrita com tenant diferente e permissões de viewer.
8. Verificar restauração de backup em destino isolado e documentar o RPO/RTO praticado.
9. Somente após segurança, teste e PR review, considerar decisão GO/NO-GO para publicação.

## Restrições

- Não executar \`restore_project\` contra o projeto atual, que é uma operação destrutiva.
- Não expor \`PROSPECT_SUPABASE_SERVICE_ROLE_KEY\` em \`VITE_*\`, GitHub source, browser, prints ou relatórios.
- Não trazer leads, pacientes ou dados reais do Meu Cuidador para fixtures.
- A aplicação e o importador permanecem em staging não configurado até aprovação. Código compilado ≠ operação homologada.

## Evidências mínimas do gate

- ID/URL do projeto confirmado e lista de migrations.
- ID da execução CI e commit SHA.
- Política e teste de isolamento com resultado observável por papel.
- Execução do lote sintético, reenvio idempotente, registro de auditoria e screenshot do painel.
- Evidência de restauração, autorização de release e plano de reversão.
