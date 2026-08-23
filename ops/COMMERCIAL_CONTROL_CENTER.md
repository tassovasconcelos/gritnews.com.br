# GRIT Commercial Control Center

## Objetivo
Uma única operação comercial para todos os produtos GRIT. Nenhum produto mantém um funil paralelo como fonte oficial. Toda aquisição deve convergir para a base central de leads e oportunidades.

## Produtos iniciais
- `meu-espetinho`
- `sr-padeiro`
- `grit-propostas`
- `grit-solucoes`

Novos produtos entram pelo mesmo contrato de dados.

## Funil oficial
`NEW -> CONTACT_PENDING -> CONTACTED -> QUALIFIED -> DEMO_SCHEDULED -> TRIAL -> PROPOSAL -> WON | LOST | NURTURE`

## SLA
- Lead inbound de alta intenção: primeira ação em até 15 min no horário comercial.
- Lead inbound comum: até 2 h úteis.
- Outbound: próxima ação obrigatória após cada contato.
- Nenhum lead aberto pode ficar sem `next_action_at`.

## Campos mínimos
- `product`
- `name` / `company_name`
- `phone` e/ou `email`
- `city`, `state`
- `source`, `medium`, `campaign`
- UTMs, `gclid`, `fbclid`
- `landing_page`, `referrer`
- `stage`, `score`, `temperature`
- `owner_user_id`
- `last_contact_at`, `next_action_at`
- `lost_reason`
- `consent_lgpd`, `opt_out_at`

## Deduplicação
Chave lógica por telefone normalizado ou e-mail normalizado. Um contato pode ter interesse em mais de um produto; nesses casos, manter um lead mestre e interesses/produtos associados, preservando a primeira origem e a origem mais recente.

## Score inicial
- +30: pediu demonstração/teste/preço
- +20: respondeu positivamente
- +15: ICP direto do produto
- +10: origem Google Search de alta intenção
- +10: retornou à landing ou iniciou cadastro
- -30: sem fit declarado
- -100: opt-out

Faixas: `HOT >= 70`, `WARM 40–69`, `COLD < 40`.

## Painel executivo
1. Leads hoje / 7d / 30d
2. Leads por produto e origem
3. HOT sem contato
4. SLA vencido
5. Próximas ações vencidas/hoje
6. Demonstrações e trials
7. Propostas abertas e valor
8. Clientes ganhos
9. Conversão por etapa
10. CAC, receita e MRR por origem quando houver dados reais

## Regras de controle
- Nunca publicar métricas simuladas como reais.
- Toda campanha usa UTMs padronizadas.
- Todo CTA comercial identifica `product`.
- Todo lead deve ter histórico de eventos.
- `WON` exige produto e data de conversão; receita somente se comprovada.
- `LOST` exige motivo.
- Opt-out bloqueia novas abordagens promocionais.

## Ritmo comercial
### Diário
- 08h: HOT + SLA vencido + ações vencidas.
- Meio do dia: revisar resposta e demos.
- Fim do dia: nenhum HOT sem próxima ação.

### Semanal
- Conversão por produto/origem/campanha.
- Motivos de perda.
- Páginas/campanhas que geram clientes, não apenas leads.
- Realocar esforço para canais com maior conversão comprovada.

## Meta operacional
A máquina deve suportar 50 leads qualificados/dia sem perder SLA, histórico ou próxima ação. O indicador principal é cliente pago/conversão; volume de leads é indicador intermediário.

## Arquitetura
Landing/SEO/Google/Meta/WhatsApp -> captura com atribuição -> `public.leads` -> eventos/interações -> oportunidade -> cliente -> assinatura/receita.

A Central de Apps GRIT deve consumir esse modelo para visão executiva única, mantendo os sistemas operacionais de cada produto isolados e seguros.
