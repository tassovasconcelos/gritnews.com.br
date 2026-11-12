# CIP PRO 360 — Projeto de evolução e squad de agentes

Versão 1.4 · 18/10/2026 · Projeto e evolução implementada: Quartel visual, Escola do time e Radar B2G PNCP sob demanda. Demais integrações e autonomia seguem nos gates descritos.

**Objetivo:** tornar o CIP o apoio diário dos gestores e da diretoria para compreender os dados, decidir prioridades e coordenar estoque, compras, preços, finanças, vendas e marketing.

**Abrangência confirmada por Tasso:** Ceará; Shopping Prohospital e Distribuidora Prohospital. Sites de referência: https://www.shoppingprohospital.com.br e https://www.prohospital.com.br. Patrocínio de negócio proposto: Rufino e Glauco. Responsáveis de cada área serão designados pela direção; nomes não representam atribuições já aprovadas.

**Decisão de produto:** uma conversa principal com o Doquita, especialistas por área, Quartel para operação e Escola para aperfeiçoamento. Interface simples, respostas objetivas e evidências acessíveis. Tecnologia e inteligência ficam a serviço do trabalho dos gestores.

## 1. Ponto de partida e resultado esperado

O CIP já está publicado na Hostinger. O acesso real de superadministrador foi confirmado; módulos manuais, consultas do Doquita e persistência de uma simulação de estoque foram verificados. A análise atual do Doquita é baseada em regras sobre registros manuais: ainda não é um agente conversacional com modelo de linguagem. Não há integração Procfit, WhatsApp ou execução autônoma implantada. Homologação completa de permissões restritas, fluxos de alteração e uso autenticado em celular continua necessária.

Esta proposta define o desenvolvimento futuro. Nenhum agente, coleta recorrente, conector, mensagem ou automação externa foi ativado por este documento. Mantém-se a hospedagem na Hostinger, sem Vercel.

Resultados de negócio a medir: disponibilidade de produtos, giro saudável, menos perdas por validade, margem de contribuição, conversão de cotações, recuperação de procura não atendida, produtividade dos gestores e qualidade das decisões. Metas financeiras serão fixadas depois da conciliação da base; recomendações não equivalem a ganhos realizados.

## 2. Experiência do gestor

Entrada com quatro caminhos: **Perguntar ao Doquita**, **Prioridades de hoje**, **Aprovações** e **Meus indicadores**. O gestor escolhe empresa, filial e período; o sistema mantém esse contexto visível.

Perguntas iniciais: “O que exige minha atenção hoje?”, “O que está parado na filial?”, “O que posso transferir antes de comprar?”, “Por que a conversão caiu?”, “Quais preços precisam de revisão?” e “O que mudou na concorrência?”. Perguntas amplas sem contexto geram uma pergunta curta de esclarecimento.

Cada resposta deve conter: **resposta direta → dado e data → ação sugerida → responsável/prazo → ressalva relevante**. Detalhes e memória de cálculo ficam em “Ver evidências”. Quando a informação não existe ou está vencida, declarar a lacuna e indicar como preenchê-la. Não inventar saldo, preço, venda, concorrente ou resultado.

Áudio: gravação ou envio de mensagem de voz, transcrição em português, identificação de intenção e extração de filial, produto, período e quantidade. Antes de uma ação material, mostrar a transcrição relevante e confirmar números e entidades ambíguos. Voz não comprova identidade nem autorização. Resposta começa em texto curto; leitura em voz é uma opção posterior. Proposta inicial de limites: até 2 minutos por áudio, com limite técnico e custo confirmados no piloto.

Uso diário: resumo ao abrir o CIP; reunião operacional de 10 minutos por área; revisão semanal com a diretoria; encerramento das tarefas com resultado e motivo. Alertas devem ser agrupados por exceção, com limite de frequência e responsável, para evitar excesso de notificações.

## 3. As três fases de autonomia

| Fase | Comportamento | Exemplo | Condição de avanço |
|---|---|---|---|
| 1 — Recomendar | Consulta fontes permitidas, explica, simula, prioriza e prepara propostas. Gestores executam as ações de negócio. | Sugerir transferência entre filiais com cálculo, disponibilidade e justificativa. | Dados conciliados, respostas avaliadas e utilidade confirmada pelo gestor. |
| 2 — Executar com aprovação | Prepara a decisão e o pacote de execução; aguarda aprovação explícita de quem possui alçada; executa exatamente o aprovado. | Gestor aprova itens, quantidades, origem, destino e validade da transferência; conector autorizado registra no ERP. | Fluxo específico testado, controle de duplicidade, auditoria, limites e recuperação de falhas. |
| 3 — Operar processos validados | Executa rotinas previamente autorizadas dentro de limites definidos e encaminha exceções para pessoas. | Reposição de categorias elegíveis por fornecedor aprovado, dentro de orçamento e cobertura definidos. | Histórico estável, ensaios de falha, limites assinados pelo dono do processo e mecanismo de suspensão. |

A promoção ocorre **por fluxo, empresa e filial**, não pelo squad inteiro. Um fluxo de reposição pode estar na fase 2 enquanto precificação permanece na fase 1. Tempo de uso ou concordância do agente consigo mesmo não promovem autonomia.

Na fase 2, aprovar uma recomendação não autoriza versões alteradas. Guardar conteúdo aprovado, valor, quantidade, validade, usuário e versão dos dados. Revalidar saldo, preço e orçamento antes de executar; mudança material exige nova aprovação. O proponente automático não é seu próprio aprovador.

Na fase 3, “processo completo” significa conclusão e confirmação de cada etapa elegível. Mudança de política, fornecedor novo, exceção fiscal, orçamento excedido ou resultado inconclusivo suspende o fluxo e devolve ao responsável. Pagamentos, alterações bancárias e compromissos financeiros relevantes permanecem sujeitos às alçadas humanas definidas pela diretoria; autonomia analítica não concede acesso bancário.

## 4. Squad proposto

São papéis especializados, com ferramentas e permissões próprias; não é necessário executar todos simultaneamente nem abrir onze conversas para o usuário.

| Papel | Missão e entregas | Fontes necessárias | Responsável de negócio proposto |
|---|---|---|---|
| **Doquita — Inteligência executiva** | Entender texto/áudio, responder, consultar especialistas e consolidar prioridades com evidências. | Dados autorizados, indicadores, políticas e tarefas. | Direção e gestores. |
| **Analista de dados** | Validar qualidade, reconciliar indicadores, explicar desvios e manter definições. | Procfit, importações e dicionário de métricas. | Controladoria/TI. |
| **Estoque e filiais** | Ruptura, cobertura, giro, validade, reservas, transferências e excesso. | Saldo disponível, lote, validade, movimentação e demanda. | Operações/estoque. |
| **Compras** | Reposição, cotação, comparação de fornecedores e acompanhamento de entrega. | Estoque, pedidos abertos, prazo real, lote mínimo e condições comerciais. | Compras. |
| **Marca-passo de preços** | Revisar contribuição, competitividade e coerência por canal; simular opções. | Custos, tributos/despesas homologados, descontos, regras e observações comparáveis. | Comercial/controladoria. |
| **Comercial** | Priorizar cotações, próximos contatos, motivos de perda e Caderninho; recuperar demanda. | Funil, pedidos, clientes autorizados e disponibilidade. | Gestores comerciais de cada empresa. |
| **Financeiro** | Projetar caixa por cenários, vencimentos, capital de giro e impacto das propostas. | Contas a pagar/receber, liquidações, pedidos e calendário financeiro. | Financeiro. |
| **Estratégico** | Consolidar riscos, cenários e alternativas; acompanhar metas da diretoria. | Indicadores reconciliados e direcionamentos aprovados. | Rufino e Glauco, a confirmar alçadas. |
| **Marketing** | Sugerir campanhas alinhadas a estoque, público, margem e capacidade de atendimento. | Produtos elegíveis, estoque, calendário e desempenho autorizado de campanhas. | Marketing e comercial. |
| **Radar de mercado** | Mapear concorrentes, preços públicos comparáveis, sortimento, ofertas e tendências. | Fontes públicas identificadas e observações internas autorizadas. | Comercial/marketing. |
| **Qualidade e Escola** | Avaliar respostas, curar conhecimento, testar habilidades e preparar versões. | Casos avaliados, feedback e políticas aprovadas. | Dono do produto e especialistas das áreas. |
| **Logística inteligente** | Avaliar promessa de entrega, risco de atraso, separação, expedição e alternativas de rota. | Pedidos, remessas, capacidade, janelas, transportadores e ocorrências. | Logística/operações. |
| **Experiência e voz do cliente** | Explicar andamento autorizado, encaminhar ocorrências e consolidar sugestões com retorno ao cliente. | Pedidos do próprio cliente, protocolos e avaliações. | Atendimento e qualidade. |
| **B2G e contratos** | Identificar oportunidades públicas e acompanhar documentos, prazos, contratos e entregas. | Fontes oficiais públicas e contratos autorizados. | Licitações/comercial B2G. |

Contrato de cada papel: objetivo, proprietário, empresas/filiais permitidas, ferramentas de leitura e escrita, fontes, critérios de recusa, limite de custo, versão, testes e nível de autonomia. O agente financeiro não recebe automaticamente acesso ao comercial completo; contexto e permissões são conferidos antes de cada consulta.

## 5. Evolução dos módulos

| Módulo | Primeira entrega útil | Evolução após dados e integração |
|---|---|---|
| Estoque inteligente | Lista de exceções por SKU/filial, filtros e dados com origem. | Cobertura por demanda, validade, estoque de segurança e propostas de transferência. |
| Giro e capital | Curvas ABC/XYZ, envelhecimento e simulações explicitadas. | Projeção por categoria, sazonalidade e medição de capital efetivamente reduzido. |
| Marca-passo de preços | Custo e margem auditáveis; comparação por item equivalente. | Propostas por canal, alçadas e gravação homologada de preços. |
| Compras | Lista de necessidades com motivo e pedidos em aberto. | Consolidação por fornecedor, rascunhos e acompanhamento aprovado. |
| Comercial e Caderninho | Funil, motivo de perda, procura não atendida e tarefa com responsável. | Disponibilidade associada à oportunidade e execução autorizada de próximos passos. |
| Financeiro | Visão de obrigações, recebimentos e cenários, se houver base autorizada. | Impacto financeiro das compras, preços e estoques; conciliação de realizado. |
| Marketing | Calendário, briefings e propostas vinculadas a disponibilidade e margem. | Aprovação, publicação por canais elegíveis e atribuição de resultados. |
| Estratégia | Resumo semanal, decisões e responsáveis. | Cenários coordenados e acompanhamento de benefícios realizados. |
| Radar | Cadastro verificável e cesta inicial de produtos comparáveis. | Coleta autorizada, detecção de mudanças e tarefas de investigação. |
| Quartel e Escola | Catálogo, tarefas, feedback e fontes versionadas. | Execução supervisionada e promoção controlada de competências. |

O custo fiscal e a formação de preço precisam de validação da controladoria; os percentuais agregados do simulador atual não devem ser usados como preço operacional.

## 6. Quartel dos Agentes

Central de operação para gestores, com telas:

1. **Missões:** proposta → em análise → aguardando aprovação → aprovada → executando → confirmada → medida; desvios para recusada, expirada ou falha.
2. **Squad:** papel, versão, proprietário, permissões, saúde, fase por fluxo e última avaliação.
3. **Aprovações:** decisão, alternativas, valores, impacto, risco, dados usados e prazo; aprovar, devolver ou recusar com motivo.
4. **Resultados:** benefício estimado separado de realizado, custo da operação, evidência e responsável.
5. **Ocorrências:** dados desatualizados, divergência de estoque, falha de conector, execução inconclusiva e botão de suspensão.

Toda missão tem identificador único, empresa, filial, agente, responsável humano, prazo e registro de etapas. Aprovação expirada não executa. A mesma solicitação não gera dois pedidos, duas transferências ou duas mensagens. Em falha parcial, consultar o estado no sistema de destino antes de repetir. Cancelamento ou compensação deve seguir recurso autorizado do ERP, com histórico preservado.

Exemplo de missão coordenada: Comercial identifica demanda não atendida → Estoque verifica outra filial → Financeiro estima custo e margem → Compras avalia alternativa se não houver disponibilidade → Doquita apresenta proposta → gestor aprova na fase 2 → conector executa → Comercial acompanha → Analista mede resultado → Escola recebe o caso avaliado.

## 7. Escola dos Agentes

Objetivo: melhorar o squad com o cotidiano, sem transformar qualquer conversa em regra ou conceder permissões automaticamente.

Trilhas: cultura do grupo; catálogo e unidades de embalagem; indicadores; estoque/validade; compras; formação de preço; comercial; finanças; marketing; atendimento por texto/áudio; ferramentas e segurança operacional.

O que significa aprender: atualizar conhecimento recuperável, procedimentos, exemplos avaliados e habilidades versionadas. Não significa retreinar o modelo automaticamente a cada conversa. Ajuste fino poderá ser estudado depois de evidência de necessidade, base adequada e avaliação de privacidade/custo.

Ciclo: **capturar caso → anonimizar/minimizar → classificar → propor lição → revisar por especialista → testar → publicar versão → medir → reverter se necessário**. Rufino, Glauco e gestores podem registrar direcionamentos com escopo, prioridade, vigência e responsável. Em conflito, o Doquita apresenta a divergência; prevalece a política aprovada e vigente, conforme alçada.

Cada habilidade tem: nome, finalidade, entrada, saída, fontes, ferramenta, permissões, exemplos corretos/incorretos, versão e avaliação. Exemplos: interpretar áudio de estoque; calcular cobertura; analisar preço; comparar embalagem de concorrente; preparar proposta de compra; resumir reunião. Habilidades externas passam por revisão de origem, dependências, licenças e comportamento antes de uso. Não instalar “as melhores skills” apenas por popularidade.

Memórias separadas: conversa individual; conhecimento da área; política corporativa. O feedback “não gostei” gera avaliação, não substitui política. Não reutilizar informações confidenciais de uma empresa ou usuário em outro contexto sem permissão.

Proposta inicial de certificação: conjunto de 100 casos representativos, incluindo áudio, ausência de dados, conflito de políticas, permissão negada e erro de ferramenta. Aprovação exige zero falha crítica de acesso/execução e avaliação humana satisfatória em pelo menos 90% dos casos. São metas propostas, ajustáveis após o primeiro piloto; sem alegação de desempenho já alcançado.

## 8. Integração Procfit — frente prioritária

Situação: mapeamento, documentação e autorização específicos para o CIP ainda serão solicitados. A revisão 1.2 identificou documentação/código de conector Procfit de locações/Supply no ROTA PRO, a avaliar para reaproveitamento; isso não comprova disponibilidade dos dados de pedidos comerciais exigidos pelo CIP. A página oficial do WMS informa APIs de integração, mas isso **não comprova** disponibilidade de endpoints, módulos contratados ou acesso no ambiente do grupo [S3].

Sequência:

1. Confirmar versão, módulos licenciados, contato técnico e ambiente de homologação.
2. Solicitar documentação, métodos autorizados, autenticação, limites, custo/licença, suporte e dicionário de campos.
3. Definir fonte preferencial: API suportada; alternativamente views de leitura homologadas; importação de arquivos como etapa transitória.
4. Conectar somente leitura inicialmente; carga histórica, atualização incremental, tratamento de cancelamentos/devoluções e reconciliação.
5. Comparar amostras por SKU, filial e documento com relatórios do ERP aprovados por cada gestor.
6. Só desenvolver escrita após esclarecer APIs/transações suportadas e limites de negócio. Sem edição direta em tabelas de produção.

Pacote de dados solicitado: empresas/CNPJ e filiais; catálogo/SKU/GTIN/unidade/fator de conversão; saldo físico, reservado, disponível e bloqueado; lotes/validade; movimentações; vendas, devoluções e cancelamentos; custos; preços e descontos por canal; fornecedores; pedidos/recebimentos; cotações/motivos; contas a pagar/receber e liquidações, com segregação de acesso.

Para cada conjunto: chave, empresa, filial, data do evento, data da extração, moeda/unidade, significado, regra de exclusão e qualidade. Necessidade de histórico inicial proposta: 12 meses, até 24 quando disponível para sazonalidade; volume e retenção dependem de avaliação técnica. Atualização diária no início; intervalos menores apenas conforme necessidade e capacidade confirmadas.

Contrato de dados deve distinguir ausência, zero e informação atrasada. Sem atualização dentro da validade do fluxo, agentes podem explicar histórico, mas suspendem recomendações operacionais sensíveis.

## 9. Arquitetura de referência

Fluxo: **CIP/WhatsApp → identificação e permissões → Doquita → consultas calculadas e especialistas → proposta → aprovação/alçada → conector autorizado → confirmação → resultado e Escola**.

Preservar interface CIP na Hostinger e autenticação existente. Criar serviço de agentes no servidor, com gateway de ferramentas, fila de tarefas e armazenamento de auditoria. O navegador não recebe credenciais do ERP, chaves secretas de IA nem tokens do WhatsApp. Avaliar a capacidade do plano atual para tarefas persistentes; usar serviço de execução compatível, dentro da infraestrutura aprovada, se necessário. A hospedagem estática sozinha não executa esse backend.

Reaproveitar a base existente com permissões por empresa e filial. Artefatos propostos: agentes e versões; fontes e documentos; habilidades e avaliações; conversas; missões; propostas; aprovações; execuções; observações de concorrentes; qualidade e resultados. São entidades de projeto, ainda não criadas no banco.

Indicadores e contas devem ser calculados em consultas/funções testadas; o modelo interpreta e explica. Consultas são parametrizadas e limitadas, com contexto autorizado imposto pelo servidor. Documentos, sites, mensagens e áudios são conteúdo de consulta e não podem dar novas permissões às ferramentas. Registrar versão do agente, fontes e estado da operação sem guardar segredos nos logs.

## 10. WhatsApp e áudio

Primeiro piloto: atendimento **interno** a gestores cadastrados, com associação segura entre número e usuário CIP. Cadastro de número não concede acesso por si só. Informações sensíveis e aprovações materiais devem usar sessão autenticada ou link para aprovação no CIP; uma resposta isolada “sim” não é uma autorização genérica.

Preparar número corporativo, conta empresarial, responsáveis, provedor/API oficial, webhook protegido, recebimento de texto/áudio, transcrição, controle de repetição e entrega, transferência para humano e retenção definida. Revalidar requisitos de conta, disponibilidade de recursos e custos na implantação. Não criar dependência de automação pelo WhatsApp Web.

Mensagens proativas precisam de adesão e tratamento de saída. A política oficial prevê modelos aprovados para iniciar conversas e mensagens fora da janela de atendimento de 24 horas [S4]. Configurar janela e elegibilidade no servidor; resposta da API não comprova leitura pelo destinatário.

**Particularidade do segmento:** a política consultada inclui restrições a produtos médicos/de saúde e medicamentos. Por isso, o piloto interno de gestão é separado de campanhas, catálogos e vendas a clientes; cada caso externo requer validar produtos, país, política vigente e elegibilidade com o provedor. Não pressupor que uma campanha de produto hospitalar pode ser disparada no canal [S4].

Retenção de áudio bruto e transcrições será definida com finalidade e acesso; proposta inicial é eliminar áudio bruto após processamento e janela operacional curta, quando compatível com necessidade de auditoria e política aprovada. Manter somente o necessário. Não prometer reconhecimento perfeito em ruído, sotaque, nomes de SKU ou números ditados.

## 11. Radar de concorrência — Ceará

Lista inicial de **candidatos a concorrentes**, identificados por sobreposição pública de produtos e região. Não constitui ranking, prova de disputa por clientes, participação de mercado ou equivalência integral. Priorização final depende das categorias e cidades atendidas pelo grupo. Pesquisa em 18/10/2026.

| Empresa | Frente inicial | Evidência e hipótese de comparação | Fonte oficial |
|---|---|---|---|
| Distrimedical | Shopping | Lojas em Fortaleza; linha ortopédica e materiais hospitalares. Validar cesta e praça. | https://distrimedical.com.br/ |
| Império Hospitalar | Shopping | Fortaleza; mobilidade, ortopedia e equipamentos. | https://www.imperiohospitalar.com.br/ |
| MedLife CE | Shopping | Loja em Fortaleza e catálogo médico-hospitalar. | https://medlifece.com.br/ |
| Locmed | Shopping e nichos de equipamentos | Loja de Fortaleza listada; CPAP, máscaras e equipamentos. Comparar condições online separadamente das lojas. | https://www.locmed.com.br/ |
| Hifarma | Distribuidora e interseções no varejo | Sede em Fortaleza; consumo hospitalar, equipamentos e fisioterapia; atuação declarada no Ceará. | https://hifarma.com.br/ |
| Panorama | Distribuidora | Sede em Fortaleza; materiais, correlatos e medicamentos hospitalares. Comparação depende do portfólio B2B efetivo do grupo. | https://www.panoramamed.com.br/ |
| Nova Med Hospitalar | Distribuidora | Empresa cearense com portfólio hospitalar e atendimento declarado no estado. | https://novamed.med.br/ |
| Newmedix | Distribuidora, apenas categorias coincidentes | Distribuição farmacêutica em Fortaleza; candidato condicionado ao mix e clientes atendidos pela Prohospital. | https://www.newmedix.com.br/ |

Não agrupar a marca “Panorama” de outros estados ou varejistas de nome semelhante com a distribuidora de Fortaleza sem identificação da razão social/site. Outros nomes citados comercialmente serão adicionados após validação.

Cadastro do radar: nome, razão social quando necessária para desambiguação, domínio, região, canal, categorias, fonte, última observação e responsável. Observação de produto: marca, GTIN/SKU, modelo, tamanho, unidade/embalagem, preço, condição de pagamento, frete quando conhecido, disponibilidade observada, data/hora e URL. “Não encontrado” não significa estoque zerado. Equivalência incerta exige revisão humana.

Começar com **30–50 itens comparáveis** escolhidos por relevância comercial; a quantidade é proposta de piloto. Cesta por empresa e canal. Coleta manual primeiro; automatização somente nas fontes permitidas e com limites de acesso. Conteúdo atrás de login, negociação privada, disponibilidade sem confirmação e frete não observado não serão inferidos.

Cadência proposta: itens prioritários diariamente quando a fonte permitir; revisão do mapa semanal; tendências e calendário comercial mensal. Nada foi agendado nesta etapa. O radar entrega mudança observada, possível impacto e tarefa sugerida, sem copiar automaticamente preços concorrentes. Decisões de preço continuam independentes e consideram custo, margem, serviço e estratégia do grupo.

## 12. Práticas de mercado a incorporar

1. Planejamento por exceção e recomendações com evidência: reduzir trabalho de leitura do gestor, mantendo caminho de investigação.
2. ABC por valor/relevância e XYZ por variabilidade, complementadas por criticidade do produto. Não cortar itens críticos só porque vendem pouco.
3. Cobertura e reposição por SKU/filial, prazo real de fornecedor, reservas, sazonalidade, nível de serviço e lote mínimo; começar com regra compreensível antes de previsão complexa.
4. Validade e rastreabilidade por produto/lote/unidade, com proposta de FEFO e controle de bloqueios. Padrões GS1 reforçam identificação e rastreabilidade na cadeia de saúde [S5]. A adoção específica precisa ser compatível com os cadastros e processos reais.
5. Preço orientado a contribuição e canal, comparando embalagem, frete e condição; evitar margem aparente por custo ou imposto incorreto.
6. Previsões comparadas com uma referência simples e avaliadas fora da amostra. Usar WAPE/viés quando aplicáveis; tratar zeros e demanda intermitente explicitamente. Modelos entram quando superam a referência útil ao negócio.
7. Aprendizado por casos avaliados e avaliação contínua, com responsabilidade definida e reversão de versões. Esta recomendação é alinhada à governança, medição e acompanhamento do NIST AI RMF [S6], sem alegar certificação.

Tendências que merecem experimentação no CIP: conversa apoiada em dados verificáveis; áudio ligado ao fluxo de trabalho; especialistas acionados sob demanda; execução por ferramentas com aprovação; rastreabilidade de recomendações e aprendizado por avaliação. São direções de produto propostas a partir das fontes, não um ranking comprovado de mercado nem garantia de ROI.

## 13. Indicadores e critérios de aceite

| Tema | Definição inicial | Verificação |
|---|---|---|
| Giro | CMV do período / estoque médio a custo no mesmo período. | Mesma base de custo e empresas/filiais comparáveis. |
| Cobertura | Saldo elegível / demanda diária estimada, com tratamento de demanda zero. | Informar janela, exclusões e fonte. |
| Ruptura | Itens/dias sem disponibilidade no universo monitorado; perda de demanda medida separadamente. | Definir catálogo ativo e distinguir ausência de venda de ruptura. |
| Margem | Contribuição após custos/despesas/tributos definidos pela controladoria. | Comparar simulação com referência fiscal/financeira homologada. |
| Conversão | Ganhas / cotações elegíveis de uma coorte/período definido. | Distinguir conversão por quantidade e por valor; cancelar duplicidades. |
| Compras | Atendimento de pedidos, prazo real, compra emergencial e aderência ao plano. | Reconciliação com pedido e recebimento. |
| Agentes | Resposta fundamentada, correções, utilidade, tempo e custo por tarefa. | Testes e avaliação humana; não usar confiança declarada pelo modelo como evidência. |
| Execução | Duplicidades, falhas, reprocessamento e confirmação no destino. | Toda execução possui evidência de término ou estado inconclusivo explícito. |
| Benefício | Resultado realizado versus baseline e esforço/custo do CIP. | Separar estimativa, aprovação, execução e efeito observado; explicitar fatores externos. |

Aceite do piloto: permissões por empresa/filial testadas com contas restritas; origem e atualização visíveis em todas as respostas numéricas; áudio testado com casos representativos; nenhuma escrita ERP na fase 1; recomendação com responsável e evidência; feedback e auditoria funcionando; teste de celular nas tarefas principais. Meta inicial de usabilidade: localizar prioridade, evidência e responsável em até três ações, sujeita a teste com gestores.

Aceite para fase 2: alçadas aprovadas; identidade do aprovador verificada; proposta imutável; validade da aprovação; teste de negativa, expiração, concorrência, falta de saldo, falha parcial e resposta ambígua; confirmação no ERP sem duplicidade. Exigir zero falha crítica em homologação. A quantidade de casos e período de observação serão definidos por risco e volume antes do piloto.

## 14. Plano de entregas

Cronograma indicativo em semanas contadas do início acordado e da disponibilidade de equipe. As frentes de ERP e WhatsApp têm dependências externas; datas de autonomia não são garantidas pelo calendário.

| Onda | Janela indicativa | Entregas e saída |
|---|---|---|
| Preparação | Semanas 1–2 | Donos dos processos, solicitação Procfit, baseline, matriz de acesso, backlog e piloto definido. |
| Copiloto fase 1 | Semanas 3–5 | Doquita com texto, fontes curadas, consultas permitidas, feedback e Quartel inicial. |
| Especialistas e Escola | Semanas 4–7 | Estoque, preços, comercial e analista; catálogo de habilidades, casos e avaliações. |
| Dados e áudio | Semanas 4–8, conforme dependências | Conector de leitura homologado ou importação explícita; áudio e reconciliação dos indicadores. |
| WhatsApp interno e radar | Semanas 6–9 | Piloto de gestores com identidade vinculada, encaminhamento humano e cesta concorrencial. |
| Execução fase 2 | Semanas 9–12 ou após gates | Um único fluxo elegível com aprovação, inicialmente tarefas internas; escrita ERP só após integração homologada. |
| Operação fase 3 | Após estabilidade demonstrada | Promoção individual dos fluxos autorizados; não há data fixa antes do piloto. |

Primeiro piloto recomendado: **Doquita + Analista + Estoque + Marca-passo de preços + Comercial**, com Quartel mínimo e Escola desde o início. Compras entra na sequência dos dados; Financeiro e Marketing ampliam conforme qualidade e responsáveis. Não atrasar governança e feedback para o final.

Equipe mínima por função, sem fixar contratações: dono do produto; liderança técnica/backend; integração de dados com TI/Procfit; interface/experiência; avaliadores de estoque/comercial/controladoria; apoio de segurança e responsável de cada processo. Dimensionamento depende das pessoas disponíveis.

Custos a levantar antes de contratar: implementação; IA por texto/áudio; armazenamento; execução de tarefas; WhatsApp/provedor e mensagens; licenças/acesso Procfit; observação de concorrentes; suporte. Fórmula de orçamento mensal: volume de conversas × custo médio de IA + minutos de áudio × custo/minuto + mensagens cobradas × tarifa vigente + infraestrutura + licenças/suporte. Valores permanecem a cotar; não há compra autorizada por este documento.

## 15. Próximas ações concretas

1. Nomear dono do produto e responsáveis das áreas com Rufino e Glauco.
2. Encaminhar a solicitação técnica ao Procfit, após definir destinatário. O texto está preparado abaixo; não foi enviado.
3. Selecionar uma filial Shopping e uma equipe B2B para o piloto, com usuários restritos.
4. Levantar as 20 perguntas mais frequentes e 10 decisões repetitivas de cada área; escolher as primeiras cinco por impacto e disponibilidade de dados.
5. Selecionar cesta concorrencial, categorias críticas e definições dos indicadores.
6. Construir a primeira fatia: conversa de texto com evidências → proposta de ação → responsável → feedback → avaliação na Escola. Áudio e WhatsApp reutilizam esse mesmo fluxo.

### Minuta da solicitação ao Procfit

Solicitamos uma reunião técnica para integrar o CIP PRO 360 ao ambiente Procfit do Grupo Prohospital, inicialmente em modo somente leitura e em homologação. Precisamos confirmar versão e módulos contratados, APIs ou views suportadas, documentação, dicionário de dados, autenticação, segregação por empresa/filial, limites, custos de integração e contato de suporte. O escopo inicial inclui produtos/unidades, estoques e reservas, lotes/validade, movimentações, vendas/devoluções, custos, preços, fornecedores, pedidos/recebimentos e cotações. Dados financeiros serão incluídos conforme autorização de acesso. Favor informar ambiente de teste e método recomendado de extração incremental, assim como eventuais interfaces oficiais de escrita para avaliação futura, sem habilitá-las nesta etapa.

## 16. Fontes e limites da pesquisa

Fontes públicas consultadas em 18/10/2026. Links comerciais são declarações dos próprios fornecedores, não auditoria independente. A seleção de concorrentes e o desenho de produto são inferências e recomendações para validação do grupo.

- [S1 — Prohospital: referência fornecida pelo usuário](https://www.prohospital.com.br/)
- [S2 — Shopping Prohospital: catálogo de referência](https://www.shoppingprohospital.com.br/)
- [S3 — Procfit WMS: rastreabilidade e APIs anunciadas](https://procfit.com.br/wms/) e [ERP](https://procfit.com.br/erp/). Sem documentação técnica do ambiente do grupo recebida.
- [S4 — Política vigente do WhatsApp Business](https://business.whatsapp.com/policy?lang=pt_BR), consultada com atualização exibida de 23/09/2026. Revalidar elegibilidade e preços ao implementar.
- [S5 — GS1: rastreabilidade em saúde](https://www.gs1.org/industries/healthcare/traceability) e [padrões de identificação](https://www.gs1.org/industries/healthcare/standards).
- [S6 — NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework).
- Fontes oficiais dos oito candidatos do radar estão na tabela da seção 11. Não foram coletadas séries históricas de preços nem realizado monitoramento automático.

**Estado final desta entrega:** escopo, arquitetura de referência, papéis do squad, Escola, Quartel, fases, backlog e mapa concorrencial inicial preparados. Implementação e ativação ficam para execução do projeto; nenhuma capacidade futura descrita deve ser apresentada no CIP como já operacional.

## 17. Ampliação estratégica — referência em abastecimento para a saúde

### 17.1 Posicionamento e canais

Direcionamento de Tasso: evoluir para ser referência em **tudo para sua clínica, hospital e home care**, com varejo, atacado, B2B, B2G e e-commerce. Tratar isso como posicionamento e ambição de serviço; não prometer disponibilidade universal nem expansão de produtos sem análise de demanda, margem, capacidade e elegibilidade.

Segmentos de clientes e canais são dimensões distintas. Um hospital pode comprar por contrato B2B ou compra pública; uma clínica pode comprar no balcão, pelo vendedor ou no e-commerce. O cadastro deve distinguir empresa/CNPJ, unidade de atendimento, perfil de compra, contrato, canal e destinatário. Não duplicar o cliente a cada canal.

Propostas por jornada:

- **Varejo:** encontrar produto adequado, saber disponibilidade real, retirar em loja ou receber, acessar assistência e solicitar troca.
- **Atacado/B2B:** catálogo e condições por contrato, cotação, listas de reposição, pedido recorrente, compra por unidade/caixa e acompanhamento por entrega.
- **B2G:** oportunidades, documentos, propostas, contratos, empenhos, entregas parciais, aceite e recebimento financeiro. Órgãos e itens públicos são pesquisados em fontes oficiais; submissão de proposta, lance e compromisso contratual ficam sujeitos à autorização específica do responsável.
- **E-commerce:** busca por nome/SKU/GTIN, filtros por especificação, preço e prazo claros, retirada, recompra e histórico. Confirmar a plataforma e seus contratos de integração antes de escolher OMS/conector.
- **Home care:** entregas programadas, necessidades recorrentes, instruções de recebimento e suporte. Não incluir diagnósticos ou prontuários no atendimento comercial; orientações clínicas permanecem com profissionais habilitados.

Separar padrão de serviço por capital, região metropolitana e interior do Ceará. Uma mesma promessa de prazo para todas as cidades não é meta aceitável sem capacidade comprovada.

### 17.2 Meta de logística inteligente

Criar uma **Torre de Logística no Quartel**, do pedido confirmado até a entrega e eventual retorno. O novo agente de Logística recomenda prioridades e planos na fase 1; na fase 2, executa ações elegíveis após aprovação; na fase 3, coordena apenas rotinas validadas. Toda rotina deve preservar bloqueios comerciais, financeiros, fiscais, sanitários e de estoque.

Capacidades priorizadas:

1. Promessa de entrega baseada em saldo disponível, reserva, localização, capacidade de separação, horário de corte, CEP, rota e janela do cliente. Exibir prazo estimado e suas condições; não prometer entrega no mesmo dia sem piloto e dados.
2. Avaliar expedição por filial/CD, custo total e impacto no nível de serviço. Transferência entre estabelecimentos deve respeitar operação e tratamento fiscal; “filial tem saldo” não basta para liberar venda ou movimentação.
3. Separação e conferência com código de barras, unidade, lote e validade quando aplicáveis; bloqueio de item errado ou vencido; inventário rotativo e rastreabilidade.
4. Consolidação de pedidos e roteirização por capacidade, zona, janela, prioridade e restrições de manuseio. Otimizar custo e cumprimento de prazo em conjunto, não apenas quilômetros.
5. Integração com transportador/frota: coleta, expedição, trânsito, tentativa, entrega, recusa, avaria e devolução. Condições especiais de conservação exigem estrutura qualificada e fonte real de medição; não inferir temperatura pela localização.
6. Prevenção de atraso, fila de exceções, responsável e plano de recuperação. O agente informa mudança de previsão com motivo e escalonamento.
7. Comprovante de entrega e divergência por item; logística reversa, troca e retorno com autorização e inspeção. Não recolocar automaticamente material retornado como disponível.

Integrações adicionais à solicitação Procfit: pedido/itens, reserva, posição de atendimento, remessa, volumes, nota fiscal autorizada, transportadora, datas prometida/expedida/entregue, devolução, cancelamento, eventos e chaves de correlação. Complementar com WMS/TMS/frota/transportador quando o ERP não fornecer os eventos. Etiqueta emitida não comprova expedição; saída para entrega não comprova recebimento.

Modelo de informação: **pedido → itens → uma ou mais remessas → volumes → eventos → comprovantes/ocorrências**. O mesmo pedido pode sair de filiais diferentes e chegar em datas diferentes. Guardar a promessa original, revisões, motivo e aceite quando necessário; mudar a promessa não apaga atraso.

### 17.3 Portal e acompanhamento fácil do pedido

Criar **Meu Pedido Prohospital**, acessível em celular e integrado ao atendimento. Primeiro, consulta autenticada do próprio pedido; link temporário e restrito poderá ser oferecido após desenho seguro. Número do pedido ou telefone, isoladamente, não concede acesso a valores, endereço, documentos ou histórico.

Tela inicial: “Qual é a situação?”, “Qual é a previsão?”, “O que falta?” e “Preciso de ajuda”. Linha do tempo: recebido → em validação → confirmado → em separação → expedido → em transporte → entregue. Estados específicos para pendência, entrega parcial, retirada, tentativa, cancelamento e devolução. Mostrar origem e última atualização; se não houver evento do transportador, explicar a lacuna em vez de simular movimento em mapa.

Funcionalidades: itens e quantidades, remessas separadas, previsão por remessa, consulta de comprovante e documentos permitidos, botão de ajuda com protocolo, pedido de correção de endereço sujeito a validação, comunicação de falta/avaria e solicitação de troca. Recompra cria novo carrinho/proposta com preço e estoque revalidados, nunca duplica silenciosamente pedido antigo.

Clientes B2B podem ter múltiplos usuários/unidades, centros de custo e alçadas, com visão autorizada por conta. Manter o portal do cliente separado da administração interna; o cliente não recebe perfil interno de agente ou gestor.

O Doquita de atendimento responde “onde está meu pedido?” consultando ferramentas limitadas ao cliente identificado. Receber áudio ou reconhecer um nome não libera acesso. Notificações transacionais por canal elegível e com frequência controlada; WhatsApp permanece sujeito à política e ao tipo de conteúdo, especialmente no segmento de saúde.

### 17.4 Voz do cliente e melhoria contínua

Após entrega ou atendimento, convidar a avaliar separadamente compra, clareza das informações, entrega e resolução. Capturar satisfação, esforço, motivo, sugestão de produto e comentário opcional. NPS pode ser usado em pesquisa de relacionamento com amostra e janela definidas; não chamar uma nota isolada de satisfação de NPS.

Ciclo fechado: **cliente registra → protocolo → classificação → responsável → prazo → análise → resposta → decisão → melhoria → verificação de efeito**. Agradecimento automático não encerra reclamação. Permitir acompanhamento de “recebida / em análise / respondida / implementada / não priorizada com justificativa”.

Sugestão de produto alimenta o Caderninho, sem prometer cadastro ou compra automática. Comercial avalia demanda; Compras analisa fornecedor e prazo; Financeiro e Preços analisam viabilidade; Estoque avalia logística; gestor decide. Escola aprende com os casos revisados. Respostas públicas e recomendações não expõem dados de clientes.

### 17.5 Indicadores logísticos e de experiência

Definir primeiro baseline por canal/região/transportador; metas numéricas serão aprovadas após medição. Não declarar o grupo melhor que concorrentes com base em promessa de site ou avaliações de mapas.

| Indicador | Regra inicial de medição |
|---|---|
| OTIF | Pedidos elegíveis entregues completos até a promessa original / pedidos elegíveis com vencimento no período. Definir tratamento de agendamento solicitado pelo cliente; não excluir atrasados para elevar o índice. |
| Pedido perfeito | Pedido no prazo, completo, correto, sem avaria e com documentação conforme / pedidos elegíveis. |
| Fill rate | Quantidade atendida na primeira remessa / quantidade confirmada; medir também por linha, sem misturar denominadores. |
| Ciclo do pedido | Tempo entre confirmação e entrega, com mediana e percentil 90 por canal/região. |
| Acurácia da previsão | Diferença entre previsão exibida e entrega real; acompanhar revisões da promessa. |
| Acurácia de estoque | Itens/localizações sem divergência segundo regra de contagem aprovada. |
| Contatos sobre andamento | Contatos “onde está meu pedido?” por 100 pedidos e taxa de resolução, sem esconder atrasos. |
| Custo de servir | Separação, embalagem, frete, tentativas, retorno e atendimento por pedido/cliente; composição validada pelo financeiro. |
| Voz do cliente | Satisfação/CSAT, esforço/CES, tempo de primeira resposta, resolução e recorrência; NPS em pesquisa própria, com método documentado. |

### 17.6 Referências nacionais e internacionais

O [Radar ampliado e referências](CIP-RADAR-CONCORRENCIA-E-BENCHMARKS.md) organiza fontes e hipóteses. Exemplos observados: Profarma oferece acompanhamento digital de pedidos; Medline reúne pedidos, remessas e ocorrências; McKesson SupplyManager reúne listas, permissões e regras de aprovação; NHS Supply Chain trabalha com inventário e leitura de códigos; Zuellig Pharma apresenta autosserviço B2B e rastreabilidade; DHL descreve visibilidade por eventos e controle de cargas sensíveis.

Esses são referenciais de capacidades, não prova de que a Prohospital precisa comprar suas soluções, reproduzir todos os recursos ou já possui estrutura equivalente. O objetivo é adaptar padrões ao Ceará, ao mix, à escala e ao orçamento do grupo. Experimentos: comparar processo atual com piloto, usando grupo/canal comparável, custo e evidências, antes de expandir.

Metodologia proposta: mapa de jornada e serviço; Pareto de falhas; padronização de eventos e indicadores; PDCA/A3 para melhoria; avaliação de causas antes de automação; teste com gestores/clientes e ciclos curtos. Inovação só avança quando reduz esforço, melhora serviço ou produz resultado verificável.

### 17.7 Sequência da ampliação e gates

1. Mapear operação atual: frota/transportadores, plataformas de venda, sistemas logísticos, regiões e prazos praticados. Não presumir TMS, WMS ou rastreamento disponíveis.
2. Definir contrato de eventos com Procfit e canais; implementar uma visão interna de pedido/ocorrência em leitura.
3. Pilotar portal do próprio pedido em um canal/rota, com dados reais e estado desatualizado explícito; incluir avaliação e sugestão com retorno.
4. Ativar agente de Logística e de Experiência apenas como recomendadores; incluir qualidade, custo e satisfação na Escola.
5. Introduzir ações com aprovação e, depois, rotinas delimitadas, preservando os gates das três fases do projeto.

Critérios de aceite: um cliente não vê pedido de outro; eventos duplicados ou fora de ordem não falseiam estado; remessas parciais aparecem separadas; documentos têm acesso restrito; atraso tem responsável; avaliação gera protocolo; sugestão tem retorno; a promessa original permanece auditável. Testar em celular e conexão lenta, com atendimento humano disponível.

### 17.8 Atualização dos artefatos

O squad passa de **11 para 14 papéis**, com Logística, Experiência do Cliente e B2G. O backlog ganha as entregas CIP-29 a CIP-44. O radar original de oito candidatos permanece como semente; o documento ampliado é a referência atual para classificação e pesquisa. As listas recebidas de buscas locais são pistas: avaliações, telefones e horários não são transferidos como fatos atuais sem validação.

## 18. Premissas ERP e integração ROTA PRO/Driver

Referência técnica e critérios completos: [Premissas de integração Procfit → ROTA PRO → CIP/Cliente](CIP-PREMISSAS-ERP-ROTAPRO-DRIVER.md).

**Decisão de arquitetura proposta:** reaproveitar o ROTA PRO desenvolvido pela GRIT, em `rotapro.gritnews.com.br`, com Driver, Gestor e avaliação. O projeto/código local contém OS, sincronização, ocorrências, horários, recebedor, comprovantes e pesquisa vinculada a tarefa concluída. Isso fundamenta o reaproveitamento, mas não comprova integração com CIP nem homologação da versão publicada nesta entrega. Produtos homônimos encontrados na internet não foram adotados como referência para essa integração.

O **Procfit** permanece fonte do pedido, itens, cliente, reserva, liberação, faturamento e cancelamento; o **ROTA PRO** registra a operação física de entrega/coleta; o **CIP** consolida consulta autorizada, inteligência e melhoria; o **portal do cliente** exibe apenas o que pertence ao cliente identificado. Status comercial, fiscal, físico e de avaliação permanecem separados e correlacionados.

Premissas obrigatórias do ERP: acesso de leitura suportado e autorizado; ambiente de homologação; dicionário de campos; identificadores estáveis de empresa, filial, cliente, pedido e item; correlação pedido/remessa/OS/nota; quantidades e unidades; endereço de entrega validado; promessa e janela de recebimento; bloqueios/liberação; cancelamentos/devoluções; alterações incrementais, data e revisão; limites e periodicidade. Sem isso, o portal não pode apresentar o andamento como integração automática confiável.

O app Driver será o ponto de confirmação operacional: receber OS atribuída, iniciar deslocamento, registrar chegada, tentativa/ocorrência e conclusão com evidência aplicável. Dado pendente no aparelho precisa ser distinguido de evento aceito no servidor. A leitura do CIP deverá ocorrer por interface autorizada de servidor; não copiar credenciais ou sessões entre aplicações nem expor dados internos ao cliente.

Pedido entregue parcialmente permanece parcial. NF emitida não significa saída física. OS concluída não comprova que todos os itens do pedido foram entregues. Foto recebida não significa comprovante auditado. Avaliação registrada não comprova entrega e não encerra reclamação.

Avaliação: reaproveitar o mecanismo existente de convite associado à tarefa concluída, após homologar vínculo, expiração e acesso. Ampliar com experiência de compra, prazo, produto e sugestão, sem confundir essas novas perguntas com recursos já implementados. Resposta negativa gera protocolo e responsável; sugestão de produto entra no Caderninho para análise.

Benefícios esperados a medir: menos redigitação e desencontro de status; clareza sobre prazo e entregas parciais; menos contatos para perguntar andamento; reação mais rápida a atrasos; prova de entrega consultável com permissão; retorno ao cliente e melhoria baseada em causa. Não há percentual de ganho ou prazo de implantação assegurado antes do piloto.

Primeiro piloto: uma filial/rota e um canal, com pedidos reais autorizados, consulta de leitura no ERP, OS vinculada no ROTA PRO, confirmação no Driver, acompanhamento do próprio pedido e avaliação. A integração só será liberada após testar duplicidade, offline/reconexão, cancelamento, atraso, parcial, falha e isolamento entre clientes. Não habilitar baixa, faturamento, pagamento ou outras escritas no ERP nesta etapa.

## 19. Indicadores executivos de resultado e geração de valor

O [Dicionário de indicadores executivos](CIP-INDICADORES-EXECUTIVOS.md) especifica 30 indicadores com fórmula, fonte, responsável e cadência. É a referência para a implantação; definições financeiras/fiscais dependem da conciliação e aprovação da controladoria.

Primeira tela da diretoria: **receita líquida; crescimento comparável; margem de contribuição; economia líquida realizada; capital liberado de estoque; OTIF**. Abas complementares: resultado e crescimento; economia e produtividade; capital e caixa; cliente e logística. Cada cartão tem valor, meta aprovada, desvio, período, fonte, atualização e aprofundamento autorizado.

Princípios: separar economia potencial e realizada, custo evitado e capital; não somar melhoria de margem novamente à economia de compra da mesma ação; não chamar redução de estoque de lucro; não confundir pedido/faturamento com recebimento; comparar períodos e filiais elegíveis; preservar promessa original de entrega; ponderar margens por valor; mostrar base insuficiente e dados desatualizados.

Doquita e agentes explicarão desvios, trarão evidências e sugerirão ação/responsável/prazo. Cálculos vêm de consultas/funções verificadas. Benefícios atribuídos ao CIP precisam de baseline, evidência, custos, deduplicação e validação financeira; não estimar ROI a partir de recomendações não executadas.

Metas numéricas serão propostas após baseline conciliado e aprovadas por Rufino, Glauco e responsáveis das áreas, conforme alçada. Sem meta ou dado, o painel não inventará semáforo nem resultado. Escopo atualizado para 56 entregas; esta revisão não publica painéis nem calcula valores reais.

## 20. Primeira implantação — Quartel, Escola e Íris B2G

Esta revisão acrescenta uma entrega de software ao planejamento anterior. O CIP ganhou três rotas autenticadas: **Quartel dos Agentes**, **Escola dos Agentes** e **Radar B2G · Íris**. A publicação permanece na Hostinger.

Personagens definidos: **Doquita** (coordenação), **Atlas** (dados), **Giro** (estoque), **Nexo** (compras), **Prisma** (preços), **Elo** (comercial), **Cifra** (financeiro), **RufasIA** (estratégia), **Faísca** (marketing), **Faro** (concorrência), **Sofia** (Escola), **Rumo** (logística), **Lia** (cliente) e **Íris** (B2G). Uniformes incorporam a logo original do Grupo Prohospital, preservada; cada papel tem cor, habilidades e missão visíveis. Animações leves respeitam preferência por movimento reduzido. O catálogo é filtrado por empresa; Íris é vinculada à Distribuidora.

O Quartel permite registrar missões, consultar o histórico compartilhado na empresa e alterar o estado pelo time. A Escola oferece quatro práticas com correção e um caderno de aprendizados para revisão humana. Os registros são persistidos com auditoria e controle de acesso; concluir uma missão ou prática não equivale a um agente executar negócio, treinar modelo ou ganhar permissão.

A Íris usa fontes públicas do PNCP: coleta publicada de 150 publicações, 69 contratações candidatas por texto e 16 resultados de itens homologados. Esses números são da amostra inicial, não cobertura de todos os portais ou oportunidades. Exibe descrição, unidade, preço unitário homologado, fornecedor PJ, CNPJ, data e links. O resultado mais recente é limitado à amostra/filtro. A interface permite consulta sob demanda e atualização limitada de resultados; não representa coleta contínua. Contratação pode ser transformada em missão de revisão, sem submeter proposta ou lance.

Correlação nesta etapa é textual, sujeita à revisão do edital, especificação e unidade. O catálogo Procfit ainda não está integrado. O Faro ainda é uma especialidade e fila de tarefas, sem monitoramento automático de concorrentes. Motor de IA conversacional, coleta persistente em segundo plano, ampliação de portais e aprendizagem automática não foram ativados por esta entrega.

Detalhes de verificação e limites: [Relatório da entrega](CIP-ENTREGA-ESCOLA-QUARTEL-B2G.md). O catálogo JSON foi atualizado para distinguir interface/papel implementado de execução autônoma pendente.


## Evolução: RufasIA e Escola dinâmica

Squad mantido em 14 agentes. RufasIA ocupa a cadeira estratégica de diretoria executiva, com histórico preservado. Pautas de Rufino, Glauco e gestão registram objetivo, indicador, responsável, prazo e evidências. Doquita coordena o encaminhamento aos especialistas.

Escola com 14 temas, filtro por agente e busca; práticas orientam casos para revisão e missões aplicadas no Quartel. Contadores representam registros do time. Evolução contínua depende de curadoria, avaliação e publicação versionada; não há treinamento ou execução autônoma habilitados.
