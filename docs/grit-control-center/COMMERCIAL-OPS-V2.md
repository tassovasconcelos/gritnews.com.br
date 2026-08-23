# GRIT Control Center — Commercial Ops V2

## Objetivo
Transformar a Central GRIT em cockpit diário de vendas, com velocidade, rastreabilidade e segurança.

## Regras operacionais
- Todo lead deve ter produto, responsável e próxima ação definidos.
- SLA recomendado de primeiro contato: até 30 minutos no horário comercial.
- Lead sem responsável, sem próxima ação ou com follow-up vencido entra em fila de atenção.
- Estágios: `new → contacted → qualified → demo → trial → proposal → won/lost`.
- Lead perdido deve registrar motivo.
- Contatos institucionais: `contato@gritnews.com.br` e WhatsApp `+55 85 92171-6546`.

## KPIs
- SLA de primeiro contato
- leads sem responsável
- follow-ups vencidos
- leads sem próxima ação
- leads quentes
- pipeline aberto em R$
- trials
- propostas
- ganhos/perdidos
- conversão por produto, origem e campanha

## Segurança
- CRM restrito a administradores ativos.
- RLS obrigatória em `leads` e `lead_activities`.
- Nenhum segredo/token no frontend.
- Mudanças críticas devem gerar atividade/auditoria.
- CI verde e release verificável antes de produção.
