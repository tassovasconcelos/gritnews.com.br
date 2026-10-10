# CONSUMO PRO 360 — Grupo Prohospital
**Tecnologia e desenvolvimento:** GRIT Soluções e Negócios.

Aplicativo corporativo web responsivo e PWA, desenvolvido em código próprio e independente da Hostinger.

## Padrão GRIT
- Frontend React + TypeScript + Vite; banco dedicado Supabase PostgreSQL + Auth + Storage privado.
- RLS por organização/empresa/setor; RPCs transacionais para movimentações críticas.
- Fonte GitHub: repositório tassovasconcelos/gritnews.com.br, pasta apps/consumo-pro-360. Branch de trabalho isolada; main preservada.
- Hospedagem futura: Cloudflare Pages ou outro provedor estático HTTPS. Nenhuma dependência do Hostinger AI Builder.

## Implementado em código (AINDA NÃO PUBLICADO)
- Login Supabase e seleção de empresa; perfil técnico GRIT sem autorização financeira implícita.
- Solicitação de materiais, alçadas de gerência/financeiro, reserva e entrega com baixa única no estoque.
- Produtos, fornecedores, depósitos, inventário inicial auditado, movimentações por centro de custo/setor.
- XML de NF-e, conferência manual de PDF/foto, anexos privados, vinculação de SKU e entrada após autorização.
- Painéis de consumo por período/setor, auditoria e NEXO inicial por regras objetivas.
- Campanhas de cotação em rascunho, sem simular disparos de e-mails.
- Estilo responsivo, manifesto PWA, sem redesenhar a logomarca corporativa.

## Prerequisitos
Node.js 22, novo projeto Supabase exclusivo deste app na região sa-east-1 e hospedagem HTTPS.

1. Dentro de apps/consumo-pro-360 execute npm install.
2. Configure .env.local usando .env.example com URL e chave publishable do NOVO projeto.
3. Aplique as migrations SQL da pasta supabase/migrations no projeto dedicado, após revisão de segurança.
4. Em ambiente administrador Supabase, crie organização, conta Auth e membership group_admin a partir dos IDs REAIS.
5. Execute npm run build e npm run dev; app local em http://localhost:4175.
6. Teste permissões RLS, inventário, NF, fluxo de aprovação e movimentações antes de qualquer deploy.
7. Para convites, faça deploy da Edge Function cp-invite-user com verify_jwt=true e APP_ALLOWED_ORIGINS para a URL aprovada.

### Bootstrap administrativo seguro (executar SOMENTE no banco dedicado)
Crie usuário no Supabase Auth e confirme sua identidade; em seguida execute:
INSERT INTO public.cp_organizations(name) VALUES ('Grupo Prohospital') RETURNING id;
INSERT INTO public.cp_memberships(organization_id,user_id,role) VALUES ('ID-ORGANIZACAO'::uuid,'ID-USUARIO-AUTH'::uuid,'group_admin');
Substitua placeholders somente no painel seguro. Nunca criar senhas padrão ou login público.

## Pendências explícitas
- Supabase dedicado CRIADO na região sa-east-1, com migrations e RLS aplicados; QA transacional efetuado com rollback. Pendente homologação web com usuários reais.
- Função cp-invite-user publicada com JWT obrigatório; precisa configurar origem autorizada, SMTP Auth e usuário inicial verificado.
- Envio SMTP, equalizador completo/PO, OCR, validação SEFAZ e IA generativa ainda NÃO conectados.
- Requer homologação financeira do custo médio multi-depósito e preços por períodos.
- Configuração Vercel criada, mas frontend e PWA ainda não publicados nem homologados.
- Enviar ativo original da marca Grupo Prohospital para uso sem redesenho.

## Testes de aceitação (a executar)
Inventário 10 resmas -> requisição 2 -> gerente diferente do solicitante aprova -> reserva saldo disponível 8 (físico 10) -> entrega físico 8 e reservado 0 -> painel setor -> auditoria. XML duplicado não deve lançar estoque duas vezes. Usuário sem empresa/setor não deve acessar dados alheios. Avaliar mobile 360px.

**Segurança:** não adicionar segredos ao GitHub, não conectar com bases produtivas existentes, desabilitar self-signup, exigir MFA para administradores, validar Security Advisor e registrar alterações por perfil.

## Atualização da implantação em 10/10/2026
- Supabase dedicado ativo: consumo-pro-360-grit (xscxwazanootrdtyrumb, São Paulo).
- Banco com 19 tabelas RLS, Grupo Prohospital, empresa inicial Prohospital e 11 setores com orçamento ainda não definido.
- Todos os testes com dados fictícios foram revertidos: fluxo estoque 10 -> pedido 2 -> gerente -> financeiro -> reserva -> entrega 8, duplicação de NF XML/PDF, requisição idempotente, RLS por setor.
- Nenhum usuário real ou credencial padrão foi criado; Auth e convites reais dependem do responsável autorizado.
- Função Edge cp-invite-user publicada com verificação de JWT obrigatória, ainda sem teste de e-mail corporativo.
- Vercel preparada em vercel.json. Na Vercel definir Root Directory apps/consumo-pro-360, Build npm run build, Output dist; env VITE_SUPABASE_URL=https://xscxwazanootrdtyrumb.supabase.co e VITE_SUPABASE_PUBLISHABLE_KEY do projeto.
- Não publicar secret/service_role no navegador. Revisar lints SECURITY DEFINER antes de produção.

## Atualização de engenharia — compras, controladoria e marca
- Migrações adicionais aplicadas no banco dedicado: propostas normalizadas, pedidos de compra e aprovação financeira segregada, vedação de segundo vencedor da mesma cotação, rascunho mensal por consumo real, auditoria de alteração em produtos/fornecedores/depósitos/cotações e armazenamento de marca oficial.
- O equalizador mostra marca, embalagem, fator de conversão, preço por unidade, frete, tributos informados, desconto, prazo e aderência técnica. Propostas são inseridas manualmente; **nenhum e-mail é enviado sem integração autorizada**.
- O botão de reposição mensal calcula, por SKU da empresa, teto positivo de (consumo entregue dos últimos 90 dias / 3 + estoque mínimo - estoque disponível), arredondado para cima. Cria **rascunho**, auditado e idempotente por mês. Não existe agendamento automático do job de e-mail nesta versão.
- Testes de banco executados com transações revertidas: 10→2→8 resmas, idempotência NF XML/PDF, propostas de fornecedores em diferentes unidades, preço posto, comprador ≠ aprovador, proibição de segundo fornecedor aprovado e cálculo de reposição mensal.
- Marca oficial: a administração poderá enviar logotipo original PNG/JPG/WebP até 2 MB; upload/versionamento no bucket e troca auditada. A interface não recria a logomarca.
- PWA: captura por câmera via input image/capture e validação de arquivo antes do envio; ainda requer validação em Android e iOS.
- Revisão de segurança Supabase: RLS ativa e alertas informativos de funções SECURITY DEFINER intencionalmente autenticadas, cuja autorização é verificada por RPC. Revisar manualmente antes de operação em produção.

## Restrições de liberação
- Vercel ainda não conectada e frontend não publicado. `vercel.json` está preparado, mas deployment depende de instalar/conectar Vercel e configurar variáveis de ambiente no projeto próprio.
- Auth sem usuários reais, nenhum superadmin GRIT com senha padrão. O responsável deve cadastrar usuário real verificado no Auth e conceder `group_admin`; uma identidade GRIT só recebe papel `grit_superadmin` explicitamente, separado da aprovação financeira.
- Integração SMTP, OCR/IA avançada, SEFAZ e ERP Procfit ainda não conectada. Nenhuma dessas funcionalidades pode aparecer como ativa antes de teste real.

## Gestão de usuários — GRIT Superadmin (10/10/2026)

- Perfil técnico oficial do Grupo: `gritsolucoes@gmail.com`, papel `grit_superadmin`, abrangência organizacional, **status pending**. Registro criado em `cp_user_directory`; não há senha fixa, usuário Auth nem vínculo ativo antes da verificação do e-mail.
- Autorizações da GRIT: administração técnica, estrutura organizacional, produtos, permissões e auditoria; **sem alçadas financeiras** para aprovar despesas, pagamentos ou alterar orçamento/limites da organização.
- Para habilitar de forma segura: em [Supabase Auth](https://supabase.com/dashboard/project/xscxwazanootrdtyrumb/auth/users) convidar `gritsolucoes@gmail.com` em ambiente administrativo; configurar em Authentication > URL Configuration o Site URL e Redirect URLs da hospedagem Vercel autorizada; concluir a confirmação de e-mail; acessar o app. A função `cp-activate-access` só libera a identidade previamente registrada após Auth verificado.
- Menu Administração > Gestão de usuários: busca/filtros/status, cadastro (nome, e-mail, cargo, telefone, perfil, empresa, setor), convite Auth, revisão/edição, suspensão e reativação via `cp-invite-user`, com auditoria e RLS. O Superadmin GRIT não pode ser editado ou suspenso por fluxos operacionais comuns.
- Convite é individual e confirmado pelo backend, depende da configuração de e-mail/URLs no Supabase; não declarar envios como homologados sem receber e abrir convite real.
- Conta pessoal: funcionário define senha própria após aceitar convite ou usa recuperação Auth; nunca armazenar senhas na aplicação.
- Smoke test com rollback validou acesso GRIT ao cadastro, isolamento de alçada financeira e bloqueio de alteração de orçamento pelo técnico.
- Base atual sem dados inventados: 1 perfil GRIT pendente, 0 contas Auth, 0 vínculos ativos, 1 empresa inicial, 11 setores provisórios. A ativação e os primeiros convites ainda requerem identidade real.
