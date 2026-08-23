# GRIT Control Center — Commercial Ops V2

## Objetivo
Transformar a Central GRIT em cockpit diário de vendas, com velocidade, rastreabilidade e segurança.

## Regras operacionais
- Todo lead deve ter `product`, responsável e próxima ação antes de sair da fila de triagem.
- SLA inicial recomendado: primeiro contato em até 30 minutos no horário comercial.
- Lead sem responsável, sem próxima ação ou com follow-up vencido entra em fila de atenção.
- Estágios: `new → contacted → qualified → demo → trial → proposal → won/lost`.
- `won` exige valor potencial/negociado revisado; `lost` deve registrar motivo.
- Contatos devem usar os canais institucionais: `contato@gritnews.com.br` e WhatsApp `+55 85 92171-6546`.

## Segurança e governança
- Acesso ao CRM restrito a perfis administrativos ativos.
- Dados operacionais dos apps permanecem isolados; a Central agrega somente visão comercial/gerencial.
- RLS continua obrigatória em `leads` e `lead_activities`.
- Nenhum segredo, senha, token de e-mail ou service role no frontend.
- Mudanças de estágio, responsável e próxima ação devem gerar atividade/auditoria.
- Deploy deve ser validado por CI e marcador de release em produção.

## KPIs diários
- leads novos
- SLA de primeiro contato
- leads sem responsável
- follow-ups vencidos
- leads sem próxima ação
- oportunidades qualificadas
- trials
- propostas
- ganhos/perdidos
- valor total do pipeline
- valor ganho
- conversão por produto, origem e campanha

## Rotina recomendada
### 08h–09h
Triagem dos novos, distribuição por responsável e recuperação de follow-ups vencidos.

### Durante o dia
Priorizar leads urgentes/quentes, registrar contato, atualizar estágio e sempre deixar próxima ação agendada.

### Encerramento
Nenhum lead novo deve terminar o dia sem responsável ou sem próxima ação, salvo descarte/lost justificado.
