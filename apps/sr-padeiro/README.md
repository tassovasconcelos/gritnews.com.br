# Sr. Padeiro

Micro-SaaS mobile-first da GRIT para padarias, mercadinhos, mercearias e conveniências.

## Proposta
**Seu negócio. Seu caixa. Seu estoque. Na sua mão.**

O Sr. Padeiro prioriza simplicidade operacional: vender, receber, controlar estoque, caixa, despesas, compras e fiado pelo celular.

## Navegação V1
- Início
- Vender
- Produtos
- Caixa
- Mais

## Escopo V1
1. PDV com dinheiro, PIX, débito, crédito e fiado
2. Produtos com unidade, peso e código de barras
3. Estoque e movimentações
4. Estoque mínimo e lista de compras
5. Caixa, sangria, suprimento e fechamento
6. Despesas
7. Clientes e caderneta/fiado
8. Fornecedores
9. Dashboard simplificado
10. Usuários e permissões
11. Assinaturas e trial
12. Super Admin GRIT

## Arquitetura
- Mobile-first / PWA
- React (alinhado ao monorepo existente)
- Supabase Auth + PostgreSQL + RLS
- Storage / Edge Functions quando necessário
- Mercado Pago para assinatura
- Analytics orientado ao funil de ativação

## Regras de produto
- 80% das operações em até 3 toques
- primeira venda em menos de 5 minutos após cadastro
- linguagem simples, sem jargão de ERP
- operação diária alimenta automaticamente indicadores e estoque
- multiempresa e multiloja desde a modelagem

## Segurança
Todas as tabelas operacionais devem ser isoladas por `organization_id` e, quando aplicável, `store_id`, com RLS. Nunca expor service-role no frontend.

## Branch de implantação
`feat/sr-padeiro-v1`
