# Sr. Padeiro — Produto V1

## Personas
### Dono
Quer saber rapidamente quanto vendeu, quanto tem no caixa, o que está acabando, quem deve e quanto o negócio está gerando.

### Operador
Precisa vender e receber com poucos toques, sem acesso a informações gerenciais sensíveis.

### Administrador GRIT
Gerencia tenants, trials, assinaturas, saúde de uso, ativação e suporte.

## Fluxo diário
`Abrir caixa -> Vender -> Receber -> Baixar estoque -> Registrar despesas -> Alertar reposição -> Fechar caixa -> Resumo do dia`

## Home
Cards prioritários:
- vendas de hoje
- caixa atual
- alertas de estoque
- fiado a receber
- botão Nova Venda

## PDV
- busca textual
- favoritos/mais vendidos
- leitura de código de barras
- venda por unidade ou peso
- carrinho
- desconto sujeito a permissão
- pagamentos: PIX, dinheiro, débito, crédito, fiado
- baixa de estoque após confirmação

## Produtos
Campos mínimos: nome, preço de venda, custo opcional, unidade, estoque, estoque mínimo, categoria e código de barras.

Unidades V1: UN, KG, G, L, ML, pacote, caixa.

## Estoque
- saldo atual
- movimentação automática por venda
- entrada manual/compra
- ajuste com motivo e auditoria
- alertas de mínimo/zerado

## Lista de compras
Sugestão = estoque alvo - saldo disponível. Na evolução, considerar velocidade de venda. Deve permitir agrupamento por fornecedor e compartilhamento.

## Caixa
- abertura
- recebimentos
- sangria
- suprimento
- despesas
- saldo esperado
- valor contado
- diferença
- fechamento

## Fiado
- cliente obrigatório
- lançamento vinculado à venda
- pagamentos parciais
- saldo devedor
- vencimento opcional
- histórico imutável de transações
- ação de compartilhamento para cobrança

## Dashboard do dono
- faturamento hoje
- comparação com ontem
- quantidade de vendas
- ticket médio
- margem estimada (quando houver custo)
- produtos mais vendidos
- horário de pico
- estoque crítico
- contas fiado

## Onboarding
1. Criar conta
2. Nome do negócio
3. Tipo: padaria, mercadinho, mercearia, conveniência, outro
4. Criar loja
5. Cadastrar/importar primeiros produtos
6. Realizar primeira venda
7. Convites progressivos para estoque, fornecedor e fiado

## Métricas de produto
- signup_completed
- store_created
- first_product_created
- first_sale_completed
- cash_register_closed
- returned_d1
- returned_d3
- trial_started
- subscription_started
- subscription_cancelled

## Critérios V1
Não bloquear lançamento por NFC-e, integração física com balança, folha, contabilidade avançada ou delivery. Esses recursos pertencem ao roadmap posterior.
