# Proconsumo — contrato da view SQL do Procfit

## Situação

O Grupo informou que disponibilizará uma view SQL. O nome, o esquema, o servidor, a liberação de rede e o usuário de leitura ainda precisam ser informados. A ponte entregue usa ODBC para SQL Server; confirmar o mecanismo com TI antes da instalação. Não foi presumida nenhuma tabela interna do Procfit e nenhuma conexão real foi declarada concluída.

Fluxo: view de leitura → ponte em servidor/VM interno → lotes HTTPS → base de análise Proconsumo → dashboard. A ponte não faz alterações no Procfit. A cópia de análise não gera entrada/baixa no almoxarifado do Proconsumo: evita duplicar estoque e consumo.

## Uma linha por item de documento ou movimento

Identidade estável: `(operation_key, kind, source_id, line_id)`. A view não pode multiplicar o item ao juntar impostos, pagamentos, fornecedores ou rateios. Se houver rateio por setor/loja, cada parcela precisa de `line_id` próprio, quantidade e valor rateados que reconciliem com a origem.

| Coluna | Conteúdo esperado |
|---|---|
| operation_key | `distributor` (Distribuidora Prohospital / Rainara) ou `retail` (Shopping Prohospital / Holanda); TI deve mapear empresas/CNPJs reais para essas frentes. |
| source_id / line_id | Identificadores estáveis de documento/movimento e item/parcela. Não usar número de linha variável da consulta. |
| kind | `purchase`, `purchase_return`, `consumption` ou `consumption_return`. Compra não deve ser confundida com consumo. |
| occurred_on | Data do evento de negócio no calendário local, `YYYY-MM-DD`. |
| source_updated_at | Data/hora da última alteração na origem, ISO 8601 **com fuso**; por exemplo, formato UTC com `Z`. Retornar como texto ISO com offset se o driver não preservar o datetimeoffset. |
| status | `posted` ou `cancelled`. Cancelamentos continuam presentes na view com a mesma identidade, campos completos e updated_at mais recente. Não excluir silenciosamente a linha. |
| cost_center_code / cost_center_name | Código/nome real do setor da distribuidora ou loja do varejo. Código obrigatório para consumo e devolução de consumo; compras sem rateio podem ficar sem destino. |
| product_code / product_name | Código único do produto no Grupo e descrição. Se os códigos diferirem entre bases, unificar na view ou usar um identificador composto estável. |
| base_unit | Unidade normalizada de consumo, estável por produto. Converter caixas/pacotes para unidade base antes de publicar a view. Alteração de unidade exige revisão, não conversão silenciosa. |
| supplier_code / supplier_name / supplier_tax_id | Código e nome obrigatórios em compras/devoluções de compra; CNPJ opcional. Usar códigos únicos no Grupo. |
| document_number / access_key | Número da NF/documento e chave NF-e com 44 dígitos quando disponível. São referências à nota; o XML/PDF original não é extraído automaticamente por esta view. |
| quantity_base | Quantidade estritamente positiva na unidade base. Devoluções usam o kind correspondente, sem inverter novamente o sinal. Até quatro casas decimais. |
| unit_cost_landed | Custo por unidade base, incluindo frete e impostos não recuperáveis e descontando descontos rateados, conforme definição homologada por Compras/Financeiro. Até seis casas decimais. |
| total_landed | Total do item/parcela, duas casas decimais. Deve reconciliar com quantidade × custo unitário (tolerância de R$ 0,02). Não somar novamente frete/impostos no dashboard. |
| currency | `BRL`. Não são misturadas moedas ou aplicadas conversões cambiais implícitas. |

As colunas opcionais devem existir na view/CSV, com NULL/vazio quando não aplicáveis. Um código de centro de custo não cadastrado não é descartado: aparece como origem ainda sem vínculo, para saneamento em Administração → Marca e integrações. As lojas reais precisam ser cadastradas na aba Lojas, com o código da view; não foram inventados nomes de lojas.

## Instalação da ponte

- Executar em servidor interno com acesso ao banco, Python e driver ODBC oficial do SQL Server. Instalar a versão de pyodbc homologada por TI e fixá-la no ambiente da ponte.
- Criar usuário com **SELECT somente na view**, sem autorização para DML, DDL ou leitura genérica do banco. `readonly=True` é uma defesa adicional, não substitui as permissões no SQL.
- Conexão com TLS e certificado válido. O código não aceita desabilitar validação do certificado.
- Guardar `PROCFIT_ODBC_CONNECTION`, `PROCFIT_VIEW_NAME`, `PROCONSUMO_SUPABASE_URL` e `PROCONSUMO_SUPABASE_SERVICE_ROLE_KEY` no gerenciador de segredos do servidor ou GitHub Secrets, conforme o executor escolhido. Nunca no navegador, no código, em arquivos sincronizados, em parâmetros do processo ou mensagens.
- O destino está restrito ao projeto Proconsumo `xscxwazanootrdtyrumb`. A função de ingestão não é executável por anon ou authenticated.

Validação local de exportação canônica, sem envio:

```text
python scripts/sync_procfit_view.py --csv caminho-do-export.csv
```

Leitura da view configurada no ambiente, sem envio:

```text
python scripts/sync_procfit_view.py
```

Somente depois da homologação e com segredos configurados no servidor:

```text
python scripts/sync_procfit_view.py --apply
```

O padrão é dry-run. A ponte valida moeda, unidade, origem/destino, valores, fuso, duplicidades e reconciliação. Lotes de até 500 linhas são atômicos; o job completo pode ter vários lotes. Falha posterior não desfaz lotes já aceitos: corrigir a origem e repetir a carga; a identidade evita duplicar os fatos e versões antigas não sobrescrevem versões novas. O painel mostra **último lote recebido**, não promete que um job interrompido terminou. Monitorar o código de saída do processo para considerar a sincronização completa. Uma fonte acima do limite configurado não é tratada como carga completa.

## Indicadores e critérios

- Consumo = baixas confirmadas menos devoluções; compras = recebimentos menos devoluções de compra. Cancelados são excluídos.
- ABC por valor líquido de consumo, usando todas as linhas do período. A primeira faixa cobre 80%, B até 95%, C o restante. O item que cruza o limite permanece na faixa em que começou. Devoluções líquidas negativas não entram na base positiva da classificação.
- Economia de preço = custo de referência menos custo atual em compras comparáveis. Referência: custo médio ponderado do último dia anterior com compras do mesmo produto/unidade/operação. Compras sem referência e devoluções não entram nessa comparação. Não é lucro, economia contábil auditada nem redução absoluta de despesas.
- Meta percentual inicialmente **a definir**, sem inventar um percentual. A administração do Grupo configura a meta e os vínculos de aprovação.
- As somas e a ABC são calculadas no banco em todo o recorte. Detalhes exibem até 250 movimentos e últimas compras até 100 linhas, com limites explícitos no painel/exportação.

## Fluxo de operação e compras

1. Usuário escolhe frente autorizada e setor/loja, monta a requisição e acompanha o protocolo.
2. Rainara libera as requisições da Distribuidora; Holanda libera as do Shopping. As contas precisam estar ativas, vinculadas à operação e com perfil/alçada apropriados. Não há autoaprovação nem liberação baseada apenas no nome.
3. Financeiro mantém a aprovação de alçada/orçamento quando aplicável. Almoxarifado separa e registra a entrega.
4. Compras registra todos os itens e propostas, incluindo referência da proposta, embalagem/unidade, frete, imposto adicional, desconto, prazos e conformidade técnica.
5. Compras documenta o fornecedor recomendado e os critérios, inclusive a justificativa de fornecedor único ou escolha acima do menor preço.
6. Formaliza o dossiê. O banco congela propostas, nomes e critérios em snapshot e auditoria; a interface permite baixar o dossiê HTML para guardar/imprimir em PDF pelo navegador.
7. Somente com o dossiê formalizado pode propor o pedido de compra, sujeito à aprovação financeira existente. A formalização não compra nem envia e-mail automaticamente.

Referências técnicas: [pyodbc conexão somente leitura](https://github.com/mkleehammer/pyodbc/wiki/The-pyodbc-Module), [timeout de consulta](https://github.com/mkleehammer/pyodbc/wiki/Connection), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
