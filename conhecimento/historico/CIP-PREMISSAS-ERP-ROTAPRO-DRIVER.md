# CIP — Premissas Procfit, ROTA PRO/Driver e jornada do cliente

Versão 1.0 · 18/10/2026 · Anexo de requisitos do projeto CIP versão 1.2.

## 1. Objetivo e limite da verificação

Conectar o pedido comercial ao trabalho de entrega, ao acompanhamento pelo cliente e à melhoria contínua. Reaproveitar o **ROTA PRO da GRIT**, com Driver/PWA, Gestor e avaliação, preservando a distinção entre situação do ERP e operação física.

Foi feita leitura do projeto local: `apps/rota-pro/README.md`, `docs/ROTA-PRO-OPERACAO-LOCACAO.md`, código das funções `survey-submit` e `sync-ingest` e documentação operacional. O código contém tarefas, vínculo com motorista, horários, ocorrências, recebedor/comprovante e pesquisa pós-tarefa. A documentação também descreve conectores Procfit para contextos de locação/Supply. Isso não confirma a existência de todos os campos de pedidos de venda nem a disponibilidade atual da integração CIP. O status de produção e a compatibilidade das versões serão homologados separadamente. Não houve alteração no ROTA PRO nem no banco nesta entrega.

Repositório local consultado, somente leitura: `C:/Users/tasso.vasconcelos/.codex/.chatgpt-projects/g-p-6ac43c6b71708191a35765fa5497c037/rota-pro-work`.

## 2. Responsabilidade de cada sistema

| Sistema | Fonte de verdade proposta | O que não deve inferir |
|---|---|---|
| Procfit | Pedido e itens, cadastro, condições, reserva/liberação, faturamento, cancelamentos e devoluções fiscais. | Entrega física só porque houve emissão de nota. |
| ROTA PRO Gestor | OS, despacho, motorista atribuído, planejamento e tratativas operacionais. | Pedido comercial liberado só porque uma OS foi criada. |
| ROTA PRO Driver | Eventos de execução, chegada/tentativa, ocorrência e conclusão física com evidências aplicáveis. | Baixa financeira, faturamento ou aceite integral do contrato. |
| CIP | Visão autorizada consolidada, inteligência, fila de exceções, indicadores e acompanhamento da melhoria. | Alterar a verdade de origem para resolver divergência de tela. |
| Portal/atendimento ao cliente | Situação autorizada de seus pedidos e protocolos, com fonte e atualização. | Acesso amplo a pedidos, motoristas, mapas ou documentos internos. |

## 3. Matriz das premissas do ERP

Solicitar a TI/Procfit confirmação de campo, origem e método suportado; os nomes abaixo são contratos conceituais, não nomes reais de tabelas/endpoints.

| Conjunto | Dados mínimos | Necessidade | Validação de aceite |
|---|---|---|---|
| Identidade organizacional | Empresa/CNPJ, filial/código, unidade de expedição | Isolar operação e correlacionar origens. | Mesmo número de pedido em empresas distintas não colide. |
| Pedido | ID estável, número, tipo, canal, cliente, criação, atualização/revisão | Chave do acompanhamento. | Número exibido não é usado isoladamente como chave ou autenticação. |
| Itens | ID de linha, SKU/GTIN quando disponível, descrição, unidade, conversão, quantidade confirmada/cancelada | Controlar atendimento integral/parcial. | Caixa e unidade não são somadas sem conversão; cancelamento por item preservado. |
| Cliente e destinatário | ID interno, conta/unidade autorizada, destinatário e contato necessário | Entrega e acesso do cliente. | Diferenciar comprador, pagador e recebedor; mínimo necessário ao motorista. |
| Endereço | ID/endereço da entrega, CEP, número, complemento, cidade/UF e instrução operacional | Entrega correta e proposta de rota. | Validar endereço; coordenada aproximada não vira GPS confirmado. |
| Liberação | Estado e motivo de bloqueio comercial, crédito, estoque e fiscal; responsável quando aplicável | Evitar despacho indevido. | Bloqueio impede nova expedição até liberação autorizada. |
| Estoque/reserva | Quantidade reservada/disponível por origem, lote/validade se aplicáveis | Promessa e separação confiáveis. | Reserva em uma filial não vira saldo livre em outra. |
| Promessa | Prazo original, janela, origem da promessa, revisões e motivo | Medir atraso com honestidade. | Mudança de previsão não substitui silenciosamente o compromisso original. |
| Separação/expedição | Quantidades separadas e expedidas, datas, conferência, origem | Mostrar andamento antes do transporte. | Se ERP não fornece, identificar fonte WMS/ROTA PRO ou lacuna. |
| Remessa e documentos | ID de remessa, relação com pedido/itens, NF/documento, volumes, transportador | Entregas fracionadas e rastreio. | Várias notas/remessas por pedido, sem duplicar total. Documento emitido não significa coletado. |
| Cancelamento/retorno | Revisão, motivo, itens/quantidades e referência ao original | Sincronizar mudanças e retorno. | Cancelamento comercial não apaga evento físico ou comprovante. |
| Contrato/B2G/locação | Contrato/empenho quando aplicável, obrigação, unidade, item; tombamento para ativos | Preservar particularidades por operação. | Entrega, coleta, venda e locação são tipos distintos; sem reaproveitar chaves por semelhança. |
| Atualização | Data/hora e fuso, revisão/cursor, cancelados e período consultado | Extração incremental e reconciliação. | Carga repetida não duplica; falha não apaga último estado confirmado. |

Permissões: começar por API suportada ou views de leitura homologadas, com conta técnica mínima. Se só houver arquivo/exportação, identificá-lo como importação com horário; não rotular como acompanhamento em tempo real. Não escrever diretamente no banco transacional.

Infraestrutura: confirmar rede/VPN quando necessária, servidor executor, autenticação, limites, custo/licença, ambiente de testes, suporte e recuperação de falhas. Não copiar credenciais de conectores existentes sem validação do proprietário e do escopo.

## 4. Contrato de integração Procfit → ROTA PRO → CIP

Fluxo proposto: **Procfit → conector autorizado → pedido/remessa correlacionados → despacho ROTA PRO → Driver → eventos confirmados no servidor → consulta CIP/cliente → avaliação/protocolo → ação de melhoria**.

Identificadores de correlação: empresa, filial, ID pedido, ID linha, ID remessa, ID despacho/OS, ID tarefa Driver e referência fiscal quando houver. A correlação precisa ser explícita e auditável; não juntar apenas por nome do cliente, telefone, texto do produto ou número de NF sem contexto.

Envelope de evento proposto: identificador único, sistema de origem, empresa/filial, pedido/remessa/tarefa, tipo, data do fato, data de recebimento no servidor, revisão, ator autorizado e referência de evidência. É proposta de contrato, não formato já disponível nas APIs atuais.

Implementar deduplicação, sequência/revisão, reenvio, fila de falhas, consulta incremental e reconciliação. Webhook só será usado se suportado e autenticado; alternativa é consulta periódica com cursor e limites. CORS não é autenticação; não liberar origem pública nem trocar tokens de usuário para unir aplicações. As bases/autenticações existentes têm escopos distintos: integração servidor-servidor com autorização explícita e consultas mínimas.

Atualização proposta para o piloto: eventos de execução disponíveis em até 1 minuto após aceite no servidor; consulta ERP em janela negociada de 5–15 minutos quando suportada. São metas a validar, não SLAs existentes. Se a carga disponível for horária, mostrar isso e não prometer previsão baseada em atualização contínua. Offline no Driver aumenta o atraso; informar data do fato e hora da sincronização.

## 5. Status e regra de exibição para o cliente

| Marco ao cliente | Evidência necessária | Ressalva |
|---|---|---|
| Pedido recebido | Registro confirmado na origem | Não significa crédito, reserva ou entrega aprovados. |
| Em validação / pendência | Estado e motivo publicável | Não expor análise financeira interna ou informações de terceiros. |
| Confirmado | Liberação e condições aprovadas para o fluxo | Se a confirmação é manual/importada, informar origem. |
| Em separação | Evento real de separação em fonte autorizada | Não inventar etapa que o ERP não registra. |
| Expedido | Remessa entregue à operação de transporte | Nota emitida ou etiqueta gerada não basta. |
| Em rota / chegada / tentativa | Evento correspondente aceito no servidor ROTA PRO | GPS de check-in não equivale a rastreamento contínuo. |
| Entregue parcialmente | Quantidades aceitas em parte das remessas/itens | Exibir o que chegou e o que continua pendente. |
| Entregue | Todas as quantidades elegíveis confirmadas e evidência requerida | OS isolada concluída pode não encerrar o pedido inteiro. |
| Ocorrência / retorno / cancelado | Evento próprio e vínculo ao pedido | Preservar histórico e divergência até resolução autorizada. |

O código local de sincronização contém estados como PENDENTE, EM ROTA e CONCLUÍDA e eventos ligados ao despacho. A grafia e o mapeamento definitivos serão conferidos com a versão publicada; usar estados internos padronizados e rótulos claros na interface. Foto pode existir com auditoria pendente: “comprovante recebido” e “comprovante verificado” são condições diferentes.

## 6. Reaproveitamento e evolução do Driver

Reaproveitar a base descrita no projeto: OS atribuída ao motorista, navegação, início/chegada/fim, recebedor, comprovante, ocorrência/reagendamento, operação offline e sincronização. Testar no aparelho e na versão realmente usados; documentação histórica não basta para declarar funcionamento atual.

Complementos a validar/desenvolver: vínculo com remessa e item, quantidade efetivamente entregue/recusada, motivo padronizado, leitura de volume/código, identificação de entrega parcial e evento incremental para o CIP. Não fazer o motorista preencher de novo o que já veio validado do pedido. Alteração de endereço, volume ou instrução relevante usa revisão e confirmação, sem perder o registro original.

Conclusão deve exigir dados mínimos conforme tipo de entrega; prever recebedor ausente, recusa, avaria, falta e falha na captura. Não obrigar o motorista a marcar entrega concluída para registrar problema. Guardar pendências no aparelho até confirmação do servidor e tratar reenvios sem duplicar tarefa.

Se houver dispositivo/localização sem permissão ou sem sinal, oferecer o registro operacional permitido com a limitação visível. Não abrir rastreamento de toda a jornada para cada cliente. O portal mostra apenas a remessa correspondente e dados necessários.

## 7. Avaliação, sugestão e aproximação com o cliente

O `survey-submit` local tem registro de convite vinculado a tarefa concluída, valida motorista/membership, usa hash do token e registra expiração. A função de avaliação recebe NPS inteiro entre 0 e 10 e delega a validação ao backend. O acesso direto a partir do CIP não está homologado; não presumir que basta embutir o formulário ou ampliar CORS. Preferir serviço autorizado ou link restrito existente, após conferir versão e testes.

Requisitos do convite: somente após evento de conclusão elegível aceito no servidor; vinculado à entrega certa; token não previsível; validade e política de reutilização explícitas; evitar disparo repetido; nunca expor dados além do necessário. Pedido parcial pode ter avaliação da entrega específica, sem alegar avaliação de todo o pedido. Um token de pesquisa não libera acompanhamento ou acesso a notas e endereços.

Evolução proposta, ainda não implementada: perguntas curtas separando compra, entrega, produto e atendimento; comentário e sugestão de produto/melhoria; consentimento e frequência; protocolo de atendimento. Para o NPS de relacionamento, definir público, janela, pergunta e amostra; nota transacional não representa automaticamente a lealdade da carteira.

Resposta negativa ou ocorrência: classificação → responsável → prazo → contato autorizado → resolução documentada → retorno ao cliente. Sugestão de produto segue para Caderninho/Comercial/Compras. O agente consolida motivos e propõe ação; gestor aprova mudanças; Escola recebe somente casos revisados e minimizados.

Benefícios esperados: cliente encontra andamento sem repetir informações; recebe previsão e aviso útil; consegue pedir ajuda e acompanhar o protocolo; percebe retorno de sua sugestão. Medir taxa de uso, contatos de andamento por 100 pedidos, resolução, satisfação por etapa, retorno dado às sugestões e recompra. Separar adoção e satisfação de ganho financeiro comprovado.

## 8. Segurança operacional e critérios de aceite

Portal autenticado ou link de acompanhamento restrito com expiração/revogação, conforme desenho aprovado. Avaliação e acompanhamento têm permissões e tokens separados. Fotos, recebedores, assinaturas e documentos só aparecem a pessoas autorizadas; definir finalidade e retenção. Valor financeiro não precisa aparecer ao motorista quando não necessário ao serviço.

Casos obrigatórios de homologação: pedido em duas empresas com mesmo número; cliente A tentando ver cliente B; remessa dividida; dois pedidos na mesma OS; uma entrega com falta; cancelamento após roteirização; nota emitida sem expedição; Driver offline; evento repetido; evento antigo chegando depois de conclusão; comprovante pendente; retorno/recusa; pesquisa expirada/duplicada; indisponibilidade do conector e recuperação sem duplicar.

Aceite conjunto: TI confirma contrato de integração; operação confirma correlação/status; fiscal valida documentos e retornos; atendimento valida linguagem e fluxo de exceção; responsável pelo produto aprova exposição ao cliente. Só liberar o piloto quando entrega real autorizada puder ser rastreada de ponta a ponta. Integração não altera faturamento, baixa financeira ou saldo ERP automaticamente nesta fase.

## 9. Plano de implantação e solicitação técnica

1. Inventariar a versão e interfaces existentes do ROTA PRO; confirmar responsáveis e canais/filiais do piloto.
2. Solicitar ao Procfit os dados da matriz e métodos suportados; comparar com o conector de locações/Supply já documentado, sem supor que cubra pedidos comerciais.
3. Definir identificadores e mapear pedido, remessa, despacho e tarefa; testar importação idempotente e consulta de leitura.
4. Integrar eventos confirmados do Driver; separar horário do fato e recebimento, confirmação de entrega e auditoria do comprovante.
5. Liberar visão interna e, depois, consulta do próprio pedido pelo cliente; vincular avaliação e protocolo.
6. Executar piloto, medir qualidade/atraso/esforço e corrigir divergências antes de ampliar.

Solicitação adicional a TI/Procfit e equipe ROTA PRO, pronta para encaminhamento pelo responsável, **não enviada**:

“Para evoluir o CIP com acompanhamento do pedido e integração ROTA PRO/Driver, precisamos confirmar APIs ou views de leitura de pedidos/itens, cliente/unidade, endereço de entrega, reserva/liberação, separação, remessas e notas, cancelamentos, devoluções e promessa original/revisada. Favor informar IDs estáveis, dicionário, atualização incremental, autenticação, limites, ambiente de teste e custos. Precisamos correlacionar pedido/linha/remessa com despacho e tarefa ROTA PRO e receber estados/evidências confirmados pelo Driver, incluindo parcial e ocorrência. A primeira etapa é somente leitura do ERP. Avaliações devem usar convite seguro vinculado à entrega; novas perguntas e retorno ao cliente exigem fluxo próprio. Favor confirmar se há eventos/integrações suportadas e responsável técnico de cada ponta.”

Estado: premissas e requisitos incluídos no projeto. Conector CIP–ROTA PRO, portal e novas pesquisas ainda precisam de implementação/homologação; nenhum serviço foi ativado por este anexo.
