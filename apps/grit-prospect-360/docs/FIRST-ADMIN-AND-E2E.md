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


## Primeiro administrador — execução restrita (status 21/09/2026)

O proprietário indicou seu e-mail diretamente na solicitação operacional. Não gravar o endereço, tokens ou senha em arquivos públicos do repositório. O projeto alvo foi consultado: \`auth.users = 0\`, \`organizations = 0\`, \`memberships = 0\`. Nenhum convite foi emitido por esta integração, porque o conector disponível não oferece uma operação Auth Admin Invite e o endereço de retorno/SMTP ainda não foi homologado.

### Antes de enviar convite

- Confirmar implantação e disponibilidade HTTPS do frontend em \`https://prospect.gritnews.com.br/\`, cujo endereço é usado como redirect; a versão ainda está em branch de desenvolvimento e não está publicada.
- Configurar Supabase Auth → URL Configuration: Site URL e allowlist de redirect do projeto exclusivo. Verificar a jornada de convite/definição de senha e recuperação no frontend.
- Configurar SMTP institucional e testar entrega e resposta sem transferir configurações de outro produto.
- Guardar \`PROSPECT_SUPABASE_SERVICE_ROLE_KEY\` somente no cofre local/host de operação; nunca em GitHub, chat, Vite ou URL.
- Registrar aprovação do proprietário para envio e ativação; se o usuário já existir, o operador não reenvia convite automaticamente.

### Script preparado (NÃO EXECUTADO)

\`scripts/first-owner.mjs\` suporta \`status\`, \`invite\` e \`activate\` com Auth Admin SDK. Ele fixa o host do Supabase dedicado, exige correspondência do e-mail com a confirmação operacional, e bloqueia invite sem declarações explícitas de verificação do redirect e SMTP. Essas declarações são verificações humanas; não representam teste automático. O script não imprime tokens ou senhas.

\`db/migrations/0004_first_owner.sql\` cria uma RPC atômica, invocável apenas pelo papel \`service_role\`; ela não cria usuário Auth, não confirma e-mail e não altera credenciais. A CLI só a invoca após consultar Auth Admin e constatar e-mail confirmado. A tentativa de executar a RPC anonimamente deve ser rejeitada. Não chamar RPC diretamente com UUID arbitrário.

Após aceite do convite pelo destinatário, verificar confirmação de e-mail em Auth e executar \`activate\`. Registrar \`organization_id\` e verificar o papel \`owner\` em \`memberships\`. Não alegar entrega ou ativação com base na mera aceitação de uma chamada de convite.

Até completar essa jornada, login, homologação de isolamento e publicação permanecem bloqueados.
