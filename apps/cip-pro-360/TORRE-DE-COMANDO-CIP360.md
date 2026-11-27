# CIP360 — Torre de Comando Prohospital | Escopo operacional da versão 1

## Objetivo e referência visual
O ambiente foi desenhado tomando como referência a imagem de Torre de Comando fornecida pelo usuário. A identidade oficial é aplicada por **arquivo de marca original** em `logo-grupo-prohospital.jpg` (SHA Git `4832b8d26b6c6567793b81a23dbfb82ff9f9071e`, idêntico ao arquivo da conversa). A sala gráfica `command-room.svg` representa pessoas/agentes trabalhando, sem se fazer passar por operação autônoma. O portal usa o nome **CIP360**.

**Empresas exibidas:** exclusivamente Shopping Prohospital e Distribuidora Prohospital. Não incluir Procirúrgica, Icleanpro ou outras empresas nesta versão.

## Funcionalidades entregues no código
1. Nova solução `torre` no catálogo e rota protegida pela sessão Supabase, com entrada pelo portal.
2. Sala visual responsiva com 12 agentes clicáveis e painel lateral para responsabilidades, origem de dados, atividades e acesso ao módulo real.
3. Seletor de empresa com fontes e tarefas limitadas ao perfil autorizado.
4. Dados consultados com RLS em tabelas existentes: `cip_stock_actions`, `cip_market_offers`, `cip_faro_signals`, `cip_market_directory`, `cip_mp_price_plans`, `cip_mp_campaign_proposals`, `cip_demands`, `cip_quotes`, `cip_agent_missions`. Falhas/ausência retornam **—**, não números fictícios.
5. Alertas de origem existentes: planos/análises de estoque e ofertas candidatas (nunca preços homologados sem validação).
6. Nova tabela `cip_tower_tasks`: abrir ações por agente, responsável, prioridade, status, evidência e histórico; gravação auditada e bloqueada por RLS empresa/perfil.
7. Alteração de andamento das tarefas; a conclusão exige evidência humana de pelo menos dez caracteres. O sistema não altera estoque/preço/ERP por isso.
8. Exportação CSV por agente e empresa, com proteção contra fórmulas no Excel e sem misturar dados da outra empresa.
9. Dados operacionais sem fonte real não são apresentados como margem, lucro, vendas ou bonificação.
10. Assets incluídos no manifest de release e no cache opcional da PWA, sem aumentar a carga crítica do login.

## Funções dos 12 agentes
| Agente | Função principal | Módulo relacionado |
|---|---|---|
| Doquita 360 | Priorização, explicação e coordenação de tarefas | Doquita |
| Marca-passo | Custos, margens e propostas de preço com aprovação | Marca-passo |
| Radar Digital | Concorrência e ofertas candidatas por SKU/fonte | Radar B2B2C |
| Radar Físico | Mapa territorial de concorrentes e fontes | Concorrentes |
| Estoque Inteligente | Giro, cobertura, ruptura e capital | Estoque |
| Compras | Reposição e fornecedores | Estoque |
| Transferências | Redistribuição de excesso/ruptura entre lojas | Estoque |
| Produtos | SKU/EAN, cadastro e similaridade | Estoque/Catálogo |
| Campanhas | Promoções e cenários de contribuição | Marca-passo |
| Caderninho | Procura não atendida e recuperação de vendas | Caderninho |
| Vendas & CRM | Cotações e relacionamento B2B | Cotações |
| Gamificação | Missões, ranking e qualidade da execução | Quartel |

## Dados de mercado e preços
Comparação de concorrentes, localização e preço dinâmico só pode ser classificada como **homologada** se houver fonte rastreável, timestamp, identificação e compatibilidade comercial do produto, unidade de medida, frete, condição promocional e disponibilidade. A versão inicial da Torre mostra ofertas **candidatas** e encaminha ao motor Marca-passo existente, sem publicar alteração de preço.

## Requisitos do próximo ciclo
- Vincular a planilha ABC/ERP por SKU, EAN, categoria, giro, estoque e loja com reconciliação.
- Configurar políticas de piso de margem por curva A/B/C e família, com alçadas por empresa/canal.
- Incorporar custo atualizado, tributos, comissão, frete, preço e estoque em fonte comum e testar cálculo item a item.
- Construir rotina de pesquisa territorial por cidade, bairro/raio e canais digitais permitidos; registrar fonte e política de coleta.
- Usar apenas integrações oficiais acessíveis e permitidas com marketplaces; não afirmar automação de consulta sem job monitorado.
- Telemetria de agentes: ciclos reais, status, evidência, execução e desempenho mensurável, distinta de representação visual.
- Relatórios exportáveis com linhas de origem, filtros por período/loja e pareceres antes de reconhecimento de ganhos.
- Homologar perfis reais, mobile, permissões, concorrência de atualização e operação em Hostinger.

## Referência ABC recebida e conferida
O arquivo `ABC produtos.xlsx` (SHA-256 `c0964b6ba423b229c81b129b8d527da047fa56243e29b78d6c49a3d69d8f5c58`) contém **6.514 produtos com código individual sem duplicidade**:
- Curva A: 3.545 itens; colunas originais `LUCRO=3`, `DESPESA=17`, `COMISSAO=2`.
- Curva B: 1.803 itens; `LUCRO=5`, `DESPESA=17`, `COMISSAO=2`.
- Curva C: 1.166 itens; `LUCRO=9`, `DESPESA=17`, `COMISSAO=3`.

Esses nomes de coluna e números são preservados **sem reinterpretar automaticamente LUCRO como piso de margem**; o significado econômico, a empresa de origem e a vigência da planilha requerem homologação. O cockpit exibe somente a referência agregada, sem importar automaticamente regras para o ERP, sem tabelar preço ou calcular resultado financeiro como realizado. Para seguir, realizar conciliação de códigos com o cadastro Procfit, fonte de custo/tributo e alçadas comerciais.

## Segurança e publicação
A migração `cip360_torre_de_comando_v1` foi aplicada ao projeto Supabase do CIP. A tabela está isolada por empresa, sem acesso anônimo; escrita depende da função `cip_can_access(company_id,true)`. Registros criados e alterados são auditados por `cip_track_change`. O login principal mantém `gritsolucoes@gmail.com` como superadm no provedor existente — sem repetir senhas.

A publicação de produção depende de teste de PR, homologação de login e autorização de deploy com destino Hostinger isolado e HTTPS válido. **Não usar imagem demonstrativa com números inventados como painel operacional.** Não confundir merge no GitHub com deploy bem-sucedido.

## Critérios de aceite
- [ ] Validar em navegador real o acesso de superadm e dos perfis Shopping/Distribuidora.
- [ ] Navegar por todos os 12 agentes; cada botão abre o módulo permitido ou recusa acesso.
- [ ] Alterar empresa e confirmar que tarefas/contagens não vazam para a outra operação.
- [ ] Criar tarefa e registrar uma atualização com trilha, mas sem executar ERP.
- [ ] Conclusão sem evidência deve ser recusada no servidor.
- [ ] CSV correto e escopado; injeção de fórmula neutralizada.
- [ ] Verificar responsividade com viewport celular/tablet/desktop.
- [ ] Conferir fontes parciais e dados ausentes, sem KPIs fabricados.
- [ ] Executar CI e preparar pacote de publicação versionado.
- [ ] Publicar após testes e verificar URL com HTTP 200/SSL/login, registrando evidência.

## Evolução operacional — marca-passo, curva ABC, cenários e vida nos agentes (27/11/2026)

A nova área é integrada à rota protegida **Torre de Comando CIP360** e aos módulos comerciais existentes. Foram adicionados:

1. **Visual da central** com operadores SVG animados, microinterações dos 12 especialistas, respeito ao modo de movimento reduzido, marca original preservada, fluxo executivo detectar → simular → coordenar → medir.
2. **Mesa de margem por SKU** diretamente na Torre: busca no estoque existente por código/descrição, filtro por categoria/curva, recuperação por lote importado quando o item não está na posição de estoque, visualização de saldo, custo, preço, loja e data da fonte.
3. **Ingestão ABC segura** dos 6.514 SKUs do arquivo anexo (A=3.545, B=1.803, C=1.166). A importação CSV em lote utiliza SHA-256, progresso, validação de cabeçalhos/duplicidade, RLS por empresa, auditoria e autorização de escrita. Lote incompleto ou com distribuição inesperada é bloqueado no servidor. O arquivo completo não foi commitado no GitHub (dados comerciais privados) e ainda deve ser importado por usuário autorizado para o destino correto.
4. **Quatro cenários financeiros**: proteção de margem, competitivo (somente com referência equivalente, HTTPS, ativa, disponível e recente), promoção controlada e campanha de giro; cálculo de contribuição unitária, piso de margem hipotético, preço alvo, diferença de preço, volumes, custos e ponto de equilíbrio. Não existem promessas de vendas incrementais: os resultados totais exigem volumes informados.
5. **Radar digital por SKU**: consulta às ofertas candidatas existentes em `cip_market_offers` com data, preço quando publicado, vendedor, classe de similaridade e link externo de evidência; não converte candidatos em referências homologadas automaticamente.
6. **Cenários versionados e auditáveis** no `cip_tower_price_scenarios` com estado fixo `simulacao`; o botão encaminhar cria tarefa humana em `cip_tower_tasks` em vez de alterar ERP/PDV/canal.
7. **Contexto real dos especialistas**: a Torre consulta o último ciclo de `cip_agent_cycles` e exibe a análise original, horário e sinalização de fonte histórica/stale. Os contadores são reconsultados a cada 90 segundos enquanto a aba estiver visível. Isso **não** equivale a uma coleta de concorrentes a cada 90 segundos, nem à execução de tarefas.
8. **Interface responsiva** e representação visual de direção executiva, com uma demonstração offline separada no chat; módulos do CIP requerem login existente e permissões de cada empresa.

### Premissas e bloqueios de preço
- A planilha contém as colunas `LUCRO`, `DESPESA`, `COMISSAO` sem notas explicativas; o usuário pode utilizá-las **somente como hipótese explícita** e deve submetê-las à homologação financeira antes de automatizar políticas de preço.
- O estoque Shopping utilizado na busca tem data de 19/10/2026, com 28.187 registros de origem; não é custo/preço atual em 27/11. Para B2B, cenários manuais são possíveis até a reconciliação de custo e preço.
- Referências candidatas do Mercado Livre, outros sites e marketplaces não podem ser tomadas como produto idêntico nem estoque confirmado. Frete, impostos, pack/unit, localização, horário e validade devem compor a revisão.
- A economia e a bonificação de Tasso não são geradas por cenários; só benefícios líquidos aprovados pela Controladoria e Diretoria serão elegíveis, sob regras contratuais.
- As integrações automáticas com Procfit/PDV/marketplaces continuam independentes e **não homologadas** para escrita/publicação de preços. O comportamento corrente é simular e encaminhar.

### Migrações adicionais aplicadas
- `cip360_abc_precificacao_interativa_v1`: `cip_abc_import_batches`, `cip_abc_products`, `cip_tower_price_scenarios` com políticas RLS e auditoria, e RPC `cip_abc_finish_import`.
- `cip360_torre_abc_batch_integrity_v1`: bloqueio servidor de lotes incompletos, identidade entre lote e empresa e restrição de referência em cenários, além de evidência de conclusão de tarefas.

### Homologação adicional pendente
- [x] Inspeção da ABC e validação de totais/campos por curva.
- [x] Teste SQL revertido: impedir lote ABC pronto sem itens; permitir finalização após carga de contagem correta e checar isolamento do usuário não autorizado.
- [x] Testes de engine/importação/simulador na esteira automatizada; verificar o último workflow do PR para confirmação.
- [x] Demonstração offline testada em Chromium desktop e celular (navegação, busca, fórmula de preços, campanha e registro de tarefa simulada), sem erros JavaScript e sem overflow horizontal.
- [ ] Homologação real no navegador dos formulários e importação no CIP autenticado, com usuário Shopping e Distribuidora.
- [ ] Confirmar origem da planilha ABC (empresa e vigência), importar 6.514 itens por empresa correta, conferir por SKU e reconciliar com Procfit.
- [ ] Validar política por curva/categoria, despesas, comissões, promoções e alçadas com a Controladoria.
- [ ] Homologar integrações externas e agendamento de agentes com logs de execução verificáveis.
- [ ] Aprovar PR, integrar na branch protegida `cip/main`, configurar/revisar Hostinger e executar deploy isolado com smoke test HTTP/SSL/login.
