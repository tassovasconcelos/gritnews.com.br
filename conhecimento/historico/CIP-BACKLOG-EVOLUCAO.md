# CIP — Backlog inicial de evolução

18/10/2026 · Backlog de planejamento com entregas parciais descritas nas ampliações e nas próximas rodadas.

Prioridades: P0 = fundação indispensável; P1 = primeiro valor operacional; P2 = expansão. Todos os responsáveis são papéis a designar. A ordem por dependência prevalece sobre a numeração.

| ID | Prioridade | Entrega | Dono proposto | Dependências | Aceite mínimo |
|---|---|---|---|---|---|
| CIP-01 | P0 | Designar piloto, responsáveis e alçadas | Produto/direção | — | Empresa, filial, usuários e cinco perguntas prioritárias definidos. |
| CIP-02 | P0 | Solicitação técnica Procfit | TI/produto | CIP-01 | Ticket/protocolo, contato e requisitos documentados; sem promessa de API disponível. |
| CIP-03 | P0 | Homologar acesso restrito por empresa/filial | Engenharia/gestores | CIP-01 | Testes positivos e negativos com perfis restritos e evidências; sem alterar alçada do superadm. |
| CIP-04 | P0 | Dicionário de indicadores e qualidade | Analista/controladoria | CIP-01 | Giro, cobertura, ruptura, margem e conversão com fórmula, fonte, período e proprietário. |
| CIP-05 | P0 | Base curada e direcionamentos | Produto/gestores | CIP-01 | Documentos com versão, vigência, escopo e aprovador; conflito registrado. |
| CIP-06 | P0 | Serviço de agentes e gateway de ferramentas | Engenharia | CIP-03 | Segredos só no servidor; consultas parametrizadas; empresa/filial impostas pelo servidor. |
| CIP-07 | P0 | Auditoria, custo e limites | Engenharia/produto | CIP-06 | Cada tarefa registra origem, versão, custo e resultado; orçamento limite e suspensão testados. |
| CIP-08 | P1 | Doquita conversacional por texto | Produto/engenharia | CIP-04/05/06/07 | Respostas objetivas com evidências; reconhece ausência de dados; não escreve no ERP. |
| CIP-09 | P1 | Quartel: missões e responsáveis | Engenharia/gestores | CIP-07 | Proposta vinculada a pessoa, empresa, prazo e estado; falha não aparece como concluída. |
| CIP-10 | P1 | Escola: feedback e avaliação | Produto/especialistas | CIP-05/08 | Feedback vira caso revisado; versão anterior preservada; zero promoção automática de permissões. |
| CIP-11 | P0 | Importador transitório com reconciliação | Dados/TI | CIP-04 | Fonte manual/importada visível; duplicidade e cancelamentos tratados; comparação com relatório aprovado. |
| CIP-12 | P0 | Conector Procfit de leitura | TI/dados/Procfit | CIP-02/03/04 | Acesso suportado confirmado, credenciais restritas, extração rastreável e dados conciliados. |
| CIP-13 | P1 | Agente analista e verificações de qualidade | Dados/controladoria | CIP-04/11 ou 12 | Sinaliza diferença, ausência e atraso; não substitui faltante por zero. |
| CIP-14 | P1 | Estoque, giro e filiais | Estoque/dados | CIP-13 | Propostas por SKU e unidade; reservas, prazo e validade considerados conforme dados disponíveis. |
| CIP-15 | P1 | Marca-passo de preços | Comercial/controladoria | CIP-13 | Memória de cálculo, canal e piso aprovado; sem publicação de preço. |
| CIP-16 | P1 | Comercial e Caderninho | Comercial | CIP-09/13 | Funil e procura com responsável, próximo passo e motivo de perda. |
| CIP-17 | P1 | Áudio no CIP | Engenharia/gestores | CIP-08/07 | Transcrição visível; confirma entidade/número ambíguo; gravação só com ação do usuário. |
| CIP-18 | P1 | Radar inicial Ceará | Comercial/marketing | CIP-01 | Oito candidatos revisados, 30–50 itens comparáveis e data/fonte por observação; sem ranking inventado. |
| CIP-19 | P1 | WhatsApp interno | Engenharia/produto | CIP-03/08/17 + conta/provedor | Número vinculado a usuário; permissões testadas; texto/áudio, deduplicação e transferência humana. |
| CIP-20 | P2 | Agente de compras | Compras | CIP-14 + pedidos/fornecedores | Necessidade desconta pedidos abertos; rascunho com quantidade, prazo e condição. |
| CIP-21 | P2 | Agente financeiro | Financeiro | CIP-13 + acesso financeiro | Projeções separadas de realizado; dados restritos; nenhum pagamento automático. |
| CIP-22 | P2 | Agente estratégico | Direção | CIP-13/14/15/16 | Resumo e cenários com evidências; decisão possui dono e acompanhamento. |
| CIP-23 | P2 | Agente de marketing | Marketing/comercial | CIP-15/16/18 | Briefing considera estoque e margem; envio/publicação depende de aprovação e canal elegível. |
| CIP-24 | P0 para fase 2 | Central de aprovação | Direção/engenharia | CIP-09 + alçadas | Aprovador autenticado; conteúdo imutável; expiração e mudança de dado exigem revisão. |
| CIP-25 | P0 para fase 2 | Primeiro executor homologado | TI/dono do processo | CIP-24 + API de escrita suportada | Uma execução por aprovação; confirmação no destino; falha parcial e reprocessamento testados. |
| CIP-26 | P0 para fase 3 | Autorização por rotina | Direção/dono do processo | CIP-25 + histórico avaliado | Limites por empresa/filial/valor/volume; exceção para humano e suspensão imediata testada. |
| CIP-27 | P1 | Usabilidade em celular e rotina do gestor | Produto/gestores | Cada entrega de interface | Prioridade, evidência e ação acessíveis; áudio e aprovações testados nos aparelhos do piloto. |
| CIP-28 | P1 | Medição de benefício | Controladoria/produto | CIP-04/09 | Baseline, custo, ação, resultado observado e fatores externos registrados sem dupla contagem. |

Primeira fatia proposta: CIP-01 a 10, com CIP-11 como fonte transitória identificada e CIP-02 avançando em paralelo. Não bloquear a Escola até a integração do ERP; não chamar importação de integração em tempo real.

Referência detalhada: [Projeto de evolução](CIP-PROJETO-EVOLUCAO-AGENTES.md).

## Ampliação 1.1 — logística, canais e cliente

| ID | Prioridade | Entrega | Dono proposto | Dependências | Aceite mínimo |
|---|---|---|---|---|---|
| CIP-29 | P1 | Qualificar radar ampliado por segmento/canal | Comercial/marketing | CIP-18 | Identidade, praça, mix e fonte; grupo e filiais sem duplicidade; pistas pendentes explícitas. |
| CIP-30 | P1 | Radar B2G em fontes oficiais | Licitações/dados | CIP-04 | Distingue proposta, ata, contrato e entrega; fonte, data, CNPJ e item/unidade. Sem submissão automática. |
| CIP-31 | P0 para logística | Mapear pedido e contrato de eventos | TI/logística | CIP-02/04 | Origem de cada status, IDs de pedido/remessa, promessa original e cancelamentos documentados. |
| CIP-32 | P1 | Torre logística interna em leitura | Operações/engenharia | CIP-31 | Pedido por remessa; fila de atraso/falta/avaria com responsável e atualização. |
| CIP-33 | P1 | Promessa de entrega por zona/canal | Logística/comercial | CIP-31 + baseline | Capacidade, corte, saldo elegível e janela considerados; estimativa não se passa por garantia. |
| CIP-34 | P1 | Portal Meu Pedido | Produto/engenharia | CIP-03/31/32 | Cliente só vê seu pedido; mobile, remessas parciais, última atualização e ajuda por protocolo. |
| CIP-35 | P1 | Agente de Logística recomendador | Operações | CIP-32/33 | Sugere prioridade/alternativa com custo e evidência; não despacha nem altera rota sozinho. |
| CIP-36 | P1 | Voz do cliente e sugestões de produtos | Atendimento/qualidade | CIP-34/10 | Avaliação gera protocolo, responsável e retorno; sugestão alimenta Caderninho sem compra automática. |
| CIP-37 | P1 | Agente de Experiência do Cliente | Atendimento | CIP-34/36 | Consulta autorizada do próprio pedido, resposta com fonte e encaminhamento humano. |
| CIP-38 | P2 | Portal B2B por conta/unidade | Comercial/engenharia | CIP-34/24 | Listas, condições e usuários por conta; recompra revalida disponibilidade/preço. |
| CIP-39 | P2 | Roteirização e transportadores | Logística/TI | CIP-32/33 | Proposta considera capacidade, janelas e conservação; execução conforme fase e autorização. |
| CIP-40 | P1 | Conferência, validade e devolução | Estoque/qualidade | CIP-14/31 | Código/unidade/lote rastreáveis; retorno não vira estoque disponível sem inspeção. |
| CIP-41 | P1 | Painel OTIF e custo de servir | Controladoria/logística | CIP-04/31/32 | Promessa original preservada; denominadores e custos explícitos; sem baseline inventado. |
| CIP-42 | P1 | Pesquisa internacional e experimentos | Produto/Escola | CIP-10/29 | Cada prática tem fonte, hipótese, experimento, métrica e decisão; não copia ganhos de terceiros. |
| CIP-43 | P2 | Notificações de pedido por canal elegível | Atendimento/engenharia | CIP-34/19 | Consentimento/política, evento real, entrega e deduplicação; sem misturar marketing com status. |
| CIP-44 | P2 | Agente B2G e acompanhamento contratual | Licitações | CIP-30/24 | Prazos, obrigações e evidências por contrato; decisão de proposta/lance com responsável autorizado. |

Iniciar CIP-29/31/42 junto da preparação do projeto. Prazo prometido, portal e roteirização dependem de fontes e operação confiáveis. Não colocar “tempo real” na interface sem atualização e evidência que sustentem o termo.

Pesquisa detalhada: [Radar e referências](CIP-RADAR-CONCORRENCIA-E-BENCHMARKS.md).

## Ampliação 1.2 — Procfit e ROTA PRO/Driver

| ID | Prioridade | Entrega | Dono proposto | Dependências | Aceite mínimo |
|---|---|---|---|---|---|
| CIP-45 | P0 | Validar matriz ERP de pedidos/entregas | TI/Procfit | CIP-02/31 | IDs, itens/unidades, liberação, endereço, promessa, remessas, cancelamentos e incremental confirmados. |
| CIP-46 | P0 | Inventariar interfaces atuais ROTA PRO/Driver | Engenharia/operação | CIP-31 | Versões publicadas e escopos conferidos; distinguir código/documentação de recurso homologado. |
| CIP-47 | P0 | Correlacionar pedido, remessa, OS e tarefa | Dados/engenharia | CIP-45/46 | Sem união por nome; parcial, multirremessa e empresas distintas testadas; carga repetida sem duplicar. |
| CIP-48 | P1 | Levar eventos confirmados Driver ao CIP | Engenharia/logística | CIP-47 | Autorizações servidor-servidor; fonte, fato/recebimento e revisão; offline não vira status confirmado. |
| CIP-49 | P1 | Homologar avaliação ROTA PRO e retorno ao cliente | Atendimento/engenharia | CIP-48/36 | Convite da entrega certa, expiração, deduplicação, sugestões e protocolo; token de pesquisa não abre pedido. |
| CIP-50 | P0 para liberar portal integrado | Piloto completo ERP–Driver–Cliente | Produto/TI/logística | CIP-34/45–49 | Entrega autorizada, parcial, atraso, offline, falhas e isolamento documentados; sem escrita ERP. |

Anexo técnico: [Premissas ERP e ROTA PRO/Driver](CIP-PREMISSAS-ERP-ROTAPRO-DRIVER.md). O backlog passa a 50 entregas de planejamento.

## Ampliação 1.3 — indicadores executivos

| ID | Prioridade | Entrega | Dono proposto | Dependências | Aceite mínimo |
|---|---|---|---|---|---|
| CIP-51 | P0 | Homologar dicionário financeiro/executivo | Controladoria/analista | CIP-04/45 | Fórmulas, grão, fonte, competência/caixa, custo e exclusões aprovados por indicador. |
| CIP-52 | P0 | Registro de economias e benefícios | Controladoria/produto | CIP-51/28 | Baseline, iniciativa, custo, atribuição, evidência e estado; sem dupla contagem ou capital como lucro. |
| CIP-53 | P1 | Painel de seis cartões da diretoria | Produto/engenharia | CIP-51/52 + dados conciliados | Valor/meta/desvio/fonte/atualização; filtros e aprofundamento autorizado; ausência explícita. |
| CIP-54 | P1 | Metas, comparabilidade e alertas | Direção/controladoria | CIP-51/53 | Meta versionada, sentido/tolerância; mesmas lojas/dias; base zero/negativa e margem ponderada testadas. |
| CIP-55 | P1 | Explicação executiva Doquita | Produto/analista | CIP-08/53/54 | Responde com cálculo verificável, desvio, hipótese, ação, responsável e prazo; sem inventar resultado. |
| CIP-56 | P1 | Fechamento e retorno do investimento CIP | Controladoria/direção | CIP-52/53 + custos e resultados medidos | Ponte de benefícios, custos e capital; horizonte, corte e versão; ROI só com base atribuível validada. |

Dicionário: [Indicadores executivos](CIP-INDICADORES-EXECUTIVOS.md). Estado atual: 56 entregas de planejamento; indicadores ainda dependem de implementação e fontes conciliadas.

## Ampliação 1.4 — módulos visuais e primeira coleta oficial

| ID | Prioridade | Entrega | Estado desta rodada | Próximo gate |
|---|---|---|---|---|
| CIP-57 | P1 | Quartel visual e missões compartilhadas | Interface e persistência implementadas; homologação superadm em navegador | Expandir testes com gestores/perfis restritos e ligar ferramentas de cada agente. |
| CIP-58 | P1 | Escola visual, práticas e propostas de aprendizado | Interface, correção de práticas e caderno persistido implementados | Curadoria por responsáveis, versionamento de habilidades e avaliações do motor de IA. |
| CIP-59 | P1 | Íris B2G PNCP com resultados e missão de revisão | Amostra real, consulta sob demanda, filtro, preço/fornecedor/data/fonte e criação de missão implementados | Ampliar modalidades/portais, catálogo de SKUs e validação de equivalência. |
| CIP-60 | P1 | Serviço persistente de pesquisa e agentes | Pendente; não há coleta contínua ou motor conversacional nesta entrega | Definir backend, fontes permitidas, orçamento, provedor de IA, periodicidade e testes antes de ativar. |

Total: 60 entregas identificadas, com escopo parcialmente implementado e limites explícitos. CIP-57/58/59 entregam partes das frentes já planejadas; não significam que todas as dependências e gates anteriores estejam concluídos.


## Sequência de execução atualizada

Consultar [Próximas rodadas](CIP-PROXIMAS-RODADAS.md). O plano preserva a prioridade original por dependência e considera RufasIA e a Escola dinâmica já publicados.
