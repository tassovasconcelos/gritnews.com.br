# CIP 360 — memória operacional

## Giro histórico varejo, B2B por lote e ações supervisionadas — 19/10/2026

Novas fontes privadas em ../evidencias: Estoque_geral_base_dados_piloto_IA_24-09-2026.xlsx e Estoque Atual da Prohospital - 19-10-26.xlsx. Originais preservados. Piloto contém posição geral117.433linhas (inclusive zeros e nove negativos), giro33.477linhas/33.359chaves, venda histórica141.131linhas sem data e compras pendentes1.358linhas sem ETA. Usuário orientou seguir sem informar período de demanda diária/venda histórica. Não inventar janela mensal, venda atual ou cobertura observada. Giro tem118chaves duplicadas e duas datas futuras; não geram transferências. Posição geral/pedidos podem conter códigos além da carga atual e não comprovam saldo disponível atual.

33359 métricas históricas Shopping cruzadas com a posição de19/10, com26.764chaves correspondentes e6.595sem linha atual. 970 destes casos têm demanda histórica positiva e geram conferência, sem chamar ausência de linha de ruptura ou saldo zero. A posição de outubro e seu alerta de última venda antiga permanecem; o giro de setembro não corrige o campo de outubro automaticamente. Estoques de datas/origens sobrepostas nunca se somam.

Distribuidora:4.382linhas de lote,2.716produtos, C.Estoque1000 próprio (não é CD100 Shopping). Cinco linhas vencidas,27com validade até90dias na data da posição,813datas ausentes/sentinela para conferência,31custos zero e lacunas/divergências de custo tributado. Fonte não tem preço de venda, unidade, reservas ou histórico comercial B2B. Valores monetários conferidos e mantidos apenas no banco/evidências privados.

Engine gerou2.975propostas sugeridas: Shopping50redistribuições entre lojas,1.769campanhas dirigidas para revisão,3revisões de preço e1.090conferências; B2B13campanhas e50conferências. Nenhuma aprovada ou executada automaticamente. Reserva do doador e teto por destino/unidade evitam dupla alocação; testes no banco encontraram zero violações da reserva. Política piloto14/30/60/90dias é premissa para aprovação, não meta validada. Fonte com janela desconhecida impede tratar cenário como previsão. Regras, escopo e critérios futuros em apps/cip-pro-360/STOCK-ACTIONS.md.

Tabelas cip_stock_intelligence_batches/rows, cip_stock_actions/events, consulta privada e transição com autoria/versão/RLS. Aprovação comercial exige conferências, responsável/prazo/quantidade e atualidade da fonte; campanhas/preços exigem também custo, despesas, piso de contribuição, preço e alçada verificados no servidor. Não aceita custo menor ou preço vigente diferente da origem sem atualizar a base; prazo respeita validade conhecida. Conclusão registra quantidade/evidência e, quando aplicável, valores manuais não negativos; transferência não é receita/caixa. Histórico permanece nas cargas seguintes. Nada executa ERP, publica campanhas, inscreve destinatários, habilita autonomia ou treina modelo OpenAI.

Importação privada ativada após conciliação de contagens e custo B2B. Testes transacionais de aprovação, campos obrigatórios, teto, versão, evidência, preço abaixo do piso e baseline alterado passaram com rollback. Funções negaram leitura sem permissão; sem SELECT anônimo, edição direta de ações ou inserção de eventos pelo cliente. Validação local passou; publicação e homologação visual serão registradas ao concluir.

## Marca-passo e posição geral Shopping — 19/10/2026

Nova posição privada em cip_shopping_stock_batches/rows: 28.187 registros, 5.421 SKUs, 18 lojas e CD100. Data-base da origem 19/10/2026. Contagens e totais monetários conferidos com extração independente; valores reservados não registrados neste repositório. Código11 não consta da nova carga; não inferir cobertura de toda a rede. XLSX original e evidências fora do Git em ../evidencias. Não somar esta posição às referências históricas parciais de lojas/CD, que se sobrepõem.

Tasso confirmou A como alto giro e E como baixo giro. Período da curva não confirmado; sem relatório de vendas/cobertura. Última venda mais recente informada termina em08/04/2025: usuário pediu ponto de alerta, preservado na tela e Telegram. Não classificar ausência de giro atual nem idade dos lotes a partir desse campo. Bases de valorização variam; contábil e potencial ao preço cadastrado não viram receita/lucro.

shopping-position.mjs no Marca-passo, Estoque, Shopping e Doquita: filtros de produto/marca/referência, unidade, lojas/CD, Curva A/E e alertas; totais de todo o filtro e fila paginada. pricing-intelligence.mjs calcula prioridades e contribuição compatível com concorrência manual validada por fonte/equivalência/data. Pendências de origem ou saldo A abaixo do mínimo válido bloqueiam encaminhamento do cenário. Diretoria/superadm autorizados registram análises com autoria em log append-only; não é aprovação ou execução de preço. Regras e limites em apps/cip-pro-360/SHOPPING-POSITION.md.

Telegram prefere a nova posição datada como referência quando não há base Procfit aprovada; nunca soma os arquivos sobrepostos. Atalho /marcapasso consulta prioridades. Mantém autorização por vínculo/empresa e briefing por adesão já existente; nenhuma inscrição, campanha ou envio real de teste. Fonte atual indisponível por erro não cai silenciosamente em arquivo antigo.

Banco aplicado: criação das tabelas/RLS/RPC, filtros A/E, contagens de alertas alinhadas a todos os filtros e índices de empresa/autoria. Carga ativada como reference_unreconciled após conferência; não representa ERP aprovado ou atualização automática. Testes no banco confirmaram negação sem acesso Shopping, sem SELECT anônimo ou gravação da origem pelo cliente, sem substituição de autoria, leitura autorizada, soma por escopo, filtros e log com rollback. Nenhum registro de teste persistiu.

Publicação concluída em Hostinger: 15d3e60/workflow39299047498 e ajuste final517056a/workflow39299578600, ambos com validação/publicação aprovadas. 189 casos nas suites do CI sem falhas. Manifesto final e seis arquivos públicos conferidos por HTTP200, hashes e bytes iguais ao local. cip-telegram v13 ativo, 11 arquivos iguais ao pacote publicado; endpoint sem sessão/segredo retorna401. Consulta no servidor via vínculo autorizado retornou a nova posição, sem enviar mensagens reais.

Homologação na sessão superadm real: posição completa, proteção de Curva A, Curva E, SKU/unidade, CD100, paginação, ocultação da posição Shopping ao selecionar Distribuidora, preenchimento de simulador e bloqueio de cenário para item A abaixo do mínimo. Estoque mostra nova posição e referências antigas em seção separada. Formulário de análise abriu sem gravação real; gravação e negação testadas com rollback no banco. Ajustados datas brasileiras, casas decimais do custo unitário e largura dos filtros; página final sem rolagem horizontal na largura disponível. Não foi feita validação em aparelho móvel ou entrega real de áudio nesta rodada. Captura privada ../evidencias/cip-marcapasso-shopping-2026-10-19.jpg. Marca-passo deixado aberto. Próxima etapa comercial: histórico de vendas/reservas/reposição e referência concorrente validada para medir cobertura, conversão e resultado realizado.

## Apresentação executiva viva — 19/10/2026

Guia interativo em presentation.mjs/presentation.css, último item do menu, rota apresentacao apenas para diretoria/superadm. 16 capítulos sobre capacidades, prioridades de Rufino, agentes, jornadas e implantação. Modo palco/tela cheia, animações com pausa/redução de movimento, roteiro opcional, cenários locais de cobertura/capacidade, caminhos de exceção e cronograma por critérios de aceite. Componentes reais em prévia sem dados e acesso ao módulo autorizado com retorno ao capítulo. Sem screenshots privados, números do orçamento reservado, chamadas de IA ou novos acessos ao banco.

Resultados esperados permanecem hipóteses: integração comercial completa Procfit, conciliação, maturidade dos agentes, ecommerce e B2G persistente ainda têm dependências. Não transformar cenário em ganho ou tecnologia publicada em autonomia operacional. Verificação local nos 16 capítulos desktop/mobile, calculadoras e ida/volta. Detalhes de apresentação e limites em apps/cip-pro-360/PRESENTATION.md.

Publicação concluída em Hostinger: versão inicial209a0b3/workflow39293875202 e ajuste de abertura em modo palco da226e8/workflow39294418857 (segunda tentativa após falha de acesso HTTPS anterior ao upload). Validação e publicação aprovadas; index.html, cip-auth.js, presentation.mjs e presentation.css conferidos por HTTP200 e bytes iguais ao local, manifesto do commit final. 164 testes locais passaram. Na sessão superadm real, conferidos item no final do menu, abertura, Escola real e retorno ao capítulo; versão final iniciou em modo palco e botão de pausa alternou. Nenhuma gravação de negócio. Captura reservada em ../evidencias/cip-apresentacao-diretoria-2026-10-19.jpg; não incluída em Git/pacote estático. Permissão negativa de outros perfis verificada em testes locais, sem criar contas de produção. Guia deixado aberto para o usuário.

## Telegram com resposta executiva unificada — 19/10/2026

Recuperada e incorporada a versão remota 8182713, com consultas de estoque e briefing diário opcional, antes de evoluir o serviço. Novo formato: informação disponível primeiro, alcance e validade explícitos, composição por empresa/origem, memória do cálculo sobre todas as linhas do filtro, ranking conjunto e próxima ação de conferência. CD e lojas podem ser consultados juntos; soma dos arquivos continua parcial, não conciliada e sem data de posição comum. Nunca chamar essa soma de inventário total ou de caixa liberado. Quantidades e contagens de SKUs entre fontes não são somadas. Ausência da Distribuidora não vira zero.

Bases aprovadas somente se somam com captura/base de custo compatíveis ou período de vendas igual; cobertura parcial permanece explícita. Referência provisória não é adicionada a base aprovada, evitando sobreposição. Valor de todo o filtro sem vendas não é inferido do ranking limitado. Novo módulo telegram/executive-reports.mjs; RPCs de autorização e dados anteriores preservadas. Sem alterações de credenciais, inscrições, alçadas ou banco.

159 testes locais passaram, com casos de centavos, datas incompatíveis, empresa incorreta, fontes repetidas, ausência de dados e handler texto/voz com rede simulada. Leitura autorizada das fontes reais conferiu cálculo completo e texto em uma mensagem; evidências reservadas em ../evidencias. Nenhum envio real ou áudio real nesta verificação; confirmação em aparelho permanece fora deste teste. Documentação em TELEGRAM-STOCK-REPORTS.md.

Publicação concluída: cip-telegram v12 ativo, todos os 11 arquivos recuperados do serviço iguais ao pacote local (normalização de quebras de linha). Endpoint sem sessão/segredo respondeu 401. Código 51a07d5 enviado à cip/main; workflow39290469229 com validação aprovada. Publicação estática não necessária nesta rodada; alteração ativa no backend do Telegram. Entrega real em aparelho permanece não verificada nesta evolução.

## Consultoria de processos por briefing — 19/10/2026

Pedido do usuário: processo interativo e consultivo para comercial/financeiro/cobrança/giro, desenho por prompt, riscos, indicadores, expectativas e validação. Implementado em process-consultant.mjs/process-ui.mjs e serviço cip-process-assistant. Proposta OpenAI estruturada em separado; aplicação deliberada cria mapa local novo; versão/histórico anteriores preservados. Modelos guiados sem IA claramente identificados. Laboratório verifica percursos/cobertura; responsável registra resultado/evidência real. Não trata simulação como comprovação de negócio. Editar mapa invalida observações anteriores; captura de evidência durante digitação evita perda na navegação.

Serviço v1 publicado com JWT, acesso de escrita por empresa, consentimento, limite atômico20tentativas/dia e chave central somente no servidor. Tabela cip_process_ai_usage privada, RLS/grants/RPC conferidos; teste de limite revertido sem uso retido, endpoint anônimo401. 139 testes locais passaram. Verificação local com identidade e provedor simulados; homologação OpenAI autenticada de produção ainda pendente nesta etapa. Usuário disse que vai abrir e entrar no CIP para conferir. Detalhes e referências em apps/cip-pro-360/PROCESS-CONSULTANT.md.

Atualização concluída: frontend f8c6ddc/workflow39262046378 publicado e conferido por HTTP200/hash; serviço evoluiu para v4, com uma correção automática limitada após inconsistência e diagnóstico somente de códigos/contagens. 140 testes locais passaram. Na sessão real autenticada fornecida pelo usuário, dois desenhos extensos foram rejeitados por consistência; briefing comercial fictício reduzido gerou com OpenAI12etapas/12conexões/3casos cobrindo todas as conexões. Desenho aplicado somente no navegador e simulado até a exceção de dados incompletos; sem salvar versão ou ações reais. Auditoria manteve avisos de repetição/aprovação, prontidão pendente por falta de execução e evidência. Geração e simulação homologadas neste caso; resultado de negócio não homologado. Proposta de teste deixada aberta para exploração. Não afirmar que qualquer prompt gera fluxo correto ou que os testes estruturais comprovam operação.

## Estoques, relatórios, cenários e análises integrados — 19/10/2026

Usuário apontou que as importações não refletiam nos módulos. Causa confirmada: Estoque Inteligente ainda exibia apenas simulador de Rufino e a consulta estava isolada em Procfit. Corrigido: Estoque Inteligente, Visão Varejo e Doquita agora consultam automaticamente as cargas privadas por origem, mediante acesso Shopping. Relatórios por grupo/marca/unidade, concentração de custo, filtro SKU, CSV do filtro e cenário de redução de custo com exportação JSON de premissas/hash. Análises determinísticas, sem afirmar validação por IA. Não há cálculo de vendas/giro/cobertura/margem sem dados. Simulador anterior recolhido, explicitamente independente das cargas.

128 testes locais passaram; módulos reais de navegação/autenticação testados com identidade sintética e adaptador privado de leitura, sem uso de credenciais ou gravações de produção. Conferidos troca CD/lojas, loja5, SKU, cenário, exportação, Varejo e Doquita. Corrigida também resposta tardia do cronograma após navegação. Produção nesta sessão estava no login; uso autenticado não homologado. Dados financeiros não foram incorporados aos arquivos públicos. Detalhes em SHOPPING-STOCK-REFERENCE.md.

Publicação Hostinger concluída: commit0b2ace1, workflow39258564626 com validação/publicação aprovadas. index.html, cip-auth.js, stock-reference.mjs e agents.css retornaram HTTP200 e hashes iguais aos locais. Versão do carregador atualizada para stock-dashboard-20261019. Importações continuam pontuais, sem alegar sincronização Procfit ou conciliação financeira.

## CD 100 Shopping — carga distinta recebida em 19/10/2026

Estoque CD100.xlsx identificado pelo usuário como CD 100 Shopping Prohospital. Importados 624 registros/SKUs únicos em lote privado cd100_partial, separado das lojas. SHA256 3be471067b79a254d4c7a89504bed89faf23da59a4e66c38b1be082ead0b9f15. Não há duplicidades, custos zero ou divergências quantidade×custo. Sem preço de venda, data do saldo, últimas movimentações, dias sem movimento, unidade, reservas ou validade. Ausências NULL, nunca zero; não classificar CD como +180 dias nem inventário completo. Dados e totais financeiros fora do Git/publicação estática. Migração complementar stock-reference-cd100.sql mantém RLS/grants anteriores. Authenticated sem empresa vê zero registros.

Tela Estoque de referência permite selecionar CD100 ou lojas +180 dias; Radar B2G inclui catálogos por origem, sem custo/saldo. 125 testes locais passaram e troca de fontes foi verificada com adaptador privado de leitura. Produção autenticada não homologada nesta rodada. O comparativo privado anterior à carga do CD deve ser lido com esta atualização. Mais detalhes em apps/cip-pro-360/SHOPPING-STOCK-REFERENCE.md.

Publicado em Hostinger: commit ddc0b6b, workflow39255628127 com validate/publish aprovados. stock-reference.mjs e b2g-research-ui.mjs retornaram HTTP200 e hashes iguais aos locais. Lote CD ativado como reference_unreconciled após conferir publicação, 624 registros, soma e ausência dos campos não fornecidos. Lojas permanecem intactas. RLS habilitada, anon sem SELECT, authenticated somente SELECT e sem empresa retorna zero. Consultor de segurança sem achados para as tabelas stock_reference. Importação pontual; não significa sincronização Procfit de dez minutos.

## Carga Shopping — somente lojas — 19/10/2026

Usuário corrigiu: Produtos Sem Giro +180 dias.xlsx contém SOMENTE LOJAS; CD100 não faz parte desta carga. Não mapear códigos 1–14,16,32–35 para nomes presumidos. Planilha privada importada em cip_stock_reference_batches/rows: 6.762 registros únicos loja/SKU, 3.295 produtos, 19 códigos. Hash 0e0c8168f496bf52122aac71708f3e765fb1da983d5f69c14e90ae3429a2ba9a. Dados financeiros não estão em Git/publicação estática. Lote provisório, não conciliado, sem alimentar relatórios ERP aprovados ou ROTA PRO.

Em todas as linhas, max(última venda,última entrada)+contador implica16/10/2026: data-base/critério deduzidos, não confirmados pelo exportador. Não tratar contador como idade de lote ou dias desde última venda. 50 diferenças de custo total vs quantidade×custo unitário acima deR$0,01 e11 custos unitários zero destacados, preservando origem. Sem unidade, lotes, validade, reservas e vendas completas. Potencial a preço cadastrado não é receita/margem/lucro.

Nova consulta em Procfit & relatórios: carga integral, filtros SKU/marca/loja/grupo/pendência e totais declarados da amostra. Radar permite incluir catálogo Shopping por acesso Shopping adicional, sem campos financeiros; seleção continua sem equivalência CATMAT certificada. RLS/grants conferidos e authenticated sem escopo retorna zero. Teste local com dados reais/adaptador de leitura; sessão autenticada de produção não homologada nesta rodada. Detalhes em apps/cip-pro-360/SHOPPING-STOCK-REFERENCE.md. Publicado em Hostinger: commit41c5d01, workflow39250081880 com validate/publish aprovados. stock-reference.mjs, erp-ui.mjs e b2g-research-ui.mjs retornaram HTTP200 com hashes iguais aos locais. 123 testes locais passaram. Carga no banco e tela publicada verificadas; uso em sessão autenticada de produção não homologado nesta rodada.

## Mix provisório e recorte federal — 19/10/2026

Importados 60 SKUs únicos da planilha Produtos PROCIRURGICA 16102026 Correta.xlsx (Produtos, A1:B61) em `public.cip_b2g_mix`, tabela privada com RLS `cip_can_access(distribuidora_prohospital)`, sem SELECT anon nem INSERT authenticated. SHA256 da origem: 2f669e37fd5c0327259e3e936d24d265a2a6dc9d914753a13111f3fb3839c4fa. Data 16/10 é referência do nome do arquivo, não atualização ERP. Nenhum dado da planilha no repositório público ou arquivos publicados. Custos/preços/saldo/incentivos/formulas excluídos; 48 erros de fórmula preexistentes na coluna L não usados. Uma descrição sem marca; grafias originais preservadas.

Radar usa catálogo privado por SKU/descrição/marca/referência/categoria; seleção sugere família, sem equivalência CATMAT automática. Brasil padrão, filtro UF e distribuição de contagens por UF. Esfera F/E/M enviada ao endpoint oficial; filtro de pregão depende de menção explícita no objeto nas páginas carregadas, não interpretação de código numérico entre sistemas. Não é lista completa de editais abertos. Backend cip-b2g v3 publicado com JWT validado. Consulta real PDM423, federal, Brasil, 19/10/2025–19/10/2026: 41 referências, 33 com pregão explícito em 13 UFs. Interface verificada em ambiente local com mix de teste e API pública real; sessão autenticada de produção não homologada nesta rodada.

Esta carga é catálogo de referência provisório, não integração Procfit completa. Próxima etapa: mapeamento revisável SKU/CATMAT e índice incremental de oportunidades/histórico, com cobertura e datas explícitas. Publicação concluída: commit 4056106, workflow Hostinger 39245603188 com validação/publicação aprovadas; módulos b2g-research-ui.mjs, b2g-research.mjs e agents.css retornaram HTTP200 e hashes iguais aos arquivos locais. 119 testes locais passaram (o workflow executa também os checks próprios adicionais). Endpoint sem autenticação retorna401. Recorte SP+F verificado em tela: 3 referências, 1 com pregão explícito. Sessão autenticada de produção continua não homologada nesta rodada.

## Evolução mais recente — Radar B2G nacional por produto

Recuperadas as atualizações remotas `e7ef991` e `fe53a63` (prorrogação pelo superadm de convites em uma hora): acesso da diretoria pelo Telegram e Marca-passo por contribuição (`PLATFORM-EVOLUTION.md`). A confirmação anterior de voz funcional permanece válida; não confundir a ressalva de testes daquela release com revogação da chave ou da confirmação do usuário.

Nova implementação B2G em `b2g-research.mjs`/`b2g-research-ui.mjs`, serviço `cip-b2g`, índice público de 20.443 famílias PDM. Pesquisa por família/CATMAT, Brasil ou UF, período, filtro de marca/empresa nas páginas carregadas, detalhe de produto/embalagem/preço/fornecedor, conferência de vencedor/porte no resultado e evolução mensal separada por produto/embalagem/marca. `B2G-PRODUCT-INTELLIGENCE.md` registra uso, fontes, limites e próximos incrementos.

Somente cruzamentos ativos por item/fornecedor/preço/quantidade são vencedores conferidos. Marca/modelo/porte ausentes não são inventados. Datas divergentes entre pesquisa de preços e resultado PNCP ficam explícitas. IDs de compras de 17 dígitos devem ser lidos sem perda de precisão. As novas publicações gerais deixam de fixar CE; amostra histórica Ceará permanece recolhida e identificada.

Limites: consulta sob demanda, páginas de 50 preços e verificação de 30 por rodada. Filtros de marca/empresa não procuram automaticamente em todo o universo remoto. Curva é descritiva sobre páginas carregadas/conferidas, não histórico nacional completo ou índice de mercado. Próxima evolução: índice persistente, coleta incremental revisável e equivalência CATMAT/SKU validada.

## Decisão mais recente — origem comum, destino CIP e dez minutos

Tasso determinou reutilizar a mesma view, alimentar diretamente o CIP e atualizar a cada dez minutos, sem misturar com ROTA PRO. Essa cadência substitui a proposta horária anterior para o novo fluxo CIP. A rotina horária do ROTA PRO foi preservada.

Verificação ao vivo em 19/10 pelo terminal Hostinger: VPN ativa, view `st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO` ainda com 45 colunas de locação/tombamento; não recebeu contrato completo de vendas/saldo de todas as filiais. Não inferir receita comercial de TOTAL_GERAL/VALOR_MENSAL nem estoque comercial do CUSTO do tombamento.

Publicado endpoint `cip-procfit-gateway` v1 e tabela RLS `cip_procfit_source_checks`. Instalados diretórios/configuração/assinatura próprios e timer `cip-procfit-sync.timer` com leitura de metadados a cada dez minutos. Primeiro recebimento real no CIP: `contract_pending`, 45 colunas, intervalo 600 segundos, `business_data_received=false`. O estado aparece em Procfit & relatórios. Esse avanço é MONITORAMENTO DE CONTRATO, não sincronização financeira; a tarefa de carga automática permanece pendente da liberação da origem, mapeamento, implementação de ingestão e conciliação.

Código-base da entrega: c57fbe8; workflow 39233392926. 105 testes passaram; autenticação por assinatura, consulta somente superadm e gravação somente serviço. O terminal confirmou agenda enabled e rotina ROTA PRO active. Evidência local em `../evidencias/cip-procfit-agenda-10-minutos.png`. Procedimento e dependências em `apps/cip-pro-360/ops/cip-procfit/README.md`.

## Atualização mais recente — voz confirmada e expansão Procfit

Em 19/10/2026 o usuário confirmou que a gravação/interpretação de áudio no Telegram funcionou no Android. A IA já havia sido confirmada como habilitada com chave salva. Essa confirmação supera os registros anteriores de chave ausente e teste real pendente. Não registrar áudio nem credencial nesta memória.

O usuário informou previsão de liberação, hoje, de dados de todas as filiais Shopping e Distribuidora na mesma view Procfit. Isso é informação de planejamento do usuário, não verificação de acesso ou cobertura. Foi preparado `GUIA-DADOS-PROCFIT-DIRETORIA-2026-10-19.md` e uma solicitação resumida em `SOLICITACAO-TI-PROCFIT-2026-10-19.md`.

Gateway histórico recuperado: VPS/VPN, leitura SQL Server e envio horário para ROTA PRO, anteriormente voltado a locações/tombamentos. Registro de operação preservado em `historico/PROCFIT-GATEWAY-OPERACAO-REGISTRO.md`; não comprova saúde atual. O CIP deve ter contrato e autenticação próprios. Ampliação exige conferir chaves/grãos para não multiplicar vendas por lotes, correspondência empresa/filial, histórico, cancelamentos, lotes remanescentes e conciliação por unidade. Exportador CIP ainda exige quatro lojas e limites atuais de importação/transporte precisam de evolução para carga total.

Prioridade acordada neste guia: acesso/dicionário/amostra → gateway CIP → vendas/estoque/aging → giro/preços/comercial → margem/caixa/serviço → execução assistida. Não prometer todas as análises com a mera liberação de colunas; 14 agentes precisam de ferramentas testadas e evidências, não apenas catálogo.

## Retomada e integração posterior em 19/10/2026

Este bloco substitui os estados anteriores quando divergirem. Incorporado `origin/cip/main` commit `b816c0b`, que já publicou importação Procfit e relatórios no painel e bot: `erp-engine.mjs`, `erp-ui.mjs`, `erp/index.ts`, `telegram/erp-reports.mjs`, `schema/erp.sql` e `ERP-REPORTS.md`. Esse é o caminho integrado de relatórios. `operational-analytics.mjs` permanece um protótipo local de cálculo anterior; não ligar em paralelo nem manter duas fontes de números.

Diagnóstico direto no servidor: `ai_enabled=false`, `has_ai_key=false`, interaction_version=2. Isso explica a voz indisponível; não havia chave salva. O usuário pediu orientação para criar a chave. Instruções fornecidas com link oficial para API Keys e campo protegido no CIP. Nenhuma credencial foi solicitada no chat.

Correção de ativação: `ai-readiness.mjs` testa interpretação e acesso à transcrição usando um segundo de silêncio WAV sintético. A ativação somente salva a chave quando ambos respondem corretamente. O teste de acesso não comprova acurácia em português nem o caminho real Telegram. Falhas distinguem chave inválida, crédito/cota, permissão, modelo e indisponibilidade sem revelar mensagens do provedor. Status distingue chave ausente de IA desativada; bot orienta ativar e reenviar áudio.

Serviço `cip-telegram` publicado na versão 8 em 19/10; autenticação por segredo do webhook e sessão/perfil no painel preservada. 102 testes automatizados passaram. Chamada real de transcrição com chave do cliente e áudio Telegram ainda pendente; não declarar voz homologada antes disso. Publicação Hostinger concluída e verificada: workflow 39229182323, commit e8f2093. bot-ui.mjs retorna HTTP 200 e SHA-256 idêntico à cópia local. Consulta ao banco também confirmou zero bases ERP aprovadas nesta retomada: relatórios reais dependem de carga e aprovação.

Atualizado em 19/10/2026, America/Sao_Paulo. Registro durável para continuidade; não altera pesos ou treinamento de modelos.

## Fonte atual

Código recuperado do GitHub `tassovasconcelos/gritnews.com.br`, branch `cip/main`, commit-base `fa746734821cbb6fb0906978c1ab7ec6436e6c8c`. Cópia nesta pasta `cip-pro360-source`. Domínio https://cip.gritnews.com.br, hospedagem Hostinger. A cópia anterior na Central de Inteligência estava em `feat/cip-pro360-shopping-distribuidora`, commit `d5477b4`; não sobrescrevê-la nem tratá-la como atual.

## Evolução recuperada de 18 para 19/10

- 14 especialistas, incluindo RufasIA; Escola, competências, habilidades e materiais versionados; mapas de Processos vivos, simulação manual, auditoria e histórico por empresa.
- Telegram @Doquita360bot: histórico relata ativação e publicação. Vínculo concluído persistente até revogação/suspensão/troca de bot; dez minutos são a validade do código de vínculo. `/menu` e `/empresas`, Shopping, Distribuidora ou todas as empresas autorizadas. Piloto superadm privado.
- IA opcional: texto roteado entre consultas limitadas; transcrição de voz até 3 minutos/10 MB, resposta em texto. Chave via tela protegida e Vault. Sem armazenamento de áudio/transcrição no banco. Não é conversa geral com acesso irrestrito ao ERP.
- Última conversa informa dificuldade de gerar chave OpenAI. Configuração e transcrição reais NÃO foram verificadas nesta retomada. Não assumir que foram habilitadas.
- Procfit: contrato e exportador preparados; vendas/estoque reais e acesso por filial ainda não homologados. Números demonstrativos da interface não são dados financeiros reais.

## Perguntas prioritárias do Tasso

1. Venda líquida da Shopping do início do mês até hoje, com devoluções/cancelamentos conciliados.
2. Custo/valor do estoque da Distribuidora e capital em lotes remanescentes acima de 180 dias.
3. Shopping: ranking de SKU/loja por valor e quantidade acima de 180 dias.
4. Ações para giro e Marca-passo de preço: Atlas valida dados; Giro prioriza estoque; Cifra valida capital; Prisma/Faro avaliam preço e equivalência; Elo/Faísca preparam ações; Doquita/Sofia acompanham resultado e aprendizado. Propostas não alteram preços nem disparam campanhas automaticamente.

## Incremento local de 19/10

`apps/cip-pro-360/operational-analytics.mjs`: núcleo de cálculo somente leitura, com testes sintéticos. Exige empresa/lojas autorizadas pelo chamador, snapshot conciliado, cobertura do período e fonte; distingue ausência de dado de zero, rejeita duplicatas e marca atraso. Vendas líquidas em centavos; estoque usa valor oficial recebido. Idade agregada por SKU não permite calcular valor de lotes antigos: requer quantidade e valor remanescentes específicos.

Este núcleo NÃO está conectado ao bot, importador, banco ou interface e NÃO foi publicado. Seu campo `reconciled` é uma pré-condição do chamador confiável, não prova de conciliação nem mecanismo de autorização. Não aceitar esse sinalizador diretamente de uploads ou prompts de usuários.

Validação: 10 novos casos sintéticos; testes do Telegram e demais módulos executados. Na cópia Windows, a conversão automática de quebras de linha alterou os bytes do SDK fixado; restaurados os bytes exatos do blob Git (SHA-256 `7f440cd50492ef25968229e5fa23ba3b501e4affa7384a75dc3a549f10a39859`) e desabilitada essa conversão neste clone. Nenhum hash de confiança foi relaxado. Testes de extração com bibliotecas externas, banco, navegador e chamadas reais de IA não fazem parte desta validação.

## Próxima entrega operacional

1. Confirmar estado da chave e testar texto/áudio reais pelo painel existente, sem pedir segredo no chat.
2. Homologar views Procfit e mapeamento empresa/loja; definir custo, fechamento, devoluções, lotes e SLA. Importação identificada é alternativa temporária, sempre com data de corte.
3. Implementar ingestão e conciliação no servidor, identidade e escopo por filial; persistir cobertura e evidências de aprovação. Só então ligar núcleo a ferramentas de consulta autorizadas.
4. Acrescentar intenção de vendas/estoque com período e empresa, esclarecimento de ambiguidades, evidência e atualização na resposta Telegram. Pedidos ERP continuam retornando indisponibilidade até isso existir.
5. Homologar as quatro perguntas prioritárias contra relatório oficial e teste negativo entre empresas/filiais. Liberar propostas de giro e preço depois de baseline e alçadas.

## Prioridade preservada

Fundação/dados → Doquita/RufasIA → estoque/giro/preços/comercial → painel/compras/finanças → canais → logística/cliente → radar/B2G/marketing → execução aprovada e autonomia delimitada. Telegram já avançou como canal; não substitui as dependências de dados.

## Referências recuperadas

Histórico copiado seletivamente em `historico/`: backlog, catálogo, rodadas, indicadores, premissas ERP/ROTA PRO/Driver e entregas. São documentos históricos; conflitos devem ser resolvidos pelo código atual e evidências recentes. Não copiamos credenciais, screenshots de acesso ou dumps operacionais.

Chats consultados: “Continue implantação do CIP PRO 360°” (01a14f39-3d74-7430-a68b-ac91db2e0bcd) e “Atualizar projetos CIP 360” (6ad59911-0ae8-83e9-bcdb-23b097264f13). Nenhuma mensagem foi enviada a outras conversas.

Documentação oficial consultada: https://developers.openai.com/api/docs/guides/function-calling — ferramentas conectam o modelo a funções externas; o servidor executa e controla o acesso. A chave sozinha não fornece dados do Procfit.

Validação e publicação do Radar B2G: 120 testes passaram; navegador local com dados públicos reais confirmou busca por família, CATMAT 619840/SP, filtro de marca e série mensal. Nenhuma gravação no CIP foi feita pelo adaptador local. Endpoint sem autenticação retorna 401; sessão autenticada de produção e criação real de missão permanecem fora dessa verificação. Serviço cip-b2g v2 publicado. Workflow 39243805648 concluiu em sucesso para 3c2fcc8; módulos publicados retornam HTTP 200 com SHA-256 idêntico ao local. Evidência local: ../evidencias/cip-b2g-historico-produto.png.
