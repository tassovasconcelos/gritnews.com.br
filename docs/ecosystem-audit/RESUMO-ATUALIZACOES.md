# Resumo de atualizações

Atualizado em 24/08/2026 com conferência do código, produção e banco de dados.

## Ecossistema e operação

- Remote Ops Kit criado na PR #76 com central de links, health check e abertura dos painéis.
- Growth OS documentado com funil comum, roteamento por produto, consentimento e atribuição.
- Contrato de roteamento versionado em `ops/growth/routing.json`.
- Variáveis Meta, Google Ads, WhatsApp, GA4 e GTM documentadas sem segredos no frontend.
- Search Console centralizado no domínio GRIT; sitemaps do portal e Meu Espetinho processados.
- Google Ads API habilitada no projeto Google Cloud e cliente OAuth criado; cliente e segredo guardados no Vault.
- Conta Google Ads `633-022-4128` mapeada. Developer token ainda depende de uma conta administradora Google Ads.
- Portfólio Meta `Grit Soluções` identificado, com página GRIT, Instagram `@grit.solucoes` e conta WhatsApp de teste.

## Captação e automações

- Supabase `gritnews` confirmado como CRM e fonte central de atribuição.
- Edge Functions de captura, sincronização, SEO e configuração de provedores ativas.
- `commercial-lead` atualizado para aceitar também `https://srpadeiro.gritnews.com.br`.
- Formulários exigem contato válido e consentimento LGPD; UTMs, `gclid`, `fbclid`, landing e produto são preservados.
- 40 leads confirmados na base: 34 do Meu Espetinho e 6 do Sr. Padeiro, todos em estágio `new`.
- Seis campanhas de Meu Espetinho e Sr. Padeiro estruturadas em planejamento, sem mídia ou disparos ativados.
- Inteligência de leads V4.1, cadências, worker de automação, segmentação, mensagens por segmento e catálogo ampliado de produtos aplicados em produção.
- Funções internas de processamento de leads restritas ao backend; conexões Meta Ads e Google Ads permanecem `disconnected` até a autorização final dos provedores.

## Apps publicados

- GRIT News: online, catálogo, conteúdo, administração, leads, oportunidades, pagamentos e ativos de marca.
- Meu Espetinho: online, PDV/SaaS, mobile/offline, billing, growth, SEO, campanhas e operação administrativa.
- Sr. Padeiro: online, landing comercial, trial, WhatsApp, captura integrada e fonte incorporada ao monorepo.
- Meu Orçamento: estrutura inicial, schema multi-tenant e landing comercial indexável no portal; subdomínio próprio ainda pendente.
- SAC ProH: online e saudável; código mantido em repositório separado.
- Moacir Rocha: online e saudável; funil jurídico deve permanecer isolado dos SaaS.
- GRIT Propostas: especificação e landing existentes; aplicação MVP ainda não implementada neste monorepo.

## Guardrails preservados

- Nenhuma campanha paga, cobrança ou envio em massa foi ativado.
- Nenhum segredo foi gravado em arquivo versionado.
- Produção externa não foi sobrescrita sem origem técnica verificável.

## Segurança aplicada

- RPCs privilegiadas sem execução anônima desnecessária.
- Captura direta na tabela de leads bloqueada; entrada somente pelo backend validado.
- Proteção contra senhas vazadas ativa no Supabase Auth.
- Auditoria de dependências de produção sem vulnerabilidades conhecidas.
- Funções internas do motor de leads e configuração de runtime sem execução anônima.
