# Integrações e credenciais

## Estado atual

| Provedor | Concluído | Pendente |
|---|---|---|
| Supabase | CRM, leads, consentimento, atribuição, campanhas planejadas e funções ativas | Corrigir alertas de segurança em mudança dedicada |
| Google Cloud | Google Ads API habilitada; OAuth desktop criado; ID e segredo no Vault | Refresh token e developer token de conta administradora |
| Google Search Console | Domínio GRIT e Meu Espetinho mapeados; sitemaps processados | Confirmar sitemap dedicado do Sr. Padeiro |
| Meta | Portfólio, página, Instagram e WhatsApp de teste identificados | Conta de anúncios, pixel, verificação, usuário de sistema e token |
| WhatsApp | Conta de teste aprovada | Número produtivo, moeda/fuso, template e webhook |

## Política de segredos

Credenciais ficam no Supabase Vault ou em secrets do provedor de deploy. Nunca registrar valores em Markdown, `.env.example`, frontend, issue, PR ou log. Arquivos `.env.example` contêm somente nomes das variáveis.

## Ativação

Só habilitar `provider_sync_enabled` após teste controlado, IDs externos válidos e logs sem dados pessoais. Campanhas permanecem pausadas até orçamento e criativos receberem aprovação humana.
