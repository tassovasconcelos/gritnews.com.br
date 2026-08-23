# Meu Orçamento

SaaS comercial da GRIT para pequenos negócios, prestadores de serviço, consultores, representantes e equipes comerciais criarem orçamentos profissionais com rapidez, enviarem por WhatsApp/e-mail e acompanharem até a conversão.

## Posicionamento
**Orçamento rápido. Acompanhamento simples. Mais chance de fechar.**

O Meu Orçamento nasce integrado ao ecossistema GRIT e não como sistema isolado. Compartilha o padrão de leads, atribuição, segurança, RBAC, telemetria, SEO e governança comercial da Central GRIT.

## Público inicial
- prestadores de serviço;
- manutenção, instalações e assistência técnica;
- representantes e distribuidores;
- pequenas lojas e negócios B2B;
- consultores e profissionais autônomos;
- empresas que ainda fazem orçamento em Word, Excel, WhatsApp ou papel.

## Módulos V1
1. **Dashboard** — orçamentos em aberto, aprovados, vencidos, taxa de conversão e valor em negociação.
2. **Clientes** — cadastro simples, histórico e contatos.
3. **Produtos e serviços** — catálogo, unidade, preço, custo opcional e descrição padrão.
4. **Orçamentos** — itens, quantidades, desconto, frete, validade, observações e condições.
5. **PDF profissional** — identidade visual, logo, dados da empresa, cliente, itens e condições.
6. **Compartilhamento** — link, PDF, WhatsApp e e-mail.
7. **Pipeline** — rascunho, enviado, visualizado, negociação, aprovado, perdido e vencido.
8. **Próxima ação** — lembretes e tarefas de follow-up.
9. **Conversão** — orçamento aprovado vira oportunidade/cliente convertido no CRM GRIT.
10. **Usuários e permissões** — owner, manager, seller, viewer.
11. **Configurações** — empresa, logo, cores, dados fiscais/comerciais e numeração.
12. **Assinatura** — trial, plano e status comercial sem expor dados financeiros sensíveis.

## Inteligência do ecossistema GRIT
- lead identificado por `product = meu-orcamento`;
- UTMs, `gclid` e `fbclid` preservados;
- entrada no pipeline comercial central;
- score HOT/WARM/COLD;
- SLA e próxima ação obrigatória;
- visão na Central de Apps GRIT;
- integração futura com campanhas, indicação, e-mail e WhatsApp;
- métricas reais de lead -> orçamento -> aprovação -> cliente.

## Arquitetura
- React + TypeScript + Vite;
- Supabase Auth + PostgreSQL + RLS;
- multi-tenant por organização;
- tabelas prefixadas `morc_` para isolamento operacional;
- `public.leads` como fonte comercial compartilhada;
- nenhuma `service_role` no frontend;
- GitHub como fonte de verdade;
- CI, smoke test e deploy controlado.

## Entidades principais
- `morc_organizations`
- `morc_members`
- `morc_customers`
- `morc_catalog_items`
- `morc_quotes`
- `morc_quote_items`
- `morc_quote_events`
- `morc_tasks`
- `morc_settings`

## Funil do produto
`Lead -> Cadastro -> 1º orçamento -> Envio -> Visualização -> Negociação -> Aprovação -> Cliente -> Assinatura`

## Regras de estabilidade
- orçamento deve ser salvo transacionalmente com itens;
- totais calculados no backend/RPC, não confiados ao frontend;
- numeração única por organização;
- histórico de status imutável por eventos;
- exclusão lógica para documentos comerciais;
- RLS em todas as tabelas tenant-owned;
- logs de erro e auditoria de ações críticas;
- nenhum dado fictício em dashboards de produção.

## Domínios planejados
- Produto: `https://meuorcamento.gritnews.com.br`
- Landing institucional alternativa: `https://gritnews.com.br/produtos/meu-orcamento/`

## Diferenciação do GRIT Propostas
O Meu Orçamento é mais direto, operacional e voltado a pequenos negócios que precisam **orçar e fechar** rapidamente. O GRIT Propostas permanece mais orientado a propostas comerciais B2B estruturadas, documentos mais completos e negociação consultiva.
