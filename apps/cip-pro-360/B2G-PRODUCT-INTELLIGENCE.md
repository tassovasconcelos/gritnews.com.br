# Radar B2G — inteligência por produto e período

Entrega de 19/10/2026. A versão incorporou primeiro `e7ef991` (acesso da diretoria pelo Telegram e Marca-passo por contribuição) e acrescentou pesquisa nacional por produto. Nenhuma atualização exige misturar dados do ROTA PRO.

## Fluxo de uso

1. Distribuidora → Radar B2G. Digite produto/família ou informe um código oficial conhecido.
2. Selecione família PDM; consulte suas especificações e escolha CATMAT quando quiser comparar um produto mais preciso. Os códigos não são SKUs do Procfit e a correspondência não é automática.
3. Escolha Brasil ou UF do órgão comprador e período de até três anos. A data usada inicialmente é a do resultado no conjunto de pesquisa de preços da fonte.
4. Busque referências. Cada página tem até 50 registros; carregue as páginas seguintes para ampliar o histórico. Marca e fornecedor filtram as páginas já recebidas, não todo o universo remoto.
5. Toque em Conferir vencedores e porte: até 30 referências por rodada, três consultas concorrentes. A verificação cruza item, fornecedor, situação ativa, quantidade e preço com resultado PNCP. Repetir permite conferir as restantes.
6. Veja datas da pesquisa e do resultado PNCP separadamente; divergências ficam explícitas. O período final de exibição usa a data PNCP quando confirmada.
7. Escolha uma série de produto + embalagem + marca para acompanhar medianas mensais, mínimo, máximo e número de observações. Somente resultados conferidos, marca não vazia/numérica e capacidade válida entram na curva. A verificação é de consistência de registro, não prova de equivalência técnica ou autenticidade da marca.
8. Exporte as referências filtradas ou registre uma análise em revisão no Quartel para Íris, Prisma e demais especialistas envolvidos. Nenhum lance, proposta, preço ou campanha é enviado automaticamente.

## Precisão e linhagem

Fontes oficiais: catálogo de materiais/PDM e pesquisa de preços do Compras.gov.br, com conferência de resultados disponibilizados pelo módulo PNCP na mesma API. A cobertura é nacional dos registros disponibilizados por essa fonte; não se declara cobertura integral de todos os portais/contratações do Brasil.

O índice textual publicado possui 20.443 famílias PDM, incluindo inativas identificadas para pesquisa histórica, coletadas em 19/10. `collect-b2g-catalog.mjs` permite atualização atômica após verificar todas as páginas e contagens. O índice não contém fornecedores ou dados privados.

Por referência: CATMAT, descrição, descrição detalhada, unidade/embalagem, capacidade e medida, marca declarada, preço unitário, quantidade, fornecedor/CNPJ informado, porte do resultado quando confirmado, órgão, cidade/UF, datas, coleta e URLs de evidência. Modelo permanece não informado quando não disponível. Porte “Demais” não vira “grande empresa” por inferência; não é consulta cadastral atual. Marca numérica recebe aviso de conteúdo atípico.

Identificadores longos retornados como número pela API são preservados como texto antes do parse; arredondamento numérico de JavaScript não pode mudar compra/item e cruzar o resultado errado. Cancelamentos, fornecedores ou quantidades divergentes não são classificados como vencedor conferido.

No teste real, uma pesquisa de luvas encontrou 4.421 referências no recorte nacional de um ano; 50 foram carregadas e 30 conferidas, com 14 correspondências de vencedor naquele momento. A data de uma referência divergiu da data do resultado PNCP; ambas foram preservadas. Isso é evidência do teste, não um relatório atualizado do mercado nem estatística representativa.

## Histórico e análise

Chave da série: CATMAT + unidade de fornecimento + capacidade + unidade de medida + marca declarada normalizada. PDM amplo ou marca isolada não identifica produto equivalente. O sistema não soma quantidades de embalagens diferentes, não converte unidades sem contrato e não mistura essas séries na mediana.

Gráfico e tabela usam mediana dos preços observados por mês de resultado, não média ponderada de despesa nem estimativa de preço de mercado. Faixa mínimo/máximo e contagem expõem a composição. Variação entre primeiro/último mês é descritiva; não é índice de inflação, efeito causal ou previsão. Há fatores não normalizados, como quantidade, região, frete, prazo e exigências técnicas.

Nenhum resultado aparece como “último preço do Brasil”: os cartões são ordenados do mais recente ao mais antigo dentro das páginas carregadas. O total e a cobertura parcial ficam visíveis. Dados ainda não conferidos permanecem referências e não alimentam a curva de vencedores. Datas divergentes podem fazer um registro sair do período após conferência; isso é necessário para respeitar a data do resultado confirmado.

## Serviços e segurança

`cip-b2g`: sessão válida e `cip_can_access('distribuidora_prohospital')` no servidor. A IA não amplia permissões. Endpoint recebe ações/IDs/períodos validados e gera somente URLs oficiais fixas, sem URL arbitrária ou escrita externa. JWT é verificado internamente com getUser; acesso sem autenticação retorna 401. Cache transitório de dez minutos por consulta e limite local por usuário/instância; não equivale a controle global distribuído ou monitoramento persistente.

O teste de navegador local usa um adaptador de dados públicos sem credenciais e sem gravação no CIP. Não comprova autenticação real ou inserção de missões em produção. Criação de missão usa a política existente e continua sujeita à alçada do usuário autenticado.

As publicações gerais anteriores permanecem em uma seção recolhida. Novas consultas dessa seção abrangem Brasil; a amostra estática antiga mantém seu escopo Ceará claramente identificado na própria fonte. O novo fluxo principal não depende daquelas publicações.

## Próximas evoluções

- Guardar pesquisas aprovadas e snapshots de referência em índice persistente para busca por marca/fornecedor em todo o acervo, sem depender só das páginas carregadas.
- Coletor incremental com revisão de cancelamentos e trilha temporal, após definição de orçamento/cadência/fontes. O atual é sob demanda.
- Equivalências técnicas revisadas entre CATMAT, marca/modelo e SKU Procfit; homologar embalagem, registro sanitário quando aplicável, frete, capacidade e condições.
- Comparativos entre marcas equivalentes com filtros de quantidade e condições, amostra mínima e estatísticas robustas; não misturar unidades automaticamente.
- Íris qualifica demanda e concorrentes, Prisma/Cifra validam contribuição/custo de servir, Giro/Nexo conferem estoque/fornecimento e Rumo verifica entrega nacional. RufasIA consolida decisões, responsáveis e resultado; Sofia mantém casos avaliados.
- Ampliar fontes oficiais onde necessário e explicitar cobertura por portal/tempo/UF. Pesquisa por marca isolada com alcance nacional completo exige esse índice e não está prometida nesta entrega.

## Documentação oficial consultada

- https://dadosabertos.compras.gov.br/swagger-ui/index.html e https://dadosabertos.compras.gov.br/v3/api-docs
- https://pncp.gov.br/manual/pt-br/latest/singlehtml/
- Endpoints: `/modulo-material/3_consultarPdmMaterial`, `/modulo-material/4_consultarItemMaterial`, `/modulo-pesquisa-preco/1_consultarMaterial`, `/modulo-contratacoes/3.1_consultarResultadoItensContratacoes_PNCP_14133_Id`.
