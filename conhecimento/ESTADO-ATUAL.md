# CIP 360 — memória operacional

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
