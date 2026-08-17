# Homologação v1 — Meu Espetinho

Data: 2026-08-17

## Critério de lançamento

O lançamento só é considerado homologado quando o fluxo abaixo funciona em produção pelo celular e computador:

Landing → cadastro → confirmação de e-mail → primeiro acesso → setup → liberação → primeira venda → fechamento → comprovante → assinatura.

## P0 — bloqueadores

- [x] Trial criado no banco com duração real de 3 dias.
- [x] Frontend de cadastro usa callback oficial `https://meuespetinho.gritnews.com.br/auth/callback`.
- [x] Callback suporta destino seguro para `/app` e `/admin`.
- [x] Login operacional usa a marca oficial, sem ícone legado.
- [x] RPCs administrativas não podem ser executadas pelo papel `anon`.
- [ ] Supabase Auth Site URL = `https://meuespetinho.gritnews.com.br`.
- [ ] Redirect URL autorizada = `https://meuespetinho.gritnews.com.br/auth/callback*`.
- [ ] Template Confirm signup institucional em português aplicado no Supabase Auth.
- [ ] SMTP institucional configurado para remover `Supabase Auth <noreply@mail.app.supabase.io>` da experiência do cliente.
- [ ] Mercado Pago confirmado como `configured: true` em produção.
- [ ] Webhook Mercado Pago testado com pagamento real/controlado e assinatura válida.

## P1 — operação

- [ ] Cadastro completo cria tenant correto e não mistura dados entre clientes.
- [ ] Super Admin consegue localizar o novo cliente.
- [ ] Setup R$ 199 abre checkout e retorna corretamente.
- [ ] Super Admin inicia e aprova implantação.
- [ ] Cliente liberado vê exatamente 3 dias de teste.
- [ ] Cadastro de produto.
- [ ] Abertura de comanda/mesa/cliente.
- [ ] Inclusão e alteração de itens.
- [ ] Fechamento em dinheiro.
- [ ] Fechamento em PIX.
- [ ] Fechamento em cartão.
- [ ] Fechamento em fiado.
- [ ] Comprovante térmico 80 mm.
- [ ] Comprovante em PNG/imagem.
- [ ] Compartilhamento pelo celular.
- [ ] Lista de compras — modo simples sem estoque.
- [ ] Lista de compras — modo com estoque opcional.
- [ ] Usuário adicional e permissões.
- [ ] Suspensão e reativação pelo Super Admin.

## P2 — aquisição e vínculos

- [ ] GA4: propriedade real e `VITE_GA4_ID` em produção.
- [ ] Google Search Console: domínio validado e `sitemap.xml` enviado.
- [ ] Google Ads vinculado ao GA4.
- [ ] Conversões: `sign_up`, `begin_checkout`, `subscription_started`.
- [ ] Meta Business/Pixel vinculado quando disponível.
- [ ] QR Code de campanha validado em Android e iPhone.
- [ ] Landings SEO indexáveis verificadas.

## Segurança

- [x] RLS/multi-tenant em uso.
- [x] Fechamento financeiro transacional via RPC.
- [x] RPCs administrativas com checagem de Super Admin.
- [x] EXECUTE anônimo revogado das RPCs administrativas críticas.
- [ ] Ativar proteção contra senhas vazadas no Supabase Auth.
- [ ] Revisar warning residual de funções `SECURITY DEFINER` executáveis por `authenticated`; o código valida `admin_users`, mas manter sob revisão.

## Publicação

Fluxo oficial: GitHub `main` → Hostinger → `meuespetinho.gritnews.com.br`.
Não realizar upload manual de arquivos em produção.
