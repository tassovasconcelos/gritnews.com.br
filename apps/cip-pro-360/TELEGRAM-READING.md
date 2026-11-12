# Doquita — leitura progressiva dos resultados

O padrão no Telegram passa a ser resposta executiva curta: resultado, empresa/filtro, data e limitação material. Não enviar automaticamente memória de cálculo, ranking completo, instruções de todos os módulos e menu extenso. A camada determinística usa os mesmos dados e validações do relatório completo; a IA continua roteando a intenção, sem calcular valores ou decidir permissões.

`telegram/response-style.mjs` compõe resumos sem truncar arbitrariamente a mensagem financeira. Consolidação de bases aprovadas mantém os critérios de data, escopo e custo do renderizador original. Referências não conciliadas continuam separadas, e empresa sem base nunca entra como zero. Estoque antigo e campo de última venda desatualizado não viram ausência de vendas ou giro comprovado.

Resultados têm dois níveis: **Detalhar última consulta** mostra composição/cálculo; **Ver resumo da última consulta** retorna à leitura curta. Ambos revalidam vínculo/empresa no servidor e consultam as fontes novamente, preservando produto, unidade e escopo. Não reutilizam números armazenados no texto anterior. A origem pode ter mudado entre os cliques; a data exibida identifica a consulta atual.

Contexto dura vinte minutos conforme `cip_bot_context`; troca de empresa limpa a consulta. O contexto salva somente intenção e filtros JSON limitados a 512 caracteres, nunca o relatório completo. Sem contexto válido, pede nova consulta. `/detalhes`, “memória de cálculo”, “como calculou?”, `/curto`, “resumir” e “mais objetivo” também funcionam sem chamada adicional à IA. Não reutilizar contexto inválido ou ampliar empresa por sugestão do modelo.

O menu principal tem quatro linhas. Consultas adicionais ficam em **Mais consultas**; respostas comuns recebem só navegação compacta. Conhecimento mostra no máximo dois trechos curtos e aponta para a Escola. Briefing diário também usa a leitura curta e mantém adesão explícita, horários e permissões anteriores. Nenhuma inscrição ou envio real deve ser criado por testes.

Interface CIP: cabeçalho **PROCFIT · CADASTRO** quando o superadm confirma lote cadastral ativo; alternativa **PROCFIT · PARCIAL**, com descrição explícita do cadastro integrado e vendas/saldos pendentes. A ficha de catálogo exibe a data real. O monitor de dez minutos é identificado como monitor da view de locações e não invalida o canal cadastral independente. Não apresentar a primeira carga pontual como sincronização contínua nem integração financeira concluída.

Testes do webhook verificam consulta curta, expansão com nova autorização, filtros preservados, contexto vencido/revogado e ausência de chamada à IA nos botões. SQL de contexto foi exercitado em transação revertida, sem alterar vínculos reais ou enviar mensagens.
