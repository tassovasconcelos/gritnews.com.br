# Checklist de conexões Growth

## Meta

- [ ] Confirmar Business Manager, app `Meu Espetinho Growth`, conta de anúncios e usuário do sistema.
- [ ] Autorizar Marketing API, Lead Ads e WhatsApp Business Platform somente nos ativos necessários.
- [ ] Gravar no Vault: `META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PIXEL_ID`, `META_ADS_ACCESS_TOKEN`.
- [ ] Gravar no Vault: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_VERIFY_TOKEN`.
- [ ] Configurar webhook HTTPS para verificação GET e eventos POST.
- [ ] Mapear formulário/campanha para `product`, UTMs e fila de destino.
- [ ] Testar lead controlado, deduplicação, opt-in e resposta.
- [ ] Vincular `external_campaign_id` e só então habilitar `provider_sync_enabled`.

## Google

- [ ] Confirmar Google Ads manager/customer e projeto no Google Cloud.
- [ ] Habilitar Google Ads API e consent screen OAuth.
- [ ] Gravar no Vault: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.
- [ ] Definir `GTM_ID`, `GA4_MEASUREMENT_ID`, `GOOGLE_ADS_ID` e labels de conversão.
- [ ] Vincular Search Console aos domínios e GA4/Ads.
- [ ] Capturar `gclid` e UTMs no primeiro acesso e conservar na conversão.
- [ ] Importar conversões confirmadas de lead/trial/assinatura.
- [ ] Vincular IDs externos e só então habilitar sincronização.

## Validação

- [ ] `capture-lead` aceita lead de teste e grava `product`, UTMs, click IDs e consentimento.
- [ ] Roteamento envia o lead para a ferramenta/fila correta.
- [ ] `growth-sync` retorna sucesso para cada provedor.
- [ ] Métricas aparecem em `marketing_campaign_metrics`.
- [ ] Receita confirmada aparece em `marketing_conversion_events`.
- [ ] Logs não contêm tokens, telefone completo ou e-mail em texto aberto.
- [ ] Campanhas e mensagens permanecem pausadas até aprovação humana.
