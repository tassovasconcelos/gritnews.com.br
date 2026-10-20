# Auditoria de rotas e montagens — PR1

O `route-manifest.mjs` passou a declarar as 17 rotas, módulos de montagem, empresa e papel exigidos. `cip-auth.js` deriva a lista autorizada e aciona as montagens a partir desse manifesto. `index.html` ainda contém o conteúdo visual de cada rota, mas resumos Varejo/B2B e Doquita não carregam módulos operacionais de estoque. Estoque Inteligente aceita associação Shopping ou Distribuidora; os painéis Shopping e o simulador aparecem somente quando essa empresa está autorizada.

Os números abaixo são contagem estática dos pedidos iniciais de dados identificáveis no código. Não incluem autenticação (1 consulta de perfil e, exceto superadm, 1 consulta de associação), retries, paginação acionada pelo usuário ou ações de gravação. `N` é o número de páginas de mil linhas para carregar a origem histórica, retornado pela contagem da carga. Onde o módulo permite variação por empresa/perfil/fonte, o número aparece como faixa ou fórmula. Isso não é telemetria de uma sessão real.

| Rota | Título | Quem vê | Montagens iniciais | Consultas / tabelas | Frames principais | Duplicidade antes | Depois / decisão | Pedidos antes → depois |
|---|---|---|---|---|---|---|---|---:|
| `inicio` | Visão geral | Qualquer perfil CIP ativo | HTML da visão geral | Nenhuma | cartões Shopping, Distribuidora, prioridades | — | Manter como entrada geral | 0 → 0 |
| `cronograma` | Cronograma | Qualquer perfil CIP ativo | `reloadMilestones` | `cip_milestones` | `cipTimeline` | — | Manter | 1 → 1 |
| `doquita` | Doquita | Qualquer perfil CIP ativo | `loadDoquita`, `loadAcademyGuidance` | até 5: `cip_price_reviews`, `cip_quotes`, `cip_demands`, `cip_academy_materials`, `cip_academy_skills` | `cipDoquitaBoard` | Montava ações, posição e referências de estoque | Manter como briefing/conversa e atalhos | `8+N` → até 5 |
| `varejo` | Shopping Prohospital | Associação Shopping; superadm | HTML do resumo | Nenhuma | cartões e atalhos | Ações, posição e referências | Manter como resumo; atalhos para Estoque e Marca-passo | `3+N` → 0 |
| `estoque` | Estoque Inteligente | Associação Shopping ou Distribuidora; superadm | `mountStockActions`; Shopping também monta posição/referência/simulador | Distribuidora: `cip_stock_intelligence_get` (1). Shopping: 4 consultas fixas: `cip_stock_intelligence_get`, `cip_shopping_stock_get`, lote de referência, `cip_scenarios`; mais `N` páginas de `cip_stock_reference_rows` | fila por empresa; posição/referências/simulador apenas para Shopping | Também carregava em Varejo/Doquita | Manter como dona das telas de estoque; seletor por empresa e módulos Shopping condicionais | Shopping `4+N` → `4+N`; Distribuidora `1` → `1` |
| `precos` | Marca-passo de Preços | Associação Shopping ou Distribuidora; superadm | `mountPricing` | 4 pedidos iniciais: função `cip-erp` (pricing), `cip_price_reviews`, `cip_mp_campaign_policies`, `cip_mp_campaign_proposals` | fila de preço, campanha, simuladores | Incorporava Central de ações e posição Shopping | Manter preço/campanhas; ações ficam em Estoque | 6 → 4 |
| `b2b` | Distribuidora Prohospital | Associação Distribuidora; superadm | HTML do resumo | Nenhuma | indicadores e atalhos para Cotações/Caderninho/Estoque | Montava a Central Shopping/Distribuidora | Manter como resumo comercial; fila acessada pelo Estoque Inteligente | 1 → 0 |
| `cotacoes` | Cotações e Conversão | Associação Distribuidora; superadm | `reloadQuoteRows` | `cip_quotes` | formulário e histórico manual | — | Manter | 1 → 1 |
| `caderninho` | Caderninho Inteligente | Associação Distribuidora; superadm | `reloadDemandRows` | `cip_demands` | formulário e demandas | — | Manter | 1 → 1 |
| `quartel` | Quartel dos Agentes | Qualquer perfil CIP ativo | `mountSquad('quartel')` | `cip_agent_work` | tarefas dos agentes | — | Manter | 1 → 1 |
| `escola` | Escola dos Agentes | Qualquer perfil CIP ativo | `mountSquad('escola')` | `cip_agent_work` | aulas e competências | — | Manter | 1 → 1 |
| `processos` | Processos vivos | Qualquer perfil CIP ativo | `mountProcesses` | `cip_can_access`, `cip_processes`, `cip_process_versions`; histórico quando há mapa selecionado | editor, mapas e histórico | — | Manter | 2 → 2 |
| `mensageiro` | Doquita no Telegram | Qualquer perfil CIP ativo | `mountBot` | função `cip-telegram` + `cip_bot_bindings` | status, vínculo e configuração | — | Manter | 2 → 2 |
| `radar-b2g` | Radar B2G · Íris | Associação Distribuidora; superadm | `mountSquad('radar-b2g')` | `cip_agent_work` e fontes de pesquisa do Radar quando acionadas | pesquisa Íris | — | Manter; módulo próprio no manifesto | 1+ → 1+ |
| `procfit` | Procfit & relatórios | Superadm e diretoria | `mountERP` + catálogo/status quando superadm + importador de referência | função `cip-erp`, `cip_erp_snapshots`, `cip_agent_work`, referências; detalhes variam por ação e importação | status, catálogo, relatórios, conciliação | Compartilha biblioteca de referência com Estoque, em telas distintas e sequenciais | Manter em Governança; importador continua restrito a esta rota | variável → variável |
| `integracoes` | Integrações e Acessos | Superadm | `mountAdmin` | função `cip-admin` | administração de perfil e empresa | — | Manter em Governança | variável → variável |
| `apresentacao` | CIP 360 para a diretoria | Superadm e diretoria; item oculto no menu geral | `mountPresentation` | Nenhuma no conteúdo-base; prévias são estáticas | apresentação executiva | — | Manter oculta no menu geral | 0 → 0 |

## Comparativo de consultas

Nos módulos afetados, uma navegação de usuário carregava a Central de ações em cinco rotas, a posição de Shopping em quatro e referências históricas em Varejo, Estoque e Doquita (além do importador de Procfit). Após o PR1, a Central, posição e referências da operação ficam somente em Estoque Inteligente; Marca-passo tem apenas consultas de preço/campanha e os resumos Varejo/B2B não fazem pedido ao backend.

| Rota | Pedidos de dados identificados antes | Após PR1 | Efeito |
|---|---:|---:|---|
| Varejo | `3+N` | `0` | 3 pedidos base e N páginas removidos; vira resumo com atalhos |
| Doquita | `8+N` | até `5` | 3 pedidos da Central/posição/referência e N páginas removidos |
| B2B | `1` | `0` | pedido da Central removido do resumo |
| Marca-passo | `6` | `4` | consultas da Central e da posição removidas; mantém preço/campanhas |
| Estoque Inteligente | `4+N` | `4+N` | conteúdo permanece completo na rota proprietária |

`N = ceil(registros da carga histórica / 1.000)`. No código do lote Shopping conhecido de 28.187 linhas, `N=29`; esse lote é dado histórico, não medição de uma sessão atual. O domínio e o banco de produção não foram instrumentados nesta auditoria, então não há medição real de latência até conteúdo útil. A tela de resumo e a estrutura de carregamento deixam de esperar pelas consultas de estoque nas rotas afetadas; tempo de resposta real precisa ser coletado com sessão autorizada e telemetria por rota.

As linhas da carga histórica agora ficam em memória somente durante a sessão, com chave de usuário + empresa + escopo + hash da fonte. Cada abertura continua consultando o lote ativo no servidor; só reutiliza linhas após confirmar o mesmo hash. Uma nova versão invalida a versão anterior do escopo. A fila de ações e a posição atual não usam cache, pois precisam validar o estado e a versão atuais antes de qualquer decisão.

## Manifesto e links diretos

O manifesto reconhece `#/estoque/sku/XYZ?loja=07`, `#/precos/acao/ID` e `#/central?filtro=alto-custo`. O atalho `/central` resolve para a fila atual de Estoque Inteligente enquanto o redesenho da Central permanece no PR2. O link de SKU preenche produto e unidade nas telas de estoque. Filtros econômicos e abertura direta de uma ação de preço dependem dos controles que serão entregues nas etapas seguintes; o link já abre a rota certa e conserva os parâmetros no contexto da sessão.

## Limites da medição

Os pedidos apresentados são auditados estaticamente por chamadas dos módulos e testes mock que contam módulos escolhidos para cada rota. Não são capturas de rede do navegador nem latência de produção. A aplicação não tinha telemetria de início/fim por rota antes deste trabalho; por isso nenhum valor em milissegundos foi inventado. A validação de latência precisa ser feita depois do PR1 com uma sessão de usuário autorizada e medições da rede de produção.
