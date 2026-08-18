# Plano de validação — modo suporte

- Super Admin + `support_tenant` válido: abre exatamente o tenant solicitado.
- `awaiting_payment`: suporte entra na operação; cliente normal continua no gate de pagamento.
- `pending_setup`: suporte entra na operação; cliente normal continua no gate de preparação.
- `suspended`: suporte entra para diagnóstico; cliente normal continua bloqueado.
- trial encerrado / assinatura inativa: suporte entra sem checkout; cliente normal continua no gate comercial.
- `support_tenant` sem concessão válida: não ativa modo suporte.
- nenhuma entrada em suporte altera status financeiro, setup, trial, cortesia ou assinatura.