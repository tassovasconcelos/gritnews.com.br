# CIP PRO 360° — checklist de implantação e preparação operacional

Revisão de 27/10/2026. GRIT Soluções e Negócios · Grupo Prohospital.

A revisão combina fonte atual da branch `cip/main`, pacote público e contagens/estados do banco. Os registros abaixo refletem a inspeção desta data; o painel **Checklist e cronograma** consulta novamente as evidências. Não foram lidos ou expostos tokens, chaves, códigos de convite, conversas privadas ou valores financeiros de clientes.

## Situação executiva

O CIP está publicado e possui componentes com uso real. A operação comercial integrada continua parcial por falta de dados recentes, política de preço, aceite dos diretores e resultado de piloto. A automação já executa análises internas; não executa preços, compras, campanhas ou transferências no ERP.

**Confirmado na inspeção:** 44 ciclos dos agentes (22 por empresa), 40 solicitações Telegram concluídas (11 com IA), um vínculo ativo, 59.471 produtos e 56.747 EANs no catálogo, 12 processos salvos e 2.978 propostas de estoque. Os ciclos não apresentavam eventos de falha; os três agendadores tinham execuções bem-sucedidas nas últimas 24 horas. Isso não comprova disponibilidade contínua ou SLA.

**Bloqueios atuais:** estoque de 19/10, nenhuma base ERP financeira aprovada, nenhuma política de campanha publicada, dois convites de diretoria expirados, nenhum diretor ativo ou vinculado, nenhuma missão medida, nenhum conselho Doquita registrado, 27 skills em rascunho e nenhuma avaliação. O monitor da origem continua apontando `mapping_required` para uma view de locações; a integração cadastral é independente.

## Checklist funcional completo

| Frente | O que já foi entregue | Situação operacional / pendência |
|---|---|---|
| Publicação | CIP em domínio próprio e implantação isolada do portal | Publicação conferida. Homologação deve ser feita por fluxo e perfil |
| Identidade | Logo oficial do Grupo Prohospital e identidade GRIT | Implantada |
| Autenticação | Login real, superadm, logout e recuperação | Um superadm ativo. Homologar demais perfis e dispositivos |
| Permissões | Empresas autorizadas, RLS e validação nos serviços | Testes existentes; validar acessos finais e escopo por loja |
| Convites | Preparar link, estender por +1 h e revogar no fluxo administrativo | Dois convites da diretoria expirados; renovar/preparar no momento do aceite |
| Diretores | Papéis de diretoria e leitura das empresas autorizadas | Nenhum diretor ativo ou pareado no Telegram na inspeção |
| Menu | Grupos, ícones locais, busca global Ctrl/⌘ K e central de soluções | Implantado |
| Preferências | Favoritos ordenáveis, recentes, fonte ampliada e redução de movimento | Implantado; preferências por navegador/usuário |
| PWA | Orientação Android/iPhone, atalhos, estrutura offline e atualização controlada | Não guarda dados comerciais offline; homologação em aparelho e leitor de tela pendente |
| Catálogo Procfit | Produtos e EANs separados, busca, paginação e ficha | 59.471 produtos / 56.747 EANs; captura pontual de 19/10. Recarga e incremental pendentes |
| Monitor Procfit | Verificação da estrutura da origem no executor existente | Monitor de locações ativo; mapping_required. Não importa vendas ou estoque comercial |
| Carga financeira | Importação, rascunho, totais independentes, conciliação e aprovação | Nenhum snapshot aprovado. Disponibilizar e validar o contrato comercial da origem |
| Estoque Shopping | Posição por CD/loja, filtros, custo/quantidade e referências de demanda | Posição de 19/10; demanda histórica tem período não confirmado. Atualizar e conciliar |
| Estoque Distribuidora | Referência por lote, custo e validade | Posição de 19/10. Não confundir validade com idade do lote ou CD100 Shopping |
| Estoque antigo | Motor para entrada acima de 180 dias e ausência de venda em janela suficiente | Depende de datas e histórico confiáveis. Não inferir idade pela validade ou cadastro do produto |
| Propostas de estoque | Conferência, redistribuição, campanha e preço com evidência | 2.912 Shopping e 66 Distribuidora, todas sugeridas na inspeção |
| Aprovação de estoque | Versão, responsável, prazo, quantidade, verificações e resultado | Fluxo implantado; nenhuma conclusão real registrada. Não movimenta ERP |
| Marca-passo | Fila, contribuição, piso, teto, equivalência e evidência de referência | Precisa de custo/preço atual, despesas, alçada e regra aprovada |
| Campanhas | Políticas versionadas, cenários, cestas, decisão e auditoria | Nenhuma política ou proposta registrada. Não existe lançamento automático de campanha |
| Resultados de preço | Cenários e cálculo de equilíbrio | Medir piloto com baseline e controle; simulação não é contribuição realizada |
| B2B | Cotações, andamento e motivos de perda | Cadastro manual implantado; conciliação e retorno do ERP pendentes |
| Caderninho | Procuras não atendidas, motivo e estado do acompanhamento | Implantado; retorno ao cliente é conduzido pelo time, sem disparo automático |
| Doquita web | Priorização de registros autorizados e acesso a estoque/conhecimento | Limites das fontes identificados; não responde vendas atuais sem base aprovada |
| Telegram | Bot, webhook, pareamento seguro, menu e seleção de empresas | Um vínculo ativo, ambas as empresas. 40 solicitações concluídas; última em 23/10 |
| Texto com IA | Roteamento de intenção, segredo no servidor e validação de empresa | 11 solicitações concluídas com uso de IA no Telegram |
| Voz | Recebimento/transcrição e interpretação preparados | Homologação separada pendente; contagem de IA não distingue áudio |
| Persistência do bot | Vínculo permanente até revogação; checagem por solicitação | Código de pareamento e contexto possuem expiração própria; não são a sessão permanente |
| Briefing diário | Agendador e adesão individual | Nenhuma adesão ativa. Nenhum envio foi ativado pela auditoria |
| 14 agentes | Identidades, competências, fontes, limites e dependências definidos | Shopping possui 13 disponíveis; Íris é exclusiva da Distribuidora, mantendo 14 no total |
| Motor dos agentes | Ciclos automáticos por regras, missão, evidência e controle por empresa | 44 ciclos reais; duas missões de atualização de dados. Rotina inicial de 6 h, verificada por hora |
| Metas e resultados | Responsável, prazo, indicador, meta, andamento, resultado e revisão | Nenhuma missão medida ou caso aprovado para aprendizado na inspeção |
| Conselho Doquita | IA estruturada com dados autorizados, materiais e casos revisados | Serviço publicado e configurado; nenhum conselho registrado. Homologar consulta autenticada |
| Escola | Orientações, links, documentos, revisões e fontes com validade | 13 materiais aprovados Shopping; Distribuidora ainda sem material aprovado |
| Leitura integral | Ingestão, extração de conteúdo, chunks, consulta e indicação de origem | Dois trabalhos de ingestão concluídos. Conferir integralidade e revisão por material |
| Skills | Versionamento, fontes, casos de teste, avaliação e aprovação | 27 rascunhos; nenhuma avaliação e nenhuma habilidade aprovada vigente |
| Aprendizado | Reutilização de fontes atuais e resultados revisados como contexto | Não é atualização autônoma de pesos nem ampliação de permissões |
| Processos vivos | Editor, conexões, auditoria, simulação e histórico concorrente | 12 processos salvos; donos precisam validar os fluxos e evidências |
| Consultor de processos | IA por briefing, proposta, aplicação local e testes de percurso | Geração real com cenário fictício conferida anteriormente; não prova processo operacional homologado |
| Radar Íris/B2G | Pesquisa de produtos, fontes oficiais, histórico e evidência de resultados | Serviço ativo; validar equivalência, data, vigência, edital e condições antes de decidir |
| Pesquisa de mercado | Referências com fonte e data nas ferramentas existentes | Não declarar cobertura completa de concorrentes, redes sociais ou tendências sem evidência |
| Cronograma | Seis marcos acompanhados pelo time | Todos estavam como planejados; são estados manuais. Não confundir com diagnóstico automático |
| Checklist de operação | Diagnóstico somente leitura, atualizável e com links de tratamento | Implantado nesta revisão, exclusivo do superadm para o diagnóstico global |
| Auditoria | RLS, checagens por pedido, eventos e versões nos fluxos | Preservados. Não é certificação geral de segurança do projeto compartilhado |
| Alertas | Histórico de falhas e estados no CIP | Push/e-mail externo, escalonamento e aceite de recebimento pendentes |
| Continuidade | Runbooks e separação lógica das aplicações | Banco dedicado, retenção e ensaio de restauração dependem de definição/aceite de infraestrutura |
| Desempenho | Limites, paginação, lazy loading da apresentação e testes de pacote | Medir latência p95, concorrência, volume real e consumo por provedor |

## Plano de entrada em operação

| Ordem | Ação | Responsável sugerido | Critério objetivo de saída |
|---|---|---|---|
| 1 | Receber views corretas e posição recente | TI/ERP, estoque e Financeiro | Chaves e totais por empresa/filial conferidos; origem e horário identificados |
| 2 | Aprovar a primeira carga comercial | Financeiro e gestor | Vendas líquidas, devoluções, saldos, custo e períodos conciliados; erros documentados |
| 3 | Concluir os dois acessos de diretoria | Superadm e cada diretor | Aceite individual, login, vínculo Telegram e consulta das empresas permitidas |
| 4 | Publicar a política do Marca-passo | Diretoria, Fiscal e Financeiro | Despesas, margem, variação, prazo, bônus e alçada formalmente definidos |
| 5 | Conduzir poucas missões piloto | Gestor e donos das ações | Metas, prazo, aprovação na origem, resultado verificável e revisão do aprendizado |
| 6 | Homologar o uso diário | Gestores, diretores e responsável técnico | Texto, voz, PWA, revogação e atualização testados por perfil; falhas tratadas |
| 7 | Estabelecer sustentação | Responsável técnico e gestor | Alertas recebidos, rotina de dados, backup restaurado e indicadores de latência/custo acompanhados |

### Solicitação objetiva para a TI

Confirmar a disponibilidade de views somente leitura com empresa, filial, SKU e unidade; saldo e reservas; custo e preço vigentes; lote, validade e data de entrada; movimentos de estoque; vendas por item/data e valores líquidos; devoluções, cancelamentos e pedidos em aberto. Identificar janela de extração, fuso, chaves, periodicidade, exclusões/estornos e totais de controle. O contrato detalhado está em `PROCFIT-CONTRACT.md`. Não solicitar envio de senhas ou chaves por conversa.

### Primeiro piloto recomendado

O gestor escolhe o escopo e os responsáveis; não foram inventadas lojas, datas, metas ou regras financeiras. Começar com poucas missões, acompanhar disponibilidade e contribuição, comparar período/loja de controle quando houver base suficiente e revisar semanalmente as hipóteses. Aceitar uma missão não aprova estoque ou preço no ERP. Em material clínico/regulado, elegibilidade e validade continuam como requisitos de conferência.

## O que foi corrigido nesta revisão

- Backlog anterior substituído por posição atual: Telegram/IA já têm evidências reais; ainda faltam os diretores, voz, conselho e operação financeira.
- Cronograma passou a oferecer checklist vivo ao superadm; diferencia registros manuais do projeto de contagens do sistema.
- Filtros de pendências, status, evidência, próximo passo, responsável sugerido e módulo de tratamento.
- Dados do diagnóstico retornam apenas contagens, estados e datas. Nenhuma credencial, contato, código de convite ou valor financeiro é exposto.
- Nenhuma renovação de convite, adesão a mensagens, política de preço, promoção de skill ou aprovação comercial foi realizada automaticamente.

## Verificação e limites

Testes abrangem cálculo de pendências, datas antigas/futuras, fontes ausentes, falha/pausa dos agentes, estados do Telegram, acesso exclusivo do superadm e comportamento de falha fechado. Teste SQL em transação revertida verificou retorno para superadm e recusa para anônimo/usuário sem perfil. Verificação de interface isolada não substitui sessão real de diretoria, aparelho móvel, transcrição ou consulta real do conselho à IA.

Nesta revisão, 343 testes automatizados passaram. O diagnóstico retornou 23 verificações: cinco execuções técnicas confirmadas, nove pendências para operar, quatro frentes parciais e cinco validações práticas. Isso não deve ser convertido em percentual de funcionalidades prontas. O teste de interface com dados agregados conferiu filtros, navegação autorizada, descarte de evidência após erro e encerramento de listeners. Axe não apontou violações nas regras executáveis em JSDOM; contraste e aparelho real não foram verificados por esse teste.
