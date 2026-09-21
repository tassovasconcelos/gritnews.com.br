# GP-DEPLOY-001 — Acesso web do GRIT Prospect 360

Estado (2026-09-21): plano de implantação, **não executado**.
PR #133 permanece draft, sem merge. O CI cria e guarda por sete dias um build
estático **sem as variáveis do projeto**; este build NÃO deve ser publicado
como uma aplicação funcional. Não reutilizar o hook do workflow auto-deploy da
GRIT News: ele aponta para outra aplicação e faz verificações do Meu Espetinho.

## Alvos reservados, não publicados

- Interface SPA: \`https://prospect.gritnews.com.br/\`
- API Node: \`https://api.prospect.gritnews.com.br/\`
- Supabase exclusivo: \`https://qspluchjhnnzgbbgmsro.supabase.co/\`
- Organização comercial: GRIT Soluções e Negócios; primeiro e-mail autorizado
  definido pelo proprietário e mantido fora do repositório.

**Atenção:** estes endereços são destinos planejados, não disponibilidade
confirmada. O único conector Hostinger disponível neste contexto lista sites do
Hostinger AI Builder e retornou lista vazia; ele NÃO dá acesso ao hPanel,
arquivos de hospedagem ou DNS deste subdomínio. O site existente pode estar
hospedado de outro modo; não inferir sua configuração. A consulta web ao endereço
da interface não foi bem-sucedida, o que NÃO prova que o DNS esteja ausente.

## Porta de implantação (exigida antes de enviar convite)

1. Identificar onde a zona \`gritnews.com.br\` é administrada e qual plano de
   hospedagem suportará a interface e um processo Node contínuo. Não criar
   site paralelo nem alterar o domínio dos demais produtos.
2. Reservar DNS e TLS para interface e API no ambiente escolhido. Verificar que
   HTTP redireciona para HTTPS e que ambos os certificados são válidos.
3. Preparar dois serviços: arquivos Vite servidos como SPA na interface, Node
   \`src/api-server.mjs\` atrás de proxy TLS na API. Não presumir que uma
   hospedagem estática execute a API Node. Evitar publicar endpoints antes
   da configuração de autenticação e limite de requisições.
4. Configurar a interface exclusivamente com
   \`VITE_PROSPECT_SUPABASE_URL\`, \`VITE_PROSPECT_SUPABASE_ANON_KEY\` e
   \`VITE_PROSPECT_API_BASE_URL\` do projeto dedicado. A chave pública é
   utilizável pelo navegador, mas não concede bypass de RLS.
5. Configurar API em um gerenciador seguro com
   \`PROSPECT_SUPABASE_URL\`, \`PROSPECT_SUPABASE_SERVICE_ROLE_KEY\`,
   \`PROSPECT_ALLOWED_ORIGIN\`, \`HOST\` e \`PORT\`. O serviço valida o host
   Supabase exclusivo. Nunca publicar \`service_role\` em JS, variáveis VITE,
   Git, telemetria ou logs; restringir processos, IPs, CORS e rede.
6. Obter build da interface após instalar dependências com
   \`pnpm install --frozen-lockfile\` e executar
   \`pnpm exec vite build --config apps/grit-prospect-360/web/vite.config.mjs\`.
   Configurar rewrite SPA para \`/index.html\`; não reutilizar saídas do site
   GRIT News. Opcionalmente baixar o artefato de CI para conferência
   estática sem credenciais, não como pacote pronto para produção.
7. Testar \`GET /health\`: ele verifica apenas o processo HTTP e sempre marca
   \`database_verified=false\`. Não declarar o Supabase funcional só porque
   health retornou 200.
8. Na página de configuração do Auth do **Supabase exclusivo**, cadastrar
   Site URL e redirect allowlist em HTTPS do Prospect. Configurar e testar SMTP
   institucional, convite, redefinição de senha e expiração. Não transportar
   SMTP/templates do Meu Cuidador ou Meu Espetinho sem avaliação.
9. Convidar o primeiro administrador apenas via Auth Admin com e-mail
   autorizado. Após confirmação do e-mail, executar o script controlado de
   bootstrap, verificar associação \`owner\` e exigir MFA apropriado.
10. Em staging, testar sessões de dois tenants, aprovação social, prévia e
    importação sintética transacional, idempotência, backup/restauração,
    revisão LGPD e limites de uso. Registrar resultado das evidências.
11. Requer revisão do PR e decisão explícita GO para uso real. Manter
    lançamento bloqueado se qualquer gate crítico falhar.

## Evidência de não publicação

Não foi detectado website Prospect no conector Hostinger AI Builder disponível.
Não há integração de publicação para o hPanel conectada a esta conversa.
Não há secrets de API/SMTP operacionais aqui. O administrador Auth não foi
provisionado na última consulta. Nenhum deploy, convite ou teste E2E foi
executado por este runbook. As migrations 0001–0007 foram aplicadas somente
ao Supabase exclusivo e o banco permaneceu sem registros.

## Plano de reversão

Preservar a branch/PR e cópias versionadas dos assets; se um staging separado
for posteriormente criado, remover sua exposição pública e revogar seus
segredos próprios caso haja incidente. Não restaurar, pausar, apagar ou migrar
o Supabase compartilhado. Restaurar o projeto dedicado somente de backup
testado, em janela aprovada, nunca por comando automático deste roteiro.
