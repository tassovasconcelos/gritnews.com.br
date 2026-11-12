# Performance CIP | Tasso — evidências de homologação

Data: 12/11/2026. PR #166, issue #167, base `cip/main`.
Projeto Supabase: `pcrwtoddavpvkaxwtstc`.

## Decisão de publicação

**NÃO PUBLICAR.** A validação técnica abaixo não substitui homologação das fontes, contas reais e regras financeiras. Nenhum deploy Hostinger, merge, pagamento ou bonificação foi executado nesta revisão.

## Correções

- Score rejeita mistura de empresa/período e KPI duplicado; não escolhe arbitrariamente a última linha recebida.
- Benefício exige origem e autor identificados; pareceres da empresa correta, de pessoas diferentes e não autoras. Origens repetidas, inclusive variantes de caixa/espaços, não validam ganhos.
- Banco possui índice único normalizado de origem. Isso não identifica sozinho dois documentos distintos que representem o mesmo benefício econômico: conciliação continua obrigatória.
- Diretoria com associação ativa de diretoria pode lançar apenas na empresa autorizada. Gestor consulta. Superadm é limitado às duas empresas CIP no módulo Performance. Nenhuma regra geral de outros módulos foi alterada.
- Cliente autenticado não pode autodeclarar medição manual como ERP conciliado/instrumentado nem designar revisores.
- Atribuição obrigatória: ação CIP, referência do marco zero e percentual documentado. Líquido = bruto incremental × atribuição / 100 − custos incrementais − estornos. Sem percentual presumido.
- Troca de empresa/período remove imediatamente formulários/dados antigos; falhas de consulta bloqueiam resultados; envio duplo bloqueado. Atualização de KPI usa somente colunas mutáveis e confirma a linha retornada.
- Consultas que atingem o limite de 1.000 linhas bloqueiam totalização parcial. Apuração paginada de alto volume continua pendente.
- Arquivos de texto do CIP preservam LF em Windows/Linux, mantendo os hashes do fornecedor e testes de tamanho estáveis.

## Banco: executado e verificado

Migrações aplicadas via conector Supabase:

1. `cip_perf_hardening_company_manual_origin` — SQL em `schema/performance-tasso-hardening.sql`.
2. `cip_perf_explicit_incremental_attribution` — SQL em `schema/performance-attribution.sql`.
3. `cip_perf_linked_reversal_reassessment` — SQL em `schema/performance-reversals.sql`.

`schema/performance-access.test.sql` executado no projeto real com identidades sintéticas e transação revertida. Verifica superadm, diretoria, gestor, usuário sem acesso, anon, empresa diferente, fonte indevidamente certificada, autoaprovação, autodesignação, chave duplicada, trilha de auditoria e dois pareceres independentes. Resultado: passou. As fixtures não persistiram.

Após rollback: 0 KPIs, 0 benefícios financeiros, 0 revisores. Nenhum valor foi declarado realizado. Sete tabelas Performance com RLS e sem grants PUBLIC/anon foram inspecionadas. Advisor de segurança após mudanças não retornou referência a `cip_perf_`; há achados em outros módulos do banco compartilhado, fora do escopo, sem mudanças neles. Advisor de saúde sem achados.

## Telemetria

O banco contém 164 eventos `cycle_completed` na consulta de auditoria, sem eventos de execução/revisão de missão observados nessa contagem. A tela agora consulta `cip_agent_events` automaticamente, respeitando empresa, período e RLS, exibindo identificador, missão, tipo e timestamp. Mostra até 100 eventos e identifica histórico parcial. Falha de logs não gera atividade presumida nem elimina as medições manuais.

Isso comprova registros de ciclos internos, não eficácia, economia ou integração Procfit homologada. Não há promoção automática de logs a score/benefício. Tempo real de execução de processos e encadeamento alerta → análise → decisão → execução → revisão ainda precisam de instrumentação e homologação.

A rastreabilidade de processos agora também consulta as versões de mapas salvas, com empresa, título, versão, identificador e instante. O banco contém 14 versões na auditoria desta rodada; salvar mapas não comprova execução de processos.

## Estornos vinculados e reapuração

Estorno é novo evento imutável, vinculado ao benefício original e ao seu período/empresa. O banco exige original com dois pareceres independentes, impede vínculo entre empresas/períodos e reserva o saldo para impedir estornos acima do líquido original. A criação é serializada por benefício com trava transacional. Estornos rejeitados liberam a reserva sem apagar histórico.

Enquanto qualquer estorno válido estiver pendente, o motor suspende o ganho do benefício original na prévia. Após dois novos pareceres independentes, desconta o valor uma única vez. Um estorno rejeitado não altera o ganho original. Eventos órfãos, incompatíveis e valores excessivos não geram benefício validado.

Testes: quatro casos de cálculo, cenário de submissão/reabertura no navegador e assertions no Supabase real para estorno válido, excesso, empresa diferente e tentativa de alterar o evento original. Fixtures revertidas. A suite da raiz do aplicativo passou com 375 testes após essa evolução. O fechamento contábil e tratamento de períodos oficialmente fechados ainda exigem aceite da Controladoria; não existe pagamento automatizado.

## Testes reproduzíveis

- Motor e segurança: `node --test apps/cip-pro-360/performance-engine.test.mjs apps/cip-pro-360/performance-security.test.mjs`.
- Navegador: instalar dependências em `apps/cip-pro-360/qa`; executar `node --test apps/cip-pro-360/qa/performance.browser.test.mjs`. Usa dados sintéticos, sem autenticação real ou chamadas ao banco de produção. Testado localmente em Edge headless, mobile 390 × 844 e desktop 1440 × 1000. Cobre meta inválida, salvamento, atualização respeitando grants de colunas, envio duplo, troca de empresa durante consulta, falha de dados e gestor sem formulários.
- Suite de testes da raiz do aplicativo executada localmente após normalização de LF: passou. Hash do Supabase preservado; orçamento offline mantido sem aumentar limite.
- CI novo executa navegador Chromium e banco PostgreSQL efêmero sem credenciais de produção. O bootstrap do CI é um harness mínimo de contratos; o teste executado no Supabase real permanece a evidência das políticas do projeto.
- Publicação CIP passa a depender também dos testes de navegador e banco. Outros workflows/sites não foram editados.

## Pendências bloqueadoras

1. Nomear revisores reais independentes da Controladoria e Diretoria por procedimento administrativo; não criar nomeações fictícias.
2. Definir e homologar baselines, metas, escopos e amostragem de Shopping/Distribuidora; carregar evidências reais reconciliadas.
3. Homologar login/sessão de contas reais e fluxo completo na aplicação integrada. Testes de UI sintética + RLS real não substituem esse aceite.
4. Conciliar documentos econômicos entre módulos e estabelecer chave canônica no sistema de origem; variantes de referência documental distintas ainda exigem revisão humana.
5. Homologar com a Controladoria as reversões vinculadas e a reapuração, incluindo regras de fechamento contábil e comunicação de períodos reabertos. A implementação técnica passou nos testes, mas não houve aceite financeiro real.
6. Instrumentar execuções reais de processos, ações, decisões e revisão; processos desenhados/salvos não equivalem a processos executados. Procfit não homologado.
7. Homologar o modelo contratual da simulação; nenhum pagamento habilitado.
8. Confirmar CI no commit final, alvo FTPS isolado, HTTP/hashes e aceite autenticado antes de qualquer publicação. Esta rodada não utilizou credenciais Hostinger nem alterou outros sites.

O commit `73c8bce4f00d1907222d5b7dfb351175852da327` passou no CI completo: [validação CIP, navegador e banco](https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/43226901983), com publicação ignorada. Evolução de estornos/versões de processos registrada em commit subsequente, cujo CI deve ser conferido no PR.
