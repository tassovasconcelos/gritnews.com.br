# GRIT Propostas

Micro-SaaS comercial da GRIT para consultores, representantes, prestadores de serviço e PMEs criarem propostas profissionais em poucos minutos e acompanharem a negociação até a conversão.

## Problema

Muitas pequenas operações ainda criam propostas em Word/Canva/PDF, enviam por WhatsApp ou e-mail e depois perdem prazo, histórico e próxima ação. O produto deve reduzir o tempo de preparação e conectar documento a pipeline.

## MVP V1

1. Cadastro de empresa e identidade visual.
2. Cadastro de clientes.
3. Cadastro simples de produtos/serviços.
4. Formulário de proposta com itens, valores, desconto, validade e condições.
5. Geração de PDF profissional.
6. Compartilhamento por link e download.
7. Status: rascunho, enviada, visualizada, negociação, aprovada, perdida, vencida.
8. Próxima ação e lembrete.
9. Conversão automática da proposta em oportunidade.
10. Dashboard: propostas, valor em aberto, taxa de aprovação, ticket médio e tempo até fechamento.
11. Usuários e permissões.
12. Assinatura SaaS e trial.

## Público inicial

- consultores empresariais;
- representantes comerciais;
- escritórios e prestadores B2B;
- agências;
- pequenas empresas de serviços;
- distribuidores com proposta recorrente.

## Princípios

- proposta em menos de 5 minutos;
- mobile-first;
- sem termos complexos de CRM no fluxo básico;
- PDF e identidade profissional como parte central da venda;
- segurança multi-tenant, Supabase Auth/PostgreSQL/RLS;
- nenhuma credencial privada no frontend;
- deploy via GitHub com CI e inclusão no GRIT Control Center.

## Modelo comercial inicial a validar

Um plano simples com trial e preço acessível para PMEs. Preço definitivo somente após validação de entrevistas e willingness-to-pay; não publicar valor fictício antes disso.

## Landing pública

https://gritnews.com.br/produtos/grit-propostas/

## Próxima sprint

- scaffold React + TypeScript + Vite;
- Supabase multi-tenant;
- schema de clientes, catálogo e propostas;
- gerador de PDF;
- primeira jornada cadastro -> proposta -> PDF;
- landing com captura real de interessados;
- instrumentação de aquisição e conversão.
