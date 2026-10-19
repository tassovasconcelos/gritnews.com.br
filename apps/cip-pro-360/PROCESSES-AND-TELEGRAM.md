# Processos vivos, competências e Doquita no Telegram

Release de 19/10/2026. Grafia oficial: **Doquita**. Preservados os IDs e os 14 agentes existentes. As imagens enviadas inspiram a clareza de funções e entregas; não incorporamos suas alegações de desempenho.

## Competências e educação continuada

`agent-capabilities.mjs` define seis competências por agente, entradas, entregas, especialistas envolvidos, métrica, caso de avaliação e limites. O Quartel permite pesquisar e consultar os planos; a Escola exibe a trilha do especialista. Maturidade: definida → fontes revisadas → teste aprovado → piloto medido → operação monitorada. É um plano de desenvolvimento; não é treinamento do modelo nem certificação automática.

Sofia assume curadoria, desenho de avaliações e auditoria de processos. Tecnologia, segurança, comunicação e crescimento atravessam o squad. Apoio jurídico permanece revisão humana especializada; não criamos um 15º agente. Foram cadastradas 27 orientações e 27 propostas de habilidades em rascunho: 13 agentes nas duas empresas e Íris apenas na Distribuidora. Não foram aprovadas automaticamente nem criadas avaliações fictícias. O gerador idempotente `ops/seed-capabilities.mjs` produz o SQL desses rascunhos. Habilidades concretas continuam sendo propostas, revisadas e aprovadas na Escola com fontes válidas e testes. Documentos são referência, não instruções que concedem acesso.

## Processos vivos

- Modelos de crescimento comercial e reposição/atendimento, ou mapa em branco.
- Início, atividade, decisão, aprovação e fim; conexões rotuladas; agente, responsável, prazo/indicador, evidência e orientação por etapa.
- Arraste pela alça; movimento por botões para teclado; mapa deslizável no celular. Animações respeitam redução de movimento.
- Simulação manual das alternativas; nenhuma chamada de ERP, disparo ou autorização de negócio. Aprovações simuladas não são aprovações reais.
- Auditoria local: início/fim, conectividade, caminhos sem saída, ciclos, ramificações, alternativas distintas, responsáveis, indicadores e evidências. Não demonstra correção integral do negócio nem conformidade BPMN.
- Dados compartilhados por empresa com RLS, permissões existentes, histórico imutável e controle de versão concorrente. Carregar histórico produz rascunho; salvar cria nova versão.
- Limites: 60 etapas, 120 conexões, JSON até 200 KB. Rascunhos podem ser salvos com pendências; erros estruturais bloqueiam simulação. Exporte sua cópia antes de recarregar após conflito.
- Referência estrutural: https://www.omg.org/spec/BPMN/2.0/ (consulta em 19/10/2026). Sugestões se adaptam aos agentes do fluxo, com referências ISO (processos/PDCA), GS1 (eventos/rastreabilidade) e NIST (governança/avaliação) consultadas em 19/10/2026. São regras cadastradas; pesquisa viva de tendências ainda não conectada. Faro deve trazer fontes atuais para revisão na Escola antes de transformá-las em regra.

## Telegram: primeiro modelo

Escolha inicial: **Doquita CIP**, em chat privado. O webhook e a tela de vínculo foram implementados; **o bot externo não está ativado sem token e configuração do webhook**. Não houve envio de mensagens reais nesta implantação.

Piloto exclusivo do superadm ativo. O servidor verifica novamente o perfil a cada consulta; suspensão bloqueia respostas mesmo com vínculo existente. Empresa explicitamente escolhida no CIP; mudar empresa exige novo vínculo. Código aleatório de 256 bits, hash SHA-256 no banco, uso único e validade de dez minutos; novo código invalida os anteriores. O usuário pode revogar no CIP ou com `/sair`. O vínculo reenvia dados ao Telegram, conforme aviso explícito na tela; não use dados clínicos ou outros dados sensíveis nesse piloto.

O modelo inicial interpreta intenções conhecidas em português por regras. Não usa LLM, não aceita SQL, não altera ERP e não interpreta qualquer pedido livre. Consultas: `/resumo`, `/missoes`, `/processos` e `/conhecimento termo`. Missões são contagens de todos os períodos do cadastro, sem títulos ou dados pessoais. Conhecimento: até dois trechos de fontes aprovadas, extraídas, vigentes e não substituídas, com título, localizador e data. Faturamento/estoque/vendas reais aguardam Procfit. Não há resposta inventada para pedidos sem dados.

Webhook HTTPS com segredo em cabeçalho; segredo e token somente no servidor. IDs do chat e remetente precisam coincidir e o chat precisa ser privado. Deduplicação de update_id, limite de 12 pedidos/minuto e até 3 tentativas com lease de 90s. Nenhum conteúdo da mensagem fica no log de fila. Na falha ambígua entre envio externo e confirmação local, pode ocorrer resposta duplicada; não prometemos entrega exatamente uma vez. Retenção operacional da fila: limpeza manual pela equipe até configurar política aprovada de retenção.

### Ativação segura

1. No Telegram oficial, abra https://t.me/BotFather e execute `/newbot`. Nome: **Doquita CIP**; username disponível terminado em `bot`. Use bot exclusivo deste projeto. Guarde o token com segurança.
2. Administrador do projeto executa, em terminal confiável com Node 20+: `node apps/cip-pro-360/ops/setup-telegram.mjs`. As duas credenciais são digitadas sem eco: token BotFather e access token Supabase com acesso ao projeto. O script verifica o bot, grava os segredos na API oficial, configura webhook e comandos e verifica a URL. Segredos não são escritos em disco nem exibidos. Não cole tokens em chats ou no frontend.
3. Alternativa: configurar `CIP_TELEGRAM_BOT_TOKEN` e `CIP_TELEGRAM_WEBHOOK_SECRET` (32 a 256 caracteres seguros) nos Secrets das Edge Functions; configurar `setWebhook` com a mesma secret_token e a URL `https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/cip-telegram`. Se necessário, reimplantar a função após alteração de segredos.
4. Abra CIP → **Doquita no Telegram**, escolha a empresa e gere o código. Envie `/vincular CODIGO` apenas ao seu bot em chat privado.
5. Homologue `/resumo`, `/conhecimento termo`, identidade não vinculada, grupo, revogação, perfil suspenso e falhas de entrega. Sem esse teste real, o canal não está homologado.

Referências oficiais consultadas: https://core.telegram.org/bots/features#botfather e https://core.telegram.org/bots/api#setwebhook (19/10/2026). WhatsApp fica para fase posterior, com número empresarial, integração e permissões próprias. Não existe envio automático para clientes nesta versão.

## Evolução orientada por resultado

1. Homologar mapas com comercial, compras e financeiro; registrar donos e indicadores reais.
2. Aprovar material e testes de cada agente; medir utilidade, falhas e revisões vencidas.
3. Ativar e testar o bot privado do superadm; ampliar perfis somente após alçadas e política de dados definidas.
4. Conectar Procfit somente leitura, conciliar baseline e então adicionar relatórios de SKU, filial e período. Não permitir consulta ampla de SQL pelo mensageiro.
5. Acrescentar interpretação semântica com ferramentas limitadas e avaliações, evidências atuais de mercado e execução assistida com aprovações específicas. O simulador atual não é um motor de workflow autônomo.
