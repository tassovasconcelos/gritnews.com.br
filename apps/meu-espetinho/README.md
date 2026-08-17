# Meu Espetinho

Micro-SaaS da GRIT para controle simples de espetinhos, churrasquinhos, trailers, barracas e pequenos negócios de alimentação.

## Objetivo

Criar uma operação extremamente simples para venda por cliente, mesa ou comanda, com visão gerencial profissional para o proprietário e modelo recorrente de assinatura.

## Base técnica

- React + TypeScript
- Vite
- Supabase Auth + PostgreSQL + RLS
- Mercado Pago para assinatura recorrente
- Arquitetura multi-tenant
- cache local apenas como contingência, isolado por `tenant_id`
- fechamento financeiro transacional via RPC
- deploy automatizado GitHub → Hostinger

## Módulos

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
11. Assinaturas e trial
12. Mercado Pago
13. Controle de dispositivos
14. Super Admin GRIT
15. Auditoria

## Fundação técnica

O tenant autenticado é resolvido explicitamente pela RPC `current_user_tenants()`. O frontend não deve selecionar ambientes com consultas genéricas e `limit(1)`.

O fechamento de uma venda usa `close_order_atomic()`, mantendo atualização do pedido e registro financeiro/fiado na mesma transação PostgreSQL.

O Supabase é a fonte oficial dos dados. O `localStorage` existe somente como contingência de interface e usa chave separada por tenant, evitando reaproveitamento de dados entre estabelecimentos no mesmo navegador.

## Banco de dados

A estrutura é multiempresa e utiliza RLS. As migrations versionadas ficam em:

`apps/meu-espetinho/supabase/migrations/`

Mudanças de DDL devem ser registradas nesse diretório e aplicadas pelo fluxo controlado do Supabase.

## Deploy

A aplicação é publicada pelo GitHub Actions. Evitar upload ou substituição manual de arquivos no servidor de produção.

O workflow de produção deve validar build e smoke test antes de enviar os artefatos para a Hostinger.

## Próximas evoluções

- ampliar testes de fluxo autenticado e financeiro;
- consolidar Design System com o manual oficial da marca;
- evoluir Super Admin para Cliente 360, billing, health score e ações de Customer Success;
- aprimorar onboarding, aquisição, analytics e conversão.
