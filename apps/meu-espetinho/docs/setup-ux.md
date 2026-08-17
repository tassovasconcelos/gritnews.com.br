# Estados de implantação

A tela de Implantação diferencia os ambientes por elegibilidade operacional.

- **Aguardando pagamento**: sem `activation_paid_at` e sem cortesia válida. Ações ficam bloqueadas.
- **Pronto para implantação**: pagamento confirmado ou cortesia válida. Permite iniciar preparação e liberar ambiente.
- **Preparação**: a Edge Function registra a homologação em andamento.
- **Liberado**: inicia o teste assistido de 3 dias quando a liberação é válida.

Erros de backend são traduzidos para mensagens claras na própria interface, sem `alert()` genérico.
