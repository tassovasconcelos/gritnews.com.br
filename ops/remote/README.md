# GRIT Remote Ops Kit

Este kit organiza a operação do ecossistema GRIT a partir de um notebook remoto, sem expor segredos no frontend.

## Objetivo
Centralizar links, rotina operacional, health checks e checklist de conexão Meta/WhatsApp/Google.

## Acessos principais
- GRIT Admin: https://gritnews.com.br/?view=admin
- GRIT Produtos: https://gritnews.com.br/produtos/
- Meu Espetinho: https://meuespetinho.gritnews.com.br/
- Landing Meu Espetinho: https://gritnews.com.br/produtos/meu-espetinho/
- SAC ProH: https://apps.sacproh.gritnews.com.br/
- Moacir Rocha: https://moacirrocha.adv.br/
- Meta Developers: https://developers.facebook.com/apps/
- Meta Business: https://business.facebook.com/
- Google Ads: https://ads.google.com/
- Google Search Console: https://search.google.com/search-console/
- Google Cloud Console: https://console.cloud.google.com/
- Supabase: https://supabase.com/dashboard
- GitHub: https://github.com/tassovasconcelos/gritnews.com.br
- Hostinger: https://hpanel.hostinger.com/

## Operação diária
1. Abrir o painel GRIT Admin e revisar leads novos.
2. Conferir Meta 100: leads, trials, primeira venda, assinaturas.
3. Validar saúde dos sites com `check-health.ps1`.
4. Abrir fila de prospecção e priorizar leads A/B.
5. Acompanhar campanhas Meta/Google quando conectadas.
6. Registrar objeções reais e motivos de perda.
7. Não enviar campanhas em massa sem opt-in/consentimento e políticas aplicáveis.

## Meta / WhatsApp
App: Meu Espetinho Growth
Casos de uso: Marketing API + WhatsApp Business Platform.

Para produção, manter segredos apenas no backend/Vault:
- META_APP_SECRET
- META_SYSTEM_USER_TOKEN
- META_AD_ACCOUNT_ID
- META_PIXEL_ID
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID
- WHATSAPP_VERIFY_TOKEN

Nunca salvar esses valores em arquivos versionados, Vite env público ou screenshots.

## Próxima configuração Meta
Se o número de teste não for provisionado, avance para configuração de produção e adicione um número comercial válido no WhatsApp Business Manager. Depois configure o webhook apontando para a Edge Function do Supabase. O callback deverá aceitar GET de verificação e POST de eventos.

## Scripts
- `open-grit-ops.ps1`: abre todos os painéis necessários no navegador padrão.
- `check-health.ps1`: testa disponibilidade dos principais sistemas.
