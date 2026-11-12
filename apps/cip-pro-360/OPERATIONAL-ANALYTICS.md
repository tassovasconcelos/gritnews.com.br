# Núcleo de consultas operacionais — incremento local

Estado: testável, sem integração de produção. `operationalReport` não acessa rede, banco, Telegram ou OpenAI. Não libera os relatórios ERP no bot existente.

Entrada baseada em `cip-procfit-v1`, acrescida de metadados emitidos por ingestão confiável: `source`, `reconciled: true`, `coverage[company]` com `stores`, `sales_from`, `sales_through` e `aging_method`. O exportador atual ainda não produz esses metadados. Identidade e autorização vêm de sessão validada no servidor, jamais da IA ou do arquivo enviado. `storeIds` representa o escopo completo coberto pelo relatório; cobertura diferente é recusada.

Datas do período são datas civis ISO inclusive nos extremos; a camada de consulta deve resolver “hoje” em America/Sao_Paulo e informar a data de fechamento disponível. `captured_at` é o instante da captura; cobertura de vendas é independente. Limite padrão de atraso de 24 horas é provisório/configurável, não promessa de tempo real. O resultado STALE precisa ser mostrado como atrasado, e não como saldo atual.

Vendas: uma linha diária por empresa/loja/SKU/data com `net_revenue` assinado, incluindo estornos conforme Financeiro. Estoque: uma linha por empresa/loja/SKU com saldo e `stock_value` oficial em BRL. Duplicatas são erros, não somadas silenciosamente. Valores monetários devem estar arredondados a centavos pelo contrato financeiro antes do cálculo.

Para aging, exigir `aging_method: remaining_lots` e campos `aged_quantity_180`/`aged_stock_value_180` calculados na origem sobre os saldos de lotes com idade ESTRITAMENTE maior que 180 dias. Não derivar esses valores de `stock_age_days` agregado ou da última venda. Estoque sem vendas e idade dos lotes são medidas diferentes. Quantidades de SKUs/unidades distintos não são somadas.

Homologação pendente: evidências de conciliação, permissões por filial, precisão e arredondamento aprovados pelo Financeiro, cobertura completa, carga atômica/idempotente, retenção, auditoria de consultas e integração com ferramentas do bot. Os testes atuais são sintéticos e não validam dados Procfit ou chamadas reais da IA.

Verificação local: `node --test apps/cip-pro-360/operational-analytics.test.mjs`.
