# CIP — Painel executivo e dicionário de indicadores

Versão 1.0 · 18/10/2026 · Anexo do projeto CIP 1.3.

Objetivo: permitir que Rufino, Glauco e gestores respondam: **estamos crescendo com margem, economizando de verdade, liberando capital e atendendo melhor?** Esta entrega especifica indicadores e painel; não contém resultados reais calculados nem altera o sistema publicado.

## 1. Painel da diretoria

Primeira tela com seis cartões: **Receita líquida**, **Crescimento comparável**, **Margem de contribuição**, **Economia líquida realizada**, **Capital liberado de estoque** e **Entrega no prazo e completa — OTIF**. Cada cartão apresenta valor, período, meta aprovada, diferença, comparação válida, fonte e atualização.

Abaixo: evolução mensal de receita e contribuição; composição das economias; estoque versus disponibilidade; entrega e satisfação; cinco decisões prioritárias, com responsável, prazo, evidência e ação sugerida. Seleção de empresa, filial, canal, segmento de cliente e período. Ranking de filiais deve permitir normalizar porte, dias úteis e maturidade, sem premiar só faturamento absoluto.

Visão resumida da diretoria; abas de resultado, economia, capital, crescimento e cliente/operação. Aprofundamento até pedido, SKU, remessa ou iniciativa conforme permissão. Comparação de números de grupos diferentes deve usar a mesma definição e período.

Sem meta aprovada, mostrar “meta a definir”, não inventar semáforo. Fonte ausente, incompleta ou vencida aparece como indisponível/provisória. Ausência não vira zero. Receita alta com contribuição em queda deve gerar alerta de qualidade do crescimento.

## 2. Convenções e regras comuns

- **RL:** receita líquida conforme política conciliada pela controladoria, com descontos, devoluções, cancelamentos e tributos sobre vendas definidos na mesma base. Não equiparar pedido, faturamento e recebimento.
- **CMV:** custo das mercadorias efetivamente vendidas, com método e ajustes homologados. Estoque e CMV devem ter a mesma base de custo.
- **DV:** despesas variáveis elegíveis, sem repetir itens já incluídos na RL ou no CMV; definir comissão, frete e demais componentes por canal.
- **MC:** contribuição = RL − CMV − DV. A denominação e a composição serão homologadas pela controladoria antes de uso executivo.
- Valores de mesma moeda e período; registrar corte, competência/caixa e fuso. Mês em curso compara dias equivalentes; não comparar mês parcial com mês anterior completo como crescimento realizado.
- Crescimento: `(atual − base) / base × 100`, somente com base positiva comparável. Base zero/negativa: mostrar variação em reais e situação, sem percentual enganoso.
- Margens são ponderadas pelos respectivos valores: não tirar média simples dos percentuais de produtos/filiais. Percentual de margem e markup não são intercambiáveis.
- Desvio de margem em **pontos percentuais (p.p.)**; desvio de receita/economia em reais e percentual quando válido. Toda exclusão deve ser visível.
- Consolidado do grupo elimina transferências/vendas internas conforme regra aprovada; não somar faturamento entre empresas como crescimento para o cliente final.

## 3. Resultado, crescimento e margem

| ID | Indicador e cálculo | Leitura e cuidado | Fonte / responsável / cadência |
|---|---|---|---|
| EX-01 | Receita líquida: soma da RL reconhecida no período. | Separar pedido, faturamento líquido e caixa recebido. Mostrar devoluções/cancelamentos. | Procfit + conciliação contábil; controladoria; diário provisório e mensal fechado. |
| EX-02 | Crescimento de RL: variação atual versus período comparável. | Mostrar mensal, anual e acumulado quando houver base. Separar efeito de novas filiais e calendário. | EX-01 + calendário; comercial/controladoria; semanal/mensal. |
| EX-03 | Crescimento em base comparável: RL de filiais/canais elegíveis em ambos os períodos. | Identificar abertura, fechamento, mudança de canal e cobertura de dados. Crescimento nominal não é automaticamente real. | RL + histórico cadastral; controladoria; mensal. |
| EX-04 | Lucro bruto = RL − CMV; margem bruta = lucro bruto / RL × 100. | Não chamar de lucro líquido; não usar estoque comprado como CMV vendido. | ERP + custos homologados; controladoria; diário/mensal. |
| EX-05 | MC em R$ e margem de contribuição = MC / RL × 100. | Medir efeito de descontos, mix, comissões e frete elegíveis; não duplicar frete no custo. | ERP/custos/despesas; controladoria/comercial; diário/mensal. |
| EX-06 | Resultado operacional gerencial: RL − CMV − despesas operacionais reconhecidas, com escopo explícito. | Ponte de contribuição para resultado; composição conciliada. Só rotular EBITDA se calculado e conciliado conforme política específica. | Contabilidade/controladoria; mensal fechado. |
| EX-07 | Ticket médio = RL / pedidos de venda concluídos elegíveis. | Um pedido com várias notas/remessas conta uma vez. Definir devolução e pedido totalmente cancelado. | Pedidos + RL; comercial; semanal/mensal. |
| EX-08 | Clientes ativos e recompra: clientes com compra elegível; taxa de recompra por coorte e janela definida. | Novos, recorrentes, reativados e perdidos separados. Não confundir pessoa, unidade e grupo econômico. | Cadastro/pedidos; comercial; mensal. |
| EX-09 | Conversão de cotações: ganhas / cotações elegíveis de uma coorte; conversão por valor em medida separada. | Definir pendentes e encerradas; medir prazo até decisão e motivo de perda. | ERP/CIP; comercial; semanal/mensal. |
| EX-10 | Crescimento por segmento/canal: RL e MC por varejo, atacado, B2B, B2G, e-commerce e perfil do cliente. | Canal e segmento são dimensões distintas; sem dupla contagem. Crescer B2G deve ser acompanhado de caixa e prazo. | Cadastro/ERP; direção/comercial; mensal. |

## 4. Economia e eficiência — benefício comprovado

| ID | Indicador e cálculo | Leitura e cuidado | Fonte / responsável / cadência |
|---|---|---|---|
| EX-11 | Economia bruta de compra = Σ `(custo-base comparável − custo efetivo comparável) × quantidade efetiva elegível`. | Mesma especificação, embalagem, tributos recuperáveis, frete, prazo e condição de pagamento conforme regra aprovada. Usar recebimento confirmado ou critério aprovado; pedido aberto é projeção. | Compra/recebimento + baseline; compras/controladoria; mensal. |
| EX-12 | Economia líquida realizada = benefício bruto verificado − custos incrementais necessários e não já incluídos. | Separar compra, logística, perdas e processo por iniciativa. Se o cálculo ficar negativo, apresentar custo líquido adicional. Efeito em caixa/DRE depende do momento contábil. | Registro de benefícios + evidências; controladoria; mensal. |
| EX-13 | Custo evitado: obrigação/despesa contrafactual plausível que deixou de ocorrer, com hipótese aprovada. | Mostrar em bloco separado; não somar à economia realizada nem alegar caixa economizado sem evidência. | Cenário/base aprovada; controladoria/dono da ação; mensal. |
| EX-14 | Economia logística: `(custo-base normalizado para volume/mix atual − custo real comparável) − custo incremental da intervenção`. | Mesmo escopo, zona, peso, janela e qualidade. Menos gasto por menos entregas não prova eficiência. | Fretes/rotas/custos; logística/financeiro; mensal. |
| EX-15 | Perdas por validade/avaria: custo reconhecido dos itens baixados; taxa sobre denominador aprovado e explícito. | Valor recuperado e perda evitada estimada separados de baixa real. Não vender estoque crítico apenas para reduzir indicador. | Baixas/lotes/qualidade; estoque/controladoria; semanal/mensal. |
| EX-16 | Produtividade: pedidos/linhas/entregas elegíveis por hora de trabalho, por processo. | Horas poupadas estimadas não viram economia financeira automática. Mostrar qualidade e retrabalho juntos. | Tempos/eventos/amostragem validada; operações; semanal. |
| EX-17 | Benefício líquido atribuível ao CIP = economias realizadas atribuídas + contribuição incremental atribuída − custos incrementais do programa ainda não descontados. | Deduplicar iniciativas e parcelas de benefício. Não incluir receita bruta incremental, custo evitado ou capital liberado como lucro. | Registro de iniciativas + controladoria; mensal/trimestral. |
| EX-18 | ROI do CIP = benefício líquido atribuível / investimento e custos do programa no mesmo horizonte × 100. | Explicitar horizonte, custos completos e atribuição. Não descontar o mesmo custo duas vezes. Payback só quando o fluxo acumulado medido cobrir investimento. | Custos + EX-17; direção/controladoria; trimestral. |

Registro obrigatório de benefício: iniciativa, empresa/filial, responsável, período, baseline, cenário sem ação, evidência, ação aprovada, execução, custos, parcela atribuível, exclusões, estado e validação financeira. Estados: **potencial → validado para decidir → aprovado → executado → realizado/medido → conciliado**. Não somar estados do mesmo benefício.

Evitar dupla contagem: desconto de fornecedor pode gerar economia de compra e, após venda, melhorar margem. Exibir ambos como perspectivas, mas não somá-los outra vez no benefício total. Redução do estoque é capital, não lucro. Uma otimização de rota contabilizada em EX-14 não reaparece como benefício separado de horas sem reconciliação.

## 5. Estoque, capital e caixa

| ID | Indicador e cálculo | Leitura e cuidado | Fonte / responsável / cadência |
|---|---|---|---|
| EX-19 | Estoque a custo e capital liberado observado = estoque-base comparável − estoque atual comparável, com ponte de variação. | Separar venda, compra, transferência, perda, ajuste e mudança de custo. A queda bruta é variação observada; só atribuir ao CIP a parcela sustentada por ação e evidência. Não equivale a caixa disponível. | Saldos/snapshots/custos; estoque/controladoria; diário/mensal. |
| EX-20 | Giro = CMV do período / estoque médio a custo. Cobertura = saldo elegível / demanda diária estimada. | Bases equivalentes, devoluções tratadas, demanda zero explícita; média de snapshots mais representativa que um único saldo. | Estoque/movimentação/venda; estoque; semanal/mensal. |
| EX-21 | Estoque envelhecido/sem giro = custo de itens em faixas de idade ou sem saída por janela definida. | Distinguir idade do lote, tempo sem venda e criticidade. Faixas por categoria e política, não corte universal. | Lotes/movimentos; estoque/compras; semanal. |
| EX-22 | GMROI gerencial = lucro bruto do período / estoque médio a custo no mesmo período. | Explicar que não é ROI total da empresa. Avaliar por categoria e horizonte comparável. | EX-04 + estoque; controladoria/compras; mensal/trimestral. |
| EX-23 | Ciclo de caixa = dias de estoque + dias a receber − dias a pagar. | Dias de estoque usa CMV; receber usa vendas a prazo; pagar usa compras a prazo elegíveis. Todos no mesmo horizonte; não usar faturamento total se a base é crédito. | Saldos médios/compras/vendas; financeiro; mensal. |
| EX-24 | Inadimplência = saldo vencido elegível / saldo total a receber elegível × 100; faixas de atraso. | Estoque de dívida por data, separado de vendas do mês; definir negociação, estorno e exclusões. | Títulos/baixas; financeiro; diário/mensal. |
| EX-25 | Caixa realizado e projetado: saldo inicial + entradas − saídas, separando efetivo e previsto. | Contrato, faturamento ou título não comprovam pagamento. Mostrar compromissos e cenários sem misturá-los ao caixa realizado. | Tesouraria/baixas/conciliação; financeiro; diário. |

## 6. Cliente, entrega e qualidade da operação

| ID | Indicador e cálculo | Leitura e cuidado | Fonte / responsável / cadência |
|---|---|---|---|
| EX-26 | OTIF = pedidos elegíveis completos e entregues até promessa original / pedidos elegíveis com prazo vencendo no período. | Parcial não conta como integral; atrasado não sai da base. Reagendamento do cliente é identificado. | Pedido/remessas + ROTA PRO/Driver; logística; diário/semanal. |
| EX-27 | Custo de servir por pedido/cliente = componentes logísticos e atendimento alocados conforme método aprovado. | Complementa margem; evitar descontar novamente despesas já incorporadas. Separar custo direto e rateio. | Custos/rotas/protocolos; financeiro/logística; mensal. |
| EX-28 | Satisfação da entrega/atendimento: CSAT por pergunta e escala; resolução e reincidência de ocorrências. | Informar número de respostas, taxa de resposta e período. Pesquisa de entrega não equivale à satisfação de toda a carteira. | ROTA PRO + protocolos; atendimento; semanal/mensal. |
| EX-29 | NPS de relacionamento = % promotores 9–10 − % detratores 0–6; passivos 7–8. | População e janela aprovadas; não agregar pesquisas diferentes nem interpretar amostra mínima como representativa. | Pesquisa de relacionamento; atendimento/produto; cadência definida após piloto. |
| EX-30 | Qualidade dos dados/serviço: atualização, completude de chaves, correlação pedido–remessa–OS e entregas com evidência. | Denominadores explícitos; comprovante existente e auditado são medidas separadas. Alertar por fonte. | Conectores/ROTA/CIP; TI/analista; diário. |

## 7. Metas, alertas e decisões

Metas são aprovadas por empresa, filial, canal, categoria e período, com dono e vigência. Baseline proposto: histórico conciliado de 12 meses quando disponível; onde não houver, medir período inicial e exibir base insuficiente. Não apresentar o relato atual de estoque/vendas como fechamento contábil.

Semáforo depende do sentido da métrica, tolerância aprovada e qualidade do dado. Não estabelecer meta única de giro/cobertura para todo SKU. Crescimento, margem e serviço formam um conjunto: redução de compras que aumenta ruptura não é sucesso isolado; economia de frete que piora entregas precisa ser avaliada.

Cada alerta: indicador, desvio, período, evidência, hipótese de causa, impacto estimado, ação proposta, dono e prazo. A IA explica e investiga; cálculos ficam em consultas/funções testadas. As três fases de autonomia existentes continuam valendo.

Exemplos de perguntas: “Crescemos com margem?”, “Qual economia já está conciliada?”, “Que parte da queda do estoque foi venda, ajuste ou transferência?”, “Qual canal cresce mas consome caixa?”, “Quais filiais precisam melhorar disponibilidade?”, “O custo da entrega está corroendo a contribuição?” e “Qual foi o benefício medido do CIP?”.

## 8. Fontes e dependências para implementação

**Procfit/controladoria:** venda líquida por item/pedido, descontos, tributos, devoluções, custo e método, comissões/despesas, compras/recebimentos, saldos históricos, títulos e baixas. A definição fiscal/contábil será validada pela área; o CIP não substitui fechamento.

**ROTA PRO/Driver:** tarefa/OS, pedido e remessa correlacionados, horários, tentativa, conclusão, ocorrência, evidência, rota, distância/custo quando registrados e avaliação. Não pressupor telemetria ou rateio de custo disponíveis.

**CIP:** metas, versões de fórmula, baseline, iniciativas, propostas, aprovação, responsável, custos do programa e resultado revisado. Marketing/e-commerce poderão fornecer dados autorizados adicionais; atribuição de canal e campanha terá metodologia própria.

Cada indicador guarda ID/versão, definição, fórmula, unidade, grão de cálculo, dimensões, fonte, campos, atualização, responsável, permissões, regra de ausência, meta, tolerância, exemplos e conciliação. Demonstrativo executivo fechado tem data de corte e versão; não reescrever histórico sem registrar ajuste.

## 9. Critérios de aceite

1. Receita/custos conciliados em amostra e período de fechamento aprovado.
2. Testes com devolução, cancelamento, transferência interna, base zero/negativa, duplicidade de nota e pedido com várias remessas.
3. Margens ponderadas corretamente; R$, %, p.p. e períodos identificados.
4. Economia potencial, realizada, custo evitado e capital separados; benefício único sem dupla contagem.
5. Crescimento comparável com conjunto de lojas e dias informado.
6. Nenhum número privado acessível fora da empresa/filial/papel autorizado; metas de diretoria e finanças com escopo próprio.
7. Fonte vencida e incompleta explicitadas; sem meta não há semáforo inventado.
8. Todo cartão abre evidências e permite entender a conta; exportação tem contexto e corte.

Implantar primeiro os seis cartões executivos; habilitar cada um conforme disponibilidade de fonte conciliada. Os demais indicadores entram por abas e necessidade. Nenhum valor fictício será apresentado como resultado real do grupo.
