# CIP360 | Pilotagem controlada da Central de Ações — 27/11/2026

## Propósito
Colocar no CIP oficial a Central de Ações e comprovar a cadeia de decisão sem inventar resultados comerciais. Escopo: Shopping Prohospital e Distribuidora Prohospital. Identidade original do Grupo preservada.

## Diagnóstico de fontes reais
- `cip_command_feed` (view `security_invoker`) recupera **602 ofertas candidatas de Radar** e **2.912 ações de estoque** para Shopping, mais **66 ações de estoque** para Distribuidora, além de missões.
- Última oferta do Radar Shopping: **29/10/2026**. Última posição de estoque nas ações: **19/10/2026**.
- As ofertas não estão homologadas como produtos idênticos e podem omitir frete, disponibilidade ou unidade comparável.
- Em 27/11/2026, o **Faro Shopping apresenta falhas internas de provedor**: 56 `provider_rate_limit` e 8 `regional_source_unavailable` nas últimas 24 horas; `failure_streak` acima de 1.800, com `circuit_until` ativo.
- `cip-faro-hourly` e `cip-faro-worker` têm jobs do `pg_cron` concluídos sem falha de agendamento. **Isso não implica pesquisa externa bem-sucedida**; o último lote real de ofertas concluídas foi em outubro.
- A configuração do Faro Distribuidora está `enabled=false`.

## Prova transacional do fluxo

Foi executado teste **reversível** usando uma oportunidade real da tabela `cip_market_offers`, em sessão autenticada autorizada. Para testar o caminho de aprovação com evidência recente sem alterar a realidade do mercado, a data da fonte foi temporariamente ajustada dentro da própria transação de teste, seguida de `ROLLBACK`.

Sequência validada:
1. Origem real no `cip_command_feed`, com empresa e SKU rastreáveis.
2. `cip_command_decide(..., 'apuracao_autorizada')`.
3. `cip_command_decide(..., 'plano_aprovado')`.
4. `cip_command_decide(..., 'em_acompanhamento')`.
5. `cip_command_decide(..., 'resultado_declarado')` com evidência **explicitamente rotulada como teste técnico**.
6. Resultado dentro da transação: **1 decisão, 5 eventos auditados, 1 tarefa de acompanhamento, estado final `resultado_declarado`**.
7. `ROLLBACK` executado. Segunda consulta confirmou **zero decisões, zero eventos e zero tarefas persistidos**, e a data original da fonte preservada.

**Este teste comprova o funcionamento técnico, não uma aprovação real do Rufino, nem execução de campanha, venda ou ganho financeiro.** A revisão real depende de login do responsável autorizado, atualização da fonte e evidência efetiva de execução.

## Regras de publicação
- A janela de frescor da UI foi corrigida para **48 horas**, alinhada ao `cip_command_guard` do servidor.
- A Central agora consulta `cip_faro_config` (acesso autorizado) e exibe se o Radar está desativado, em circuit-breaker, com falhas recentes ou sem dados recentes. O escritório não pode representar o trabalho parado como pesquisa concluída.
- Fluxo de aprovação humano e trilha de auditoria já estão disponíveis no banco e no PR #170.
- Nenhuma aprovação automática de preços, campanhas, compras ou transferência será liberada sem integração homologada.
- Para o primeiro caso de negócio **real**, é necessário revalidar a oferta e escolher o responsável gerencial pelo CIP, registrar uma decisão por usuário autenticado e anexar evidência de execução/resultado.
- Importação ABC, controle de margem e conexão com Procfit dependem de homologação de custo, vigência e empresa de origem.

## Porta de homologação
- [x] Validar estrutura de origem e trilha RLS no banco.
- [x] Teste técnico reversível com 5 estados e tarefa auditada.
- [x] Confirmar política de fonte atualizada para aprovação de plano.
- [x] Conferir integridade após rollback.
- [ ] Executar login e fluxo em navegador real nos perfis de Rufino/gestores.
- [ ] Obter nova referência verificável do Radar para um SKU e registrar justificativa humana.
- [ ] Registrar execução real e resultado concilado, distinto de `resultado_declarado`.
- [ ] Resolver limitações de provedor do Faro e preservar orçamento de pesquisas.
- [ ] Validar Hostinger/FTPS, executar publicação pela esteira protegida e confirmar HTTPS/manifest/login.

## Evidências externas à base de dados
- PR: https://github.com/tassovasconcelos/gritnews.com.br/pull/170
- Issue de publicação: https://github.com/tassovasconcelos/gritnews.com.br/issues/171
- Validação CI do PR: workflow da branch, a consultar antes de merge.
