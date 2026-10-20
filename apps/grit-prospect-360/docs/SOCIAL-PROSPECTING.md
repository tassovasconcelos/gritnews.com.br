# GRIT Prospect 360 — Instagram e LinkedIn (SOC-001)

Status 21/09/2026: cadastrado como módulo de desenvolvimento. Sem OAuth, scraping, pesquisas reais, coleta de perfis pessoais, disparos, follow-ups automáticos, publicação ou contas conectadas. Supabase dedicado: qspluchjhnnzgbbgmsro.

## Referência visual

A arte de referência do usuário apresenta uma plataforma concorrente de captação, qualificação, dashboard, mensagens e follow-up. Os números da arte (ex.: 185 leads, 34 qualificados) são marketing da referência, NÃO resultados do GRIT. Nossa entrega organiza a jornada pela segurança, proveniência e reconciliação com o cadastro empresarial, sem reproduzir funcionalidades indisponíveis das APIs.

## Pipeline

1. Partir do cadastro empresarial: CNPJ, nome e região previamente registrados e com origem autorizada.
2. Buscar/indicar URLs de **páginas corporativas** de forma manual pelo operador, por canal institucional de entrada ou API oficial aprovada, conforme disponibilidade.
3. Normalizar \`platform + account_key\` por organização; rejeitar URL de pessoa do LinkedIn, redirecionamentos, URLs com parâmetros e nomes inválidos.
4. Registrar em \`social_prospect_candidates\`, estado \`pending\`; repetir perfil retorna \`already_exists\`. O mesmo CNPJ não é inventado a partir de uma rede social.
5. Validação humana: confirmar identidade empresarial, site/CNPJ independente e autorização/finalidade. Rejeitar homônimos, duplicatas e registros sem fundamento.
6. Relacionar \`company_id\` somente após conferência (FK composto por organização impede associação cruzada). Futuras integrações com leads/CRM exigem políticas e migração próprias.
7. Interação comercial deve usar canais permitidos, base legal e preferências de contato; nenhum disparo social está habilitado.

## Instagram

- Base inicial: cadastro de página empresarial fornecida pelo operador.
- Futuro conector via **Meta Instagram API with Facebook Login**, apenas com conta profissional/Página vinculada, escopos, revisão e finalidade aprovados. Recursos variam; verificar elegibilidade de Business Discovery e hashtag search para o app e versão em uso.
- Mensagens por API: responder a conversas em condições autorizadas quando o usuário tiver iniciado a interação; não usar API para DMs frias em massa. O envio permanece desativado no banco e no código.
- Não copiar cookies de sessão, não automatizar a interface web, não solicitar credenciais Instagram ao usuário.

## LinkedIn

- Base inicial: referência de página **/company/** fornecida pelo operador/empresa ou canal institucional próprio. Nunca /in/, posts pessoais, listas de seguidores ou contatos.
- Marketing APIs não autorizam uso de dados de membros para identificar prospects, enriquecer CRM ou enviar mensagens de massa. Portanto, não construir raspador ou busca automatizada de pessoas.
- Futuro: **Lead Sync API** somente para Lead Gen Forms controlados pela empresa, após aprovação de produto/escopo (incluindo r_marketing_leadgen_automation onde exigido), autorização e verificação de finalidade. Respostas de formulários e dados pessoais requerem governança específica e não são gravados pela migration SOC-001.
- Não automatizar convites, conexões ou InMail sem integração formal autorizada; zero follow-ups automáticos nesta versão.

## Segurança e isolamento

- Migration 0005 em Supabase exclusivo: \`social_prospect_candidates\` + \`social_channel_config\`, RLS em ambas. Leitura só para membros da organização.
- Inserção apenas via backend que valida JWT, permissão owner/admin/operator e proveniência manual. Admin API do provedor somente por fluxo próprio após aprovação, nunca permitindo que o cliente forje uma origem oficial.
- Unicidade (organization_id, platform, account_key); FK (organization_id, company_id) evita associar empresa de outro tenant.
- \`outbound_enabled=false\` é um CHECK de banco: nem role privilegiada consegue ativar envio social por simples configuração.
- \`discovery_enabled=false\` por padrão; LinkedIn não oferece pesquisa genérica de prospects pela configuração.
- Tokens OAuth de redes sociais não estão modelados nem salvos. Não colocar segredos em VITE_ ou em logs; apenas manager seguro de segredos.

## Endpoints do MVP (não publicados)

\`POST /api/v1/social-candidates\` com JWT exclusivo, \`organization_id\` e \`candidate\` contendo \`platform\`, \`profile_url\`, \`company_label\`, \`source_kind='manual_corporate_url'\`. Retorna \`pending_review\` ou \`already_exists\`. O cliente autenticado lê sua fila via RLS. Não há endpoint para envio de mensagens.

## Gates de homologação

- Provisionar e confirmar primeira conta administrativa Auth (ainda não efetuado).
- Testar duas organizações, papéis e concorrência de registros em sessão real; rollback das fixtures.
- Definir consentimento/finalidade e janela de retenção; avaliar requisitos LGPD com responsável.
- Conectar contas oficiais e obter aprovações formais específicas; comprovar limite/rate do provedor.
- Testar webhooks assinados, tratamento de resposta, opt-out e políticas de comunicação antes de qualquer integração de mensagem.
- Revisar segurança, backup/restauração e publicar somente após GO explícito.

## Fontes técnicas (checadas 21/09/2026)

- Meta Instagram API: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Meta Send API: https://www.postman.com/meta/instagram/folder/uxudqu0/send-api
- LinkedIn Marketing API restricted uses: https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases?view=li-lms-2026-03
- LinkedIn Lead Sync access: https://learn.microsoft.com/en-us/linkedin/marketing/lead-sync/getting-access-leadsync?view=li-lms-2026-03


## Revisão humana implementada (SOC-002)

- Migrations \`0006_social_review\` e \`0007_review_link_guard\` aplicadas SOMENTE ao Supabase exclusivo: pendentes/reprovados não podem ter \`company_id\`; aprovados precisam de \`company_id\`, \`reviewer_user_id\`, \`reviewed_at\` e motivo de 12 a 500 caracteres.
- A API \`POST /api/v1/social-candidates/review\` valida a sessão, exige \`owner\` ou \`admin\`, e chama a função transacional restrita ao backend; não permite aprovação anônima, de operador ou viewer.
- A tela permite informar CNPJ exato da empresa já cadastrada, validar no tenant e registrar aprovação ou reprovação com justificativa. A presença da página social isoladamente NÃO comprova identidade empresarial.
- A revisão é auditada, idempotente para a mesma decisão do mesmo revisor, e **não autoriza nem dispara mensagens**.
- Pendência: testes reais de permissão RLS, Auth inicial, persistência E2E e restauração antes de publicar.
