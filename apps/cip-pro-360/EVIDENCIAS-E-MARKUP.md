# Abertura de evidências e análise de markup

Os botões do Faro abrem o SKU/loja e levam o foco à seção de evidências. Filtros anteriores de correspondência, revisão e qualidade são limpos para não ocultar as ofertas do produto. SKU/loja numéricos ou textuais são reconhecidos. Se a base não fornecer a linha, o histórico ainda é consultado e a ausência de custo fica explícita; falha de consulta não é tratada como saldo ou custo zero.

A base da loja selecionada fornece nosso preço e custo, com data e situação de atualização. Não se usa o custo de outra loja ou de outro SKU. Ofertas coletadas a partir de outra loja só admitem normalização quando a unidade do nosso produto coincide com a unidade da coleta. Sem seleção interna, a coleta original não contém custo e este permanece pendente.

## Métricas

- Preço concorrente por nossa unidade, sem frete: preço da oferta × itens na nossa unidade ÷ itens na oferta. Exige moeda, embalagem e correspondência sem bloqueio de qualidade; alternativa/rejeição não vira referência comparável.
- Diferença percentual: (nosso preço ÷ preço concorrente normalizado com frete − 1) × 100. Positivo significa nosso preço acima. Sem frete e embalagem conhecidos, a diferença fica pendente.
- Nosso markup: (nosso preço − nosso custo) ÷ nosso custo × 100.
- Markup se vendermos pelo preço concorrente: (preço concorrente por nossa unidade, sem frete − nosso custo) ÷ nosso custo × 100. É cenário sobre custo observado, não margem líquida ou recomendação automática.
- Simulação: preço hipotético editável, markup, fator de multiplicação e margem bruta matemática. Esta margem exclui impostos, comissões, frete próprio e despesas. Não é o resultado realizado.

A ação “Simular preço e markup” não muda cadastro nem preço. “Conferir evidência e registrar decisão” preserva as conferências e permissões existentes. “Abrir produto no Marca-passo” encaminha SKU, empresa e loja; a hipótese não é aprovada ou aplicada por esse atalho. Custo/base desatualizados continuam visíveis como pendência.

## Verificação

Testes de aritmética cobrem markup versus margem, embalagens de múltiplos itens, frete desconhecido, custo zero/ausente, alternativa e unidade divergente. Teste de interação com interface simulada cobre abertura e foco do produto, edição da hipótese, navegação para o Marca-passo e abertura do histórico mesmo sem linha da base. Não substitui auditoria visual com sessão autenticada real. Nenhuma pesquisa paga é disparada por abrir ou simular.
