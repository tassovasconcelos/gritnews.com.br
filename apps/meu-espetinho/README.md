# Meu Espetinho

Micro-SaaS da GRIT para controle simples de espetinhos, churrasquinhos, trailers, barracas e pequenos negócios de alimentação.

## Objetivo

Criar uma operação extremamente simples para venda por cliente, mesa ou comanda, com visão gerencial profissional para o proprietário e modelo recorrente de assinatura.

Princípio de produto: recursos mais avançados devem ser opcionais e apresentados em linguagem simples. O PME deve conseguir operar sem conhecer termos técnicos, controles contábeis ou rotinas complexas.

## Base técnica

- React + TypeScript
- Vite
- Supabase Auth + PostgreSQL + RLS
- Mercado Pago para assinatura recorrente
- Arquitetura multi-tenant
- cache local apenas como contingência, isolado por `tenant_id`
- fechamento financeiro transacional via RPC
- integração nativa GitHub → Hostinger para produção

## Módulos

1. Cadastro e onboarding do estabelecimento
2. Login e recuperação de senha
3. Usuários e permissões
4. Produtos e categorias
5. Clientes
6. Venda rápida
7. Contas/comandas abertas
8. Fechamento de conta + comprovante térmico/imagem
9. Caixa
10. Dashboard gerencial
11. Lista de compras da semana (modo simples ou com estoque)
12. Assinaturas e trial
13. Mercado Pago
14. Controle de dispositivos
15. Super Admin GRIT
16. Auditoria

## Fundação técnica

O tenant autenticado é resolvido explicitamente pela RPC `current_user_tenants()`. O frontend não deve selecionar ambientes com consultas genéricas e `limit(1)`.

O fechamento de uma venda usa `close_order_atomic()`, mantendo atualização do pedido e registro financeiro/fiado na mesma transação PostgreSQL.

O Supabase é a fonte oficial dos dados. O `localStorage` existe somente como contingência de interface e usa chave separada por tenant, evitando reaproveitamento de dados entre estabelecimentos no mesmo navegador.

## Banco de dados

A estrutura é multiempresa e utiliza RLS. As migrations versionadas ficam em:

`apps/meu-espetinho/supabase/migrations/`

Mudanças de DDL devem ser registradas nesse diretório e aplicadas pelo fluxo controlado do Supabase.

## Deploy

A produção usa a integração nativa Hostinger ↔ GitHub apontando para a branch `main` e a raiz `apps/meu-espetinho`.

Configuração esperada na Hostinger:

- Node.js 22.x
- instalação: `npm install`
- build: `npm run build`
- entrada: `server.js`

Os GitHub Actions de CI validam build e smoke test antes do merge. Depois do merge em `main`, a Hostinger deve detectar o novo commit e publicar automaticamente. Evitar upload ou substituição manual de arquivos em produção.

## Direção das próximas evoluções

- manter a operação simples e progressiva para PMEs;
- ampliar testes de fluxo autenticado, fechamento e comprovante;
- evoluir estoque somente como recurso opcional, sem obrigar o cliente a adotar rotinas complexas;
- continuar Super Admin, Customer Success, aquisição, analytics e conversão.
