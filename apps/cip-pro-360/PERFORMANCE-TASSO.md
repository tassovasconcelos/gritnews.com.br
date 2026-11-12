# CIP PRO 360° | Performance CIP · Tasso
## Escopo implementado na branch `feat/cip-indicadores-performance-tasso`

**Empresas:** Shopping Prohospital e Distribuidora Prohospital, com segregação na origem e na leitura.
**Rota:** `performance`, disponível a `superadm`, `diretoria` e `gestor` com empresas autorizadas. Os dois primeiros registram; o último consulta.
**Propósito:** medir a geração incremental de valor por meio do CIP, sem remunerar o nível pré-existente de faturamento, estoque, margem ou produtividade.

### 1. Placar de performance (100 pontos)
| Pilar | Peso | KPI principal |
|---|---:|---|
| Crescimento de vendas | 20 | Vendas líquidas comparáveis |
| Margem e preços | 15 | Margem de contribuição |
| Estoque e giro | 15 | Giro de estoque |
| Caderninho | 10 | Margem das vendas recuperadas |
| Radar | 5 | Ações competitivas efetivas |
| Gamificação | 5 | Equipe ativa nas atividades relevantes |
| Velocidade e produtividade | 15 | Horas líquidas poupadas |
| Agentes, automação e coordenação | 15 | Ações coordenadas com resultado validável |

Cada KPI tem **empresa + período + baseline + meta + observado + evidência + origem**. Pontuação de cada indicador: progresso incremental em direção à meta, limitado a 120% do peso. O índice completo só aparece quando **os oito indicadores** possuem valores e metas coerentes; incompletos ficam como prévia parcial, e **todos** permanecem sujeitos à validação independente.

Indicadores auxiliares: tempo para decisão, tempo por processo, percentual de automação, entregas por hora, retrabalho, despesa de pessoal evitada, estoque imobilizado.

### 2. Produtividade, velocidade e custo
Registrar por empresa e processo:
- Minutos por execução antes e depois, mantendo tipo e complexidade comparáveis.
- Volume mensal de execuções.
- Horas adicionais de revisão humana e retrabalho.
- Horas produtivas mensais por pessoa (parâmetro de estimativa, padrão 160).
- Custo-hora de referência e evidência.

Cálculos:
- **Horas brutas liberadas** = (minutos antes - minutos depois) × execuções / 60.
- **Horas líquidas liberadas** = horas brutas - supervisão adicional - retrabalho adicional.
- **FTE equivalente** = horas líquidas / horas produtivas por pessoa. Pode ser negativo.
- **Valor indicativo da capacidade** = horas líquidas × custo-hora. **Não** é economia financeira reconhecida e não entra automaticamente na bonificação.

Contabilizar **despesa reduzida** ou **contratação evitada** somente mediante evento financeiro específico, com evidência e revisão da Controladoria e Diretoria. Pessoas realocadas não são tratadas como empregados eliminados.

### 3. Inteligência, ações coordenadas e automação
Registrar por agente/missão: análises, recomendações, ações executadas, ações com resultado verificável, tarefas elegíveis, tarefas automáticas, tempo decisório antes/depois e evidência.
- Efetividade = ações eficazes / ações executadas.
- Automação = tarefas executadas automaticamente / tarefas elegíveis.
- Tempo decisório é ponderado pelo volume de análises com medição válida.
- Registros manuais não provam runtime de IA autônomo.

### 4. Livro de benefícios financeiros incrementais
Tipos aceitos: margem incremental, despesa efetivamente reduzida, custo financeiro evitado, contratação comprovadamente evitada ou outro benefício validável. Não registrar faturamento total nem principal de estoque liberado como ganho.
- **Chave de origem globalmente única** (por exemplo, `ERP:PEDIDO:12345`) impede a duplicação da mesma origem entre as empresas.
- **Benefício líquido do evento** = ganho incremental bruto - custo incremental - estornos/devoluções.
- Eventos são **append-only**, com trilha `cip_audit`. Correções devem ser registradas por reversões identificáveis, sem apagamento do histórico.
- **Dois pareceres positivos independentes**, `controladoria` e `diretoria`, de **pessoas distintas** e que não sejam autoras do evento, são necessários para entrar em benefício validado.
- Pareceres dependem de designação explícita em `cip_perf_reviewers`. A tabela de designação é **sem escrita pelo frontend**, para impedir autodesignação. Atualmente nenhum revisor foi designado: valores ficam pendentes.
- Parecer rejeitado exclui o evento.
- A referência de remuneração de **6%** é apenas uma **simulação ilustrativa**, multiplicada pelo fator do score de 100 pontos, sujeita a contrato, revisão, retenções e aprovação. **Nenhuma instrução de pagamento é implementada**.

### 5. Dados e segurança
Banco Supabase GRIT (mesmo provedor de autenticação já homologado para CIP); tabelas com prefixo `cip_perf_`, RLS, permissão por empresa, autor e perfil, auditoria em escritas. Nenhum acesso anônimo e nenhum token de serviço no navegador.

No momento, as medições desta tela são **registros manuais com fonte declarada**. Não se afirma que vendas, CMV, folha, eventos ou agentes já estejam automaticamente instrumentados ou conciliados ao Procfit.

### 6. Arquivos e implantação
- `schema/performance-tasso-v1.sql` — banco/RLS/catalogação e duas aprovações independentes.
- `performance-engine.mjs` — motor puro de pontuação, produtividade, automação, efetividade, benefícios e bônus ilustrativo.
- `performance-engine.test.mjs` — testes de cálculos e de regras de aprovação.
- `performance-ui.mjs` e `performance.css` — cockpit responsivo e lançamentos.
- `navigation-data.mjs`, `index.html`, `cip-auth.js` — rota autorizada.
- `release-check.mjs`, `release-check.test.mjs`, `sw.js` e workflow CIP — assets versionados, atualização PWA e testes CI.

### 7. Critérios de homologação
1. Acesso `anon` ou usuário de outra empresa deve ser negado.
2. `superadm` vê apenas as duas empresas do escopo CIP; gestor só a(s) autorizada(s).
3. KPI sem meta incremental válida não gera pontuação.
4. Ausência de medições mostra **—**, nunca ganho presumido.
5. Horas liberadas, FTE e valor de hora-homem não entram automaticamente como lucro.
6. Sem nomeação de revisores, o ganho financeiro fica pendente e nenhum pagamento é inferido.
7. Mesmo revisor não pode aprovar como Controladoria e Diretoria e o autor não pode aprovar o próprio evento.
8. Sem fonte de ERP, não usar rótulo `validado` ou `economia realizada` em KPI operacional.
9. Todas as inserções e atualizações possuem trilha no `cip_audit`.
10. Navegação, formulários, carga por empresa e período, CSS mobile, hash de release e testes HTTP precisam ser homologados antes da publicação.

### 8. Próximas integrações para automação verdadeira
- **Procfit:** faturamento líquido, margens/CMV, giro por filial, cotações, pedidos, perdas e devoluções; usar vínculo documento de origem.
- **Marca-passo/Faro:** eventos de decisão de preço aprovados, valor de margem incremental atribuível por SKU.
- **Caderninho:** oportunidade → proposta → pedido → NF → margem rastreada, sem duplicação com outras vendas.
- **Agentes/Doquita:** log de análise, timestamp de alerta, decisão, execução, revisão e eficácia por ação.
- **Gestão de equipe:** elegíveis, acesso, tarefas e evolução de gamificação, respeitando LGPD e regras de trabalho.
- **Controladoria:** custo evitado, contratação evitada, custos operacionais e reversões com integração financeira confiável.
- **Governança:** formalizar responsáveis de Controladoria e Diretoria para validação, metas do período e contrato de remuneração.
