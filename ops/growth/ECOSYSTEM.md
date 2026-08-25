# GRIT Growth OS

Este documento complementa o Remote Ops Kit do PR #76 e define a fonte operacional do ecossistema GRIT.

## Objetivo

Centralizar aquisição, consentimento, qualificação, roteamento, atendimento e atribuição de receita. O Supabase `gritnews` é a fonte de verdade; Meta, Google e WhatsApp são canais, não bancos mestres.

## Sistemas

| Sistema | Papel | Entrada | Saída |
|---|---|---|---|
| GRIT News/Admin | portal, catálogo e operação comercial | formulários, navegação, ofertas | leads, oportunidades, conteúdo e receita |
| Meu Espetinho | SaaS/PDV para espetinhos e pequenos restaurantes | trial, cadastro e uso | ativação, assinatura e eventos de produto |
| Sr. Padeiro | SaaS/PDV para padarias | formulário, WhatsApp e trial | lead qualificado e assinatura |
| SAC ProH | atendimento e relacionamento | solicitações e histórico | encaminhamento, suporte e oportunidade |
| Moacir Rocha Growth | aquisição jurídica | formulário, Google e conteúdo | lead jurídico para fluxo separado |
| Supabase gritnews | CRM e atribuição central | todos os canais | fila, status, métricas e automações |
| Meta Ads/Pixel | descoberta, remarketing e Lead Ads | campanhas Facebook/Instagram | lead, clique, visualização e conversão |
| WhatsApp Business | contato consentido e follow-up | lead roteado | conversa, qualificação e agendamento |
| Google Ads | intenção de busca e remarketing | campanhas por produto | clique, lead, trial e venda |
| GTM/GA4 | mensuração comum | eventos web/produto | funil e audiência |
| Search Console | demanda orgânica | páginas e termos | oportunidades SEO |
| GitHub | código e configuração versionada | PRs e workflows | deploy auditável |
| Hostinger | entrega dos sites | builds | domínios e aplicações |
| Mercado Pago | monetização | checkout | pagamento, ativação e receita |

## Produtos e roteamento

| Chave | ICP | Origem prioritária | Destino |
|---|---|---|---|
| `meu_espetinho` | espetinhos, bares e pequenos restaurantes | Meta local, Google Search, indicação | CRM GRIT → WhatsApp comercial Meu Espetinho |
| `sr_padeiro` | padarias e confeitarias | Google Search, Meta local, prospecção consentida | CRM GRIT → WhatsApp comercial Sr. Padeiro |
| `grit_media` | anunciantes, parceiros e assessorias | conteúdo, formulários B2B, LinkedIn/manual | CRM GRIT → comercial GRIT News |
| `sac_proh` | clientes/contatos ProH | portal e atendimento | SAC ProH; oportunidade comercial somente com base legal |
| `moacir_rocha` | demanda jurídica | Google Search e conteúdo | projeto Moacir Rocha; nunca misturar com SaaS |
| `tenpets` | tutores, ONGs e parceiros pet | conteúdo, social e busca | parceria/lead TenPets |
| `eusebio_imoveis` | compradores e anunciantes imobiliários | busca e landing pages | fila imobiliária |
| `infoprodutos` | compradores de conteúdo | SEO, mídia e remarketing | checkout Mercado Pago |

## Funil comum

1. `lead_submitted`: captura com origem, UTMs, `gclid`/`fbclid`, produto e consentimento.
2. `lead_qualified`: ICP, cidade, necessidade, prazo e canal preferido validados.
3. `contact_started`: primeiro contato permitido.
4. `trial_started` ou `proposal_sent`: próximo passo conforme produto.
5. `activation_completed`: valor inicial entregue.
6. `subscription_started` ou `purchase`: receita confirmada.
7. `lost`: motivo obrigatório para aprendizado.

## Regras de automação

- Deduplicar por telefone normalizado e e-mail em janela de 90 dias.
- Preservar first-touch e last-touch; nunca sobrescrever UTMs originais.
- Leads sem consentimento ficam disponíveis para análise, mas não entram em disparos.
- Meta Lead Ads devem entrar por webhook assinado; Google por formulário/landing com `gclid`.
- Disparo de WhatsApp usa template aprovado e somente quando houver base legal/opt-in.
- Rotear pelo campo `product`; quando ausente, usar landing page e campanha.
- Score A: intenção explícita + contato válido + produto/cidade aderente.
- Score B: contato válido e aderência parcial.
- Score C: dados incompletos, fora de ICP ou sem permissão de contato.
- Conversões confirmadas devem retornar a Meta/Google com identificadores permitidos e dados tratados conforme políticas e LGPD.

## Estado encontrado em 23/08/2026

- Supabase `gritnews`: ativo e saudável.
- `leads`: 40 registros, RLS habilitado, atribuição e consentimento existentes.
- Edge Functions ativas: `capture-lead`, `commercial-lead`, `configure-growth-provider`, `growth-sync`, `seo-growth-robot` e outras.
- Seis campanhas planejadas para Meu Espetinho/Sr. Padeiro.
- Meta Ads e Google Ads registrados como `disconnected`.
- Nenhum ID externo de campanha vinculado; sincronização permanece desabilitada.
- GTM, GA4, Google Ads e Meta Pixel ainda sem IDs no runtime.

## Guardrails

Segredos ficam no Vault/backend. Nunca usar variáveis `VITE_*` para tokens, app secrets, service role ou refresh tokens. Qualquer ativação de campanha, orçamento ou envio em massa exige revisão humana final.
