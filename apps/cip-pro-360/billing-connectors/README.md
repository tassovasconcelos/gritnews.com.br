# CIP360 · Conectores financeiros oficiais · 27/11/2026

## Escopo
- Projeto Supabase: `pcrwtoddavpvkaxwtstc`.
- Interface existente: `https://cip.gritnews.com.br/` → **Central de Consumo**.
- **Somente superadministração** pode consultar as quatro contas globais; a visão por empresa continua isolada.
- Dados da organização **nunca são somados a Shopping e Distribuidora simultaneamente**.
- Este coletor é **somente leitura** nas APIs externas. Não compra créditos, não eleva limites, não muda cobrança e não faz failover de inferência.
- Custo retornado por API não é necessariamente a cobrança final em fatura. Créditos não disponibilizados são nulos, não zero.

## Fontes homologadas em código
1. OpenAI — `GET https://api.openai.com/v1/organization/costs` com chave **de Admin API**. Valor agregado do mês em USD, paginado. A API de custos não fornece saldo de créditos neste fluxo.
2. Anthropic — `GET https://api.anthropic.com/v1/organizations/analytics/cost`, cabeçalhos `anthropic-version: 2026-10-21` e `anthropic-beta: analytics-usage-cost-2026-08-24`. Dados em *centavos* (dividir por 100), **após descontos e antes de créditos**, relatório pode atrasar até 24 h.
3. DataForSEO — `GET https://api.dataforseo.com/v3/appendix/user_data` com autenticação Basic. Extrair `tasks[0].result[0].money.balance` em USD, inclusive saldo negativo. Não inventar gasto mensal a partir do saldo.
4. DeepSeek — `GET https://api.deepseek.com/user/balance` com bearer da própria conta. Saldo pode estar em USD ou CNY; não converter sem câmbio auditado.

## Segredos a provisionar fora do GitHub e do navegador
No dashboard Supabase → Edge Functions → Secrets, cadastrar somente os segredos necessários:
- `CIP_OPENAI_ADMIN_KEY`
- `CIP_ANTHROPIC_ADMIN_KEY`
- `CIP_DATAFORSEO_LOGIN` e `CIP_DATAFORSEO_PASSWORD`
- `CIP_DEEPSEEK_API_KEY`

Criar **um segredo independente de alta entropia, no mínimo 32 caracteres**, e provisioná-lo **sem exibir em logs nem na conversa** em:
- Variável Edge Functions `CIP_BILLING_SYNC_SECRET`
- Secret no Supabase Vault com o nome `cip_ops_billing_sync_secret` e exatamente o mesmo valor.

Não reutilizar a chave de inferência OpenAI como chave administrativa nem reutilizar a credencial do Faro. O coletor Edge `cip-ops-billing-sync` rejeita toda chamada sem a credencial própria. O agendamento `cip-ops-global-billing` roda a cada 6 horas, mas **não envia requisições externas enquanto o segredo do Vault estiver ausente**.

**Esta execução não recebeu, criou ou confirmou nenhuma credencial externa real. Sem elas, os relatórios ficam como “não configurados”.**

## Compartilhamento entre empresas
Valores de OpenAI e Anthropic são retornados no escopo da organização/conta. Nenhum valor é imputado automaticamente ao Shopping ou à Distribuidora.

A tabela `cip_ops_billing_scope_map` foi criada para futura atribuição formal por projeto, workspace ou chave, mas não realiza rateio nem atualiza o financeiro por empresa sozinha.

## Garantias e validações
- RLS por superadmin na origem; públicos e logins comuns não conseguem consultar o relatório global.
- Edge Function de domínio fechado, sem URLs informadas pelo cliente e sem acesso público a credenciais.
- Resposta do provedor tem tamanho limitado, timeout curto e erros sanitizados.
- 429 respeita cooldown e `Retry-After`. Um erro de cobrança não gera chamadas repetidas em loop.
- Pesquisa OpenAI e Anthropic suporta paginação; coleta DataForSEO e DeepSeek preserva moeda.
- Snapshots são **acumulados no mês**, não transações a somar.
- Interface superadmin mostra data de leitura e origem do número.
- Auditoria da importação: nenhum prompt, chave, login, corpo de resposta ou payload financeiro bruto é persistido.

## Homologação necessária
1. Criar credenciais administrativas com o menor escopo possível.
2. Executar um ciclo de sincronização privado via job protegido.
3. Confirmar pelo menos um `cip_ops_global_billing_snapshots` com fonte `provider_api`.
4. Conferir o número em paralelo no painel oficial de cada provedor e observar a diferença entre “uso/custo antes de créditos” e fatura.
5. Autorizar mapeamento de projeto ou workspace antes de atribuir custos por empresa.
6. Testar 401, 429, 5xx, credencial ausente, créditos ausentes e relatório incompleto.
7. Homologar a nova seção por login real de superadmin e avaliar em desktop e mobile.
8. Só então planejar failover multimodelo com autorização, limites contratados e testes de equivalência.

## Links de referência
- OpenAI: https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs
- Anthropic: https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api
- DataForSEO: https://docs.dataforseo.com/v3/appendix/user_data/
- DeepSeek: https://api-docs.deepseek.com/api/get-user-balance/
- Continuidade: issue #177 no GitHub do projeto.
