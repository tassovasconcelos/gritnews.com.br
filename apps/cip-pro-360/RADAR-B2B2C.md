# Radar B2B2C — Faro / Atlas / Prisma / Doquita

Entrega de 27/10/2026, complementar ao Radar B2G existente.

## Operação

1. Abra **Radar B2B2C · Faro** em Todas as soluções ou **Pesquisar mercado** no produto da mesa do Marca-passo.
2. Selecione empresa, SKU e unidade da base real. O radar usa o preço observado identificado na origem; não substitui carga antiga por dado atual fictício.
3. Complete marca, modelo, GTIN válido, tipo, medidas e especificação. Informe quantos itens físicos contém a nossa unidade de venda. CX não significa automaticamente 100 unidades.
4. Escolha domínios. Presets: Mercado Livre, Magalu, Amazon Brasil, Cirúrgica Store, Medjet, Cirúrgica Paulista e Cirúrgica Fernandes. Inclua outros concorrentes de varejo, atacado ou distribuição, até oito domínios por rodada; desmarque presets para reservar espaço. Cadastros dos sites não significam conexão às respectivas APIs.
5. Escolha identidade ou exploração de similares. Informe a praça. Autorize a rodada paga e pesquise. Repita com outros domínios ou atributos para aprofundar. O histórico de links anteriores é usado como orientação para diversificar a pesquisa, sem garantir resultados novos.
6. Compare título, vendedor, link, marca/modelo, embalagem, trecho de evidência, preço, frete, disponibilidade declarada e limitações. Datas da coleta, da nossa base e do preço na fonte são distintas.
7. Abra a fonte, confira a variante, disponibilidade, frete, termos e vendedor. Revise o de/para como referência, alternativa de mix ou descarte. Diferenças técnicas detectadas e alternativas de marca não podem ser promovidas como equivalentes.
8. Ao criar referência, confirme valor total, quantas de nossas unidades a oferta contém, praça, condição e canal. A referência usa a data da conferência em Brasília. Referências anteriores deste mesmo SKU/link/vendedor/unidade/canal originadas no radar são retiradas da comparação; a evidência original permanece. Uma coleta anterior não substitui outra mais recente já revisada.
9. Abra o Marca-passo e escolha o mesmo canal da referência. A mesa continua exigindo regra financeira, despesas, fonte conciliada e alçada para aprovar planos. A integração não escreve preços no ERP ou marketplace.

## Leitura do de/para

| Classificação | O que significa | Uso |
|---|---|---|
| Mesmo GTIN | Código válido normalizado corresponde e não houve divergência explícita | Priorizar conferência da oferta/embalagem |
| Marca e modelo correspondentes | Atributos informados coincidem | Conferir todas as especificações |
| Similaridade | Sobreposição de termos e atributos; identidade não certificada | Revisão humana integral |
| Alternativa de marca | Marca diferente, sem equivalência presumida | Análise de mix/cotação; fora da referência equivalente |
| Divergência | Modelo, aplicação, material, esterilidade, medida, GTIN ou produto/acessório conflitante | Fora da comparação equivalente |

O índice é uma heurística de ordenação, não probabilidade de acerto, certificação técnica, clínica ou regulatória. A pesquisa por inteligência encontra e estrutura os candidatos; o motor local explicita correspondências e divergências. As decisões ficam versionadas por observação e podem orientar rodadas posteriores, sem treinamento automático de modelos.

Preço normalizado de cenário = `(preço total + frete conhecido) × itens da nossa embalagem ÷ itens da embalagem concorrente`. Só é calculado com quantidades positivas, BRL e frete conhecido; ausente não é zero. Alternativas/divergências não geram preço normalizado para nossa comparação. O número não certifica impostos, mínimo, Pix/cartão, habilitação CNPJ ou equivalência. A referência final usa as quantidades equivalentes confirmadas pelo responsável.

## Coleta, cobertura e custo

- Pesquisa web pública pelo serviço existente de inteligência, modelo `gpt-5-mini` com ferramenta web obrigatória. Reutiliza a chave já configurada no backend; não cria nem expõe credenciais.
- Até seis chamadas web e 24 candidatos por rodada; até dez rodadas por usuário/dia e 30 por empresa/dia (Brasília), com proteção transacional de orçamento e contra pesquisa simultânea do mesmo usuário. Esses são limites de uso, não um teto financeiro garantido em reais.
- URLs precisam aparecer nas fontes efetivamente retornadas pela busca e pertencer aos domínios solicitados. Links com credenciais, portas não padrão, parâmetros de sessão e páginas de login/checkout são descartados; rastreadores comuns são removidos.
- Preço extraído só é mantido se o trecho possuir o mesmo valor explícito em reais. O trecho vem do provedor: não substitui a confirmação da página pelo responsável. Frete e embalagem desconhecidos permanecem desconhecidos.
- Não se afirma varredura integral, preço em tempo real, acesso a todos os vendedores, conexão às APIs dos marketplaces ou quantidade disponível auditada. Um domínio selecionado pode não gerar fonte ou resultado. Catálogos sem preço público podem gerar somente pistas para cotação.
- Login, CAPTCHA, CNPJ, CEP, conteúdo dinâmico e restrições de indexação limitam a coleta. O radar não faz login em concorrentes, não contorna bloqueios e não compra produtos. Integrações oficiais de ML/Magalu/Amazon são uma etapa independente, com credenciais e escopos próprios.
- Não foi introduzida coleta contínua ou rotina paga automática. O B2G e os agentes existentes continuam disponíveis.

## Segurança e validação

- Autenticação real e perfil comercial autorizado antes de acessar configuração, consumir pesquisa ou revisar referências; autorização revalidada após a coleta.
- `cip_market_runs` e `cip_market_offers` com RLS por empresa; cliente não pode escrever diretamente. Operação de conclusão exclusiva do serviço. Funções privilegiadas em schema privado, wrappers públicos invoker e privilégios explícitos.
- Custos, estoque, margens e preço interno não são enviados ao provedor; somente descrição, unidade, atributos informados, domínios e links públicos anteriores. Resultados e dados comerciais não são guardados em localStorage nem no cache PWA.
- Payload, saída, links, quantidade de fontes, duração e chamadas limitados. Instruções nas páginas são tratadas como conteúdo não confiável; o modelo não possui ferramentas para alterações de negócio.
- Testes unitários de correspondência, medidas, fontes, preço ausente, cotas, autorização e persistência; testes SQL em transação com rollback (inclusive criação de referência, substituição, divergência, concorrência, cotas e isolamento); teste isolado da interface e axe estrutural sem contraste. Não equivalem à homologação visual em aparelho nem a uma pesquisa comercial real autenticada.
- Serviço instalado; inteligência existente confirmada habilitada e com chave configurada, sem expô-la. Nenhuma referência comercial ou preço real foi criado durante os testes; a primeira pesquisa operacional deve ser iniciada por usuário autorizado no CIP.

## Próximas etapas

- Conectores oficiais e feeds de parceiros, quando as credenciais, termos e escopos forem homologados; manter a proveniência de cada captura.
- Monitoramento agendado opt-in por produto/fonte, orçamento, validade e alertas. Precisa de limites e autorização próprios antes de consumir buscas em segundo plano.
- Catálogo mestre homologado com GTIN/embalagem/marca/modelo por SKU; validação de enriquecimento vindo do Procfit. Os campos informados nesta versão não reescrevem o cadastro mestre.
- Histórico de variação normalizado e alertas considerando mesma variante, praça, vendedor, canal, impostos e forma de pagamento. Uma mudança de condição não deve parecer simples alteração de preço.

Fontes técnicas consultadas: [busca web OpenAI](https://platform.openai.com/docs/guides/tools-web-search), [itens e buscas Mercado Livre](https://developers.mercadolivre.com.br/itens-e-buscas), [Google Custom Search](https://developers.google.com/custom-search/v1/overview). O caminho adotado reutiliza a infraestrutura de busca existente, sem presumir acesso anônimo irrestrito às APIs comerciais.
