# Coleta de custos operacionais do CIP360

Aplique `schema/central-consumo-faturamento-v2.sql` após a instalação da Central v1, primeiro em homologação. Execute o coletor em Node 22+ no ambiente servidor. O processo não chama modelos. A publicação estática da Hostinger não deve conter o coletor nem suas variáveis.

Configure `CIP_FINOPS_TARGETS` como uma lista JSON de objetos com `company`, `provider` e `scope`. Os identificadores de empresa são `shopping_prohospital` e `distribuidora_prohospital`. Associe cada projeto OpenAI ou workspace Claude exclusivamente à sua empresa depois de conferir a titularidade e escopo. A associação é explícita e o coletor rejeita escopos repetidos e linhas de outras entidades. Contas compartilhadas sem segregação não são suportadas.

Use o gerenciador de segredos para `OPENAI_FINOPS_ADMIN_KEY`, `ANTHROPIC_FINOPS_ADMIN_KEY`, `CIP_FINOPS_SERVICE_ROLE_KEY` e configure `CIP_FINOPS_SUPABASE_URL` para a instância autorizada. Execute `node apps/cip-pro-360/ops/collect-provider-costs.mjs`. Um agendamento externo pode executar por hora após homologação. Monitore o código de saída, os estados de coleta e a data da última observação. `report_unavailable` significa que a janela ainda está sem relatório atribuível ou que a fonte não confirmou a cobertura.

O coletor usa mês UTC e inclui apenas dias UTC encerrados. A API OpenAI pode receber ajustes posteriormente. A API Claude informa custo após descontos e antes de créditos, e não inclui todas as cobranças de compromisso. Os valores são despesas de uso reportadas no escopo e ficam separados das faturas. Uma repetição na mesma hora não cria outra observação. Saldo e teto contratado permanecem desconhecidos quando a fonte não os fornece.

Em homologação, rode os testes Node, valide a migração e consulte o painel com um usuário autorizado de cada empresa e um usuário sem acesso. Faça uma coleta real de cada escopo habilitado, confira a soma com o console oficial e repita na mesma hora para conferir a idempotência. Teste o aviso de consulta indisponível e observe o cenário de omissão por falta de dados antes de habilitar qualquer rotina em produção.

- [OpenAI Costs](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs)
- [Claude Usage and Cost Analytics](https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api)
