# Estoque: análise e ações supervisionadas

Fase atual: alertas e propostas calculados por regras na importação. Não há execução autônoma, atualização recorrente da planilha, envio de campanhas, movimentação de estoque ou alteração de preços no ERP. Conhecimento persistente são as fontes privadas e os eventos auditáveis; não é treinamento do modelo OpenAI. Quartel, agentes, Escola e integrações anteriores permanecem com seus limites.

## Fontes e separação

Shopping: o piloto de24/09 contém posição, giro, venda histórica sem datas e compras pendentes sem ETA. O saldo de19/10 continua sendo a autoridade da posição atual. Giro duplicado e datas futuras ficam em conferência. Demanda diária com período não confirmado pode formar cenário, nunca cobertura observada atual. Quantidades históricas negativas são preservadas separadamente de positivas; não inferir faturamento ou mês de venda. Não somar posições de datas diferentes. Ausência na carga atual não é saldo zero. A comparação usa chaves SKU/unidade organizacional; mudanças de embalagem exigem conferência.

Distribuidora B2B: fonte própria por linha de lote/validade, C.Estoque1000. Não é CD100 da Shopping. Sem unidade de fornecimento, preços, reservas e histórico de vendas B2B; não calcular giro ou margem realizada. Usar Custo Médio Total como valor declarado da fonte; valores com impostos e última compra permanecem distintos, com lacunas/divergências. Validade ausente ou sentinela é pendência, não validade indefinida confirmada. Identificador de lote numérico sem precisão segura exige confirmação do código original na origem; não reconstruir dígitos ou tratar notação científica como identidade confiável. Vencidos não entram como candidatos comerciais; itens com indicação de prescrição/medicamentos/bloqueio/controle vão para conferência técnica quando próximos da validade.

Fontes originais, extrações e importador específico desta carga permanecem em ../evidencias, fora do Git e pacote estático. Tabelas privadas armazenam métricas, referências de linha, metadados, regras e propostas. Não carregam a folha de vendas sem datas como vendas atuais. Hash e linha permitem voltar ao original; os vetores normalizados não substituem o XLSX original como evidência.

## Política piloto

Parâmetros para revisão, não aprovados como política permanente: risco de cenário até14dias; destino30; doador preserva60; excesso acima de90; alerta de validade até90dias. Redistribuições entre lojas da mesma empresa exigem SKU, descrição e unidade iguais, fonte histórica única, demanda positiva e parâmetros coerentes. Não tratam demanda zero/ausente como saldo livre. CD100 não é doador automático. Propostas compartilham um orçamento do saldo doador, evitando alocação repetida. Limites do destino respeitam máximo da origem quando informado. Campanhas preservam mínimo/segurança, reserva do cenário e quantidades já propostas para transferência; itens A não geram promoção por esta regra.

Ausência de saldo atual com demanda histórica positiva gera conferência, não uma ordem por ruptura. Duplicidades e datas inválidas também geram conferência. Propostas de campanha são ideias de revisão de oferta, exposição e preço; não são públicos, textos, descontos ou contatos aprovados. Sem calendário de campanhas ou destinatários inscritos automaticamente.

## Aprovação e acompanhamento

sugerida → aprovada → em_acompanhamento → concluida; rejeição possível antes de concluir. Diretoria/superadm ativos com acesso à empresa podem registrar decisões. Fonte/versão são verificadas no servidor; sem DML direto do cliente. Eventos guardam autoria, horário, estados e justificativa. Não é autorização técnica de execução no ERP.

Aprovação comercial exige fonte atual (no máximo dia anterior), versão atual da análise, responsável, prazo, quantidade dentro do teto e conferências de saldo, reservas/pedidos, embalagem/lote/validade/elegibilidade, demanda, margem/frete e operação. Conferência administrativa exige saldo, identificação/lote e responsável; pode servir justamente para corrigir fonte antiga. Fontes antigas não recebem nova aprovação comercial; planos já aprovados podem ser acompanhados e encerrados com evidências. Fila mantém planos abertos e histórico encerrado nas cargas seguintes; propostas antigas não aprovadas não são tratadas como fila nova.

Campanha/preço exigem também premissas numéricas registradas. Servidor recalcula piso de contribuição a centavos, contribuição/unidade e variação. Custo não fica abaixo do declarado na origem; se há preço vigente na origem ele é o denominador da alçada. Mudança da origem exige atualização. Prazo não ultrapassa validade conhecida. Aprovação é negada abaixo do piso ou fora da variação declarada pelo diretor. Isso protege o plano conforme premissas, não garante margem realizada com dados incompletos.

Conclusão exige quantidade observada e evidência. Receita, custos variáveis e caixa recebidos são relatos opcionais e não negativos nesta versão, não conciliados ao ERP; não modelam DRE/devoluções ou fluxo de caixa completo. Transferência/conferência não aceitam lançamento financeiro de ganho. Valor movimentado a custo não é caixa liberado. Resultados acumulados da empresa estão sem filtro de período. Não prometer economia, conversão ou ganho de performance sem observações comparáveis.

## Autonomia futura

Habilitar por alçada somente depois de fonte atualizada/conciliada, demanda com período, reservas, disponibilidade, embalagem, lotes/validade, tributação, frete, preço e referência concorrente validados; política formal aprovada; pilotos com resultado/evidência e tratamento de exceções; integração de escrita idempotente no ERP, monitoração e reversão. Esta entrega não liga esse modo nem aprova planos automaticamente. Os logs de resultados fornecem evidência para calibrar regras; não alteram políticas sozinhos.

## Implantação e verificação

Schema de referência: schema/stock-actions.sql para ambiente novo. Importar em loading, conferir contagens, somas monetárias e chaves contra extração independente; só então ativar. Engine compartilhado stock-action-engine.mjs; UI stock-actions-ui.mjs no Marca-passo, Estoque, Shopping, Doquita e B2B. Backend Telegram lê a nova base da Distribuidora e a pauta piloto de Shopping mantendo autorização por vínculo/empresa. RLS em todas as tabelas, privilégios mínimos e função de transição com identidade verificada, bloqueio de linha e controle de versão. Sem chaves no cliente ou dados de negócio no pacote público.
