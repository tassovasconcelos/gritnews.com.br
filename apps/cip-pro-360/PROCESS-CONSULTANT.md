# Processos vivos — consultoria por briefing

Responsável seleciona empresa/área, descreve objetivo e rotina e acrescenta respostas/ajustes. Desenhar com IA gera proposta isolada; Revisar mapa atual envia somente campos do desenho e auditoria, sem outras empresas, dados ERP ou evidências de pilotos. Aplicar proposta cria novo mapa local, sem sobrescrever a versão compartilhada. Salvar versão usa o controle concorrente e histórico existentes.

Doquita produz etapas, decisões rotuladas, exceções, responsáveis propostos, evidências, riscos/controles, perguntas, indicadores e casos de teste. Geração limitada a 18 etapas, 30 conexões; cada saída é validada no servidor e cliente. Até 20 tentativas/dia por usuário, contador atômico no banco (inclui falhas após iniciar a geração). Chave da configuração central do CIP é lida apenas no serviço; consentimento específico do briefing obrigatório. Sem execução de mensagens, pagamentos, cobranças ou alterações ERP. Modelo guiado por área é alternativa determinística explicitamente identificada, sem interpretação do prompt.

## Laboratório

Auditoria verifica estrutura, alcance e saídas; os casos verificam percursos início→fim e cobertura de conexões. Não executa sistemas externos nem demonstra regra de negócio. Resultado operacional/evidência são declarações do responsável. Prontidão bloqueia estrutura inválida, percursos/conexões sem teste, responsáveis/critérios não confirmados, casos sem sucesso/evidência ou falta de responsável pela validação. Mesmo com esses campos preenchidos, encaminha para aceite formal/piloto controlado, sem declarar certificação automática. Alterar o mapa invalida as observações anteriores. Evidência é capturada durante digitação e preservada nas versões. Metas sem baseline ficam propostas/pendentes, não ROI comprovado.

## Serviço e segurança

Endpoint `cip-process-assistant`, JWT obrigatório e `auth.getUser`, acesso de escrita à empresa verificado no servidor pelo cliente autenticado antes de ler configuração ou chamar provedor. OpenAI Chat Completions com Structured Outputs, `store:false`, modelo já empregado pelo CIP `gpt-4.1-mini-2025-04-14`. Proposta estruturada limitada; recusas, truncamento, grafos inválidos e falhas do provedor não viram sucesso. Erros não repetem credenciais ou conteúdo remoto. Nenhum prompt/evidência gravado na tabela de consumo. Prompt/mapa só são salvos no CIP quando o usuário salva a versão, conforme RLS existente.

`schema/process-assistant.sql`: contador privado com RLS e sem grants anon/authenticated, RPC de consumo somente service_role. Advisor INFO “RLS sem policy” é esperado: tabela interna ao serviço. Teste transacional até limite e tentativa excedente passou e foi revertido, sem uso retido. Endpoint sem autenticação retorna401. Separação por empresa, consentimento, orçamento e falhas do modelo cobertos por testes com provedor simulado.

## Referências verificadas em 19/10/2026

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat): contrato estruturado; validação de negócio permanece no CIP.
- [BPMN 2.0 — OMG](https://www.omg.org/spec/BPMN/2.0/): referência de notação; mapa simplificado não declara conformidade BPMN.
- [ISO 9001 — abordagem de processos](https://www.iso.org/insights/iso-9001-explained): orientação para processo, risco e melhoria, sem alegar certificação.
- [Supabase — autenticação de funções](https://supabase.com/docs/guides/functions/auth): autenticação e autorização no serviço.

139 testes locais passaram. Navegação real com identidade/provedor simulados conferiu consentimento, modelo de cobrança, proposta/aplicação, exceção, recusa, gravação/reabertura de evidência e edição que invalida teste. Isso é distinto da homologação de geração OpenAI em sessão autenticada de produção.
