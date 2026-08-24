# Sr. Padeiro — Acessos e Operação

## Aplicação
Produção planejada: `https://srpadeiro.gritnews.com.br`
Status atual: desenvolvimento/homologação na branch `feat/sr-padeiro-v1`.

## Repositório
`https://github.com/tassovasconcelos/gritnews.com.br`
PR de implantação: `#70`

## Supabase
Projeto compartilhado inicial: `gritnews`
Project ref: `pcrwtoddavpvkaxwtstc`
API URL: `https://pcrwtoddavpvkaxwtstc.supabase.co`

## Super Admin
Conta central: `tassovasconcelos@gmail.com`
Autorização: `public.admin_users.role = superadmin` e `active = true`.
Senha: gerenciada exclusivamente pelo Supabase Auth. Nunca registrar senha em texto puro no banco, GitHub ou documentação.

## Isolamento Sr. Padeiro
Prefixo das tabelas: `srp_`
Todas as tabelas operacionais usam RLS.
Acesso normal é limitado à organização do usuário.
Super Admin ativo pode administrar todas as organizações Sr. Padeiro.

## CRM / Leads
Base compartilhada: `public.leads`
Identificação do produto: `product = sr-padeiro`
Campanha inicial: `srp_launch_fortaleza_01`

## Campanhas cadastradas
- Sr. Padeiro | Prospecção WhatsApp Fortaleza
- Sr. Padeiro | Meta Leads Local
- Sr. Padeiro | Google Busca Intenção

Status inicial: `planned`. Mídia paga permanece com orçamento zero até landing, tracking e orçamento serem aprovados.

## Segurança
- publishable key pode ser usada no frontend com RLS corretamente configurada.
- nunca expor `service_role`.
- nunca armazenar senha de Super Admin em tabelas de aplicação.
- leads empresariais públicos sem opt-in permanecem com `consent_lgpd=false`.
