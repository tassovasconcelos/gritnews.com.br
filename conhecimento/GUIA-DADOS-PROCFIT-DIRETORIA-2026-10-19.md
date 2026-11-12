# CIP 360 — guia de dados Procfit e evolução da inteligência executiva

**Decisão posterior do responsável:** mesma view de origem, destino direto no CIP e cadência financeira-alvo de dez minutos, com configuração/serviços próprios. Não encaminhar dados pelo ROTA PRO. Em verificação ao vivo em 19/10, a view ainda retornou o contrato antigo de 45 colunas; foi instalado verificador de metadados a cada dez minutos. A ingestão financeira aguarda origem ampliada, mapeamento e homologação. As referências horárias abaixo descrevem o legado, não a cadência solicitada para o CIP. Operação atual: `apps/cip-pro-360/ops/cip-procfit/README.md`.

**Data:** 19/10/2026 · **Destinatários:** TI/Procfit, Controladoria, Comercial, Compras, Estoque, Logística e Diretoria.

**Objetivo:** transformar os dados de todas as filiais da Shopping Prohospital e da Distribuidora Prohospital em decisões rápidas, explicáveis e acompanhadas até o resultado. Este documento é uma especificação para alinhamento e homologação; não comprova que os novos dados já foram liberados ou conectados.

## 1. Ponto de partida e próxima prioridade

Tasso confirmou nesta conversa que o áudio do Telegram funcionou. A ativação de IA já foi confirmada no servidor; o teste de compreensão em voz é uma confirmação do usuário, sem auditoria independente do conteúdo do áudio.

O CIP já possui importação manual, conciliação e consultas de vendas, estoque e giro em bases aprovadas. O próximo salto é alimentar essas consultas pelo gateway Procfit, com cobertura de empresas/filiais, histórico e atualização controlada. A liberação anunciada para hoje precisa ser conferida por metadados, amostra e conciliação antes de ser considerada entregue.

Primeiras decisões a habilitar:

1. Quanto cada empresa e filial vendeu no mês, com qual margem e contra qual meta e período comparável?
2. Quanto está investido em estoque e qual parcela permanece em lotes com mais de 180 dias?
3. Quais produtos estão sem vendas, quais ameaçam ruptura e onde há excesso que possa atender outra filial?
4. O que priorizar em preço, transferência, venda e compra, preservando contribuição e disponibilidade?
5. Qual ação tem responsável, prazo e resultado comprovado, e o que exige decisão da diretoria agora?

## 2. Gateway de conexão: recuperar o que existe e ampliar com contrato próprio

### Infraestrutura registrada no projeto

O documento de operação anterior descreve VPS Hostinger `srv2065879.hstgr.cloud`, VPN persistente, SQL Server `172.17.0.11:1433`, banco `PBS_PROHOSPITAL_DADOS` e view `st.TASS_PRODUTOS_TOMBAMENTOS_LOCACAO`. A rotina `procfit-sync.timer` roda a cada hora cheia em America/Sao_Paulo. O destino existente é um gateway HTTPS do ROTA PRO, em projeto distinto do banco atual do CIP.

A homologação histórica de 15/10 registrou 96 linhas/45 colunas e teste de repetição idempotente. Isso comprova somente aquele escopo e momento; não comprova a ampliação de hoje nem a saúde atual do VPS. O material local também registra exceção temporária de confiança no certificado SQL: TI deve revisar e substituir por cadeia confiável. Credenciais permanecem no servidor; não integrar por navegador ou expor SQL à internet.

### Fluxo-alvo para o CIP

```text
Procfit / view(s) autorizada(s)
  → VPN + executor no VPS (somente leitura)
  → extração por conjunto, empresa, filial e período
  → gateway HTTPS próprio do CIP, com autenticação de serviço
  → área de recepção e validação, sem exposição imediata
  → conciliação e publicação atômica da versão aprovada
  → consultas calculadas e autorizadas no servidor
  → especialistas + painel da diretoria + Doquita no Telegram
  → proposta / aprovação / execução comprovada / resultado
```

Reutilizar a infraestrutura quando apropriado; não reutilizar automaticamente o segredo, o endpoint ou as permissões do ROTA PRO. O novo destino deve preservar a operação de locações. A frequência horária é o ponto de partida registrado. Consultas a cada 5–15 minutos são proposta posterior, condicionada a volume, indexação, janela de atualização e autorização da TI. O painel sempre mostra a hora dos dados; “agora” significa a última informação confirmada, não conexão em tempo real presumida.

### Se todos os dados vierem na mesma view

O requisito é uma origem consistente, não necessariamente uma única tabela final. Solicitar à TI o dicionário da view, a definição do que representa uma linha, as chaves únicas e a lista de joins.

- Preferir conjuntos separados: cadastros, vendas por item, saldos por lote, movimentos, preços, compras e financeiro. Views separadas ou um campo `record_type` com contrato por tipo são alternativas a homologar.
- Não juntar estoque atual diretamente a cada item de venda. Um SKU com 5 lotes e 30 vendas pode produzir 150 combinações e multiplicar saldo e receita.
- Não corrigir esse problema com `DISTINCT` ou deduplicação por SKU: isso pode apagar vendas legítimas e lotes diferentes.
- Se a view ampla for obrigatória, especificar para cada medida sua chave de origem e regra de extração; conciliar os conjuntos separadamente antes de cruzá-los no CIP.
- Vendas identificadas por documento/item/evento; estoque por empresa/filial/depósito/SKU/lote/data de referência; pedido por pedido/item. Nome do produto e EAN isoladamente não são chaves transacionais.
- Não presumir que códigos antigos de filial sejam globais. Empresa + filial oficial e tabela de correspondência são obrigatórias.

## 3. Solicitação técnica de liberação para hoje

Pedir à TI os seguintes itens, sem troca de credenciais por mensagens abertas:

| Item | Entrega esperada | Evidência de aceite |
|---|---|---|
| Origem | Nome exato da view, banco, ambiente e versão do contrato | Dicionário de colunas, tipos e significado de uma linha |
| Cobertura | Todas as empresas jurídicas e filiais das duas operações, inclusive CDs, depósitos e inativas no histórico | Lista oficial de códigos, situação e datas de abertura/fechamento |
| Identidade | Código jurídico/operacional original e correspondência para Shopping/Distribuidora no CIP | Nenhum código mapeado por suposição; desconhecidos ficam em quarentena |
| Acesso | Conta de serviço de leitura restrita e VPN/rede aprovadas | Consulta permitida nas views e tentativa de escrita negada |
| Amostra | Pacote com cenários representativos, sem dados pessoais desnecessários | Venda normal, cancelamento, devolução, lote antigo, transferência e saldo zero |
| Histórico | Extensão disponível por conjunto, data inicial e eventuais lacunas | Relatório de cobertura por empresa/filial/conjunto |
| Mudanças | Coluna de atualização, chave de desempate e mecanismo para exclusões/cancelamentos | Reprocessamento recupera alterações retroativas |
| Conciliação | Relatórios oficiais independentes por empresa/filial/período | Totais, contagens, critérios e responsável conferidos |
| Operação | Responsável técnico e substituto, janela de carga, limites e tratamento de falhas | Teste de carga, interrupção, repetição e recuperação |

Não bloquear a primeira entrega à espera de todos os módulos. Liberar primeiro cadastros + vendas + saldo/custo + lotes, com lacunas explícitas; compras, margem completa, financeiro e logística entram conforme disponibilidade comprovada.

## 4. Padrão obrigatório para todos os conjuntos

Campos comuns: sistema de origem, versão do contrato, identificador estável do registro, empresa jurídica, empresa operacional CIP, filial, data/hora do evento, data/hora da última alteração, versão ou sequência quando existente e indicador de exclusão/cancelamento quando aplicável.

No pacote de carga: `batch_id`, conjunto, extração completa/incremental, início/fim da captura, período coberto, fuso, empresas/filiais esperadas, contagens, totais de controle, cursor anterior/novo, hash e versão do extrator. Cobertura completa deve ser comprovada pelo processo; não é apenas uma caixa marcada no arquivo.

Identificadores como texto para preservar zeros à esquerda. Quantidades e valores com precisão decimal declarada; arredondamento somente no estágio definido pelo Financeiro. SKU tem unidade comercial, unidade de estoque e fator de conversão com vigência. Campo desconhecido permanece nulo e recebe motivo; não substituir por zero. Datas civis de competência e instantes com fuso são campos distintos.

## 5. Dados necessários por domínio

Os nomes abaixo são campos lógicos propostos. A TI deve preencher a coluna equivalente real do Procfit, transformação e responsável no dicionário final.

### P0 — identidade, catálogo, venda e estoque: primeira entrega

| Conjunto / grão | Campos necessários | O que habilita |
|---|---|---|
| Empresas e filiais — uma linha por unidade | IDs oficiais; vínculo jurídico e operacional; nome; tipo loja/CD/depósito; cidade/UF; situação; abertura/fechamento; calendário e dias operacionais; canais atendidos | Cobertura total, acesso por filial e comparação entre lojas equivalentes |
| Produtos — um SKU por empresa e unidade de referência | SKU; EAN quando houver; descrição; marca; fabricante; categoria/subcategoria; unidade; embalagem; conversões; situação; controle por lote/validade; equivalentes revisados; fornecedor principal quando aplicável | Unir vendas/estoque, comparar unidades e sugerir substitutos válidos |
| Vendas — um evento financeiro elegível por item/documento | ID evento; pedido/item; documento/item/série; vínculo com original em estorno; empresa/filial; SKU; datas de pedido, faturamento e competência; quantidade/unidade; bruto; desconto; receita líquida oficial; tributos e seu tratamento; CMV no evento; canal; vendedor; cliente interno pseudonimizado; tipo/status; venda externa/intercompanhia | Venda mensal, mix, contribuição, ticket, devoluções e crescimento comparável |
| Estoque — um saldo por data/empresa/filial/depósito/SKU/lote | Saldo físico; reservado; bloqueado; disponível; trânsito por origem/destino; unidade; custo médio/unitário oficial; valor de estoque; lote; validade; data original de entrada; saldo remanescente da entrada; referência do snapshot | Capital por loja, ruptura, excesso, idade por lote e validade |
| Movimentações — um evento por linha de movimento | ID; tipo entrada/saída/ajuste/transferência/devolução; origem/destino; SKU/lote; quantidade; custo/valor; data; documento original; motivo; contrapartida da transferência | Reconstruir idade e saldo, explicar variação de estoque e eliminar transferências duplicadas |

**Precisões indispensáveis:**

- Data de cadastro do produto, última compra e última venda não substituem a data original do saldo remanescente. Transferir entre filiais não deve rejuvenescer artificialmente o estoque.
- Um lote pode receber entradas em datas diferentes. Se isso ocorrer, exigir camada de entrada/remanescência dentro do lote ou método de apropriação documentado. Idade média isolada não mede corretamente capital acima de 180 dias.
- Solicitar lotes de todo o estoque ainda existente, mesmo quando a entrada ocorreu antes do histórico de vendas extraído.
- Saldo físico, disponível e valor contábil são perspectivas distintas. Não aplicar o valor do saldo físico à quantidade disponível sem critério oficial.
- Registrar devoluções e cancelamentos sem subtrair duas vezes. O contrato deve dizer se o valor já é líquido e se estornos aparecem como eventos negativos ou revisão do registro original.
- Receitas internas e estoques em trânsito exigem regra de consolidação para evitar dupla contagem entre empresas e filiais.

### P1 — margem, preço, compras e comercial: estratégia de giro

| Conjunto / grão | Campos necessários | O que habilita |
|---|---|---|
| Preços e condições — SKU/filial/canal/tabela/vigência | Preço vigente; preço efetivamente praticado; tabela/campanha; vigência; descontos; condição de pagamento; custo de referência; impostos; comissão; frete subsidiado; taxas de cartão/marketplace; contribuição mínima aprovada; alçada | Marca-passo, margem ponderada e comparação de cenários sem desconto automático |
| Pedidos de compra — pedido/item e eventos | Fornecedor; SKU/unidade; quantidade pedida, recebida, cancelada e em aberto; preço; custo total comparável; frete; impostos recuperáveis/não recuperáveis; pedido; promessa; recebimentos; prazo de pagamento; condição mínima | Reposição, cobertura futura, excesso em compra e prazo real do fornecedor |
| Fornecedores — fornecedor/condição vigente | ID; grupo econômico quando validado; lead time prometido/observado; mínimo; embalagem; condições; restrições; calendário; incidências de atraso e devolução | Escolha de abastecimento e avaliação de serviço; economia com base comparável |
| Cotações/oportunidades — oportunidade/item e histórico de estado | ID; cliente interno; filial; vendedor; SKU ou descrição; quantidade; data; preço proposto; custo de referência; estado; motivo de perda; concorrente quando conhecido; validade; próximo contato; pedido convertido | Conversão, recuperação de cotações e priorização de demanda não atendida |
| Demanda não atendida — ocorrência/item | Filial; produto solicitado; quantidade; motivo; data; substituto oferecido; oportunidade vinculada; autorização de retorno quando necessária; resultado | Perda potencial, ruptura comercial e sortimento; não confundir demanda registrada com venda garantida |
| Clientes e vendedores — entidade e dimensão comercial | ID interno; segmento; canal; região; responsável comercial; situação; vínculo entre unidades/grupo quando validado; preferências de contato no sistema responsável | Carteira ativa/inativa, recompra, concentração e ação comercial por público elegível |
| Metas e calendário — métrica/escopo/vigência | Meta de receita/contribuição/serviço; empresa/filial/categoria; período; calendário comercial; aprovador; versão | Desvio para meta, ritmo necessário e priorização executiva |

O ERP pode não possuir todas as oportunidades, procuras ou metas: o CIP deve recebê-las dos módulos responsáveis e manter a origem. Dados pessoais de contato não são necessários ao painel executivo agregado; o acesso operacional deve ser separado.

### P2 — caixa, execução, experiência e mercado: visão completa

| Conjunto / grão | Campos necessários | O que habilita |
|---|---|---|
| Receber/pagar — título/parcela e baixa | ID; empresa; cliente/fornecedor interno; emissão; competência; vencimento original/renegociado; valor; saldo; baixa; juros/desconto; situação; moeda; pedido/documento correlacionado | Inadimplência, compromissos, caixa previsto/realizado e efeito do crescimento no capital de giro |
| Despesas e orçamento — lançamento/centro de custo | ID; competência; categoria; centro; unidade; valor; natureza variável/fixa segundo regra; orçamento; vínculo de rateio | Ponte de contribuição para resultado; custo de servir sem repetir despesas |
| Pedido/remessa/entrega — item e eventos | IDs correlacionados ERP/ROTA PRO/Driver; quantidades; promessa original; revisões/motivos; liberação; separação; expedição; tentativa; entrega; parcial; devolução; ocorrência; custo real quando disponível | OTIF, atraso, carteira pendente e custo da entrega; nota emitida não comprova entrega |
| Experiência — protocolo ou resposta | ID; vínculo com pedido quando autorizado; tipo; motivo; escala/pergunta; data; resolução; prazo; reabertura; pesquisa/população | Satisfação, reclamações e fechamento do ciclo; amostra e taxa de resposta explícitas |
| Mercado e concorrência — observação de produto equivalente | SKU/equivalência revisada; vendedor; localização; preço; frete; unidade; disponibilidade; condição; URL/evidência; data | Radar e Marca-passo com comparabilidade; não presumir preço concorrente no Procfit |
| B2G — oportunidade/item/contrato e marcos | Fonte oficial; órgão; edital/item; especificação/unidade; proposta; habilitação; resultado; contrato/empenho; obrigação; prazo; pagamento | Íris qualifica oportunidades e riscos; valor estimado, adjudicado, contratado e recebido são distintos |
| Iniciativas CIP — uma ação e seus resultados | ID; evidência; recomendação; empresa/filial/SKU; dono; prazo; aprovação; execução; baseline; custo incremental; benefício medido; validação financeira | Prestação de contas, aprendizado e benefício atribuível ao CIP |

## 6. Histórico e atualização desejados

| Dados | Pedido inicial | Cadência proposta e uso |
|---|---|---|
| Vendas, movimentos, preços e compras | 24 meses completos + mês corrente; preferir 36 meses se a origem suportar | Incremental inicialmente horário; comparação anual e sazonalidade somente com cobertura válida |
| Lotes remanescentes | Todo o estoque existente e a origem histórica de seus saldos, independentemente da idade | Snapshot completo consistente e mudanças por lote; aging de 180 dias exige data original |
| Saldos históricos | Diário por pelo menos 12 meses se existir; começar a guardar desde a implantação | Histórico para estoque médio, giro e evolução de capital; não inventar passado ausente |
| Vendas para ausência de giro | Pelo menos 180 dias completos até a referência, com alterações e devoluções tratadas | “Sem vendas” exige cobertura; sem histórico completo, resposta é inconclusiva |
| Títulos e baixas | Todos os títulos ainda abertos, mesmo antigos; histórico de 24 meses quando disponível | Diário/intradiário conforme fechamento e disponibilidade |
| Cadastros, metas e condições | Versões vigentes e alterações históricas relevantes | Na mudança ou diário; manter validade temporal |
| Mercado/experiência/logística | Disponibilidade por fonte e política específica | Não prometer cadência do ERP para fontes independentes |

Preservar separadamente data de captura, data máxima do evento, fechamento do período e atraso da origem. Um arquivo extraído às 14h pode conter fatos somente até a véspera. Dados executivos fechados devem permanecer versionados mesmo após ajustes retroativos.

## 7. Contrato operacional do gateway e escala

1. **Extração:** usuário SELECT-only, consultas parametrizadas, paginação por chave estável, timeout e limite de concorrência. Medir o volume antes de definir frequência. Não remover controles de carga para buscar “tudo” de uma vez.
2. **Incremental:** usar alteração + chave de desempate, janela sobreposta e reconsulta de períodos sujeitos a ajustes. Se não houver trilha confiável de alteração/exclusão, usar snapshots completos particionados e reconciliação; não supor que maior ID capture toda mudança.
3. **Consistência:** snapshot transacional quando suportado e aprovado; caso contrário, corte consistente/controle de versão acordado. Não misturar saldo de uma hora com movimentos de outra como se fossem simultâneos.
4. **Transporte:** autenticação servidor-servidor própria, HTTPS, identidade de carga idempotente, hash, repetição com espera e fila de falhas. Nenhum segredo em arquivo público ou log.
5. **Recepção:** validação estrutural e semântica, quarentena com motivos, contagens e totais. A carga repetida produz o mesmo resultado. Mudança de contrato incompatível bloqueia a publicação e alerta o responsável.
6. **Publicação:** promover apenas partições completas e conciliadas. Pacote incompleto não substitui o último estado válido; exibí-lo como atrasado quando necessário. Ausência de linha numa carga incremental não significa exclusão.
7. **Conciliação:** conferir por empresa/filial/dia e por tipo de evento, usando relatório oficial independente. Fórmula, arredondamento e tolerância acordados com Controladoria. Aprovação automática só após histórico validado, regras aprovadas e trilha de exceções.
8. **Observabilidade:** última tentativa, último sucesso, período/cobertura, linhas lidas/aceitas/rejeitadas, duplicatas, duração, defasagem e divergências. Alertas ao responsável com procedimento de recuperação; não narrar sucesso se só a conexão funcionou.
9. **Acesso:** empresa, filial, papel e sensibilidade verificados no servidor. Custos, margem e caixa exigem alçada; escolher “todas” no bot só inclui unidades autorizadas. Acesso à view ampla do conector não concede acesso amplo ao usuário.
10. **Retenção e recuperação:** definir retenção de bruto e histórico, backups, restauração testada e correção rastreável. Dados sensíveis minimizados e segregados.

**Limites atuais que exigem evolução:** a importação manual do CIP aceita 4 MB de arquivos combinados/20 mil linhas por conjunto e até 8 MB normalizados. A rotina histórica do VPS registra 20 mil registros/8 MB por lote. O exportador PowerShell do CIP ainda exige exatamente quatro lojas. Não servem como promessa de carga de todas as filiais e dois anos de histórico. Será necessário adaptar o extrator, particionar o transporte e homologar armazenamento/consulta antes de liberar cobertura total. A infraestrutura de banco atual do CIP é compartilhada; a ampliação precisa revisar isolamento e capacidade.

## 8. Como os 14 especialistas usam os dados

Esta matriz define entregas desejadas. O catálogo e a Escola não comprovam que todas as ferramentas analíticas abaixo já estejam implementadas ou que os modelos tenham sido treinados.

| Especialista | Entradas principais | Entrega para decisão e medida de resultado |
|---|---|---|
| Doquita | Consultas autorizadas, contexto da pergunta e evidências dos especialistas | Resposta curta com empresa/filial/período, fonte, atualização, achado e próximo passo; esclarecer ambiguidade |
| Atlas | Cadastros, cargas, conciliações e dicionário | Confiança por indicador, ponte de divergências e explicação de variações; medir completude e discrepâncias |
| Giro | Saldos, lotes, validade, vendas, demanda e trânsito | Ranking de capital antigo, excesso/ruptura e transferências candidatas; medir disponibilidade e capital com qualidade |
| Nexo | Demanda, saldo, pedidos abertos, lead time e condições | Reposição justificada e compras a rever; medir atendimento, estoque e custo comparável |
| Prisma | Preço praticado/vigente, custo, despesas, equivalentes e alçadas | Cenários de Marca-passo com contribuição e piso aprovado; medir contribuição realizada e conversão, não só volume |
| Elo | Cotações, clientes, procuras, saldo e preço | Oportunidades priorizadas e próximo contato; medir conversão, recompra e contribuição incremental |
| Cifra | Estoque, CMV, despesas, compras, títulos e baixas | Capital, caixa e benefícios conciliados; separar lucro, caixa, economia realizada e capital liberado |
| RufasIA | Diretrizes, metas, indicadores e iniciativas | Pauta com até cinco decisões, alternativas, responsável e prazo; medir execução e efeito validado |
| Faísca | Público elegível, disponibilidade, margem, sazonalidade e campanhas | Briefings e campanhas propostas para itens atendíveis; medir contribuição incremental com atribuição explícita |
| Faro | Evidências externas, equivalência de produtos e contexto comercial | Comparação de mercado com condição e data; medir cobertura e qualidade das referências |
| Sofia | Casos, erros, revisão humana, avaliações e resultados | Aprendizado versionado, testes e revisão de habilidades; medir erro e utilidade antes/depois |
| Rumo | Pedido/remessa, promessa, ROTA PRO/Driver e custos | Exceções e plano de entrega; medir OTIF e custo sem perder nível de serviço |
| Lia | Protocolos, pesquisas, devoluções e eventos de atendimento | Causas recorrentes, retorno e resolução; medir prazo, reincidência e satisfação com amostra |
| Íris | Catálogo, disponibilidade, custo, capacidade, PNCP e contratos | Oportunidades B2G qualificadas da Distribuidora; medir aderência, risco, margem e prazo de caixa |

O encadeamento principal será Atlas → Giro/Nexo/Prisma/Elo/Cifra → Doquita/RufasIA → gestor responsável → execução confirmada → Sofia. Faro, Faísca, Rumo, Lia e Íris entram conforme o processo e suas fontes. Recomendações de vários agentes sobre o mesmo estoque não podem contabilizar o mesmo benefício várias vezes.

## 9. Painel da diretoria: decidir em poucos minutos

Primeira tela: empresa, filiais incluídas, período, atualização, cobertura e confiança. Exibir inicialmente apenas indicadores homologados; os demais ficam indisponíveis com dependência clara.

| Indicador | Definição para homologação | Decisão que apoia |
|---|---|---|
| Receita líquida MTD | Receita reconhecida do primeiro dia do mês ao corte confirmado, com descontos/estornos/tributos conforme definição oficial | Ritmo de venda e lacuna para meta |
| Crescimento comparável | Variação em lojas/canais elegíveis, com dias equivalentes; base positiva para percentual | Crescimento da operação existente versus expansão |
| Contribuição em R$ e % | Receita líquida − CMV − despesas variáveis não já descontadas; percentual ponderado | Qualidade do crescimento e alçada de preço |
| Estoque a custo | Valor oficial do saldo na base explicitada, sem dupla contagem de trânsito | Capital comprometido e necessidade de abastecimento |
| Capital >180 dias | Valor dos saldos remanescentes com entrada original estritamente anterior ao corte de 180 dias | Priorizar giro; não confundir com sem venda |
| Estoque sem venda positiva | Valor/SKUs sem venda na janela completa validada | Rever sortimento, transferência e esforço comercial |
| Cobertura e risco de ruptura | Saldo elegível versus demanda estimada e lead time; hipótese e incerteza visíveis | Repor ou redistribuir, preservando serviço |
| Carteira e compra aberta | Quantidades e valores ainda pendentes, sem repetir parcelas recebidas/canceladas | Evitar sobrecompra e acompanhar promessa |
| Conversão e oportunidade | Coorte de cotações elegíveis; demanda não atendida em bloco próprio | Onde atuar comercialmente agora |
| Caixa e inadimplência | Baixas realizadas separadas de previsões; títulos vencidos por data-base | Financiar crescimento e cobrar com prioridade |
| OTIF | Pedidos completos e entregues no prazo original entre elegíveis; parciais/atrasados preservados no denominador | Corrigir serviço e proteger recompra |
| Benefício CIP | Contribuição incremental/economia atribuível conciliada, com custos; capital liberado em bloco separado | Avaliar retorno do programa sem dupla contagem |

Ticket médio exige IDs de pedido válidos; a base diária por SKU atual não basta. Giro usa CMV/estoque médio a custo de períodos compatíveis. “Dias sem venda” e idade do lote permanecem separados. Não tirar média simples de margens por produto/filial. Crescimento mensal parcial não se compara a mês anterior completo.

### Cartão de decisão prioritária

Cada cartão deve responder: **o que aconteceu → qual evidência → qual impacto → quais alternativas → qual recomendação → quem decide/executa → até quando → como medir**. Incluir custos, restrições, validade da análise e nível de confiança. Meta ou alçada ausente aparece como “a definir”; semáforos não recebem limites inventados.

Exemplo estrutural, sem números fictícios: “Produto/filial concentra capital antigo; há procura confirmada em outra unidade. Giro sugere avaliar transferência; Prisma compara preço e contribuição; Rumo verifica prazo e custo. Gerente decide no prazo acordado. Resultado será medido por venda líquida, contribuição, capital e disponibilidade.”

## 10. Perguntas de homologação por texto e voz

1. “Qual a venda líquida da Shopping neste mês até a última atualização? Separe por filial e compare dias equivalentes.”
2. “Quanto temos em estoque na Distribuidora e quanto está em lotes acima de 180 dias? Qual base de custo foi usada?”
3. “Quais produtos da Shopping concentram mais capital antigo? Mostre valor, quantidade, unidade, filial e validade.”
4. “Quais itens não venderam nos últimos 180 dias? O histórico cobre toda a janela?”
5. “Onde uma transferência pode reduzir excesso e atender demanda sem causar falta na origem?”
6. “Quais compras abertas aumentam o excesso e quais são necessárias para evitar ruptura?”
7. “Quais revisões de preço podem aumentar a contribuição? Mostre premissas, despesas e alçada.”
8. “Quais cotações podemos recuperar com o estoque atual e quem fará o retorno?”
9. “Qual filial cresce em receita e perde contribuição, e quais componentes explicam a diferença?”
10. “Quais são as cinco decisões prioritárias da diretoria, com responsáveis, prazo e evidência?”

Os comandos financeiros atuais cobrem um subconjunto dessas perguntas. Comparações históricas, cenários e consultas novas precisam de ferramentas e testes próprios; a IA não ganha essas capacidades apenas por receber mais colunas. O bot pode pedir empresa, filial, período ou significado de “parado” antes de responder.

## 11. Rodadas de evolução e aceites

| Rodada | Entrega | Aceite para avançar |
|---|---|---|
| 1 — liberação e contrato | Inventário de view/colunas, todas as filiais, chaves, histórico, tipos de evento e relatórios oficiais | Sem duplicidade de medidas; mapa empresa/filial conferido; amostra e cobertura documentadas |
| 2 — gateway CIP | Leitura dedicada, lotes particionados, validação, conciliação, versão publicada e monitoramento | Repetição sem duplicação; falha preserva última base; todas as filiais conciliadas; permissões positivas e negativas |
| 3 — primeiro valor executivo | Venda MTD, estoque/custo, aging e sem venda no painel/Telegram | Mesma pergunta produz mesmo número no relatório oficial, painel e voz, com mesmo corte e escopo |
| 4 — giro, preço e comercial | Giro/Nexo/Prisma/Elo/Cifra com regras de análise e propostas rastreáveis | Lote antigo não rejuvenescido; transferência viável; margem com custos aprovados; cada proposta tem dono |
| 5 — direção, caixa e serviço | Comparações, metas, RufasIA, títulos, logística e benefícios | Indicadores conciliados, top decisões revisado, capital/lucro/caixa separados |
| 6 — aprendizado e execução assistida | Casos reais na Escola; fluxo de aprovação e execução limitado por processo | Testes versionados, aprovação específica, confirmação no destino e suspensão/reversão quando aplicável |

Prazo de cada rodada depende do que a TI liberar e do volume medido. Não prometer todas as análises no dia da liberação da view. Escola, qualidade e permissões evoluem em todas as rodadas.

## 12. Checklist para aceitar a primeira carga completa

- [ ] Lista oficial de empresas/filiais coincide com a cobertura recebida, incluindo unidades sem movimento.
- [ ] Chaves únicas e joins testados; venda, estoque e lote não multiplicam um ao outro.
- [ ] Período, data de atualização, fuso e fechamento confirmados por conjunto.
- [ ] Totais por filial/dia confrontados com relatórios independentes, com divergências explicadas e regra assinada pela Controladoria.
- [ ] Devolução, cancelamento, transferência, reserva, trânsito, conversão de unidade e alteração retroativa testados.
- [ ] Caso com múltiplas entradas no mesmo lote mantém origem/remanescência rastreável; estoque antigo não é inferido pela última venda.
- [ ] Duplicação, carga vazia, carga parcial, interrupção, repetição e mudança de estrutura exercitadas.
- [ ] Consulta autorizada funciona e tentativa fora da empresa/filial/papel é negada no servidor.
- [ ] Interface distingue dado indisponível, parcial, atrasado e zero conciliado.
- [ ] Usuário confere respostas por texto e voz com fonte, empresa/filial e corte correto.
- [ ] Donos técnicos e de negócio definidos; alerta, reprocessamento e recuperação documentados.
- [ ] Somente depois do aceite liberar novos consumidores e eventual aprovação automática das cargas.

## 13. Responsabilidades a confirmar

TI/Procfit: acesso, view, dicionário, desempenho, histórico e mudanças. Controladoria/Financeiro: receita, custo, contribuição, fechamento, conciliação e benefícios. Operação de estoque/compras: saldos, lotes, origem, disponibilidade e lead time. Comercial/Marketing: carteira, conversão, metas, públicos e alçadas. Logística/Atendimento: correlação dos eventos e nível de serviço. GRIT/CIP: gateway, validações, ferramentas, permissões e monitoramento. Diretoria: prioridade, limites, responsáveis e aprovação das decisões de negócio. Nomes e substitutos devem ser confirmados; o documento não atribui aprovações pessoais.

## 14. Referências do projeto e estado das evidências

- Gateway histórico: documento local `output/procfit-vps/OPERACAO.md` na antiga Central de Inteligência; infraestrutura registrada, sem inspeção ao vivo nesta elaboração.
- Contrato e importação atual: `apps/cip-pro-360/PROCFIT-CONTRACT.md`, `ERP-REPORTS.md`, `ops/procfit-export.ps1` e `erp-engine.mjs`.
- Indicadores e fórmulas: `conhecimento/historico/CIP-INDICADORES-EXECUTIVOS.md`; este guia amplia o pedido de dados sem substituir a validação financeira.
- Agentes: `apps/cip-pro-360/agents-data.mjs` e planos de competências; 14 especialistas, Íris restrita à Distribuidora.
- Dados liberados hoje: informação fornecida pelo usuário como previsão; acesso e conteúdo ainda precisam de verificação técnica.
