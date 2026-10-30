# Gestão da padaria — 30/10/2026

A operação `/app` deixa de usar o limite de 520 px do aplicativo móvel. A área tem cabeçalho da padaria, navegação lateral no computador, seletor de loja e conteúdo amplo. Em telas menores, os módulos ficam em uma navegação horizontal, mantendo as tabelas com rolagem própria.

Proprietário e gestor entram no Dashboard gerencial. Os módulos são: PDV, catálogo, estoque e mínimos, compra inteligente, vendas e rentabilidade, despesas, caixa e equipe/configurações. O Super Admin, ao abrir a operação em consulta, tem os mesmos relatórios sem botões de alteração habilitados. Alterações de suporte continuam exigindo uma sessão autorizada. Caixa, estoque e consulta mantêm as permissões de seus perfis.

## Indicadores e decisões

- Períodos de 7, 30 e 90 dias por loja, usando o calendário de Fortaleza. Os totais são agregados no banco, sem depender do limite de linhas do Data API.
- Faturamento de vendas concluídas, comparação com o período anterior, atendimentos, ticket médio, gráfico diário, produtos com maior faturamento e formas de pagamento.
- Fiado integra o faturamento e aparece identificado nos pagamentos. Não se apresenta esse total como dinheiro recebido.
- Próximas ações baseadas em estoque mínimo, custos pendentes, catálogo em revisão e evolução das vendas.
- Despesas com descrição, categoria e valor, gravadas com ator e evento de auditoria. Não se deve registrar novamente o custo da mercadoria como despesa operacional.
- Análise por produto, quantidade vendida, faturamento, margem bruta conhecida, custo/preço atuais e margem atual. Busca e ordenação por faturamento, menor margem ou custo pendente. Exportações CSV preservam unidades e neutralizam fórmulas.

## Custos históricos e rentabilidade

O gatilho de inserção do item captura o custo vigente do produto. Um valor fornecido pelo cliente na coluna de snapshot não substitui o custo do cadastro. Custos positivos anteriores são reconhecidos; custo zero exige revisão explícita. Vendas antigas sem snapshot continuam sem custo histórico. Não se usa o custo de hoje para fabricar o resultado passado.

Descontos são rateados proporcionalmente ao valor dos itens. O dashboard só apresenta margem total e resultado após despesas quando os custos históricos do período estão completos. Também informa a margem dos itens cujo custo é conhecido. O resultado após despesas considera apenas os lançamentos registrados e não equivale ao lucro líquido contábil.

## Estoque e compra inteligente

Cada produto tem saldo, mínimo e alvo por loja. Alterações exigem motivo e produzem movimento com a diferença entre o saldo anterior e o novo, além de evento de auditoria. As operações usam bloqueio da linha e transação do banco. Produto e loja devem pertencer à mesma organização.

A demanda semanal é o maior valor entre as vendas dos últimos sete dias e um quarto das vendas dos últimos 28 dias. O alvo calculado é o maior entre o alvo cadastrado, mínimo e demanda semanal com 15% de segurança, arredondada para cima. A sugestão é `máximo(0, alvo calculado − saldo)`. O gestor pode revisar as quantidades e exportar. A lista não envia pedidos nem movimenta estoque.

Produtos ativos de pronta entrega e encomenda entram na análise. Para encomendas, a tela orienta revisar pedidos e validade antes de produzir/comprar. Itens inativos ou com modalidade a confirmar ficam fora das sugestões. Não se somam quantidades de unidades diferentes em um indicador único.

Por solicitação expressa do usuário, a loja principal da Padaria Delícias do Pão recebeu saldo 50, mínimo 5 e alvo 50 nos 102 produtos. O saldo segue a unidade de venda cadastrada: 87 UN, 14 PACOTE e uma CAIXA. O lançamento ocorreu em homologação, com movimentos e evento que guarda o saldo anterior, sem alterar o estado ativo/inativo dos produtos. Uma venda e um saldo preexistentes foram preservados no histórico; o ajuste completou o saldo solicitado. O evento de inicialização impede repetir essa carga silenciosamente. A alteração é específica deste cliente; não inicializa estoques de outros clientes.

## Validação

- 22 testes administrativos (incluem sete novos testes gerenciais) e 20 testes compartilhados de operações passaram.
- TypeScript/Vite e smoke do Sr. Padeiro passaram.
- Migrações geradas pela CLI, validadas com PostgreSQL local e aplicadas ao projeto operacional. Funções públicas usam SECURITY INVOKER e verificam escopo/perfil e troca obrigatória de senha.
- No banco real, transação com rollback verificou ajuste de estoque, custo e preço, despesa, auditoria, conclusão de venda com baixa de 50 para 49, snapshot de custo e preservação do snapshot após editar o custo. A transação usou papel autenticado e claims de sessão existente válidos apenas como fixture de teste SQL. Não houve login de navegador em nome do cliente nem venda de teste persistida.
- Tentativas com sessão antiga foram recusadas pelo controle de senha já existente. Comparação dos advisors antes/depois não identificou achados novos.
- A publicação deve ser conferida no JavaScript e CSS servidos pela hospedagem após o merge. As verificações de build, HTTP e banco não substituem uma revisão visual autenticada com o proprietário.

Os custos reais que ainda não foram informados precisam ser revisados pelo gestor. Não foram inventados custos, margens, despesas ou vendas para preencher o dashboard.
