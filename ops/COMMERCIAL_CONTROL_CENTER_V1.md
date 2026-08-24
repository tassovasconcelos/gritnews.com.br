# GRIT Commercial Control Center V1

## Objetivo
Unir a telemetria técnica da Central de Apps com indicadores comerciais reais, sem fabricar métricas.

## Regras
- todo novo lead deve poder carregar `appId`;
- campos comerciais adicionais são opcionais para manter compatibilidade com leads existentes;
- leads legados sem `appId` permanecem como `Não classificados` e não são atribuídos artificialmente a nenhum produto;
- conversão por app usa apenas leads classificados daquele app;
- nenhum MRR, trial ou receita será exibido até existir fonte transacional confiável para o indicador;
- saúde técnica continua vindo de `/control-center/status.json`.

## Campos de lead V1
- `appId?: string`
- `source?: string`
- `campaign?: string`
- `owner?: string`
- `nextAction?: string`
- `nextActionAt?: string`

## KPIs disponíveis com a base atual
- total de leads classificados;
- novos;
- contatados;
- qualificados;
- convertidos;
- taxa de conversão por produto, apenas quando houver leads classificados;
- leads não classificados, para saneamento de base.

## Próxima fase
Instrumentar trials, ativações, assinaturas, MRR e churn por eventos persistidos no backend/Supabase de cada app, consolidando somente agregados sanitizados na Central GRIT.
