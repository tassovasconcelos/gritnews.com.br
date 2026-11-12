# Faro especial: seleção assistida e pesquisa contínua

> Evolução de volume em 28/10/2026: as regras atuais são descritas em `FARO-COBERTURA-MIX.md` (1.000 SKUs distintos/dia, até 48 verificações/hora, uma chamada/tarefa e revisita especial de quatro horas). Os parâmetros de volume abaixo documentam a implantação anterior.

Na operação do Radar, a diretoria pode adicionar até dez produtos do portfólio ativo da empresa ao Faro especial, definir um objetivo e escolher busca exata ou ciclo expandido. A lista permanece visível fora dos filtros e da paginação do portfólio; mostra tarefas concluídas, registros de ofertas, evidências recentes, vendedor, marca, preço candidato, data, correspondência e pendências. O histórico completo continua no radar do SKU. Retirar não apaga coletas ou decisões.

A seleção inicial usa o portfólio com fonte identificada já disponível. Não cria catálogo ou curva ABC para a Distribuidora. Se a origem retirar um produto da base ativa, ele permanece identificado como pendente na seleção e não recebe novas tarefas até voltar à base. O limite dez inclui pendentes; a diretoria pode retirá-los.

## Execução dentro do orçamento existente

Não há cron novo, chamada paga ao salvar nem execução extraordinária de teste. O cron horário mantém até 24 tarefas/hora, 576/dia, duas chamadas web e 3.200 tokens de saída por tarefa; o worker existente continua com duas tarefas a cada cinco minutos. Limites e habilitação não são alterados pela migração.

A seleção conserva primeiro até quatro recorrentes prioritários conforme a configuração existente. Os especiais ativos recebem as próximas vagas; a união não duplica produtos. O restante fica em rodízio geral. Com quatro recorrentes distintos dos dez especiais, sobram dez vagas gerais em um lote de 24; se houver sobreposição, sobram mais. Configuração menor, pausa, circuito, quota diária ou fila atrasada podem impedir todos os especiais de concluir na hora. A UI distingue seleção de execução real e não promete cobertura integral.

Especiais são classificados com prioridade 110 para preservar pesquisa em múltiplos domínios autorizados, sem substituir a busca por um único alvo regional. Desde a evolução de autonomia, uma vaga geral por janela e as fases de aprofundamento dos especiais expandidos podem explorar novos domínios públicos. Os limites permanecem os mesmos. Referências regionais e de marcas continuam no rodízio geral existente.

O ciclo expandido alterna por janela horária: produto exato, aprofundamento e semelhantes. A fase segue a janela original da tarefa, mesmo se executada depois. Busca exata não pede alternativas. Todas as variantes conservam qualificação determinística e revisão humana; nenhuma modifica preços, referências aprovadas ou cadastro mestre.

## Memória verificável

Cada consulta reaproveita até 12 URLs recentes de ofertas não rejeitadas do SKU e da empresa, além de até três registros de tratamento de sinais. Objetivo, fase, versão e observações ficam registrados no contexto da execução. Seleções e mudanças geram eventos com versão e motivo. Evidências são mantidas nas tabelas existentes de execuções/ofertas/sinais. O painel oferece balanço móvel de 24 horas; não cria rotina diária adicional.

Aprendizado significa reaproveitar fatos e correções registrados, com nova conferência pública. Não há treinamento automático do modelo nem promoção automática de uma observação humana a fato. Fonte antiga, resultado vazio, marca não confirmada e condição não comparável continuam explícitos. Capital de estoque e ABC antigos não demonstram giro atual.

## Validação

Testes de worker/model request sem rede paga: fase e objetivo, limite de duas chamadas, não envio de custos/preços internos e persistência do contexto. SQL em transação revertida: teto dez, troca e retirada, versão vencida, escopo por empresa, bloqueio anônimo e sem autorização, lote de 24 sem duplicação, idempotência horária, duas tarefas por claim e duas chamadas reservadas por tarefa, modo coerente e seleção visível. Nenhum teste dispara pesquisa real.
