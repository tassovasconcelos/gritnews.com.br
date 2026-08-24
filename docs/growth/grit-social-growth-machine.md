# Máquina de crescimento social — GRIT

Atualizado em 24/08/2026.

## Linha de base

- Instagram: `@grit.solucoes`
- 17 publicações, 134 seguidores e 530 perfis seguidos.
- Nove publicações recentes apareceram no Business Suite sem legenda.
- Melhor alcance observado na amostra: Reel com 64 impressões e 54 contas alcançadas.
- Os Reels de 16 segundos tiveram retenção média curta (aproximadamente 2–7 segundos).
- Facebook: a atualização de capa observada teve zero interação.

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
