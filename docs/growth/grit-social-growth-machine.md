# Máquina de crescimento social — GRIT

Atualizado em 25/08/2026.

## Linha de base

- Instagram: `@grit.solucoes`
- 17 publicações, 134 seguidores e 530 perfis seguidos.
- Nove publicações recentes apareceram no Business Suite sem legenda.
- Melhor alcance observado na amostra: Reel com 64 impressões e 54 contas alcançadas.
- Os Reels de 16 segundos tiveram retenção média curta (aproximadamente 2–7 segundos).
- Facebook: a atualização de capa observada teve zero interação.

### Medição operacional iniciada em 25/08/2026

Período exibido pelo Meta Business Suite: 28/07/2026 a 24/08/2026.

- Facebook: 2 visualizações, 2 visualizadores, 1 interação com conteúdo, 0 novos seguidores e 0 visitas à Página.
- 100% das visualizações e a única interação vieram de não seguidores.
- Plano semanal do Meta: 1 de 7 tarefas concluídas; ainda sem Stories no Instagram e sem posts do Facebook contabilizados na meta.
- Janela sugerida pelo Planner para a semana: 19h, horário em que os seguidores do Instagram aparecem mais ativos.

Leitura: existe descoberta mínima fora da base atual, mas volume e frequência ainda são insuficientes para avaliar formato, oferta ou conversão. A primeira sprint deve priorizar consistência, conteúdo demonstrável e rastreamento — não impulsionamento prematuro.

## Status de início da operação

- Calendário e Insights revisados no Meta Business Suite.
- Usuário técnico administrativo `gritopsadmin2026` criado no portfólio GRIT.
- Página, Instagram e app Meu Espetinho Growth atribuídos ao usuário técnico.
- Token da API continua bloqueado pelo Meta; publicação e atendimento permanecem assistidos pelo Business Suite até a credencial ser emitida.
- Nenhum disparo promocional em massa está autorizado. Contato ativo depende de consentimento e registro de origem.
- Fila multicanal protegida em produção contra processamento simultâneo e duplicidade; a Edge Function rejeita chamadas sem o segredo interno antes de consultar ou consumir leads.
- Resposta automática do Meta Business Suite revisada para classificar contatos pelas palavras-chave `PADEIRO`, `ESPETINHO`, `SAC` e `SISTEMA`, com SLA humano de até três horas úteis e aviso de privacidade.
- Automações específicas `Lead — Sr. Padeiro`, `Lead — Meu Espetinho`, `Lead — SAC 4.0` e `Lead — Sistema sob medida` ativas para mensagens recebidas, com perguntas de qualificação e links UTM distintos por produto.
- Caixa de Entrada ainda indica o Instagram como desconectado; as rotas estão configuradas, mas a entrega no Direct depende da reconexão do canal.
- Auditoria inicial de 25/08/2026: 39 itens de WhatsApp permanecem em `consent_required/blocked`; as quatro integrações estavam desativadas e não havia consentimentos ativos na fila central. Nenhum lote antigo de saída deve ser liberado sem regularização.
- Canal de e-mail habilitado em produção após confirmação dos segredos SMTP da Hostinger. A habilitação vale apenas para itens com consentimento ativo; os 39 WhatsApps antigos continuam bloqueados.
- Formulário do Meu Espetinho migrado localmente de `capture-lead` para `commercial-lead`, com consentimento obrigatório, autorização por canal, produto, UTMs, `gclid`, `fbclid`, formulário de origem e política de privacidade. Build de produção validado.

## Links rastreáveis da sprint 01

- Meu Espetinho: `https://meuespetinho.gritnews.com.br/?utm_source=meta&utm_medium=organic_social&utm_campaign=sprint_01&utm_content=checklist_fechamento`
- Sr. Padeiro: `https://srpadeiro.gritnews.com.br/?utm_source=meta&utm_medium=organic_social&utm_campaign=sprint_01&utm_content=diagnostico_perdas`
- GRIT Soluções: `https://gritnews.com.br/?utm_source=meta&utm_medium=organic_social&utm_campaign=sprint_01&utm_content=ecossistema_grit`

Usar um único link e uma única palavra-chave por publicação. Nunca remover os parâmetros antes de registrar o lead.

## Posicionamento

Promessa central: sistemas simples que dão controle ao pequeno negócio e transformam operação em recorrência.

Produtos prioritários:

1. Sr. Padeiro — gestão para padarias.
2. Meu Espetinho — pedidos, caixa, clientes e indicadores para espetinhos.
3. SAC 4.0 — pós-venda, garantia e qualidade.
4. Sistemas sob medida — automação, integração e dados.

## Funil social

Alcance → interação por palavra-chave → qualificação por produto → teste/demonstração → assinatura → ativação → prova social → indicação.

Palavras-chave de entrada: `PADEIRO`, `ESPETINHO`, `SAC` e `SISTEMA`.

Todo contato deve registrar origem, campanha, conteúdo, produto, consentimento por canal e data. Mensagem promocional só entra na fila após consentimento válido. Pedido de descadastro interrompe a sequência imediatamente.

### Automação técnica

1. Meta envia mensagens e comentários assinados ao `meta-lead-webhook`.
2. O webhook valida a assinatura antes de processar qualquer dado.
3. `PADEIRO`, `ESPETINHO`, `SAC` e `SISTEMA` classificam o produto de interesse.
4. Mensagem privada cria permissão temporária de `requested_contact` somente no mesmo canal; comentário público não cria consentimento promocional.
5. Origem, identificador Meta, campanha e texto ficam vinculados ao lead.
6. A entrada pausa sequências anteriores, abre atendimento humano e preserva a janela de resposta da Meta.
7. A fila de saída verifica consentimento, janela, horário, integração e limite de frequência antes de liberar qualquer contato.
8. Teste, ativação, assinatura e receita voltam ao painel de atribuição por origem e produto.

O webhook permanece inativo até que `META_APP_SECRET` e `META_WEBHOOK_VERIFY_TOKEN` estejam no cofre do Supabase e a assinatura do aplicativo Meta esteja validada.

## Cadência editorial semanal

- Segunda: dor operacional e diagnóstico.
- Terça: demonstração curta de uma funcionalidade.
- Quarta: bastidor, método ou construção do produto.
- Quinta: caso, prova ou antes/depois verificável.
- Sexta: oferta de teste ou demonstração.
- Sábado: dica prática do segmento.
- Stories diários: enquete, pergunta, prova, bastidor e CTA.

Meta inicial: quatro Reels, dois carrosséis e Stories em cinco dias da semana. Cada peça deve ter um único objetivo e uma única CTA.

## Estrutura de conteúdo

1. Gancho específico nos dois primeiros segundos.
2. Problema reconhecível pelo público.
3. Demonstração real da solução.
4. Resultado sem promessa absoluta.
5. CTA por palavra-chave ou link rastreável.

## Princípios de distribuição e retenção

- Produzir primeiro para consumo orgânico: vídeo vertical 9:16, áudio claro, texto dentro da área segura e uma ideia por peça.
- Tratar os primeiros três segundos como a promessa do conteúdo; eliminar abertura institucional e começar pela dor, contraste ou resultado demonstrável.
- Otimizar para sinais de valor real: tempo assistido, conclusão, repetição, salvamento, compartilhamento e conversa iniciada — não apenas curtidas.
- Criar conteúdos que mereçam ser enviados: checklist, erro caro, comparação, passo a passo, diagnóstico e ferramenta prática.
- Usar conteúdo original, demonstrações reais dos produtos e linguagem específica de cada segmento. Evitar repostagens com marca-d'água e promessas genéricas.
- Publicar também no Facebook com audiência pública e adaptação de legenda, preservando o aprendizado separado por canal.
- Fazer testes A/B de gancho e capa sem mudar simultaneamente tema, duração e CTA.

## Sprint editorial — primeira semana

### Segunda — Reel de diagnóstico, Sr. Padeiro

- Gancho: `Sua padaria vende todos os dias. Mas você sabe onde o lucro está escapando?`
- Corpo: mostrar em cortes rápidos caixa, estoque e perdas; encerrar com três sinais de falta de controle.
- CTA: `Salve para revisar no fechamento e envie para quem cuida da operação.`
- Conversão: comentário `PADEIRO` para demonstração, registrado com origem do conteúdo.

### Terça — Carrossel salvável, Meu Espetinho

- Capa: `Checklist de fechamento do espetinho em 7 minutos`.
- Páginas: comandas abertas, pagamentos, divergência de caixa, itens vendidos, estoque crítico, clientes recorrentes e próximo turno.
- CTA: `Salve este checklist e compartilhe com o responsável pelo caixa.`
- Conversão: comentário `ESPETINHO` para conhecer o fluxo digital.

### Quarta — Reel de bastidor, sistemas sob medida

- Gancho: `Esta tarefa parecia pequena até descobrirmos quantas horas ela roubava por semana.`
- Corpo: mapa antes/depois de um processo, sem expor dados confidenciais e sem inventar resultados.
- CTA: `Comente SISTEMA com o processo que mais se repete na sua empresa.`

### Quinta — Carrossel de autoridade, SAC 4.0

- Capa: `5 sinais de que seu pós-venda está perdendo clientes silenciosamente`.
- Páginas: histórico disperso, retorno atrasado, ausência de responsável, garantia sem rastreio e reclamação sem causa raiz.
- CTA: `Marque alguém do atendimento e salve para a próxima reunião.`

### Sexta — Reel comparativo, ecossistema GRIT

- Gancho: `Planilha, sistema genérico ou solução feita para sua operação?`
- Corpo: comparação honesta por estágio, custo de coordenação, rastreabilidade e velocidade.
- CTA: `Envie para um gestor que está escolhendo sistema.`
- Conversão: link rastreável da bio com escolha de produto.

### Stories diários

1. Enquete de dor real.
2. Resposta com microdiagnóstico.
3. Demonstração ou bastidor.
4. Caixa de perguntas.
5. CTA para conteúdo do dia ou conversa autorizada.

## Regras de correção semanal

- Se retenção aos três segundos ficar abaixo da mediana das últimas quatro peças comparáveis, regravar apenas o gancho e a primeira cena.
- Se houver alcance sem salvamentos ou compartilhamentos, aumentar utilidade específica e reduzir texto promocional.
- Se houver engajamento sem visita ao perfil, alinhar capa, promessa da bio e CTA.
- Se houver visitas sem conversa ou teste, reduzir fricção da oferta e usar uma única palavra-chave por produto.
- Se houver leads sem ativação, revisar qualificação, tempo de resposta e primeiro valor entregue no onboarding.
- Reaproveitar os 20% melhores temas em três variações; não duplicar a mesma peça.
- Encerrar um formato somente após quatro testes comparáveis e documentar a hipótese seguinte.

## Backlog de legendas

### Sr. Padeiro

Padaria cheia e gestão no controle? 🥖📊

Com o Sr. Padeiro, você acompanha vendas, caixa, estoque, clientes e indicadores em um só lugar — de forma simples para decidir mais rápido e ajudar a reduzir perdas.

Quer ver como funciona no seu negócio? Comente **PADEIRO** ou fale com a GRIT pelo link da bio.

### Meu Espetinho — controle

Seu espetinho pode vender mais sem transformar o fechamento em confusão. 🍢

O Meu Espetinho organiza pedidos, comandas, caixa, clientes e indicadores em uma única rotina.

Comente **ESPETINHO** para receber o caminho do teste.

### SAC 4.0

Pós-venda não é custo: é retenção, aprendizado e recorrência.

O SAC 4.0 organiza atendimento, garantia, qualidade e histórico para sua equipe acompanhar cada cliente com contexto.

Comente **SAC** para conhecer o fluxo.

### Sistemas sob medida

Planilha demais, retrabalho e informações espalhadas são sinais de uma operação que precisa de integração.

A GRIT transforma processos reais em sistemas simples, rastreáveis e prontos para evoluir.

Comente **SISTEMA** e conte qual processo mais trava sua empresa hoje.

## Indicadores semanais

- Alcance por formato e produto.
- Retenção de Reel aos 3 segundos e conclusão.
- Salvamentos e compartilhamentos por alcance.
- Visitas ao perfil e cliques por publicação.
- Conversas iniciadas por palavra-chave.
- Leads qualificados por origem e produto.
- Testes iniciados, ativações e assinaturas.
- Receita recorrente e cancelamentos por coorte/origem.

## Regras operacionais

- Não comprar seguidores ou engajamento.
- Não automatizar curtidas, comentários ou seguidores falsos.
- Não disparar mensagens promocionais sem consentimento.
- Não publicar números, depoimentos ou resultados sem evidência.
- Responder comentários e mensagens legítimas no mesmo dia útil.
- Revisar desempenho toda segunda-feira e substituir formatos abaixo da mediana após quatro testes comparáveis.
