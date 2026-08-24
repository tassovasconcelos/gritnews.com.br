# Sr. Padeiro — Google Launch Runbook

## Estado técnico
- sitemap: `https://srpadeiro.gritnews.com.br/sitemap.xml`
- robots: `https://srpadeiro.gritnews.com.br/robots.txt`
- política: `https://srpadeiro.gritnews.com.br/privacidade`
- termos: `https://srpadeiro.gritnews.com.br/termos`
- 8 landings comerciais + hub de conteúdo orgânico
- canonical e dados estruturados nas páginas SEO
- tracking preparado para GA4, Google Ads e Meta via variáveis de ambiente

## Variáveis necessárias no ambiente de produção
- `VITE_GA4_ID=G-...`
- `VITE_GOOGLE_ADS_ID=AW-...`
- `VITE_GOOGLE_ADS_LEAD_LABEL=...`
- `VITE_META_PIXEL_ID=...`

Nunca inventar IDs. Devem vir das contas oficiais da GRIT.

## Search Console
1. Criar/verificar propriedade de domínio `srpadeiro.gritnews.com.br` ou domínio `gritnews.com.br`.
2. Publicar o token de verificação fornecido pelo Google por DNS ou método suportado.
3. Enviar `https://srpadeiro.gritnews.com.br/sitemap.xml` no relatório Sitemaps.
4. Inspecionar e solicitar indexação da home e principais landings.
5. Acompanhar indexação/cobertura; não considerar indexado apenas por sitemap publicado.

## Google Ads
Campanhas iniciais recomendadas:
- Search | Sistema para Padaria
- Search | Sistema para Mercadinho
- Search | PDV Simples / Controle de Caixa / Estoque

Conversão primária: envio de formulário de lead.
Conversões secundárias: clique WhatsApp, início de trial e cliente ganho (quando integração offline estiver pronta).

## Palavras-chave iniciais
- sistema para padaria
- sistema para mercadinho
- sistema para mercearia
- pdv para padaria
- pdv simples para pequeno comércio
- controle de estoque padaria
- controle de caixa padaria
- controle de fiado mercadinho
- sistema de gestão pelo celular

## Negativas iniciais
- grátis download
- crack
- emprego
- curso
- planilha grátis (manter apenas em campanha/conteúdo específico quando estratégico)

## Gate antes de ativar orçamento
- produção HTTP 200
- formulário criando lead no CRM
- WhatsApp correto
- Política de Privacidade pública
- GA4/Google Ads IDs reais configurados
- evento de conversão testado
- UTMs/gclid preservados no CRM
- CRM com responsável/SLA/próxima ação
- billing/onboarding operacionais

## Medição
Não otimizar só para CPL. Acompanhar:
- lead bruto
- lead válido
- MQL
- trial
- proposta
- cliente ganho
- CAC
- receita/MRR por origem e campanha
