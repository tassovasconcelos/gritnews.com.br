# Procfit → CIP 360 — solicitação de dados para TI

19/10/2026 · Documento para encaminhamento pelo responsável. Não enviado automaticamente.

Precisamos ampliar a conexão de leitura do Procfit para todas as filiais da Shopping Prohospital e da Distribuidora Prohospital. A finalidade inicial é conciliar vendas, estoque a custo, lotes acima de 180 dias e itens sem vendas, disponibilizando análises para a diretoria pelo CIP e Telegram.

## Liberação inicial solicitada

1. **Origem e acesso:** confirmar banco/view, ambiente, conta SELECT-only, rede/VPN, responsável e janela de consulta. Entregar dicionário de colunas e informar exatamente o que representa cada linha.
2. **Empresas/filiais:** lista oficial completa, códigos, vínculo jurídico/operacional, lojas/CDs/depósitos, situação e datas de abertura/fechamento. Unidades sem movimento devem permanecer identificadas na cobertura.
3. **Produtos:** SKU, descrição, categoria, marca, EAN quando houver, unidade e fatores de conversão, situação e controle por lote/validade.
4. **Vendas por item/evento:** identificadores únicos, empresa/filial, pedido/item, documento/item, SKU, datas, quantidade, bruto, descontos, receita líquida oficial, tributos/tratamento, CMV, tipo/status e referência do original em devolução/estorno. Canal e IDs internos de vendedor/cliente para evolução.
5. **Saldo por filial/depósito/SKU/lote:** físico, reservado, bloqueado, disponível, trânsito, custo e valor oficial, validade, data original da entrada e quantidade remanescente associada à entrada. Transferência não pode reiniciar artificialmente a idade.
6. **Movimentações:** entradas, saídas, ajustes, devoluções e transferências com IDs, datas, quantidades, custo, origem/destino e documento de referência.
7. **Histórico:** solicitar 24 meses de vendas/movimentos e todo o estoque remanescente com sua origem, inclusive antiga. Informar lacunas. Para “sem vendas há 180 dias”, precisamos de janela completa ou última venda positiva verificada.
8. **Atualização:** campo de alteração + chave de desempate, revisões/exclusões/cancelamentos e regra de recuperação de ajustes retroativos. Informar quando os fatos efetivamente ficam disponíveis na view.
9. **Conciliação:** fornecer relatórios oficiais independentes de receita, devolução, CMV e estoque por empresa/filial/período, com definição e arredondamento, para validação com Controladoria.

## Atenção ao formato da view

Se vendas e saldos estiverem na mesma view, precisamos das chaves originais de cada medida e da regra de relacionamento. Uma venda repetida por lote ou movimento pode multiplicar os totais. Preferimos conjuntos separados ou tipos de registro explícitos. Não resolver por `DISTINCT` sem preservar os eventos legítimos.

## Próximos dados, sem bloquear a primeira carga

- Preços por tabela/canal/filial, vigência, impostos, comissão, frete/taxas e alçadas de contribuição.
- Compras e recebimentos por item, saldo em aberto, fornecedor, lead time e condições.
- Cotações, pedidos, perdas e vínculos de conversão.
- Receber/pagar e baixas; despesas por competência/centro de custo.
- Remessas e eventos de entrega correlacionados ao ROTA PRO/Driver.

Metas, pesquisas de cliente, concorrência e oportunidades PNCP podem vir de sistemas próprios. Não exigimos que o Procfit contenha essas informações se forem mantidas em outra fonte.

## Método de implantação

Reaproveitar o VPS/VPN já registrado para locações, preservando a rotina ROTA PRO. O destino CIP terá autenticação e contrato próprios. Começar com frequência horária validada, carga particionada e leitura controlada; aumentar frequência somente após teste de desempenho. O exportador atual de quatro lojas e os limites de carga precisam ser adaptados para cobertura total.

Solicitamos uma amostra representativa e um alinhamento técnico para mapear campos, chaves, cobertura, volumes, frequência, relatórios de conferência e responsáveis. A liberação de acesso não será tratada como homologação automática dos indicadores.

Detalhamento: [Guia completo de dados e decisão](GUIA-DADOS-PROCFIT-DIRETORIA-2026-10-19.md).
