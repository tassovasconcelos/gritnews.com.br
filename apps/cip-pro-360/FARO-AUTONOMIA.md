# Faro: descoberta autônoma com evidências

O cron e o worker existentes continuam sendo os únicos executores pagos. Nenhuma pesquisa é disparada ao publicar ou validar esta evolução. Não se aumenta o teto de 24 tarefas por hora, 576 por dia, duas chamadas web e 3.200 tokens de saída por tarefa. Quotas, pausa, circuito e patrocínio continuam obrigatórios.

## O que muda

Até uma vaga do rodízio geral em cada janela horária é destinada à descoberta de concorrentes fora dos domínios conhecidos. Essa vaga substitui uma pesquisa geral, sem adicionar tarefa. Se o lote não tiver item geral disponível, não há essa exploração. O produto continua respeitando o rodízio de cobertura.

Nos especiais em ciclo expandido, a fase de aprofundamento também pode descobrir fontes públicas. Busca somente exata permanece restrita. A fase é definida pela janela da tarefa, não por um temporizador novo. Os demais recorrentes e as buscas dirigidas por loja/marca seguem a rotina anterior. A descoberta não fica limitada a uma única loja regional.

A instrução de pesquisa diversifica lojas cirúrgicas regionais, distribuidores, fabricantes com venda pública e vendedores de marketplaces. Orienta uso de GTIN, marca/modelo e sinônimos e reformulação quando não encontra anúncio válido, dentro do mesmo orçamento. Isso não garante que duas chamadas cubram todas as estratégias ou fontes.

## Rastreabilidade e reutilização

Ofertas de domínios novos são marcadas como novas fontes para conferência do vendedor. O histórico do SKU guarda vendedor, URL, marca/modelo, preço candidato, embalagem, condições, coleta e pendências. Cidade/UF só entram quando constam de fonte comercial consultada com trecho comprobatório; não significam preço de filial ou frete para uma praça.

A pesquisa recebe domínios e URLs conhecidos de sua empresa/SKU para evitar repetição exclusiva e para poder revalidar fontes anteriores. Novos links podem voltar nas rodadas de descoberta; não se adicionam automaticamente à lista aprovada de domínios nem ao diretório de lojas. Observações e revisões permanecem no contexto especial. Não há treinamento automático do modelo.

## Validação de fontes

O worker recebe a autorização de descoberta do job criado pelo servidor, nunca da página pública. Só esses jobs podem registrar oferta fora dos domínios originais. O banco exige domínios públicos válidos, URLs HTTPS e anúncio presente na lista de fontes retornadas pelo executor. O parser exige que a URL tenha aparecido como fonte da ferramenta web e que o preço esteja no trecho citado. Isso é rastreabilidade, não certificação comercial.

O de/para, as guardas de qualidade, divergências de embalagem/marca e a conferência humana continuam ativos. Fontes descobertas são candidatas, não fornecedores homologados ou preços aprovados. Não há login em concorrente, contorno de captcha, contato externo ou alteração de preço no ERP.

## Verificações

Testes sem chamadas pagas: descoberta usa o mesmo job e o limite de duas ferramentas; não estreita a pesquisa ao alvo regional; conserva URLs públicas e rejeita endereços internos; fonte não citada é descartada; nova fonte recebe identificação.

SQL com rollback: distribuição de uma vaga geral, preservação da seleção especial de dez, lote de 24 sem duplicação, limite de dois claims, prova de URL exigida, rejeição de domínio privado e lease incorreto, persistência em histórico, impossibilidade de ampliar domínios em um job normal e todas as verificações de isolamento e versão da seleção especial.
