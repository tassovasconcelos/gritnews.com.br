# Marcas, especialidades e qualidade do Faro

## Referências cadastradas

13 páginas, nove marcas. As três páginas ativas da Dellamed são a loja própria, o perfil Shopee e o perfil Mercado Livre. O institucional é complementar, pausado para não duplicar pesquisa. A URL do Mercado Livre foi fornecida pelo responsável e retornou 403 na verificação; conta e selo oficial não foram certificados. O perfil Shopee foi visto publicamente, sem certificação independente do selo.

Supermedy, Hidrolight, Mercur (loja), Convatec, Coloplast, Hollister e B. Braun participam como fontes de catálogo ou preço quando público. O catálogo institucional Mercur é complementar à loja e permanece pausado. A Procirúrgica é referência do próprio grupo, fora da pesquisa concorrencial paga. Fonte institucional não significa preço disponível, condição de distribuidor ou oferta equivalente.

As URLs de origem estão no arquivo de configuração de referências públicas `market-watch-sources.json`. Foram removidos parâmetros de anúncios e rastreamento; identificadores funcionais de vendedor não são removidos pelo normalizador. Não foram usadas áreas privadas nem variantes admin, staging ou homologação dos fabricantes.

## Categorias

Mobilidade, órteses, dietas/nutrição, meias de compressão, bolsas/estomias, curativos, camas hospitalares, luvas, máscaras descartáveis, CPAP/BiPAP, máscaras para CPAP e consumo hospitalar. Categorias são organizacionais; não certificam indicação clínica. A ausência de uma nova página de marca em determinada categoria não impede o acompanhamento do SKU nas fontes regionais existentes.

Os fabricantes foram vinculados apenas a categorias de referência relevantes; isso não comprova cobertura integral do portfólio ou disponibilidade de cada SKU. A classificação é sugerida pela descrição original, sem substituir grupos oficiais do ERP. Brand, GTIN, modelo, tamanho e códigos continuam sujeitos à evidência.

## Rodízio existente

Sem nova agenda ou aumento dos limites: 24 tarefas/hora, até quatro recorrentes prioritárias, limite 576 tarefas/dia, até duas chamadas web por tarefa. Nas tarefas de rodízio, aproximadamente uma em cada três seleções pode priorizar uma página de marca compatível com marca ou categoria; as demais mantêm as lojas regionais. Quando não há página compatível elegível, a seleção continua regional. Domínios não repetem na mesma janela e o tempo desde a última seleção permanece critério.

Uma fonte de marca diferente pode gerar análise de alternativa de mix. O modo é explicitamente `alternatives`; não gera equivalência de preço nem troca clínica. Identidade do nosso SKU e critérios originais não são substituídos pela marca da fonte.

A consulta começa pela página acompanhada e o domínio permitido. Marketplaces exigem vendedor identificado dentro do escopo Dellamed e trecho literal que identifique esse vendedor. Perfil, marca, fabricante e plataforma não são automaticamente o mesmo vendedor. Os resultados continuam candidatos; o vínculo à conta oficial exige conferência.

O mesmo cadastro está disponível nas duas empresas com RLS. Shopping executa; Distribuidora continua pausada até existir portfólio ABC explícito. Habilitar uma página não ativa a empresa nem dispara pesquisa naquele momento.

## Qualificação de evidências

A qualificação básica é calculada no servidor e também no coletor. O histórico exibe os resultados originais acrescidos da qualificação atual; não reescreve preços, vendedor ou descrições originais. Catálogos/listagens/perfis, vendedores genéricos e preço vindo de página bloqueada são mantidos para auditoria, mas não podem virar referência pelo fluxo do Radar.

Massa e volume são normalizados: 100 g vs 60 g bloqueia correspondência, enquanto 1 L vs 1000 mL não é uma divergência. Também há conferência de tipo de estomia, sistema de uma/duas peças, compressão em mmHg, interface nasal/oronasal e equipamento/máscara/acessório CPAP. Valores ausentes não são fabricados e continuam exigindo revisão. Essas verificações não certificam substituição clínica nem todos os atributos possíveis.

Um resultado sem bloqueio básico ainda exige todas as conferências humanas existentes: produto, embalagem, preço total à vista, frete, disponibilidade, termos e canal. Não representa aprovação ou aplicação no ERP.

35 sinais derivados que falharam na requalificação inicial foram marcados como superados. Coletas originais e preços foram preservados; nenhuma referência financeira existente foi alterada. O evento `market_quality_audit` registra quantidade e versão da regra.

## Usabilidade e verificação

Radar B2B2C possui painéis recolhíveis para marcas/especialidades e diretório regional, evitando que dezenas de fontes empurrem a seleção do produto para o final da página. Há filtro de fontes por categoria e marca e filtro de qualidade no de/para. Diretoria/superadm podem pausar/ativar páginas elegíveis com justificativa e controle de versão. Referência própria não pode ser ativada como concorrente por esse comando.

Os painéis apenas consultam o banco, sem pesquisa paga ao abrir, filtrar ou atualizar. Respostas antigas de outra empresa são descartadas. Leituras periódicas ficam suspensas com o painel recolhido. Dados de negócio não são colocados no cache offline do PWA.

Validação: testes de identidade, URLs, escopo de marketplace, massa/volume, especialidades, autorização, rodízio e promoção bloqueada; testes SQL em transação desfeita, sem dispatch; validação de pacote/publicação. Não foi feita homologação visual autenticada no navegador.

## Fontes públicas consultadas

- https://www.dellamed.com.br/loja/
- https://shopee.com.br/dellamed
- https://www.mercadolivre.com.br/loja/dellamed (leitura bloqueada)
- https://www.supermedy.com.br/loja
- https://hidrolight.com.br/produtos/
- https://loja.mercur.com.br/
- https://mercur.com.br/produtos/saude/
- https://www.procirurgica.com.br/
- https://www.convatec.com/pt-br/
- https://www.coloplast.com.br/
- https://www.hollister.com.br/pt-br
- https://www.bbraun.com.br/pt.html

Stock, custos e tabelas por loja continuam sujeitos à conciliação do Procfit. A base de 19/10 não é giro atual. Sem carga conciliada, o Marca-passo continua em preparação e simulação assistida.
