# Meu Espetinho — Growth Engine Meta 100

## Objetivo
Conquistar os primeiros 100 clientes pagantes com aquisição mensurável, onboarding rápido, retenção e indicação. A meta de 100 clientes é interna e não deve aparecer em publicidade ao consumidor.

## North Star e guardrails
- North Star: clientes pagantes ativos.
- Meta: 100 pagantes.
- Preço de referência operacional: R$ 59,90/mês (validar antes da publicação definitiva).
- CAC alvo inicial: <= R$ 120; recalibrar quando houver LTV/churn reais.
- Trial: 3 dias sem cartão.
- Escala de mídia: aumentar orçamento apenas com assinatura atribuída e CAC dentro do guardrail.
- Nunca criar depoimentos, número de clientes, economia ou resultados fictícios.

## Funil instrumentado
visit -> lead_created -> signup -> trial_started -> onboarding_completed -> first_product -> first_sale -> first_close -> checkout_started -> subscription_started -> retained_30d -> retained_90d -> referral_shared -> referral_converted

Todo evento deve registrar, quando disponível: user_id/tenant_id, timestamp, landing, referrer, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid e referral_code. Dados pessoais devem respeitar consentimento/LGPD e não devem ser enviados às plataformas de mídia sem base/configuração adequada.

## Oferta e mensagem
Headline: "Você vende. O Meu Espetinho mostra quanto realmente sobrou."
Subheadline: "Organize pedidos, caixa e gestão do seu espetinho direto pelo celular."
CTA primário: "Testar grátis por 3 dias"
CTA secundário: "Ver como funciona"

Pilares:
1. Lucro: entender vendas, custos e resultado sem planilhas complexas.
2. Organização: balcão, mesa/comanda e fechamento em um fluxo simples.
3. Compras: usar vendas/estoque opcional para orientar a próxima compra.
4. Simplicidade: começar pelo celular, sem linguagem de ERP.

## Campanhas de aquisição
### META-LUCRO
Hook: "Você sabe quanto vendeu. Mas sabe quanto realmente ganhou?"
Destino: landing / lucro.
Criativos: vídeo vertical 15–30s, demonstração real do produto e imagem estática.

### META-CADERNO
Hook: "Seu espetinho cresceu. Seu caderno não precisa crescer junto."
Destino: landing / organização.

### META-COMPRAS
Hook: "Saiba o que vendeu hoje e organize o que precisa comprar amanhã."
Destino: landing / compras.

### GOOGLE-INTENT
Busca de alta intenção: sistema para espetinho; sistema para churrasquinho; sistema para espetaria; controle de espetinho; PDV para espetinho; comanda para espetinho; controle de estoque para espetinho.
Usar correspondências e negativas controladas; não ampliar automaticamente sem conversão comprovada.

### REMARKETING
Audiências elegíveis: visitou landing e não iniciou trial; iniciou cadastro e não ativou; trial sem primeira venda; trial expirado sem assinatura. Respeitar consentimento e políticas das plataformas.

## Distribuição de teste
Hipótese inicial: R$ 100/dia por 14 dias, sujeita à aprovação humana antes de ativar mídia.
- 60% Meta aquisição
- 20% Google Search
- 20% remarketing
A verba não deve ser aumentada automaticamente sem dados mínimos e guardrails.

## Regra de escala
- Sem trial/assinatura após volume mínimo: recomendar pausa, nunca aumentar verba.
- Trial alto e first_sale baixo: diagnosticar onboarding antes de culpar mídia.
- Assinaturas com CAC <= alvo: recomendar +15% a +20% por ciclo, limitado por max_daily_budget.
- CAC > 1,5x alvo: recomendar redução/pausa.
- Toda mudança real em Meta/Google exige integração autenticada e campanha explicitamente marcada auto_optimize=true.

## Lifecycle automatizado
- T0: boas-vindas + CTA para primeira configuração.
- +10 min sem produto: ajuda contextual no app.
- +2h sem primeira venda: tutorial curto/in-app; WhatsApp/e-mail somente com consentimento.
- D1: resumo de progresso.
- D2: benefício baseado no uso real.
- D3: CTA para assinatura.
- D4 e D7: recuperação de trial expirado.
- D15: reativação, sem desconto inventado.
- Pago: onboarding de retenção e, após uso real, convite de indicação.

## Programa de indicação
Proposta comercial inicial: "Indique outro espetinho. Se ele assinar e permanecer elegível, você ganha 30 dias."
Regras obrigatórias antes de ativar benefício financeiro:
- código único por tenant;
- atribuição server-side;
- impedir autoindicação, duplicidade e fraude;
- benefício somente após confirmação de pagamento do indicado;
- ledger de benefícios auditável;
- limite e política publicados;
- não conceder crédito apenas por clique/cadastro.

Eventos: referral_shared, referral_signup, referral_qualified, referral_converted, referral_reward_granted.

## Prospecção ativa — primeiros 100
Prioridade geográfica: Fortaleza/RM e Ceará antes de nacionalizar.
Fontes permitidas: negócios publicamente listados, inbound, indicação e listas com base legal. Não raspar/usar dados pessoais privados.
Pipeline: novo -> qualificado -> contato -> respondeu -> trial -> ativado -> pago -> perdido.
Campos: estabelecimento, cidade, canal público, responsável quando fornecido, origem, status, próxima ação, motivo de perda.

## Painel Meta 100 no Super Admin
Mostrar dados reais do Supabase, nunca placeholders apresentados como produção:
- progresso 0/100;
- leads;
- trials;
- onboarding concluído;
- primeira venda;
- assinaturas;
- MRR;
- CPL;
- CAC;
- trial->pago;
- churn;
- LTV quando houver histórico suficiente;
- ROAS;
- ranking Meta / Google / orgânico / WhatsApp / outbound / indicação.

## Automação de mídia
O Growth Engine existente `evaluate_growth_campaigns` continua sendo o motor de recomendação. A aplicação automática permanece desligada por padrão. Conectar APIs oficiais Meta/Google em backend/Edge Function; tokens nunca no bundle Vite. Importar métricas automaticamente antes de habilitar mudanças de orçamento.

## Definition of Done para liberar escala
1. GA4/GTM/Google Ads/Meta IDs configurados em produção.
2. UTMs persistidas no lead/trial/assinatura.
3. Eventos críticos validados em ambiente real.
4. Mercado Pago confirma assinatura server-side/webhook.
5. Super Admin reconcilia assinaturas com origem da aquisição.
6. Programa de indicação possui antifraude e ledger.
7. Landing e cadastro mobile testados.
8. Primeiro ciclo de mídia limitado aprovado manualmente.
9. CAC e trial->pago calculados com dados reais.
10. Só então liberar aumento progressivo de orçamento.
