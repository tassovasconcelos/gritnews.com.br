# Faro — pesquisa automática da curva A

Ativada em 27/10/2026 por solicitação explícita do responsável pelo CIP. Complementa a pesquisa manual do Radar B2B2C e o Radar B2G.

## Operação inicial

- Shopping Prohospital: 866 SKUs classificados como A em pelo menos uma unidade, com saldo positivo na posição de 19/10/2026. Deduplicação por SKU; a coleta utiliza uma loja representativa, escolhida pelo maior capital observado. Isso não define uma ABC de vendas consolidada da rede.
- A cada hora: até 24 produtos, com quatro recorrentes selecionados por prioridade/pin e capital observado, e vinte em rodízio, priorizando quem há mais tempo não foi colocado na fila. O pin influencia a seleção; mais pins que vagas não garantem acompanhamento horário de todos os marcados.
- Para 866 itens, uma passagem pelo restante exige aproximadamente 44 horas, sem falhas, pausas ou falta de orçamento. Essa estimativa não significa coletar todos os anúncios, todos os vendedores ou todas as fontes de cada SKU.
- Até 576 tarefas por dia em Brasília, duas chamadas web e 3.200 tokens de saída por tarefa. Há até 1.152 chamadas web reservadas/dia nesse limite. Chamadas e tokens de entrada também podem gerar cobrança; isto não é um teto financeiro em reais nem promessa de uso máximo diário.
- Duas tarefas são processadas a cada cinco minutos, em paralelo, distribuindo o lote ao longo da hora. Pesquisas manuais mantêm os limites anteriores e não perdem sua cota para a rotina automática.
- As sete fontes iniciais são as já configuradas no radar: Mercado Livre, Magalu, Amazon Brasil, Cirúrgica Store, Medjet, Cirúrgica Paulista e Cirúrgica Fernandes. Cada pesquisa tem cobertura parcial, restrita aos domínios configurados.
- Distribuidora: configuração criada pausada; a carga atual não possui classificação ABC explícita. Não se fabrica uma curva de vendas usando custo de estoque. Ativação depende de integrar uma fonte ABC identificada.

## Responsabilidade dos agentes

**Faro** coleta evidências públicas e reconsulta links rastreados. **Atlas** participa do de/para pela classificação de identidade/similaridade e divergências do radar. **Prisma** recebe oportunidades na mesa de preço; **Doquita** consolida o acompanhamento. Mantêm-se os 14 agentes existentes.

O portfólio é sincronizado com a última carga ABC disponível. Quando o hash da fonte não muda, a sincronização evita regravar todos os produtos. Mudanças de descrição, marca ou unidade removem complementos de identidade para nova conferência. As datas de classificação e de estoque são expostas; estoque antigo não comprova giro atual, disponibilidade livre, lote ou resultado de vendas.

A pesquisa recebe somente descrição, unidade, atributos e URLs públicas, sem custo, margem, capital de estoque ou preço interno. Marca e quantidade da nossa embalagem podem ser complementadas pela diretoria; isso não reescreve o cadastro mestre.

## Sinais para o Marca-passo

- **Evidência para revisão:** oferta com preço candidato e correspondência não bloqueada.
- **Nosso preço acima do candidato:** diferença acima do limiar configurado, com preço normalizado calculável e premissas explícitas.
- **Queda de preço:** comparação de observações do mesmo link/vendedor com embalagem, frete, moeda, condições, marca, modelo e tamanho iguais; exige normalização e limiar mínimo.

Frete e embalagem ausentes não são zero. Similaridade não certifica equivalência. Alternativas de marca e divergências técnicas não geram preço normalizado para nossa comparação. Sinais repetidos sem alteração relevante não são reabertos; sinais numéricos antigos podem ser substituídos por nova observação. Cada decisão e evidência continua no histórico.

**A coleta automática não cria referência aprovada, não aprova programação e não escreve preço no ERP ou marketplace.** O responsável abre produto/evidência, confere variante, vendedor, disponibilidade, frete e condição e então leva a referência ao Marca-passo. A aprovação de preço continua dependendo de regra financeira, custos/despesas, origem conciliada e alçada. Tratar um sinal registra a ação, sem aprovar preço.

## Onde acompanhar e configurar

- **Radar B2B2C → Vigilância da curva A:** rotina, próxima janela, tarefas de hoje, fila, última conclusão, SKUs pesquisados e SKUs com evidência nas últimas 24 horas.
- **Programação, portfólio e execuções:** volume por hora, grupo recorrente, limite diário, limiar e fontes; prioridades, identidade/GTIN/embalagem por SKU; tarefas concluídas, falhas e pausas.
- **Marca-passo:** painel compacto com a cobertura e até cinco sinais abertos, com acesso ao produto e às evidências.
- O painel atualiza suas leituras a cada minuto enquanto estiver visível. A execução automática independe de navegador/PWA aberto.
- Somente diretoria e superadm configuram buscas pagas, prioridades e identidade. Perfis de revisão autorizados podem registrar o tratamento dos sinais.

## Controles operacionais e segurança

- Cron `cip-faro-hourly` (`0 * * * *`) monta o lote com unicidade SKU/janela e trava transacional.
- Cron `cip-faro-worker` (`*/5 * * * *`) despacha a fila com autenticação secreta própria do serviço, guardada no Vault. A função não aceita chamadas de navegador nem usuários comuns. O JWT de usuário não é usado como credencial de agendador.
- Fila com lease exclusivo e prazo de três minutos, sem repetição automática da mesma tarefa paga. Tarefa abandonada fica identificada; observação expirada não é concluída em duplicidade.
- Autorização do patrocinador conferida na seleção e conclusão. Pausa e inativação impedem novas conclusões de coleta; chamada já enviada pode ter custo.
- Três falhas consecutivas abrem espera de uma hora; sucesso restaura a operação. Inteligência desabilitada impede a chamada ao modelo e é indicada no painel.
- RLS por empresa em configurações, portfólio, tarefas e sinais. Clientes não escrevem diretamente. Lease, segredo do worker e capacidades de conclusão não são disponibilizados aos usuários.
- Advisor de segurança: a tabela privada do segredo tem RLS sem política, intencionalmente fechada e sem concessão aos clientes. Não se cria política aberta para remover esse aviso informativo.
- Uma supervisão horária no ChatGPT consulta cobertura, falhas e novos sinais e só informa mudanças relevantes. Ela não repete a pesquisa paga nem altera dados/preços/limites ou envia mensagens externas.

## Evidência de implantação

Duas primeiras pesquisas reais executadas pelo worker responderam HTTP 200, com 12 ofertas e sete sinais candidatos, sem timeout. O lote inicial tinha 24 tarefas. Esses são resultados de coleta, sem certificação comercial ou previsão de aumento do giro.

Verificação: 387 testes unitários/integração locais; testes SQL com rollback para filas, unicidade da hora, leases, geração de sinais, comparação sob mesmas condições, pausa, orçamento, permissões e RLS; teste isolado de interface com axe estrutural, sem avaliação de contraste ou homologação em aparelho físico.
