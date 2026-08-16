# Meu Espetinho

Micro-SaaS da GRIT para controle simples de espetinhos, churrasquinhos, trailers, barracas e pequenos negócios de alimentação.

## Objetivo

Criar uma operação extremamente simples para venda por cliente, mesa ou comanda, com visão gerencial profissional para o proprietário e modelo recorrente de assinatura.

## Base técnica

- React + TypeScript
- Vite
- Supabase Auth + PostgreSQL + RLS
- Mercado Pago para assinatura recorrente
- PWA/mobile-first na próxima etapa
- Arquitetura multi-tenant

## Módulos previstos

1. Cadastro e onboarding do estabelecimento
2. Login e recuperação de senha
3. Usuários e permissões
4. Produtos e categorias
5. Clientes
6. Venda rápida
7. Contas/comandas abertas
8. Fechamento e divisão de conta
9. Caixa
10. Dashboard gerencial
11. Assinaturas e trial de 3 dias
12. Mercado Pago
13. Controle de dispositivos
14. Super Admin GRIT
15. Auditoria

## Estrutura inicial

```text
apps/meu-espetinho/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── supabase/
│   └── schema.sql
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e configure:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_MERCADOPAGO_PUBLIC_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`

Nunca versionar credenciais reais no GitHub.

## Banco de dados

O arquivo `supabase/schema.sql` cria a primeira estrutura multiempresa com:

- tenants
- profiles
- tenant_users
- categories
- products
- customers
- orders
- order_items
- payments_received
- cash_registers
- cash_movements
- subscriptions
- devices
- audit_logs

Todas as entidades operacionais são vinculadas por `tenant_id`. RLS está habilitado para impedir acesso entre estabelecimentos.

## Trial

Cada novo tenant nasce com:

- `subscription_status = trialing`
- `trial_started_at = now()`
- `trial_ends_at = now() + 3 dias`

A próxima etapa deve adicionar a validação de acesso no backend e a transição automática de status via Webhook do Mercado Pago.

## Deploy pretendido

Aplicação preparada para ser publicada em:

`https://app.gritnews.com.br`

O deploy deve continuar saindo do GitHub. Evitar upload ou substituição manual de arquivos no servidor de produção.

## Próxima etapa recomendada

Implementar autenticação real, onboarding, CRUD de produtos, nova conta/comanda, fechamento, caixa e conexão ao Supabase antes de liberar qualquer assinatura paga.
