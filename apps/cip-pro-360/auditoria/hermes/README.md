# Hermes Agent × CIP360 — piloto supervisionado

Estado: banco e contexto/missões determinísticos implantados; execução externa ainda não homologada. O código deste diretório não é servido no site público. Um supervisor controla a promoção de candidatos na Academia existente.

## VPS — preparação
- Usar conta Linux e perfil Hermes dedicados, sem acesso ao Procfit, SSH administrativo, arquivos de chaves ou ferramentas de terminal, envio de mensagens, execução de código e escrita externa. Não reaproveitar o perfil de uso pessoal ou a credencial service_role do Supabase.
- Verificar a instalação com `hermes --version`. Instalação, provedor e configuração seguem https://hermes-agent.nousresearch.com/docs.
- Configurar no perfil dedicado a API local (`API_SERVER_ENABLED=true`, `API_SERVER_HOST=127.0.0.1`, `API_SERVER_PORT=8642`, `API_SERVER_KEY` gerada localmente e protegida); iniciar `hermes gateway` nesse perfil. Não abrir a porta pública nem configurar CORS. Verificar que a lista efetiva de ferramentas não permite alterações ou exfiltração. A chave do banco não deve estar no processo do Hermes.
- No processo isolado do adaptador, configurar `CIP_PUBLISHABLE_KEY`, `CIP_ACCESS_TOKEN` (JWT vigente do gestor autorizado à empresa; nunca service_role), `HERMES_API_KEY`, opcional `HERMES_MODEL`. Não armazenar em Git, não colar em chats. Usar arquivo de ambiente protegido ou gerenciador de segredos. O token é temporário; para operação desacompanhada provisionar identidade de integração de privilégio mínimo e renovação segura, ainda não implementadas. Não usar conta pessoal em um serviço permanente.

## Teste
```sh
python3 -m unittest discover -s apps/cip-pro-360/auditoria/hermes -p 'test_*.py'
python3 apps/cip-pro-360/auditoria/hermes/cip_hermes_worker.py --company distribuidora_prohospital --agent b2g
```
O segundo comando só lê o contexto e verifica duplicatas. Sem chamada ao modelo. Para uma consulta real, depois de verificar o perfil isolado, orçamento, provedor e autorização de processamento, repetir com `--execute`. O comando faz uma única consulta e persiste uma proposta não aprovada. Por padrão envia somente estado, referência do ciclo, função e diagnósticos mínimos; `--include-approved-knowledge` exige validação adicional de privacidade e autoriza o envio de trechos de habilidades vigentes e casos aprovados, sem dados de clientes. A resposta é tratada como conteúdo não confiável, validada por forma e referências, nunca executada como comando. A API retorna o modelo declarado, não uma atestação de identidade.

## Critérios de habilitação
1. Validar a versão e saúde real da VPS/Hermes, ferramenta permitida e origem do modelo.
2. Dry-run com Íris, sem custo, contexto da Distribuidora.
3. Uma chamada real com limite de orçamento e candidato gravado, revisar fontes e verificar ausência de qualquer escrita externa.
4. Revisão humana da hipótese e eventual criação de material/skill na Academia com fonte e testes. Não promover texto automaticamente.
5. Após habilitar identidade técnica e limites, agendar no servidor um piloto serial, com trava por ciclo e orçamento; não iniciar 27 chamadas simultâneas. Nenhum agendamento de modelo foi habilitado neste PR.

O agendador no Supabase atualiza o contexto a cada 10 min; o ciclo comercial existente mantém seu intervalo de 6h. Missões internas continuam mesmo que a VPS falhe; não há prova de chamadas Hermes até a existência de uma proposta real e validação operacional. A interface distingue contexto determinístico e proposta externa.
