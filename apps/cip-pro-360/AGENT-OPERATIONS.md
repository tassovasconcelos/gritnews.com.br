# CIP PRO 360° — operação coordenada dos agentes

Versão de 21/10/2026. Preserva os 14 agentes existentes e a identidade Doquita.

## O que está conectado

A Mesa de operação, em Quartel dos agentes, separa três tipos de trabalho:

1. **Ciclo automático por regras versionadas.** Consulta a posição ativa de inteligência de estoque, suas propostas, contagens do funil e da demanda e conhecimento aprovado. Registra parecer por especialista e gera missões internas com evidência. Não usa modelo pago.
2. **Conselho Doquita com IA, sob demanda.** Gestor, diretoria ou superadm podem solicitar orientação à OpenAI já configurada. O servidor consulta somente a empresa autorizada, o último ciclo com até oito horas, trechos aprovados da Escola, skills com avaliação aprovada e fontes vigentes, além de casos medidos revisados. A IA explica prioridades, dependências, medidas e aprendizados. É uma proposta editorial revisável e pode conter erros; seus textos nunca comandam ferramentas.
3. **Execução supervisionada e medição.** O gestor aceita uma missão com responsável, prazo, indicador e meta; registra andamento, resultado e referência verificável. A revisão aprova ou rejeita seu uso como aprendizado. A adoção de missão não aprova nem executa a proposta de estoque de origem.

Os personagens e animações já existentes continuam visuais. A atividade comprovada está no registro do ciclo, nas missões e nos eventos.

## Rotina inicial

- Ativa para Shopping Prohospital e Distribuidora Prohospital.
- Agendador SQL verifica a cada hora, no minuto 17 UTC. O intervalo inicial mínimo por empresa é seis horas. A rotina continua com o navegador fechado.
- Controle por empresa: pausar/retomar, objetivo, intervalo de uma a 24 horas e limite de uma a dez propostas por ciclo.
- Limite inicial de cinco propostas de estoque novas por ciclo, com até 20 missões abertas de estoque. A fila considera o próximo candidato ainda não acompanhado, distribui tipos e evita duplicação pela ação de origem.
- Atualização de fonte e revisão de aprendizado podem gerar missão adicional; não consomem a cota de propostas de estoque.
- Acionamento manual respeita cinco minutos entre ciclos. Pausa bloqueia também o acionamento manual.
- Não há envio de mensagens, compra, alteração de preço, transferência no ERP ou campanha externa neste motor.
- Erros do agendador ficam como `cycle_failed` com SQLSTATE e mensagem segura no histórico do painel. Não há promessa de alerta externo.

## Especialistas e sinergia

| Agente | Trabalho ligado à mesa | Entrega e dependência |
|---|---|---|
| Doquita | Coordenação e conselho | Reúne prioridades, evidência, perguntas e próximos passos |
| Atlas | Dados e confiança | Identifica fonte antiga e lacunas; antecede a ação comercial |
| Giro | Estoque | Analisa filas e pede conferência de disponibilidade e elegibilidade |
| Nexo | Compras | Exige demanda, reservas, prazo e pedidos; não efetua compra |
| Prisma | Preços | Encaminha validação de contribuição e alçada no Marca-passo |
| Elo | Comercial | Contabiliza cotações/procuras abertas; prepara próximo passo pelo time |
| Cifra | Finanças | Separa custo de estoque, cenário, receita e caixa; exige conciliação |
| RufasIA | Diretoria | Relaciona objetivo, responsáveis, prazo e medição |
| Faísca | Campanhas | Analisa candidatas, pede público e capacidade antes do piloto |
| Faro | Concorrência | Informa que coleta de mercado não ocorreu neste ciclo; encaminha ao Radar |
| Sofia | Escola | Relaciona materiais e casos; cria missão de revisão de resultados pendentes |
| Rumo | Logística | Analisa candidatas de transferência; exige frete, lote e aceite |
| Lia | Cliente | Analisa procuras abertas; pede retorno e causa, sem contatar clientes |
| Íris | B2G | Mantém pesquisa sob demanda e exige edital/equivalência; só na Distribuidora |

Um agente pode apontar falta de dados. Isso é um bloqueio real, não simulação de execução. O quadro da Shopping contém 13 especialistas porque Íris é exclusiva da Distribuidora; o cadastro global continua com 14.

## Metas e aprendizagem

- Indicadores de missão: itens conferidos, unidades movimentadas, unidades vendidas ou contribuição informada em R$.
- A meta é declarada pelo gestor. Medida informada não equivale a venda conciliada nem prova ganho incremental.
- Percentual de atingimento só aparece depois de resultado informado e revisão aprovada. Nunca somar unidades diferentes nem atribuir automaticamente causalidade aos agentes.
- O sistema reutiliza até dez casos revisados da própria empresa no conselho. Rejeitados/pendentes ficam fora. Fonte e regra continuam independentes.
- A Escola mantém seu fluxo versionado de materiais e skills. O conselho usa fontes com aprovação vigente e skills com avaliação mais recente aprovada, sem versão sucessora vigente.
- Aprendizagem significa contexto revisado e recuperável, não treinamento automático dos pesos de um modelo nem ampliação de permissão.

Cadência sugerida: diariamente conferir fontes e escolher poucas prioridades; durante o piloto acompanhar disponibilidade e contribuição; semanalmente revisar evidências, causas e hipóteses e atualizar a Escola. Comparar lojas/períodos e controle antes de afirmar aumento de vendas.

## Fonte atual e bloqueios

Na implantação, as posições disponíveis eram de 19/10/2026. Parte da demanda de varejo veio de histórico de setembro com período não confirmado. O motor bloqueia geração de novas propostas comerciais a partir de posição com mais de um dia, futura ou ausente e cria uma missão de atualização. Mesmo fonte recente exige confirmar reservas, unidade, lote, validade e período. Validade não comprova idade acima de 180 dias.

A aceitação de missão é plano interno. Autorizações de estoque e de preço permanecem nos módulos existentes, com suas validações e alçadas.

## Segurança e limites

- Tabelas novas têm RLS por empresa e clientes recebem apenas SELECT.
- Comandos atômicos passam por função privada com auth.uid(), perfil ativo e alçada na empresa. Os wrappers públicos usam SECURITY INVOKER. O executor interno e o agendador não são chamáveis por clientes.
- Estado e versão são conferidos sob bloqueio de linha; eventos mantêm autoria, contexto e versão.
- Conselho: JWT verificado, usuário validado no Auth, alçada verificada antes e depois da inferência, corpo limitado, origem restrita, quota atômica de 12 solicitações por gestor por 24 horas. Falhas do modelo também consomem quota.
- Credencial já configurada é lida só no servidor. Não entra no front, histórico, contexto ou resposta.
- Nenhum contato de cliente ou valor individual de cotação é coletado pelo ciclo; o conselho recebe contagens, evidências de estoque e conhecimento selecionado, que pode conter dados do material aprovado. A interface informa o envio à OpenAI.
- Não é processamento contínuo por 14 modelos. O ciclo é um motor explicável por regras; o conselho é uma inferência estruturada sob demanda com múltiplas perspectivas.
- Não inclui navegação automática por sites de mercado ou garantia de receita, margem, disponibilidade ou comportamento futuro.

## Operação técnica e verificação

Schema: `schema/agent-operations.sql`; regressão transacional: `schema/agent-operations.test.sql`. O teste cria dados sintéticos, exercita o fluxo e sempre deve terminar com ROLLBACK. Não executar os fixtures com COMMIT.

Edge Function `cip-agent-council`: index.ts + handler.mjs + ai.mjs + agent-operations-engine.mjs. Supabase JS 2.57.0; modelo fixado gpt-4.1-mini-2025-04-14. Provedor recebe store:false e schema estrito; sem ferramentas de execução.

Verificação inclui testes de consentimento, empresa, autenticação, quota, fonte antiga, persistência, falha/refusa do provedor e isolamento; SQL verifica cadência, fila, transições, metas, resultado, versão, RLS e executor privado. Testes de IA usam provedor controlado; não equivalem a homologação completa de uma consulta autenticada ao provedor real ou teste em aparelho móvel.

### Evidências da implantação

Em 21/10/2026, primeiro ciclo real concluído para as duas empresas: 27 pareceres (13 Shopping e 14 Distribuidora) e duas missões de atualização da base. A fonte de 19/10 foi corretamente marcada como antiga. Agendamento ativo, sem falhas no primeiro ciclo. Endpoint do conselho publicado com JWT obrigatório; chamada sem autenticação recusada com 401. Pré-validação SQL foi transacional, com rollback integral dos fixtures. A análise de segurança não trouxe apontamentos sobre os novos objetos.

Verificação isolada da interface com JSDOM: consulta por empresa, escape de conteúdo, definição de meta, andamento, resultado zero, perfil de leitura, pausa e troca de empresa. Axe verificou as regras estruturais executáveis nesse ambiente; contraste visual e aparelho real não foram homologados nessa etapa.
