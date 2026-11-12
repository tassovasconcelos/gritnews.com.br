# CIP 360° — mapa do PWA e modelo de dados

**Decisão de produto proposta:** evoluir o CIP existente em HTML/CSS/JavaScript, preservando Hostinger, Supabase, rotas atuais, dois escopos empresariais e as integrações exclusivamente no servidor. Não criar uma segunda aplicação. Esta página descreve o desenho-alvo e identifica o que já existe e o que depende de dados ou implementação.

## Mapa de telas

**Contexto fixo:** empresa (Shopping / Distribuidora / Grupo autorizado), período e estado dos dados. No celular, cinco destinos principais: **Início Doquita · Aprovações · Marca-passo · Estoque · Mais**. “Mais” reúne Visão B2B, Cotações, Caderninho, Radar Íris, Processos vivos, Escola, Quartel, Procfit & relatórios e configurações, respeitando perfil e empresa. No desktop, o menu lateral atual pode manter todos os módulos.

| Destino | O que merece atenção → evidência → próximo passo |
|---|---|
| Início / Doquita | Até três achados executivos, fonte/data/estado e até cinco alertas por valor; pergunta por texto/voz encaminhada ao serviço protegido. |
| Aprovações | Fila da alçada por impacto e prazo; origem, piso, comparação, efeito econômico e motivo; aprovar, ajustar ou recusar com trilha. |
| Marca-passo | Fila GIRO / CAIXA / ATAQUE / MARGEM / MANTER; mapa de preço/piso; concorrência homologada; simulador de alternativas. |
| Estoque | Ranking por loja/filial e SKU, ruptura, excedente, lotes e redistribuição; detalhe abre evidências e elegibilidade. |
| Mais | Jornadas B2B/B2C/B2G e operação, sempre abertas conforme papel, empresa e fonte disponível. |

**Caixa única de detalhes:** qualquer alerta, SKU, ação ou cartão mostra empresa/unidade, origem, data-base e selo REALIZADO / PROVISÓRIO / SIMULADO; valores de estoque, CMV, cobertura, capital elegível e custo mensal/acumulado; onde há sobra e demanda; histórico de propostas e resultado; evidências e ações permitidas ao perfil. Dados ausentes mostram o campo necessário e o responsável pela liberação.

## Modelo de dados

**Entidades existentes a reutilizar:** `cip_stock_intelligence_batches` e `cip_stock_intelligence_rows` guardam cargas e linhas por empresa; `cip_stock_actions` e `cip_stock_action_events` guardam propostas, transições, autoria, aprovação e acompanhamento; `cip_shopping_stock_batches` e `cip_shopping_stock_rows` guardam a posição Shopping; `cip_price_decision_log` guarda análises de preço. O vínculo de empresa/RLS e as RPCs de transição continuam sendo a autoridade de acesso e aprovação.

**Contrato lógico do app (origem única demo | Supabase):**

- `SourceBatch`: empresa, escopo de filial, origem, hash, capturada_em, data_base, janela inicial/final, cobertura, estado de conciliação.
- `Product`: SKU, descrição, marca, grupo, unidade, categoria e identificadores Procfit.
- `InventoryPosition`: empresa, filial, SKU, lote/validade quando confiáveis, quantidade disponível/reservada, custo, preço, origem e data-base.
- `SalesWindow`: empresa, filial/canal, SKU, unidades, receita líquida, CMV, última venda verificada, janela e completude.
- `PriceEvidence`: SKU/unidade equivalentes, preço, concorrente público, URL/fonte, captura, condição e grau de equivalência.
- `Action`: tipo/modo, SKU/filial/canal, evidências, cálculo versionado, limite físico, estado, responsável, alçada, prazo e resultado medido.
- `ActionEvent`: ação, ator, instante, estado anterior/novo, motivo, evidência e decisão de alçada; append-only.
- `PolicyVersion`: taxa de carregamento, cobertura-alvo, dias para classificação, margem/piso, pesos do rating e matriz de alçadas, com vigência, aprovador e justificativa.
- `IdleExposureSnapshot` *(necessidade proposta, ainda não implementada)*: SKU/filial, capital elegível, critério que o tornou parado, início observado, fonte/hash, taxa e versão da política. Alimenta perda acumulada sem retroagir antes da primeira evidência confiável.

**Cálculo financeiro:** funções determinísticas versionadas calculam cobertura somente com CMV diário válido e base compatível. Capital parado por SKU/filial é o maior entre custo dos itens sem venda verificada pelo prazo aprovado e excedente sobre CMV diário × cobertura-alvo; as parcelas não se somam. A taxa confirmada é 1,5% ao mês. Perda mensal = capital elegível × taxa; perda acumulada exige histórico de elegibilidade. Piso, contribuição e compensação não são calculados pela IA. Ausência de fonte não equivale a zero; simulação não vira realizado.

## Premissas e ponto que muda o desenho

A primeira entrega é incremental, com os módulos reais já existentes; Shopping e Distribuidora permanecem isoladas, sem escrita automática no Procfit. A demo é determinística e claramente identificada, sem nomes reais. No celular, “Mais” reduz a navegação a cinco destinos sem remover acesso por papel; no desktop, o menu existente segue amplo. O PWA poderá armazenar somente o shell; sem rede, mostrará apenas snapshot em memória com horário e aviso.

**Data inicial confirmada pelo usuário:** usar o primeiro histórico confiável de vendas que comprova a parada. Só calcular retroativamente quando a janela for completa e a origem validada; sem histórico suficiente, iniciar o acumulado na primeira carga conciliada que identifica o SKU como elegível e rotular como “acumulado observado no CIP”. A data de recebimento/idade do lote continua separada da ausência de venda.

**Primeiro bloco desenvolvido:** manifest instalável, ícones Android/iOS, service worker com allowlist estática sem respostas comerciais, aviso de conexão e barra móvel com cinco posições filtradas pelas permissões de rota. Ver `PWA.md`. A página é incremental; ainda não implementa troca global empresa/período, perda mensal/acumulada em cada detalhe ou demonstração determinística.

**Não presumir disponibilidade:** janela confiável de vendas/CMV, reservas, custo e despesas por canal, equivalência de concorrente, identidade por filial, prazos logísticos e pesos/alçadas aprovados. A tela deve informar o dado, a fonte e o dono que faltam.
