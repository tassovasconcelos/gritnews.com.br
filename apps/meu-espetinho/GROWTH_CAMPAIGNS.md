# Meu Espetinho — Growth Engine

## Objetivo
Transformar tráfego pago em teste de 3 dias, checkout e assinatura, com atribuição por origem e mensuração no GA4, Google Ads e Meta Ads.

## Funil oficial
1. `view_landing` — visita qualificada à página principal.
2. `signup_step` — avanço no cadastro.
3. `sign_up` — conta criada com sucesso.
4. `start_trial` — teste de 3 dias iniciado após criação da conta.
5. `begin_checkout` — usuário iniciou pagamento de ativação ou assinatura.
6. `activation_paid` — setup confirmado.
7. `subscription_started` — assinatura recorrente confirmada.

Nunca considerar clique no botão como cadastro, teste ou compra. Conversões devem refletir resultado confirmado.

## Campanha 1 — Controle sem caderninho
**Objetivo:** gerar testes.

- Público: donos de espetinhos, churrasquinhos, trailers, bares pequenos e food trucks.
- Dor: pedidos perdidos, fiado sem controle, fechamento manual e falta de visão de caixa.
- Promessa: "Menos bagunça. Mais controle. Mais lucro."
- CTA: "Teste grátis por 3 dias".
- Landing: `/sistema-para-espetinho` ou `/`.
- Conversão primária: `start_trial`.
- UTM base: `utm_source={google|meta}&utm_medium=paid&utm_campaign=controle_sem_caderninho&utm_content={creative}`.

## Campanha 2 — Venda mais com operação simples
**Objetivo:** gerar testes qualificados e checkouts.

- Público: negócios que já usam WhatsApp, comandas de papel ou planilhas.
- Promessa: "Pedidos, caixa, clientes e fiado na palma da mão."
- Criativo: demonstração visual do sistema no celular.
- CTA: "Conheça e teste por 3 dias".
- Landing: `/comanda-digital-para-espetinho`.
- Conversões: `start_trial` e `begin_checkout`.
- UTM base: `utm_source={google|meta}&utm_medium=paid&utm_campaign=operacao_simples&utm_content={creative}`.

## Campanha 3 — Assine e mantenha seu negócio no controle
**Objetivo:** converter usuários do teste em assinantes.

- Público: remarketing de usuários que iniciaram teste, visitaram `/app` ou iniciaram checkout sem assinatura ativa.
- Mensagem: "Seu teste mostrou o caminho. Continue com seus dados, pedidos e clientes organizados."
- CTA: "Assinar Meu Espetinho".
- Conversão primária: `subscription_started`.
- UTM base: `utm_source={google|meta}&utm_medium=remarketing&utm_campaign=trial_para_assinatura&utm_content={creative}`.

## Regras de otimização
- Não otimizar campanha por PageView quando houver volume suficiente de `start_trial`.
- Migrar otimização para `subscription_started` assim que houver volume consistente de assinaturas.
- Separar aquisição e remarketing.
- Não misturar leads de suporte com conversões comerciais.
- Nunca enviar e-mail, telefone, nome pessoal ou senha em parâmetros de analytics.
- Utilizar `transaction_id` nos eventos pagos para evitar duplicidade.

## IDs necessários no ambiente de produção
- `VITE_GA4_ID`
- `VITE_GTM_ID` (opcional)
- `VITE_GOOGLE_ADS_ID`
- `VITE_GOOGLE_ADS_START_TRIAL_LABEL`
- `VITE_GOOGLE_ADS_SIGNUP_LABEL`
- `VITE_GOOGLE_ADS_ACTIVATION_LABEL`
- `VITE_GOOGLE_ADS_SUBSCRIPTION_LABEL`
- `VITE_META_PIXEL_ID`

Os IDs e labels devem ser obtidos diretamente nas contas oficiais Google/Meta. Nunca inserir valores fictícios.
