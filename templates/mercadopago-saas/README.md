# Padrão GRIT — Mercado Pago para SaaS

Este template define o padrão para projetos SaaS recorrentes da GRIT usando Supabase Edge Functions + Mercado Pago.

## Arquitetura
Frontend nunca recebe Access Token. O browser chama Edge Functions autenticadas; as funções chamam Mercado Pago. Webhooks usam HMAC-SHA256 e idempotência.

## Secrets obrigatórios no backend
- MERCADO_PAGO_ACCESS_TOKEN
- MERCADO_PAGO_WEBHOOK_SECRET
- MERCADO_PAGO_MODE=production|test
- APP_BASE_URL
- ACTIVATION_AMOUNT
- MONTHLY_AMOUNT

Nunca versionar Access Token, Client Secret ou Webhook Secret no GitHub.

## Endpoints padrão
- create-activation-checkout — cobrança única de implantação/ativação
- create-subscription — assinatura mensal via /preapproval
- mercadopago-webhook — payment, subscription_preapproval e subscription_authorized_payment
- mercadopago-health — expõe apenas booleanos de configuração, nunca os valores dos secrets

## Banco padrão
- subscriptions
- billing_transactions
- billing_webhook_events
- tenants.subscription_status

## Webhook
URL de produção: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`

Validar obrigatoriamente `x-signature` usando o manifest oficial `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` e HMAC-SHA256. Eventos devem ter uma chave única (`event_type:provider_id`) para evitar processamento duplicado.

## Fluxo padrão
1. Usuário cria conta / trial.
2. Sistema cria tenant e assinatura trialing.
3. Checkout de ativação cria cobrança única.
4. Assinatura cria preapproval recorrente.
5. Webhook valida assinatura, consulta o recurso no Mercado Pago e atualiza banco.
6. Tenant recebe status active/past_due/paused/cancelled.

## Checklist novo projeto
1. Criar uma aplicação Mercado Pago específica para o produto.
2. Ativar credenciais de teste e testar ponta a ponta.
3. Definir Webhook e revelar o Webhook Secret.
4. Gravar secrets no ambiente do backend.
5. Executar health check.
6. Testar cobrança de ativação.
7. Testar assinatura.
8. Testar eventos de webhook e idempotência.
9. Somente então ativar credenciais de produção.

## Regras de segurança
- Access Token exclusivamente backend.
- Preferir uma aplicação Mercado Pago por produto/projeto para isolamento e rotação independente.
- Validar HMAC de todo webhook.
- Nunca confiar apenas no retorno do navegador; confirmar status consultando a API do Mercado Pago.
- Manter chaves de teste e produção separadas.
