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
- Supabase dedicado ainda NÃO provisionado. Migrações e RLS ainda NÃO aplicadas/testadas.
- Administração de convites: função escrita, ainda sem deploy real; associação de membros depende de Auth.
- Envio SMTP, equalizador completo/PO, OCR, validação SEFAZ e IA generativa ainda NÃO conectados.
- Requer homologação financeira do custo médio multi-depósito e preços por períodos.
- Publicação HTTPS, ícones PNG de PWA e instalação móvel requerem validação.
- Enviar ativo original da marca Grupo Prohospital para uso sem redesenho.

## Testes de aceitação (a executar)
Inventário 10 resmas -> requisição 2 -> gerente diferente do solicitante aprova -> reserva saldo disponível 8 (físico 10) -> entrega físico 8 e reservado 0 -> painel setor -> auditoria. XML duplicado não deve lançar estoque duas vezes. Usuário sem empresa/setor não deve acessar dados alheios. Avaliar mobile 360px.

**Segurança:** não adicionar segredos ao GitHub, não conectar com bases produtivas existentes, desabilitar self-signup, exigir MFA para administradores, validar Security Advisor e registrar alterações por perfil.
