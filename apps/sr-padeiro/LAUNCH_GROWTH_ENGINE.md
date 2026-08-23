# Sr. Padeiro — Launch & Growth Engine

## Objetivo
Gerar os primeiros leads qualificados e converter pequenos comércios em usuários ativos do Sr. Padeiro sem perder a simplicidade do produto.

## ICP inicial
1. Padarias de bairro
2. Mercadinhos / mercearias
3. Conveniências
4. Pequenos supermercados com operação enxuta

Prioridade geográfica inicial: Fortaleza e entorno, com expansão posterior por performance.

## Proposta de valor
**Seu negócio. Seu caixa. Seu estoque. Na sua mão.**

Venda, controle estoque, organize o caixa, registre despesas e acompanhe o fiado direto pelo celular.

## Oferta de entrada
- demonstração rápida pelo celular
- onboarding simples
- foco em primeira venda em poucos minutos
- sem promessas de economia, base de clientes ou resultados não comprovados

## Campanha 1 — Outbound WhatsApp / prospecção B2B
UTM: `srp_launch_fortaleza_01`

### Mensagem 1
Olá! Tudo bem? Encontrei o seu comércio e estou apresentando o **Sr. Padeiro**, uma ferramenta simples para pequenos negócios controlarem vendas, caixa, estoque, despesas e fiado direto pelo celular. Posso te mostrar em 2 minutos como funciona?

### Follow-up 1
Passando só para complementar: a proposta do Sr. Padeiro é substituir controles espalhados e cadernos por uma rotina simples no celular, sem transformar o pequeno comércio em um ERP complicado. Se fizer sentido, te envio uma apresentação rápida.

### Follow-up 2
Se hoje vocês já usam algum sistema, sem problema. Posso te mostrar apenas a comparação de simplicidade e mobilidade. Se não for prioridade, me avise e não volto a incomodar.

Regras: contato individual, horário comercial, não insistir após opt-out, registrar retorno no CRM.

## Campanha 2 — Meta Leads Local
UTM: `srp_meta_leads_ce_01`

### Criativo A — Dor do caixa
Título: **Seu caixa ainda depende de caderno?**
Texto: Venda, registre despesas e acompanhe o dia pelo celular com o Sr. Padeiro.
CTA: Conhecer

### Criativo B — Estoque
Título: **Descubra o que está acabando antes de perder venda.**
Texto: Estoque, vendas e compras organizados em uma rotina simples.
CTA: Quero conhecer

### Criativo C — Controle na mão
Título: **Seu negócio na palma da mão.**
Texto: Caixa, estoque, vendas e fiado em um app pensado para o pequeno comércio.
CTA: Ver como funciona

Ativar apenas após Pixel/CAPI, eventos e landing page estarem funcionando.

## Campanha 3 — Google Busca
UTM: `srp_google_search_01`

Grupos de intenção:
- sistema para padaria
- sistema para mercadinho
- controle de estoque padaria
- controle de caixa mercadinho
- PDV simples para pequeno comércio
- caderneta digital fiado

### Anúncio base
Título 1: Sistema simples para padaria
Título 2: Caixa e estoque no celular
Título 3: Conheça o Sr. Padeiro
Descrição: Controle vendas, estoque, caixa, despesas e fiado em uma ferramenta simples para pequenos comércios.

## Funil
`Lead -> Contato -> Interesse -> Demonstração -> Cadastro -> 1º produto -> 1ª venda -> Retorno D1/D3 -> Assinatura`

## Lead scoring inicial
- 90–100: padaria + mercadinho / operação híbrida
- 80–89: padaria, mercadinho ou conveniência com fit direto
- 70–79: pequeno supermercado / operação com provável necessidade
- <70: nutrir / validar aderência

## KPIs
- leads novos
- taxa de contato
- taxa de resposta
- demonstrações agendadas
- cadastros iniciados
- primeira venda realizada
- ativação D1/D3
- conversão em assinatura
- CAC por origem

## Segurança e LGPD
Leads encontrados em fontes empresariais públicas entram como `consent_lgpd=false`. Prospecção deve ser individual, pertinente ao contexto B2B e oferecer opt-out claro. Consentimento para campanhas recorrentes deve ser capturado explicitamente.

## Super Admin
A autorização central deve usar Supabase Auth + `public.admin_users`. Nunca armazenar senha em texto puro no banco, arquivos ou GitHub. O frontend usa somente chave publishable; `service_role` nunca é exposta.
