# CIP 360 — evolução enquanto aguardamos o Procfit

## Entrega desta revisão
- Diretoria pode vincular seu próprio Telegram após aceitar o convite e autenticar no CIP. Cada vínculo é privado e permanente até revogação/suspensão. Somente o código vence em 10 minutos.
- Consulta das empresas autorizadas por memberships ativas, verificadas a cada pedido e também na seleção por texto/voz. Modelo de IA não concede permissões.
- Superadm configura credenciais, importa e concilia. Diretoria consulta somente bases aprovadas, sem ler rascunhos ou segredos.
- Marca-passo nas duas empresas: fila por SKU/loja, capital em lotes acima de 180 dias, evidência de venda recente, cobertura observada se houver 90 dias completos, preço ausente, risco de ruptura e alerta de atualização.
- Simulador exige despesas e alçadas informadas. Piso de contribuição arredondado para cima, teto de variação, contribuição por unidade, desconto até o piso e volume adicional necessário para compensar desconto. Isso não é previsão de demanda.
- Referência exige equivalência confirmada, fonte e data de até sete dias. Política conservadora inicial do simulador, sujeita à validação comercial.
- Nenhum preço/campanha/transferência aplicado no ERP. Propostas de missão permanecem em revisão humana.

## Condição dos dois convites
Na inspeção inicial desta revisão, os convites de Glauco e Rufino estavam prontos para aceite, com perfil diretoria e ambas as empresas. Ainda não havia perfil ativo nem vínculo Telegram de nenhum dos dois. Não foram enviados novos convites nem mensagens e não houve bypass de aceite. Links de convite têm validade própria; caso expirem, o superadm pode usar Preparar novo link no módulo de acessos, com papel e empresas já preenchidos. Não registrar tokens em documentos ou chamados.

## Prioridades recomendadas
| Prioridade | Evolução | Critério de conclusão | Dependência |
|---|---|---|---|
| P0 | Primeira carga conciliada | Totais por empresa/loja conferem com ERP; lotes/recebimento rastreáveis | TI e Financeiro |
| P0 | Homologação dos diretores | Aceite, vínculo individual, consulta às duas empresas, suspensão/revogação testada | Ação pessoal de cada diretor |
| P0 | Matriz de custo e alçada real | Despesas por produto/canal, contribuição mínima, responsável e prazo aprovados | Compras, Fiscal, Diretoria |
| P1 | Monitoramento operacional | Alertas de erro, latência p95, carga atrasada e consumo IA com responsável definido | Canal operacional e orçamento |
| P1 | Banco dedicado ao CIP e recuperação | Separação de aplicações, backup e restauração ensaiada em ambiente isolado | Decisão de infraestrutura/custo |
| P1 | Carga incremental idempotente | Checkpoint, reprocessamento, devoluções e exclusões reconciliadas | Contrato Procfit validado |
| P1 | Agregados e fila assíncrona | Benchmark com volume real; não transportar snapshots completos para cada pergunta | Tamanho e frequência reais |
| P1 | Decisões de preço auditáveis | Guardar cenário, baseline, autor, aprovador, vigência, resultado e reversão | Matriz de alçadas |
| P2 | Curvas ABC/XYZ e sazonalidade | Definir janela, devoluções, rupturas, zeros e frequência; amostra suficiente | Histórico de vendas completo |
| P2 | Referências de mercado | Fonte licenciada, produto/embalagem/canal equivalentes e validade | Fonte comercial disponível |
| P2 | Aprendizado contínuo dos 14 agentes | Casos avaliados, fontes aprovadas, métrica de qualidade e versionamento | Resultados reais revisados |
| P2 | Experimentos de preço | Grupo comparável, prazo, contribuição e volume medidos; alçada por execução | Histórico e governança |

## Performance e segurança: evidência e limites
O motor de fila usa índices em memória de produto, preço e vendas para uma passagem pelos conjuntos, ordenação e paginação de 20 linhas. Ainda não é benchmark de produção; limites do importador continuam em 4 MB e 20 mil linhas por conjunto. Totais financeiros oficiais continuam no motor decimal com centavos exatos; simulador e fila são cálculos de apoio.

A inspeção de advisors do CIP identificou somente avisos informativos de RLS sem políticas em tabelas internas (configuração, códigos, atualizações, convites e eventos), intencionalmente sem acesso direto do cliente. Esses avisos não justificam criar acesso público. Isso não é certificação de segurança de todo o projeto compartilhado. Demais aplicações e seus avisos não foram alterados.

Sem chave OpenAI habilitada, menus e consultas determinísticas continuam funcionando. Texto livre com IA e voz dependem da configuração segura; não foi efetuada transcrição real nem transmissão de relatórios em testes. Não há carga financeira Procfit real nesta revisão nem homologação financeira. A verificação da estrutura da origem a cada dez minutos, incorporada da versão atual, não equivale à importação de vendas e estoque.
