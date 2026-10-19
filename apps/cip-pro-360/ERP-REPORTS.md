# Procfit & relatórios — base manual conciliada

Release 19/10/2026. Nenhuma conexão real com o SQL Server foi executada. Nenhum dado real de vendas ou estoque foi recebido nesta implantação. As fixtures dos testes são sintéticas, isoladas e revertidas; não existem dados demonstrativos nas consultas de produção.

## Fluxo disponível

1. Superadm abre **Procfit & relatórios**, baixa modelos CSV ou usa o pacote JSON do exportador.
2. Importa a base, declara cobertura de vendas, escopo de lojas, saldo disponível ou físico e atualização. Só é aceito o catálogo das duas empresas CIP, com SKU e unidade explícitos.
3. Validações bloqueiam chaves duplicadas, SKU sem cadastro, datas inválidas/futuras, quantidades negativas em estoque, campos numéricos vazios e valores inconsistentes. Não há truncamento silencioso. Limites do piloto: 4 MB de arquivos combinados, 20 mil linhas por conjunto, até 8 MB por snapshot normalizado. Bases maiores exigem evolução do transporte/armazenamento; não declare a empresa completa se exportou apenas parte.
4. As empresas são separadas em snapshots imutáveis em rascunho, com hash SHA-256 do pacote normalizado, fonte e responsável. O hash não prova autenticidade do ERP: a conferência humana é necessária.
5. Superadm confere totais obtidos independentemente no ERP e registra nota de responsável, cobertura, custo e critérios. Divergência maior que R$ 0,01 bloqueia a liberação. A tolerância estrita desta importação não substitui a homologação financeira do conector.
6. Só bases aprovadas aparecem no bot. A mais recente é escolhida pela data de captura, não pela ordem de upload. Base com mais de 36 horas recebe aviso. Sem base, não há valor inventado nem saldo zero por ausência.
7. O painel pagina todos os produtos/lojas do filtro em grupos de 20. O Telegram mostra os primeiros cinco e aponta o painel. Mensagens longas são divididas; não são cortadas silenciosamente.

O piloto financeiro é exclusivo do superadm tanto no app quanto no bot. Custos não foram liberados automaticamente para vendedores ou outros perfis. Escopo e origem sempre aparecem. A base manual é referência para homologação e não equivale a conexão em tempo real, homologação do ERP nem liberação de ações automáticas.

## Consultas

- `/vendas`: venda líquida do mês corrente em Brasília, do primeiro dia até o menor entre hoje e a cobertura importada. Exige cobertura completa desde o início do mês e snapshot do mês corrente; caso contrário, valor indisponível. Atualização anterior a hoje não se apresenta como venda até o instante atual. Escopo de piloto/lojas selecionadas permanece explicitamente parcial.
- `/estoque`: soma do valor informado nas linhas de saldo disponível ou físico, conforme declaração. Valor ausente não é zero; arquivo de estoque vazio e cobertura não confirmada permanece indisponível.
- `/parados`: saldo remanescente com entrada original **há mais de 180 dias**, por lote. Não usa idade média, última venda, giro ou `stock_age_days` agregado como substitutos de data de entrada. Se faltarem lotes/cobertura, o total completo fica indisponível e a parte conhecida é identificada.
- `/semvendas`: SKU/loja sem venda positiva na janela de 180 dias. Exige histórico completo cobrindo a janela até a data de referência ou coluna de última venda verificada; ausência de registro em histórico incompleto não comprova ausência de vendas. Não confundir com idade por lote.
- `/giro`: prioridades de capital parado e plano de trabalho de Giro, Prisma, Elo e Sofia. O botão de propostas no painel exige base aprovada, cria quatro missões em revisão no Quartel e não executa transferências, descontos, compras ou campanhas.

O roteador por regras já reconhece as perguntas sobre venda mensal, custo do estoque, estoque acima de 180 dias e giro. A IA opcional amplia interpretação por texto e voz, mas não calcula os totais: o mesmo motor determinístico usa valores decimais e soma em inteiros de centavos. Não são geradas consultas SQL pelo modelo. Outros períodos ou ferramentas não disponíveis exigem esclarecimento.

## Contrato de importação

JSON: `schema` = `cip-procfit-v1` ou `cip-procfit-v2`, `captured_at` em ISO com fuso, `datasets` com arrays `products`, `inventory`, `sales` e `prices` opcional. O exportador v1 só pode ser declarado saldo **disponível**; v2 com lotes tem saldo físico remanescente.

CSV: um arquivo por conjunto, cabeçalhos snake_case, separador selecionável e formato numérico declarado. Brasil: `1.234,56`; canônico: `1234.56`. A conversão não adivinha o significado de ponto e vírgula. Datas: AAAA-MM-DD ou DD/MM/AAAA.

| Conjunto | Colunas |
|---|---|
| products | company_id, sku, description, unit, category |
| inventory | company_id, store_id, sku, quantity, average_cost, stock_value, lot_id, received_date, last_sale_date |
| sales | company_id, store_id, sku, sale_date, quantity, net_revenue, cost_of_goods |
| prices (opcional) | company_id, store_id, sku, current_price |

Empresas: `shopping_prohospital`, `distribuidora_prohospital`. Produtos: chave empresa + SKU. Estoque: empresa + loja + SKU + lote; sem lote, uma linha agregada não comprova idade. Vendas: totais diários líquidos por empresa + loja + SKU + dia, com cancelamentos/devoluções/descontos conciliados no ERP. Valores monetários totais têm duas casas; quantidades têm até quatro, custo médio até oito, CMV agregado e preço unitário até quatro. Valorização compara quantidade × custo médio arredondado a centavos contra stock_value, com tolerância de R$ 0,02 por linha para arredondamento; divergência precisa ser corrigida na origem. O total importado também precisa conferir com o ERP na revisão.

`received_date` é a data original de entrada do lote ainda remanescente, preservada em transferências conforme regra validada pela TI/Financeiro. `last_sale_date` é a última venda positiva do SKU/loja; só será usada sem histórico completo se a declaração de verificação tiver sido marcada e revisada. Campos vazios não viram datas ou saldos fictícios. Um conjunto vazio é explícito: CSV somente com cabeçalho ou array vazio, acompanhado da declaração e conferência.

## Exportador SQL Server preparado

`ops/procfit-export.ps1` continua SELECT-only, com TLS e credencial em prompt. Não foi executado; PowerShell e rede Procfit não estão disponíveis aqui. A TI deve criar e homologar as views propostas. Parâmetros `SalesFrom`/`SalesThrough` filtram o período por parâmetros SQL. Sem `IncludeLotAging`, exporta v1 e não comprova idade. Com esse switch, depende da view proposta `cip.vw_inventory_lots` com `quantity_remaining_physical`, `average_cost`, `stock_value`, `lot_id`, `original_receipt_date`, `last_positive_sale_date`, além de empresa/loja/SKU. Não há criação automática de view, inferência de credenciais ou escrita no ERP.

A importação manual não agenda transferência de dados nem liga a rede/VPN. O conector automático continua dependendo da TI, do isolamento planejado, das alçadas e da conciliação formal. A chave OpenAI só habilita interpretação/transcrição e nunca dá acesso ao banco Procfit.
