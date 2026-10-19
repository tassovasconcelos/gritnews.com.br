# Shopping — carga provisória das lojas

O usuário confirmou em 19/10/2026 que a planilha contém somente estoque parado em lojas. A menção inicial ao CD e a resposta “100” foram corrigidas: o CD não está incluído. Os nomes das lojas não foram mapeados; preservar os 19 códigos de origem.

Fonte privada: Produtos Sem Giro +180 dias.xlsx, Planilha1, A1:N6763; SHA256 `0e0c8168f496bf52122aac71708f3e765fb1da983d5f69c14e90ae3429a2ba9a`. São 6.762 linhas únicas por código da loja/SKU, 3.295 SKUs. Não publicar planilha, registros, custos, preços ou totais no Git ou no pacote estático.

Em todas as linhas, a data mais recente entre última venda e última entrada somada a “Dias Sem Venda” resulta em 16/10/2026. Data-base e semântica são deduzidas dessa identidade; aguardam confirmação do responsável pela exportação. Não rotular esse contador como dias desde a última venda, nem como idade original do saldo por lote. Não há unidade de fornecimento, lotes, reservas, validade ou histórico completo de vendas.

50 linhas têm diferença absoluta superior a R$0,01 entre o custo total informado e quantidade × custo unitário arredondado em centavos. 11 linhas têm custo unitário zero. Preservar os valores de origem e a diferença calculada, sem corrigir silenciosamente. Potencial = saldo × preço cadastrado: não representa receita, contribuição ou lucro. Não somar quantidades entre produtos sem unidade.

## Armazenamento e acesso

Schema: `schema/stock-reference.sql`. Lote privado em `cip_stock_reference_batches`; linhas em `cip_stock_reference_rows`. Status `loading` durante carga e `reference_unreconciled` somente após conferir contagem e somas. Chaves hash/código da loja/SKU e hash/linha da planilha tornam reprocessamento idempotente. Novo lote deve manter a origem anterior auditável; interface consulta o lote disponível mais recente, sem somar versões.

RLS exige `cip_can_access(shopping_prohospital)` e lote disponível; authenticated pode apenas ler, anon não tem SELECT. Nenhum dado é inserido nos snapshots ERP aprovados, no ROTA PRO ou no bot financeiro. Atualização da planilha é pontual, não rotina Procfit de dez minutos.

Interface `stock-reference.mjs` dentro de Procfit & relatórios: carga explícita, leitura de todas as páginas, comparação com contagem/somas do lote, pesquisa por SKU/descrição/marca, filtros loja/grupo/pendência, ordenação por custo e paginação visual. Falha ou truncamento não apresenta uma carga parcial como completa. Sem alterações automáticas de preços ou saldo.

Radar B2G: botão de inclusão do mix Shopping exige acesso adicional à Shopping via RLS, mesmo que o usuário já tenha acesso B2G da Distribuidora. Consulta somente catálogo (SKU, descrição, marca, grupo/subgrupo), sem custo, saldo ou preço. Agrupa repetições do mesmo SKU entre lojas para pesquisa e identifica origem Shopping. Não certifica marca/modelo nem equivalência CATMAT. Catálogos de origens distintas mantêm identificação própria.

## Verificação

Contagem, SKUs, lojas, somas e critério das datas conferidos no banco contra extração privada. Grants/RLS conferidos; authenticated sem vínculo de empresa lê zero lotes/linhas. Consultor de segurança não indicou estas tabelas. Testes de filtros, centavos, grão SKU/loja e ausência de cálculos de receita/lucro em `stock-reference.test.mjs`.

Verificação local no navegador com dados reais da planilha e adaptador somente leitura: carga completa, filtros de 50 divergências, 11 custos zero, loja5 com881 linhas, inclusão de3.295 produtos no B2G e seleção de SKU77360. Sem erros no console. Evidência privada em `evidencias/cip-shopping-lojas-carga.png` na raiz externa do repositório. Não equivale a homologação de sessão autenticada em produção.
