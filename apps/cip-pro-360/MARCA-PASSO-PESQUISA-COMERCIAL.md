# Marca-passo: pesquisa de concorrência e inteligência física

Atualizado em 20/10/2026. Este documento define a evolução recomendada para conectar estoque, pesquisa de preços e decisão supervisionada. A pesquisa online feita nesta data é exploratória e não constitui uma cesta de concorrentes auditada.

## Regra de decisão

O motor deve priorizar, nesta ordem, risco de ruptura, contribuição unitária depois das despesas, exposição de capital e cobertura, custo de carregar estoque e referência concorrencial comparável. Um preço baixo visto na internet não autoriza redução. Promoção exige custo confiável, saldo conciliado, demanda recente, equivalência e contribuição mínima/alçada preenchidas. Se faltar dado decisivo, a ação correta é pedir atualização ou validação, não completar por inferência.

Separar três indicadores: custo mensal estimado de carregar o saldo atual (saldo valorizado × 1,5%); exposição acumulada estimada desde a parada somente com data de início confiável; e perda contábil realizada, que exige apuração financeira própria. O acumulado calculado sobre saldo atual é cenário e não reconstitui o capital histórico. Idade de lote e falta de giro não são a mesma medida.

## Amostra de análise da carga Procirúrgica

Na planilha “Produtos PROCIRURGICA 16102026 Correta.xlsx”, aba Produtos, o SKU 138799 (termômetro KF-HW004) aparece com 3.555 unidades e R$ 145.568,36 a custo; média mensal de venda e cobertura estão vazias. A incidência teórica de 1,5% sobre todo esse saldo é R$ 2.183,53 por mês, mas o dado não permite afirmar que o SKU esteja parado. O preço de venda na planilha é R$ 205,90 e a coluna de preço proposto indica R$ 60,00; antes de qualquer decisão, é necessário conciliar essa diferença com preço vigente, canal e custo carregado.

Para o SKU 138801 (oxímetro OXH-78/PRO27), a carga informa 1.329 unidades, custo unitário de R$ 45,60, valor de estoque de R$ 60.602,40, venda média de 62,1 unidades/mês e cobertura aproximada de 21,4 meses. O preço de R$ 46,80 encontrado em varejista online é uma oferta unitária, que deixaria somente R$ 1,20 antes de despesas sobre o custo da planilha; não deve ser copiado como preço-alvo. Uma página de concorrente apresenta o mesmo modelo por R$ 99,99 (R$ 94,99 no Pix), enquanto páginas próprias do grupo mostram preço diferente por canal. A dispersão exige confirmar data, quantidade, frete, canal e condições antes de comparar.

## Cesta e qualidade de referência

Cada referência armazenada deve ter URL/fonte, data e hora da observação, tipo de canal (varejo, marketplace, distribuidor, loja física ou compra pública), CNPJ/razão comercial quando disponível, estado/cidade/filial, SKU concorrente, marca/modelo, especificação, unidade e embalagem, preço à vista e parcelado, frete, quantidade observada, disponibilidade, prazo de entrega, garantia, registro sanitário quando aplicável, responsável da pesquisa e nota de confiança.

Equivalência é graduada como exata (mesma referência/modelo e apresentação), forte (mesma função e especificações críticas), parcial (há diferença de marca, acessório, garantia ou apresentação) ou inválida. O sistema não deve calcular recomendação automática de preço a partir de equivalência parcial/inválida. CATMAT/BPS pode ajudar a padronizar itens e observar aquisições públicas nacionais; ele é uma camada distinta das ofertas atuais do varejo. Consulta ANVISA valida situação de registro quando aplicável, não preço nem equivalência comercial.

Como ponto de partida operacional: 5 ou mais referências independentes, com pelo menos 3 comparáveis exatas/fortes, observadas nos últimos 7 dias, para publicar faixa de mercado. Abaixo disso, mostrar “amostra insuficiente” e listar cada observação. Um anúncio em marketplace, um preço de compra pública e uma página própria do grupo não podem ser consolidados como se fossem concorrentes equivalentes.

## Mapeamento físico de concorrentes

Uma visita gera um registro por filial e produto observado. O fluxo é: localizar a filial; registrar data/hora e pesquisador; pesquisar produto, embalagem e disponibilidade; coletar preço e condições; registrar função profissional declarada do contato (vendedor, gerente, supervisor ou responsável de preços), nome somente quando necessário à continuidade comercial; anexar opcionalmente cotação, foto da etiqueta/produto ou URL; revisar equivalência e evidência; então liberar a referência para a cesta.

Evidência opcional não deve conter rosto, conversa privada ou informação sem relação com a oferta. Priorizar etiqueta/preço, página pública, cotação comercial e contato corporativo. Guardar o mínimo de dados pessoais profissionais necessário, finalidade, fonte, autor e prazo de revisão; controlar acesso e permitir correção/exclusão conforme política interna e orientação do encarregado de dados. Não buscar nem armazenar endereço residencial, telefone pessoal ou dado sensível. Uma pessoa identificada também é dado pessoal; definir base legal e retenção com o responsável de privacidade antes de persistir esse cadastro em produção.

Campos recomendados para a futura tabela de observação: `company_id`, `competitor_id`, `branch_id`, `channel`, `observed_at`, `observer_user_id`, `product_sku`, `competitor_product`, `brand`, `model`, `pack_quantity`, `unit`, `equivalence_grade`, `price_cash`, `price_card`, `freight`, `availability`, `minimum_quantity`, `delivery_days`, `professional_role`, `professional_name` (opcional), `business_contact` (opcional), `source_url`, `evidence_storage_key` (opcional), `confidence`, `review_status`, `reviewed_by`, `reviewed_at`, `expires_at`. Evidências privadas precisam de storage privado, política de acesso por empresa, limites de tipo/tamanho e trilha de auditoria; não publicar em bucket público nem no pacote estático.

## Próximas entregas

1. Concluir qualidade dos dados no Marca-passo: custo atual e data de captura, alerta acima de 36 horas, distinção de custo médio vs custo de reposição e bloqueio de preço quando a fonte está parcial ou antiga.
2. Criar registro manual assistido de observação online/física, armazenamento privado de evidência e revisão antes de usar como concorrência. Nesta fase, busca web abre fontes para checagem humana; não faz scraping nem atualização contínua.
3. Conciliar snapshots de estoque/venda por filial e produto; calcular giro, cobertura, exposição mensal e acumulada observada; tratar item sem histórico como “sem base”, não como parado.
4. Construir cesta de concorrentes por produto/canal/região, com equivalência, preço normalizado por unidade, amostra mínima e tendência temporal.
5. Gerar ações supervisionadas com rating justificável: ruptura e risco de contribuição bloqueiam descontos; excesso/capital, carga de 1,5% e diferença de mercado podem elevar prioridade de campanha; cada ação mostra benefício esperado, perda máxima, premissas, confiabilidade e aprovação responsável. Não automatizar alteração de preço na primeira fase.

## Fontes oficiais e limite de uso

- BPS/Ministério da Saúde: compras públicas e privadas de medicamentos e dispositivos médicos, com CATMAT para padronização; usar como série de compras públicas, não como monitor de varejo. https://www.gov.br/saude/pt-br/acesso-a-informacao/banco-de-precos
- Painel BPS permite acompanhar preços de compras em todo o Brasil e histórico de aquisições: https://www.gov.br/saude/pt-br/acesso-a-informacao/banco-de-precos/painel/
- ANVISA: consulta de registros de produtos sujeitos à vigilância sanitária: https://www.gov.br/anvisa/pt-br/sistemas/consulta-a-registro
- ANPD: legítimo interesse requer finalidade e análise de necessidade/salvaguardas; a empresa deve validar a hipótese legal e retenção para dados de contatos profissionais: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_hipoteses_legais_tratamento_de_dados_pessoais_legitimo_interesse

## Fontes de preço verificadas para a amostra

Consulta em 20/10/2026. São ofertas observadas na web, sujeitas a mudança, disponibilidade, frete, condição e região. Links para concorrentes externos e páginas do próprio grupo devem permanecer identificados separadamente.

- Oxímetro OXH-78/PRO27 anunciado por R$ 99,99 ou R$ 94,99 no Pix: https://healthclean.com.br/produtos/oximetro-de-dedo-digital-oxh-78-pro27-procirurgica-rhm1z/
- O mesmo modelo aparece em marketplace por R$ 59,00 em anúncio com frete promocional variável: https://www.mercadolivre.com.br/loja/guerreiros?category_id=MLB6284&client=recoview-selleritems&item_id=MLB4164266275&official_store_id=220302&recos_listing=true
- Prohospital publica o modelo OXH-78/PRO27 por R$ 69,90 na página consultada: https://www.prohospital.com.br/linha-pulmonar/oxigenioterapia/oximetros
- Shopping Prohospital lista o SKU 138801 por R$ 99,00, diferença de canal/unidade de negócio que precisa ser entendida antes de fixar um preço único: https://www.shoppingprohospital.com.br/linha-pulmonar/oxigenioterapia/oximetros/oximetro-de-pulso-dedo-oxh-78-pro27-procirugica
- Termômetro modelo KF-HW004 anunciado por R$ 82,53 no Pix ou R$ 86,87 no cartão em marketplace; modelo e função testa/ouvido coincidem, mas marca/garantia e registro ainda precisam de validação: https://www.magazinevoce.com.br/magazinehardmob/termometro-infravermelho-kf-hw004-healt-clean/p/hkg0959fb2/cp/term/?seller_id=stpsmei
- Outra oferta do KF-HW004 anuncia R$ 66,49 no Pix e informa 3.426 unidades; trata-se de uma declaração do vendedor, não disponibilidade verificada de forma independente: https://healthclean.com.br/produtos/termometro-infravermelho-2-em-1-testa-e-ouvido-5c173/
