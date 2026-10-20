# Radar B2G — inteligência por produto e período

Entrega de 19/10/2026. A versão incorporou primeiro `e7ef991` (acesso da diretoria pelo Telegram e Marca-passo por contribuição) e acrescentou pesquisa nacional por produto. Nenhuma atualização exige misturar dados do ROTA PRO.

## Evolução de precisão e cobertura — 19/10/2026

Esta seção substitui os limites anteriores de 50 preços, 20 CATMATs e 30 conferências fixas. Cada página de preços solicita até 500 registros na fonte; a ampliação assistida lê até dez páginas (5.000 registros) sob demanda, sem afirmar cobertura integral do Brasil. Cada página de especificações tem até 100 itens. A tela apresenta inicialmente 50 cartões, com mais resultados sob demanda; filtros, CSV e histórico usam toda a amostra carregada.

Busca de família ordena candidatos por termos, abreviações usuais, início do nome e contexto de materiais de saúde, preservando opções inativas para histórico. A busca assistida por descrição consulta até três famílias candidatas e duas páginas de cada, e mostra quantas especificações foram examinadas. O parâmetro textual direto da API retornou zero para a busca de teste; não é usado como prova de ausência de produtos. A busca assistida não estabelece correspondência automática SKU/CATMAT.

Novos filtros locais: termos obrigatórios na especificação, unidade exata, quantidade mínima e porte já conferido, além de marca/fornecedor, UF, esfera e período. Medidas numéricas são mantidas junto da unidade: “20 ml” não é satisfeito por “3 ml + agulha 20 G”. Negação de esterilidade e “sem látex” não viram atributos positivos. São verificações de texto; não certificam equivalência técnica. Filtros de marca, fornecedor, porte e termos continuam restritos à amostra carregada.

O superadm pode pesquisar o cadastro Procfit diretamente pelo filtro do mix (até 25 correspondências por consulta; refinar o termo). Usa a RPC cadastral já protegida, sem ampliar permissões ou presumir que todo produto global pertença à Distribuidora. Outros usuários mantêm o mix autorizado e a consulta oficial. Categoria/marca/grupo de marca e EAN ajudam a orientar a pesquisa; não comprovam saldo nem equivalência.

Conferência PNCP: 30 ou 60 referências por rodada, considerando os filtros atuais, com até três chamadas simultâneas. A checagem pode procurar pendentes mesmo com a visualização “somente conferidos”; falhas continuam indicadas. Histórico compara apenas mesma série CATMAT + apresentação + capacidade + medida + marca. Exibe último resultado **da série carregada**, mediana, faixa, número de observações, fornecedores e UFs; amostras abaixo de cinco observações recebem aviso. Nenhuma estatística geral mistura embalagens ou marcas.

Alterar filtros da origem ou selecionar outro produto limpa o resultado anterior, evitando apresentá-lo como se fosse da nova consulta. Cancelamento ignora respostas atrasadas. O CSV preserva conteúdo textual com neutralização de fórmulas. Não há coleta contínua, lances ou campanhas automáticas.

Verificação pública: PDM30247, Brasil, 19/10/2025 a19/10/2026 retornou 4.421 registros informados e 500 na primeira página (cerca de1MB). PDM423 retornou162 na consulta nacional. Esses números são evidência pontual da fonte, não indicadores atuais da empresa.

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

## Mix privado e recorte federal (19/10/2026)

Primeira carga: 60 SKUs, 21 categorias de sugestão, tabela cip_b2g_mix. Campos: descrição/SKU, marca literal e normalizada para busca, referências extraídas, categoria/termo sugerido, hash/arquivo/linha/data de referência. Importação idempotente por hash+SKU. Nenhuma coluna financeira; não substitui ERP. Schema em schema/b2g-mix.sql. Cadastro acessível somente a usuários com escopo Distribuidora; sem gravação pelo navegador. Futuros lotes precisam de revisão e desativação explícita da versão anterior para não duplicar SKUs ativos entre hashes.

Tela: Nosso mix → selecionar produto → selecionar família oficial e especificação → Brasil ou UF → esfera Federal/Estadual/Municipal → consultar → filtrar pregão declarado no objeto → conferir resultados. Marca e modelo próprios não provam equivalência com item comprado; usuário revisa embalagem/especificação. Filtro federal é remoto (`esfera=F`); filtro pregão é local e explícito (`objetoCompra`), limitado às páginas carregadas. Contagens por UF não agregam preços de produtos diferentes. Não inclui varredura automática nem garantia de cobertura de editais abertos.

Verificado na fonte oficial: PDM423, F, todas UFs, 2025-10-19 a 2026-10-19: 41 referências, 33 com menção a pregão; 13 UFs no recorte textual. Evidência local ../evidencias/cip-b2g-mix-federal.png a partir da raiz do projeto. Gravação de missão não exercitada em produção nesta rodada.


## Busca direta e caso de referência — 19/10/2026

O fluxo principal agora recebe produto, marca, CNPJ e UF sem exigir CATMAT. Seleção do mix/cadastro preenche produto e marca; o acesso cadastral continua inalterado. Pesquisa avançada e histórico permanecem disponíveis em seção recolhida.

Três rotas efetivas, sob autorização da Distribuidora no servidor:

- Índice nacional de resultados Compras.gov.br por CNPJ e data. Cada candidato passa pela descrição do item; somente correspondências recebem conferência adicional de resultado ativo, fornecedor, quantidade, preço, órgão e marca declarada na pesquisa de preços. Até 100 itens por rodada, lotes de oito, três trabalhadores; paginação da fonte de 500. Não é cobertura universal dos fornecedores.
- Contratos PNCP de todos os publicadores, por data de publicação; até 500 por página. Produto/UF/esfera/CNPJ filtram as páginas recebidas. Marca não presumida, preço unitário não inferido do valor global.
- Contratos estaduais Ceará Transparente, API pública documentada, por assinatura, 100 registros por página. Consulta específica pelo ISN_SIC também disponível. Registros marcados confidenciais não são apresentados. Datas de publicação/DOE e processo licitatório preservados.

Consultas limitadas a 365 dias, até 50 páginas por recorte. APIs de contratos não oferecem busca textual nos parâmetros usados: filtros são explicitamente locais às páginas consultadas. Há rotas complementares de pesquisa web por domínio para Licitaweb, Ceará Transparente, DOE Ceará, TCE municipal e Transparência federal; links não equivalem a rastreadores automáticos, leitura integral de PDFs ou integração desses portais. Brasil é padrão, sem restrição ao Ceará.

Controle de carga: descrição antes do enriquecimento, cache de até 80 respostas públicas/10 minutos e espaçamento de 900 ms no adaptador. 429 interrompe a rodada e permite retomada; não representa ausência de registros. Respostas parciais com falhas não entram no cache de serviço. Captura mais antiga entre evidências mantida, sem renomear cache como coleta nova.

Caso de referência pesquisado, não fixture inserida como resultado: compra 94300105910412024, item 9430010591041202400003, PNCP 07954480000179-1-024072/2024. Governo do Ceará, resultado de 20/10/2025, Prohospital CNPJ 09485574000171, 1.101 unidades a R$ 2.614,00; total R$ 2.878.014,00. Marca declarada exatamente PROCIRURGICA e RIOFL. Família antiga PDM 9639 referencia PDM 30368; o caminho exclusivamente por família perdia esse registro.

Ceará Transparente ISN_SIC 1454263: contrato 747/2026, assinatura 27/08/2026, publicação 01/09/2026, DOE 03/09/2026; R$ 744.843,96 globais, processo de contratação 24001.059494/2026-34. Campo num_spu_licitacao 24001028094202415 vincula ao processo da homologação. Não somar homologação e contrato nem presumir execução/receita. Há divergência técnica entre CATMAT elétrico/hidráulico e objeto contratual por manivelas; conferir anexos, sem certificar equivalência/modelo. A fonte também contém grafia corrompida no nome do credor, preservada; o vínculo usa CNPJ.

Botão de caso real consulta novamente ambas as fontes e só apresenta a relação se os processos coincidirem. É uma referência explícita de conferência rápida; a busca geral continua independente, sem depender desse botão.

Documentação oficial: https://dadosabertos.compras.gov.br/v3/api-docs ; https://pncp.gov.br/api/consulta/v3/api-docs ; https://api-dados-abertos.cearatransparente.ce.gov.br/api-docs/v1/swagger.yaml . Serviço preserva getUser e cip_can_access antes de qualquer consulta/cache; nenhum token, cadastro privado ou saldo incluído no pacote público. Sem alteração ROTA PRO ou Telegram.

## Precisão da identidade de item — 20/10/2026

Na busca integrada, cada resultado homologado agora é enriquecido com a descrição curta e a especificação do item da contratação (endpoint `2.1_consultarItensContratacoes_PNCP_14133_Id`), unido pela chave exata de compra + item. O vínculo do resultado homologado continua exigindo item, fornecedor, situação, preço e quantidade. A pesquisa de preços fica identificada em campo separado; não é usada como título do item oficial.

Se a consulta do item falhar, o cartão informa que a descrição oficial está pendente. Divergência de fornecedor/preço/quantidade entre o item e resultado aparece como alerta. Código de catálogo e PDM são exibidos como classificação; não certificam SKU/modelo comercial nem fabricante. Marca composta permanece literal e não é atribuída a um fabricante isolado.

Caso real revalidado em 20/10/2026 nas APIs oficiais: compra `94300105910412024`, item PNCP 3 (`9430010591041202400003`), Prohospital, 1.101 unidades, R$ 2.614,00 homologados/unidade, R$ 2.878.014,00 no total. Descrição curta oficial: “Cama hospitalar”. A especificação detalhada oficial e a descrição da pesquisa de preços coincidem no registro, com referência textual PDM 30368; o item contém código catálogo 402629/PDM 9639. A consulta de preço declara a marca composta “PROCIRURGICA e RIOFL”. Valores, vencedor, quantidade e item conferem; a fonte não comprova um modelo comercial único nem qual das duas marcas corresponde a cada unidade. Não declarar esse registro como equivalência exata a SKU de catálogo da Procirúrgica sem edital/anexo ou referência comercial validada.


## Pesquisa nacional por produto, marca e UF — 19/10/2026

Supera a apresentação anterior: retirado o botão de caso específico e retirados produto/marca/CNPJ pré-preenchidos. O fluxo profissional principal é Pesquisa integrada, sem CATMAT ou fornecedor obrigatório. Mix/cadastro continua sugerindo os termos. Alterar filtros invalida resultados anteriores e direciona a próxima consulta.

b2g-sources.mjs contém 27 UFs e portais de referência, domínios governamentais por UF e fontes nacionais PNCP, Portal da Transparência federal, Compras.gov.br, Comprasnet e DOU. UF selecionada permite somente seus domínios estaduais + fontes nacionais; esfera Federal usa fontes nacionais. Brasil direciona todos os domínios estaduais cadastrados. Não afirmar que cada portal foi varrido: o painel distingue plano de domínios e endereços efetivamente retornados na rodada. A busca pode encontrar conteúdos de municípios sob os domínios estaduais.

b2g-web-search.mjs usa Responses API, gpt-5-mini (reasoning low), ferramenta web_search obrigatória, filtros de domínio, até três chamadas de busca e lista web_search_call.action.sources. store:false, até6000 tokens e55s. Chave OpenAI existente lida somente no serviço, nunca no cliente/Git/log. Consulta envia somente termos e filtros; não envia planilhas, saldos ou relatórios. Rota cip-b2g mantém getUser e cip_can_access Distribuidora antes da consulta/cache. Quota atômica20 tentativas/dia/usuário autorizada em cip_b2g_web_claim, só serviço. Limite de instância100 requisições/minuto e cache10min permanecem.

Todos os documentos da pesquisa web têm status document, candidato para conferência, mesmo se o modelo descrever homologação. Campos de etapa e valor são extração assistida, não preço ganho conferido. Somente URLs HTTPS sem credenciais/porta alternativa, do domínio permitido e realmente retornadas pela ferramenta, são aceitas. Comprador/UF/esfera/CNPJ e data devem respeitar filtros (documentos sem data do ato ficam fora do recorte temporal); marca contrária é descartada e marca ausente fica pendente. Resposta incompleta ou sem evidências reais produz erro explícito, nunca resultado fabricado. Não se executam instruções das páginas. Conteúdo indexado e resumos não substituem leitura integral de anexos ou conferência nas APIs de resultados.

As APIs estruturadas anteriores permanecem em Fontes para complementar: fornecedor Compras.gov.br, contratos PNCP e contratos Ceará Transparente. A pesquisa web consulta conteúdo indexado do Portal da Transparência federal; API CGU exige chave própria e não foi integrada. Não confundir PNCP com Portal da Transparência federal. Não há27 adaptadores de APIs estaduais: há roteamento web oficial para27 UFs. Não contornar certificados, WAF, captcha ou acessos restritos.

Avaliação Relevante/Não corresponde: cip_b2g_search_feedback, RLS por usuário + acesso Distribuidora. Armazena apenas termos, URL pública e avaliação. Retomada da mesma combinação produto/marca/UF prioriza relevantes e rebaixa irrelevantes sem excluir automaticamente documentos. Preferência supervisionada não treina o modelo nem modifica evidências. Contadores privados de IA sem políticas públicas são intencionais; anônimo/authenticated não podem consultar ou alterar a quota. Não há rotina diária autônoma configurada.

Fontes técnicas consultadas: https://developers.openai.com/api/docs/guides/tools-web-search ; https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email ; https://supabase.com/docs/guides/database/postgres/row-level-security . Registro privado de verificação inicial dos portais: ../evidencias/iris-portais-uf-2026-10-19.json. Estados com erro TLS/DNS/HTTP no acesso inicial não foram tratados como inexistência de dados nem tiveram TLS desativado.

Homologação revelou rejeição explícita de filtros de domínio pelo snapshot gpt-4.1-mini-2025-04-14. A pesquisa web passou a gpt-5-mini com suporte à ferramenta; Telegram e Processos mantêm modelos anteriores. Não remover o filtro de domínio para contornar incompatibilidade.

## Item de cama: adjudicação não equivale à marca/modelo exatos — 20/10/2026

Conferida a fonte primária adicional do PNCP para a compra 07954480000179-1-024072/2024: edital/anexo e relação de itens (anexo “RelacaoItens94300105910412024000.pdf”). A página 1 da relação identifica o item 3 como cama hospitalar elétrica/hidráulica, polietileno, até 200 kg, 4 rodízios de 6", comandos remoto e nas grades/peseira, bateria recarregável, Trendelenburg/Fowler/reverso e grades escamoteáveis. A API oficial de item/resultados confirma a mesma especificação, Prohospital, 1.101 unidades e R$ 2.614,00 homologados por unidade. A pesquisa de preços registra literalmente “PROCIRURGICA e RIOFL”. Isso prova a adjudicação desse item e o texto composto da marca; não individualiza fabricante, modelo comercial ou SKU Procirurgica.

Regra de apresentação: manter o resultado visível como adjudicação oficial conciliada, mas quando a pesquisa pede Procirurgica e a origem declara “Procirurgica e Riofl”, classificar marca/modelo como pendentes, não como correspondência exata da marca. Contagem de adjudicações conciliadas é separada da contagem de marcas declaradas individualmente; não contar marca composta como confirmação de fabricante. Mostrar os atributos principais do edital no cartão e deduplicar descrição de pesquisa de preços quando repetir a especificação oficial. Regressão cobre o caso composto. 72 testes B2G passaram; 11 verificações do pacote Hostinger passaram.

Referência oficial: https://pncp.gov.br/app/editais/07954480000179/2024/24072 . A relação de itens é publicação oficial do processo; não foi localizada proposta comercial com modelo/fabricante individual por unidade nesta verificação.


A pesquisa integrada consulta primeiro b2g-market-search.mjs: catálogo público de famílias, até cinco famílias incluindo referências legadas. A evolução para colostomia percorre até seis páginas por família (500 registros/página), orçamento total12 páginas/42s de coleta, até120 correspondências exibidas e36 candidatos conferidos nas APIs de resultados. Cobertura recebida/total e páginas parciais são explícitas. Não há fornecedor obrigatório nem códigos fixos do caso comercial. Homologação exige correspondência de fornecedor ativo, preço e quantidade; divergência permanece referência. Depois complementa com pesquisa web oficial, preservando os resultados estruturados mesmo se a web falhar. Isso não representa varredura integral do mercado.

## Vocabulário comercial e classificação oficial — colostomia

Corrigidos dois descartes indevidos: preposições de/da/do/para não são características do produto; famílias genéricas de bolsas não devem superar a nomenclatura específica de estomia. Ranking por termos completos, frequência e famílias ativas, com vocabulário de descoberta colostomia/ostomia/estomia. Sistema p/ estomia é candidato de família para bolsas, sem certificar indicação clínica ou modelo.

Na correspondência do item, colostomia admite sistema de estomia somente quando há bolsa e aplicação intestinal explícitas, com aviso de correspondência ampliada. Aplicação urinária, urostomia, aplicação não informada e acessórios sem bolsa não são incluídos por essa ampliação. Medidas e demais termos informados permanecem obrigatórios. Mesma regra no parser web e filtro da interface; candidatos web continuam documentos para conferência, mesmo quando descrevem homologação.

Teste oficial de19/10/2026: produto bolsa de colostomia, marca PROCIRURGICA, Brasil,19/10/2025–19/10/2026, sem CNPJ: PDM19897 retornou1453 registros em3 páginas. Seis itens tiveram resultado homologado conferido (CE e PE, incluindo esfera federal no CE); não significam seis processos distintos nem receita realizada. Não afirmar que todos os municípios já estão cobertos ou que os demais resultados alegados foram encontrados. Filtro municipal usa esfera M na API, sem confundir município do comprador com esfera municipal.

Validação final em produção:1453 referências da família principal,6 homologações em3compras. A investigação inicial também encontrou um fixador em Adjuvante p/ estomia; excluído da busca por bolsas. A regra de produto rejeita acessórios como placa/clamp/fixador/pasta quando o pedido é bolsa; buscas explícitas por esses acessórios continuam válidas.


## Cateter, sonda uretral e identificadores com zero inicial - 19/10/2026

Cateter generico/uretral/hidrofilico passa a investigar tambem familias Sonda trato urinario e Sonda uretral, sem fixar codigo de familia, marca ou fornecedor. Cateter periferico/central/vascular/nasal explicito nao herda essa expansao urinaria. O ranking ancora o substantivo: cateter hidrofilico nao seleciona muciloide hidrofilico de psyllium nem guia como familia de cateter. Sinonimia serve a descoberta; calibre, comprimento, ponta e demais termos continuam obrigatorios.

No item, sonda uretral e candidata por cateter. Hidrofilico ausente nao e inferido de lubrificada: retornam produtos relacionados com technical_pending, nota explicita e contagem separada das homologacoes sem essa pendencia. Negacao explicita de hidrofilia e tipos/calibres contraditorios sao rejeitados. Parser web compartilha regra e nunca confirma vitoria.

Restaurado zero inicial de idCompra SOMENTE quando o prefixo de17digitos do idCompraItem oficial de22digitos comprova exatamente o mesmo identificador numerico. Sem coincidencia nao alterar. Base de precos numerica omite zero, mas API de resultados exige texto completo. Caso real:09014905001282026 e09014905001342026; semzero endpoint retornava vazio, com prefixo oficial retorna homologacao Prohospital. Nao criar compra por suposicao.

Coleta evolui para rodada distribuida entre familias:12paginas/42s, ate6paginas por familia por rodada, sem consumir tudo na primeira familia. Cursor validado com ate5familias, paginas1..500, somente familias do plano derivado da consulta. Ampliar pesquisa oficial continua paginas pendentes sem repetir a IA, mantendo filtros, resultados e fontes anteriores. Cobertura recebida/total/parcial e limites permanecem explicitos. Ate120correspondencias exibidas e36conferidas por rodada; nao equivale a varredura integral.

Teste oficial cateter+PROCIRURGICA,Brasil,semCNPJ,19/10/2025-19/10/2026: primeira rodada5500referencias/5familias,4itens homologados/3compras. SP:Prohospital2itensR$5,94,calibre6French; PE:Prosaude2itensR$8,98 eR$6,91,calibres10e12French. Sao produtos heterogeneos, sem faixa de preco equivalente e sem inferir receita. Pesquisa cateter hidrofilico apresenta esses itens como relacionados com revestimento pendente. Segunda rodada10870referencias acumuladas,4itens preservados e pagina8pendente na familia urinaria. Prova privada ../evidencias/iris-cateter-corrigido-2026-10-19.json e iris-cateter-ampliado-2026-10-19.json.


## Vocabulario revisado por produto - 19/10/2026

b2g-vocabulary.mjs versao2026-10-19.1 centraliza28grupos prioritarios Procirurgica:nomes comerciais/oficiais,termos relacionados,familias de descoberta,caracteristicas a conferir,fontes/data. As21categorias da carga privada do mix tiveram seus search_seed reconhecidos; nenhuma descricao/SKU/saldo/custo privado foi publicado. Complemento de cateteres/ostomia pesquisado nos catalogos publicos Procirurgica/Prohospital e catalogo oficial Compras.gov.br. B2G-VOCABULARY.md documenta entradas, fontes e manutencao. Nao sao equivalencias tecnicas certificadas.

Motor compartilhado por familias estruturadas, filtro de itens, parserweb e interface. Termo original continua nos filtros; alias de classe nao remove medidas/materiais/modelos,esterilidade,negacoescompostas ou origem da marca. CH06/6Fr/6French normalizados sem misturar numero de calibre com comprimento. Espacos/acentos de marca normalizados para correspondencia, grafia original preservada. Foley/demora nao vira sinonimo de hidrofilico/intermitente. Aplicacao intestinal e urinaria separadas. Acessorios nao viram produto completo. Pistas comerciais como ComfortCath nao certificam modelo de item generico.

Busca prioriza listas de familias com todos os termos conhecidos antes de completar com listas parciais, evitando pesquisar cadeiras odontologicas por falta literal de banho. Interface explica vocabuláriodebusca,nomes,pistasrelacionadas e criterios; painel filtravel dos28grupos no Radar. Mudancasde filtros mantem invalidacao de respostas anteriores. Avaliacao de documentos continua preferencia de ordenacao,sem treinamento automatico nem aprovacao automatica de palavras.

Testes oficiais:cadeira de banho+PROCIRURGICA encontrou homologacaoRJ com marca declarada pro cirurgica; sonda de trato urinario+PROCIRURGICA encontrou os4itensSP/PEda validacao anterior. Precos/vencedores sao dados dasfontes e conferidos independentemente de sinonimos.77testes locais relacionados aprovados, incluindo negacoes,calibres,tipos/acessorios,marca/UF,aliasreciprocos e vocabulário no pedido web. Sem ampliacao de permissao,banco,credenciais,Telegram ou ROTA PRO.
