# GRIT Prospect 360 — Gate de publicação do primeiro acesso

Status: PREPARADO, **NÃO publicado**. Atualização: 2026-09-21.
Alvo exclusivo: Supabase \`qspluchjhnnzgbbgmsro\`, região \`sa-east-1\`.
Domínio planejado: \`https://prospect.gritnews.com.br/\`.
API planejada: \`https://api.prospect.gritnews.com.br/\`.

## Inventário e impedimento atual

O aplicativo está exclusivamente na branch \`feat/grit-prospect-360-mvp-foundation-20260921\`, PR #133 draft. O fluxo atual do monorepo \`.github/workflows/auto-deploy.yml\` tem destino para outros produtos e utiliza um hook de Hostinger da branch \`main\`; **não usar esse hook no Prospect**. O aplicativo não está vinculado a um site Hostinger AI Builder retornado pelo conector. A URL pública não foi verificada como acessível e a API ainda não possui ambiente de execução. Não anunciar acesso como ativo.

A CLI \`scripts/first-owner.mjs\` necessita um redirect HTTPS verificado e entrega SMTP configurada para solicitar convite. Em consultas anteriores o Supabase dedicado possuía zero usuários Auth, organizações, memberships, empresas e candidatos. Reconsultar antes de qualquer ação.

## Infraestrutura — ordem obrigatória

1. Escolher e vincular explicitamente o serviço de hospedagem do novo app, separado dos sites GRIT News/Meu Cuidador. Conferir titularidade do domínio \`gritnews.com.br\` e autorização para alterar os dois subdomínios. O conectador Hostinger AI Builder não enxerga este site; não criar outro site apenas para simular implantação do código existente.
2. Frontend: site estático Vite com HTTPS e fallback de SPA para index.html. Requisitar política \`noindex\` até o release formal, headers de segurança e registro de versão. \`VITE_PROSPECT_SUPABASE_URL\` deve ser EXATAMENTE \`https://qspluchjhnnzgbbgmsro.supabase.co\` e \`VITE_PROSPECT_SUPABASE_ANON_KEY\` ou publishable key compatível são valores PÚBLICOS do MESMO projeto. \`VITE_PROSPECT_API_BASE_URL\` é a API separada em HTTPS. **Nunca** incluir service-role/token de API em VITE_.
3. Backend: serviço Node >=22 com \`api-server.mjs\`, sem exposição direta desprotegida, usando um manager de segredos próprio. Exigir \`PROSPECT_SUPABASE_URL\` do projeto exclusivo, \`PROSPECT_SUPABASE_SERVICE_ROLE_KEY\` backend-only e \`PROSPECT_ALLOWED_ORIGIN=https://prospect.gritnews.com.br\`. O endpoint \`/health\` atesta apenas processo e retorna \`database_verified:false\`.
4. DNS e TLS: cadastrar A/CNAME específicos para cada subdomínio no provedor escolhido; verificar certificados, rota da SPA, CORS e nenhum redirecionamento para os demais apps. Não alterar \`gritnews.com.br\` raiz nem \`meucuidadorapp.com.br\`.
5. Auth do Supabase exclusivo: Site URL \`https://prospect.gritnews.com.br/\` e allowlist de redirect correspondente; configurar SMTP institucional, testar entrega/recuperação, proteção de senhas, limite de envio e MFA para administrador.
6. Executar \`scripts/first-owner.mjs status\` usando chaves no cofre. Solicitar invite **somente após** todos os checks; aguardar o aceite do e-mail informado pelo proprietário e sua confirmação no Auth; executar activation sem forjar UUID/credenciais. Nunca persistir o e-mail do proprietário em repositório público.
7. Testar isolamento com dois tenants, papéis \`anon/viewer/operator/admin\` e IDs reais de contas de teste em ambiente descartável; testar fila social pendente, revisão humana, bloqueio de associação não aprovada, importação CSV, reenvio e idempotência.
8. Homologar backup e restauração em destino isolado; documentar rollback do release com versão anterior, sem truncar banco nem apagar dados.
9. Verificar o URL externo a partir de navegador sem sessão e com conta homologada; aprovação de GO formal. Somente depois informar a página como ativa.

## Verificações a registrar por evidência

- Commit SHA, CI de testes e build concluídos; resultado de vulnerabilidades.
- DNS, TLS e HTTP status do domínio e da API; headers; SPA fallback; noindex.
- Auth redirects permitidos, SMTP e recibo de entrega (sem tokens).
- Roles, RLS cross-tenant, API e banco com dados sintéticos, export do plano de backup.
- Decisão GO/NO-GO, homologador, data e comprovante de ausência de alterações em projetos compartilhados.

## Links

- PR de desenvolvimento: https://github.com/tassovasconcelos/gritnews.com.br/pull/133
- CI isolado: https://github.com/tassovasconcelos/gritnews.com.br/actions/workflows/grit-prospect-360-ci.yml
- Painel Supabase EXCLUSIVO: https://supabase.com/dashboard/project/qspluchjhnnzgbbgmsro

Nenhuma etapa de provisionamento Auth, conexão às redes sociais ou envio comercial é automaticamente autorizada por este documento.
