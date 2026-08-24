# GRIT Lead Growth Engine V5

## Objetivo

Transformar cada solicitação de contato em atendimento mensurável e cada assinatura em sinal de otimização para aquisição, sem disparos indiscriminados.

## Fluxo operacional

1. Formulário ou webhook registra produto, landing, formulário, UTMs, `gclid`, `fbclid` e plataforma de origem.
2. O coletor guarda a versão do aviso de privacidade e a autorização separada por canal.
3. O motor classifica o lead, aplica SLA e inscreve na cadência do produto.
4. A fila só libera contato quando há endereço, autorização válida, frequência permitida, horário comercial e integração ativa.
5. Resposta recebida pausa a cadência e cria ação humana imediata.
6. Oportunidade ganha deve gerar evento de assinatura e retorno de conversão para a plataforma de origem.

## Guardrails ativos

- opt-out bloqueia e cancela toda fila pendente;
- WhatsApp e e-mail exigem autorização comprovável por canal;
- Instagram e Facebook exigem autorização e conversa recebida dentro da janela operacional da plataforma;
- máximo de um envio automatizado em 24 horas e três em sete dias por lead;
- envios programados somente entre 09h e 19h no horário de São Paulo;
- dados antigos sem prova de autorização permanecem em `consent_required`;
- integrações desligadas produzem `integration_required`, nunca envio silencioso;
- respostas interrompem automações para evitar insistência.

## Gestão diária

- SLA: primeiro contato em até 15 minutos durante o horário comercial;
- prioridade: lead com intenção de teste, preço ou implantação antes de conteúdo genérico;
- todo lead aberto deve ter responsável e próxima ação;
- cadência recomendada: imediato, D+1, D+3 e D+7, encerrando ao responder, converter, recusar ou pedir opt-out;
- medir por app e origem: leads, taxa de contato, resposta, qualificação, teste iniciado, assinatura, receita, tempo até contato e motivo de perda.

## Integrações

- WhatsApp: Cloud API oficial, templates aprovados e opt-out simples;
- Instagram/Facebook: webhooks de mensagens e Lead Ads, respeitando janela e permissões da Meta;
- e-mail: provedor com unsubscribe e tratamento de bounces;
- Google: preservar `gclid` e preparar Enhanced Conversions via Data Manager API;
- Meta: preservar `fbclid`, formulário e campanha para Conversions API quando a conexão oficial estiver ativa.

## Estado em 24/08/2026

- 90 leads existentes: 50 vindos de listagens públicas do Google e 40 da carga anterior; 39 cadências já criadas;
- 39 ações antigas bloqueadas em `consent_required` por ausência de prova por canal; os demais prospectos públicos não entram automaticamente em disparos;
- integrações de envio ainda não estão liberadas em produção;
- Edge Function `commercial-lead` V4 captura consentimento e origem para novos formulários.
