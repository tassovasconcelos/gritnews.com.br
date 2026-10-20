# Marca-passo: precificação e campanha sell-out por loja

**Estudo de produto e regra operacional — 20/10/2026**

## Decisão proposta

Evoluir o Marca-passo com um cálculo determinístico por SKU e loja, regido por política versionada de diretoria/superadmin. O sistema sugere o preço necessário para cumprir a margem depois de despesas e bônus, mede a viabilidade no volume declarado e envia o cenário para validação humana. Aprovar uma proposta registra a decisão; não atualiza o Procfit nem inicia uma campanha.

O motor V24 em [`Plataforma_Inteligencia_Procirurgica_V24_PRECIFICACAO_ESPECIAL_FORCA_VENDAS.html`](../../../../HC%20Tasso%2026/Plataforma_Inteligencia_Procirurgica_V24_PRECIFICACAO_ESPECIAL_FORCA_VENDAS.html) fornece conceitos úteis de custo, alíquotas, preço piso, preço alvo e condição comercial. Ele é uma aplicação independente baseada em dados locais do navegador. Seus percentuais fiscais e amostras não são regra aprovada do CIP e não foram copiados para o produto.

## Como a recomendação é formada

1. **Regra comercial:** diretoria/superadmin publica uma versão por empresa com contribuição mínima e alvo, variação máxima de preço, duração máxima, faixas de bônus e custeio por fornecedor. A política anterior permanece consultável.
2. **Base do SKU e da loja:** custo, preço atual e saldo vêm da fila de uma carga aprovada quando selecionada. A tela preserva empresa, loja e horário da fonte. A meta é digitada pelo responsável; não é inferida de vendas incompletas.
3. **Viabilidade financeira:** custo e despesas variáveis/fixas são informados e conferidos pelo responsável financeiro. Referência de concorrente só entra no preço se for equivalente, tiver fonte e coleta de até sete dias.
4. **Recomendação:** o preço é limitado entre o piso com margem mínima e o preço alvo; quando há concorrente validado, prioriza a referência dentro desse intervalo. A variação máxima autorizada limita o preço. Se a alçada impedir o piso, o cenário é bloqueado.
5. **Bônus:** ao atingir a faixa informada, o bônus por unidade reduz a contribuição. Custeio do fornecedor é mostrado à parte. O piso e o preço alvo são recalculados com a parcela líquida da empresa, sem “esconder” incentivo como despesa externa.
6. **Decisão e acompanhamento:** a proposta fica ligada à empresa, produto, loja, versão da regra, premissas e memória de cálculo. Apenas diretoria/superadmin aprova ou rejeita com justificativa. Nenhuma proposta publica preço no ERP.

## Memória de cálculo

Para uma campanha de um SKU em uma loja, `C` é custo unitário, `F` despesa fixa por unidade, `D` despesas percentuais sobre a venda, `m` contribuição mínima ou alvo, `B` bônus por unidade atingido, `S` custeio do fornecedor por unidade, `Q` meta de unidades e `P` preço:

```text
Bônus líquido por unidade = máximo(0, B − S)
Piso = arredondar para cima em centavos [(C + F + bônus líquido) / (1 − (D + margem mínima)/100)]
Preço alvo = arredondar para cima em centavos [(C + F + bônus líquido) / (1 − (D + margem alvo)/100)]
Contribuição líquida da campanha = [P × (1 − D/100) − C − F − bônus líquido] × Q
Receita do cenário = P × Q
Capital potencial liberado a custo = C × Q
Custo de capital no prazo = C × Q × 1,5% × dias/30
```

O bônus por faixa só é aplicado se a meta declarada atingir o mínimo daquela faixa. Receita exige venda e caixa exige recebimento. O custo de capital de 1,5% ao mês é um cenário acordado pelo usuário, não prejuízo ou economia contábil realizada.

### Exemplo sintético, para conferir a mecânica

Premissas apenas ilustrativas: custo R$ 60, preço atual R$ 110, despesas variáveis de 10%, despesa fixa zero, margem mínima 15%, alvo 25%, bônus bruto de R$ 3 por unidade ao atingir 20 unidades, fornecedor cobre R$ 2 por unidade, estoque disponível 100 e meta da loja 40 unidades em 14 dias.

- Bônus líquido da empresa: R$ 1/unidade; custo total do incentivo: R$ 40; custeio do fornecedor: R$ 80.
- Piso pós-bônus: R$ 81,34; preço alvo: R$ 93,85. Sem uma referência concorrente válida, o motor sugere o alvo.
- Receita se as 40 unidades forem vendidas: R$ 3.754; contribuição estimada no mesmo volume: R$ 938,60.
- Contribuição no preço atual e no mesmo volume: R$ 1.560; variação no cenário: −R$ 621,40. Para igualar essa contribuição, seriam necessárias cerca de 66,5 unidades no novo preço — 26,5 além da meta —, cálculo de equilíbrio, não previsão.
- Custo de capital correspondente a 14 dias: R$ 16,80, em cenário de permanência do saldo. O valor não compensa por si só a queda de contribuição do exemplo.

Esse teste ilustra por que “preço competitivo” e “campanha rentável” não são sinônimos. Se o produto concorrente estiver a R$ 82, o preço ainda fica acima do piso, porém abaixo do alvo; o gestor precisa ver a contribuição menor e o volume de equilíbrio antes de liberar a ação.

## Cadência e indicadores do piloto

Começar com uma campanha e um grupo pequeno de lojas para SKUs de curva A e saldo excedente, sem risco de ruptura, reserva ou validade não conferidos. Revisar elegibilidade e concorrência diariamente; revisar vendas e contribuição em D+7, D+14 e D+30. A meta só deve ser calibrada depois de obter o histórico conciliado por loja.

Medir separadamente: unidades vendidas sobre meta; redução do saldo físico; contribuição líquida real após custo/despesa/bônus; bônus devido, pago e reembolsado pelo fornecedor; receita faturada; caixa recebido; saldo remanescente; ruptura e transferência; preço realizado versus preço aprovado; divergência entre margem estimada e realizada. Registrar também cancelamentos/devoluções e descontos que acumulem com o bônus. Interromper ou revisar quando o preço sair da faixa aprovada, a contribuição cair abaixo do piso, o estoque se tornar insuficiente ou a mecânica não tiver evidência de sell-out.

Não estimar aumento de volume nem elasticidade com os dados atuais. A melhor comparação é um piloto supervisionado contra lojas/SKUs comparáveis e janela anterior, depois de confirmar sazonalidade, disponibilidade e vendas. Evitar atribuir crescimento à campanha quando estoque, preço, canal ou calendário tiverem mudado ao mesmo tempo.

## Dados que destravam maior precisão

- Custo efetivo atual por SKU/filial com fonte, data, impostos recuperáveis, frete e custo de reposição.
- Preço praticado e condição de pagamento/faturamento por loja; impostos, comissão e despesas variáveis validados por Financeiro/Fiscal.
- Vendas líquidas e devoluções por SKU/loja/dia, com janela e completude; estoque disponível, reservas, pedidos em trânsito, lotes e validade.
- Concorrência física/digital com evidência opcional, produto/unidade equivalentes, preço, prazo, frete, data, canal e responsável pela coleta.
- Para coleta física: razão/nome da empresa, distribuidor ou lojista, cidade/UF, cargo da pessoa que informou e condição. Nome/cargo e link ou identificação de evidência são opcionais; registrar a origem aumenta rastreabilidade, não comprova sozinho que o preço está disponível.
- Mecânica de bônus: beneficiário, elegibilidade, teto, período, cumulatividade, estorno, aprovação financeira e regra de reembolso do fornecedor.
- Conciliação de venda, recebimento e pagamento do bônus. Sem isso, os resultados continuam “informados” e não “realizados conciliados”.

## Estado desta evolução

O CIP ganhou o motor determinístico, testes, regra comercial versionada, propostas por SKU/loja, memória de cálculo e aprovação/rejeição com autoria. A submissão recalcula no servidor o piso, preço alvo, limite de variação e margem, usando a versão ativa. RLS restringe leitura à empresa e as alterações passam por funções protegidas; a publicação da regra e a decisão só aceitam diretor/superadmin ativo.

O HTML V24 permanece referência analítica. O preço não é atualizado no Procfit; a campanha não é ativada automaticamente; não há ainda painel de resultados reais conciliados. A próxima evolução deve integrar custo/despesas e vendas completos da view Procfit, conectar resultado de sell-out e recebimento e só então avaliar automações delimitadas.
