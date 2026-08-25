# Manual operacional

## Rotina diária

1. Executar `ops/remote/check-health.ps1`.
2. Verificar novos leads, consentimento, produto, origem e score no CRM.
3. Tratar primeiro leads A; registrar contato, resultado e próxima ação.
4. Conferir falhas das Edge Functions sem copiar dados pessoais para logs.
5. Validar campanhas e métricas; manter sincronização desligada quando faltar ID externo ou credencial.

## Publicação segura

1. Confirmar qual app e domínio serão alterados.
2. Comparar a branch com o commit atualmente publicado.
3. Executar typecheck, build e smoke test do app afetado.
4. Revisar sitemap, robots, canonical, manifest e formulários.
5. Publicar por pipeline rastreável e registrar commit, data e responsável.
6. Repetir health check e uma validação controlada sem dados pessoais reais.

## Growth e leads

- Roteie sempre por `product` e preserve first-touch/last-touch.
- Nunca envie contato sem consentimento ou base legal documentada.
- Meta Lead Ads entra por webhook assinado; Google entra com `gclid`/UTMs.
- Receita confirmada retorna aos canais apenas com identificadores permitidos.
- Orçamento, campanha ativa, cobrança e disparo em massa exigem aprovação humana final.

## Incidente

Se houver falha de captura, pause mídia relacionada, preserve logs técnicos, confirme o endpoint e restaure a última versão saudável. Não remova leads nem regrave atribuição original.
