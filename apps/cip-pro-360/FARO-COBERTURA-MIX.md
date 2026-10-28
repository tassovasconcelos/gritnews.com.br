# Faro: 1.000 SKUs distintos/dia e cobertura do mix

Base medida na implantação: Shopping Prohospital, 5.421 SKUs distintos (5.420 com saldo positivo), posição de 19/10/2026. A curva A declarada abrange 866 SKUs com saldo positivo. O portfólio automático passa a incluir o mix completo dessa fonte, sem fabricar curva ABC ou giro atual. A loja representativa de cada SKU não representa uma comparação de preço de todas as lojas. A Distribuidora permanece desabilitada, sem ativação presumida.

## Capacidade e custo

A fila existente programa até 48 verificações/hora e 1.152/dia. O worker existente pode assumir quatro tarefas a cada cinco minutos. Cada nova tarefa reserva no máximo uma chamada web e 1.600 tokens de saída; a pesquisa solicita até duas ofertas. O teto de chamadas web mantém-se em 1.152/dia, equivalente ao teto anterior de 576 tarefas × duas chamadas. Reservas legadas de duas chamadas também entram na contagem durante a transição. A reserva é conservadora: coleta direta reserva uma chamada, mas registra zero chamadas usadas.

O número de requisições ao modelo pode crescer, portanto isso não garante custo financeiro idêntico. Tokens de entrada/saída e chamadas realmente retornadas continuam registrados. Não há orçamento fixo em reais, plano gratuito presumido ou promessa de que toda página permita leitura direta. Pesquisas manuais continuam separadas e exigem autorização explícita na tela.

## Seleção e redundância

A meta é programar mil SKUs distintos no dia de Brasília. O planejador evita repetir um produto no lote geral do mesmo dia e avança primeiro nos menos recentemente programados. Os quatro recorrentes são selecionados priorizando a curva A declarada, prioridade manual e capital observado; não é ranking atual de vendas. Os dez especiais podem ser escolhidos em todo o portfólio disponível e têm revisita de quatro em quatro horas. Se um especial já estiver no grupo horário, a união não duplica a tarefa na mesma janela.

Revisitas consomem capacidade e não são contadas novamente como SKU distinto. Os padrões de 48/h, 4 prioritários e até 10 especiais cabem na meta de 1.000/dia em um dia completo bem-sucedido. Reduzir a capacidade ou elevar o grupo recorrente pode impedir a meta; o painel mostra aviso, sem elevar limites por conta própria.

A cadência adicional de especiais pode dar evidências de vendedores distintos, mas não garante fontes independentes em cada rodada. A descoberta de novos concorrentes permanece dentro das vagas gerais e da fase de aprofundamento dos especiais. Sem correspondência e condições comparáveis, não se gera conclusão de diferença de preço.

## Coleta híbrida

Antes da IA, o executor pode reconsultar uma URL de anúncio aprovada nos últimos sete dias. A primeira implementação usa dados estruturados públicos de produto/oferta (JSON-LD), apenas em seis domínios permitidos de lojas médicas. Não inclui coleta direta de marketplaces, áreas autenticadas ou listas/catálogos genéricos.

O conector exige robots.txt acessível e permissivo, HTTPS sem credenciais/portas, sem redirecionamento, um produto e uma oferta inequivocamente identificados, BRL, preço numérico e identidade compatível com o produto e a referência aprovada. Não segue URLs arbitrárias sugeridas pelo modelo. Limita-se a uma página por domínio por janela de cinco minutos, com resposta limitada a 1 MB e robots renovado em até uma hora. Captcha, bloqueio, divergência, várias variantes ou informação insuficiente levam ao caminho de pesquisa já reservado, sem chamada extra além do teto.

Cada sucesso direto guarda URL, vendedor previamente conferido, campos estruturados, coleta e hash do conteúdo, com `search_calls=0` e `collection=direct_structured`. Frete e embalagem atuais não são herdados automaticamente da revisão anterior: permanecem pendentes. A coleta é nova candidata, não atualização automática da referência aprovada nem de preço no ERP.

## Cobertura verdadeira

O painel distingue: SKUs programados, SKUs com tarefa concluída, revisitas, rechecagens diretas sem IA, SKUs com preço candidato sem bloqueio básico e SKUs sem qualquer oferta. Uma tarefa concluída sem ofertas não comprova preço monitorado. Registro de oferta não é homologação. A meta diária não significa que mil produtos já tenham evidência de preço no primeiro dia.

Na medição inicial, só 41 SKUs tinham algum registro de oferta, vários incompletos ou em marketplaces. Expandir fontes verificáveis é parte do trabalho contínuo. É necessário acompanhar a cobertura efetiva; falhas, circuitos, pausas, limites, revisão de fontes e indisponibilidade podem ampliar o prazo. No dia da transição, chamadas já consumidas reduzem a capacidade restante. A estimativa de seis dias usa dias completos e cumprimento da meta, não é garantia de coleta integral.

Nenhum cron novo é criado. Não se executa busca paga de teste ou para preencher artificialmente indicadores. Custos/preços da base de 19/10 precisam de conciliação antes de decisões financeiras. Abrir evidências e simular markup usam dados existentes, sem iniciar pesquisa paga.

## Verificação

SQL em rollback simula seis dias completos para 5.421 SKUs, confirma exatamente mil distintos por dia, limite de 48 tarefas/janela, até 1.152 verificações/dia, idempotência horária, cobertura do mix no sexto dia, quatro claims com reserva de uma chamada cada e isolamento de execução do planejador.

Testes do coletor direto usam respostas sintéticas, sem rede externa. Cobrem robots, identidade/variante, produto/oferta únicos, moeda, domínio privado, redirecionamento proibido, limite de requisições por domínio e hash. Testes do worker confirmam quatro tarefas de uma chamada/1.600 tokens e zero chamadas ao modelo quando a coleta direta funciona.
