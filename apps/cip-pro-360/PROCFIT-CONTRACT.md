# Procfit — contrato proposto para homologação com TI e Financeiro

**Ampliação de 19/10/2026:** o pedido para todas as filiais, o gateway existente, o grão de cada conjunto, o histórico e os requisitos dos 14 especialistas estão no [guia de dados para a diretoria](../../conhecimento/GUIA-DADOS-PROCFIT-DIRETORIA-2026-10-19.md). Esse guia é especificação; não comprova liberação da view ou conexão homologada. O exportador abaixo ainda restringe a seleção a quatro lojas e deve ser adaptado antes de prometer cobertura integral.

Estado: preparado; sem acesso ao ERP, sem execução no ambiente Prohospital e sem integração homologada. Nenhum número do simulador é dado real de ERP.

## Transporte e autorização

Executar `ops/procfit-export.ps1` dentro da rede/VPN autorizada. A TI fornece servidor, base, conta SELECT-only, certificado TLS válido e quatro códigos reais de lojas. Credenciais são solicitadas em prompt seguro, sem arquivo de senha. ApplicationIntent ReadOnly é uma preferência de conexão, não substitui os GRANT/DENY do banco. O script usa somente SELECT e recusa papéis sysadmin, db_owner e db_datawriter. Snapshot deve ser habilitado pelo DBA; o conector não altera configurações do SQL Server.

As views abaixo são interfaces propostas e ainda não existem de forma comprovada. A TI deve mapear as tabelas oficiais do Procfit, regras de saldo, custo, devoluções e tributos antes de disponibilizá-las.

| View proposta | Campos e significado mínimo |
|---|---|
| cip.vw_products | company_id, sku, ean, description, unit, category, observed_at |
| cip.vw_inventory | company_id, store_id, sku, quantity_available, average_cost, stock_value, stock_age_days, observed_at |
| cip.vw_sales_daily | company_id, store_id, sale_date, sku, quantity, net_revenue, cost_of_goods, observed_at |
| cip.vw_prices | company_id, store_id, sku, current_price, average_cost, expense_pct, observed_at |

## Regras de dados a decidir

- Chave: empresa + loja + SKU; produtos preservam SKU e unidade oficiais. EAN ausente permanece nulo.
- Custo médio e valor do estoque devem respeitar o fechamento financeiro oficial. Valores monetários em BRL, precisão decimal declarada pela TI.
- Saldo disponível: documentar reservas, bloqueios e estoque em trânsito. Quantidade indisponível nunca vira zero por ausência de dado.
- Idade de estoque: definir lote/entrada e método ponderado. Não inferir idade pela última venda.
- Vendas: conciliar cancelamentos, devoluções, descontos e CMV no mesmo período do ERP. Datas devem indicar fuso e data de fechamento.
- Taxas e despesas: declarar o denominador e os componentes. Uma taxa desconhecida não recebe um valor ilustrativo.
- Frequência proposta: diária, com horário, timezone, SLA e responsável definidos pela TI. Reexecução idempotente por snapshot e chave.

## Aceite do piloto

1. Definir quatro lojas piloto e quatro de controle comparáveis; códigos oficiais e aprovação da diretoria ainda pendentes.
2. Reconciliar 100% das chaves de produto/loja e registrar rejeições sem descartes silenciosos.
3. Diferença financeira inferior a 2% é a tolerância proposta pela auditoria, sujeita à assinatura do Financeiro; não é liberação automática.
4. Exibir origem, período, última atualização, integridade e atraso no app antes de habilitar recomendações operacionais.
5. Somente após isolamento do banco, acesso por filial, baseline e alçadas aprovadas liberar o piloto.

## Entrega disponível

O exportador gera um snapshot JSON e o último resultado de conexão local. Não envia dados pela internet, não concede acessos no SQL Server e não modifica o ERP. Importação automática no CIP será habilitada após validar o contrato e o destino dedicado.

## Entrada manual para homologação — implementada em 19/10

O módulo **Procfit & relatórios** recebe JSON/CSV como rascunho e libera uma base de referência apenas após conciliação humana. Não é conector automático nem homologação do ERP. Veja `ERP-REPORTS.md` para contrato de colunas, limites, precisão, escopo parcial, aprovação e comandos do Telegram.

A view opcional de lotes `cip.vw_inventory_lots` é proposta e depende da TI: `company_id, store_id, sku, quantity_remaining_physical, average_cost, stock_value, lot_id, original_receipt_date, last_positive_sale_date`. A data original e o saldo remanescente precisam ser validados; não substitua por idade média nem última venda. O exportador tem parâmetros de datas e o switch `IncludeLotAging`, ainda não executados no ambiente Procfit.
