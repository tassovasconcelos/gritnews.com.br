# Cenários de validação — modo suporte

1. Super Admin abre Cliente 360 e inicia suporte para tenant ativo: operação abre normalmente e mostra banner `Modo suporte`.
2. Tenant com `awaiting_payment`: Super Admin entra na operação sem tela de cobrança; proprietário continua vendo cobrança.
3. Tenant com `pending_setup`: Super Admin entra na operação; proprietário continua vendo preparação.
4. Tenant `suspended`: Super Admin entra para diagnóstico; proprietário continua bloqueado.
5. Trial encerrado / assinatura inativa: Super Admin entra sem checkout; usuário normal continua no bloqueio comercial.
6. `support_tenant` inválido ou sem concessão: não ativa modo suporte e não ignora gates.
7. O modo suporte não altera `subscription_status`, `setup_status`, pagamento, trial ou cortesia.