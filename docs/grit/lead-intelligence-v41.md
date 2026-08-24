# GRIT Lead Intelligence V4.1

## Objetivo
Evoluir a tabela `public.leads` já existente como fonte central de verdade comercial. Não criar CRM paralelo.

## Implantado no banco `gritnews`
Migration aplicada em 2026-08-23/24:
- `product_key`
- `score_reason`
- `temperature`
- `expected_close_at`
- `last_touch_at`
- first/last touch de source/medium/campaign
- `normalized_email`
- `normalized_phone`
- `do_not_contact`
- índices para conciliação, roteamento e fila comercial

## Estado observado após migration
- 40 leads totais
- 0 sem `product_key`
- 40 oportunidades abertas sem responsável
- 0 grupos duplicados por telefone normalizado
- 0 grupos duplicados por e-mail normalizado
- 0 registros marcados `do_not_contact`

Observação: não foi criado índice UNIQUE. Mesmo sem duplicidades atuais, a próxima fase deve introduzir ingestão idempotente antes de bloquear duplicação no banco.

## Regra de conciliação futura
1. telefone normalizado
2. e-mail normalizado
3. CNPJ (quando disponível)
4. empresa + cidade como sinal auxiliar, nunca como chave única automática

Em match: atualizar last touch + activity; preservar first touch; não criar outro lead por padrão.

## Próxima fase V4.2
- score explicável e `score_reason`
- Next Best Action determinística
- temperatura recalculável
- fila de SLA
- distribuição apenas para usuários autorizados por app
- UI no módulo Leads existente

## Segurança
- nenhuma service role no frontend
- `do_not_contact` deve bloquear automações futuras
- qualquer merge/dedup destrutivo exige trilha de auditoria e possibilidade de reversão
- não automatizar envio WhatsApp/e-mail sem integração autorizada e controle de opt-out
