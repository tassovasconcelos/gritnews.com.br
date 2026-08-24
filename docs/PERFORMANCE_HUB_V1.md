# GRIT Performance Hub V1

## Objetivo
Centralizar métricas reais e auditáveis de Google Analytics 4, Google Search Console, Instagram/Facebook, Meta Ads e eventos próprios dos produtos GRIT.

## Regra de integridade
- Nenhuma métrica de exemplo pode aparecer como real.
- Todo KPI precisa carregar origem, período, timestamp da coleta e estado da integração.
- Falha de um conector não pode derrubar o dashboard inteiro.
- Tokens e chaves privadas nunca devem ser expostos em variáveis `VITE_*` ou no bundle do navegador.

## Fontes
### Dados internos
Eventos dos apps GRIT: page_view, cta_click, whatsapp_click, lead_created, trial_started, signup_completed, checkout_started, subscription_started, payment_approved e subscription_cancelled.

### Google Analytics 4
Conector server-side para histórico e realtime. Métricas principais: activeUsers, sessions, newUsers, engagedSessions, conversions/key events e revenue quando aplicável.

### Search Console
Conector server-side para clicks, impressions, ctr, position, query, page, device e country.

### Meta
- Graph API / Insights para Facebook Pages e Instagram profissional.
- Marketing API para campanhas, conjuntos, anúncios, spend, impressions, reach, clicks, leads e métricas derivadas.

## Endpoint público do frontend
O frontend deve consumir somente `/api/performance/*` (ou `VITE_PERFORMANCE_API_BASE`).

Endpoints planejados:
- `GET /api/performance/overview`
- `GET /api/performance/projects`
- `GET /api/performance/integrations`
- `GET /api/performance/ga4/realtime`
- `GET /api/performance/ga4/report`
- `GET /api/performance/search-console`
- `GET /api/performance/meta/organic`
- `GET /api/performance/meta/ads`

## Variáveis server-side planejadas
Estas variáveis pertencem ao runtime do backend/secret manager e não ao Vite:

- `GOOGLE_SERVICE_ACCOUNT_JSON` ou referência segura equivalente
- `GOOGLE_GA4_PROPERTY_*`
- `GOOGLE_SEARCH_CONSOLE_SITE_*`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_SYSTEM_USER_ACCESS_TOKEN`
- `META_AD_ACCOUNT_*`
- `META_PAGE_ID_*`
- `META_IG_BUSINESS_ACCOUNT_ID_*`

## Persistência mínima
Tabela sugerida `performance_snapshots`:
- id
- project_id
- source
- metric
- dimension_key
- dimension_value
- period_start
- period_end
- value_numeric
- collected_at
- freshness
- raw_ref opcional

Tabela `performance_integrations`:
- project_id
- source
- status
- last_success_at
- last_attempt_at
- last_error
- config_ref

## Produtos V1
- gritnews
- meu-espetinho
- sr-padeiro
- meu-orcamento
- grit-propostas

## Ordem de implantação
1. Dashboard auditável e catálogo de integrações.
2. GA4 server-side.
3. Search Console server-side.
4. Meta orgânico.
5. Meta Ads.
6. Funil unificado lead -> trial -> assinatura -> receita.
7. CAC, LTV, ROAS, alertas e anomalias.

## Critério de pronto
Um conector só muda para `connected` quando uma chamada real à API oficial retorna com sucesso e o timestamp da última coleta é persistido.