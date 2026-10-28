# Auditoria do diretório regional do Faro

Fonte autorizada: Clientes Theramart.XLS, 484 registros. Data cadastral declarada na planilha: 26/10/2026. Importação no CIP: 27/10/2026 (Brasília). A lista é referência fornecida, não censo nacional, certificação de loja cirúrgica ou comprovação de relação comercial atual.

## Resultado

| Critério | Resultado |
|---|---:|
| Registros preservados | 484 |
| UFs extraídas do endereço | 26 |
| Pares cidade/UF após padronização textual | 164 |
| Registros com cidade extraída | 472 |
| Cidade pendente | 12 |
| UF pendente | 2 |
| Sem site informado | 107 |
| Referências próprias identificadas | 18 |
| Registros candidatos ao rodízio | 346 |
| Domínios candidatos distintos | 190 |
| Duplicatas exatas por nome e endereço normalizados | 0 |

Segmentos são sugestões pelo nome (cirúrgica/hospitalar, ortopedia, distribuição, locação e a confirmar). Filiais da mesma rede e domínios repetidos são preservados como referências de localização. Nome repetido não prova duplicidade. Cidade/UF extraídas não foram todas validadas em fontes externas; não há coordenadas inventadas.

Foram excluídos do rodízio concorrencial os 18 registros com Shopping Prohospital e fontes sem site comercial elegível, incluindo links apenas sociais. Telefones e e-mails não foram importados. A planilha e as linhas completas não fazem parte do pacote público do site. Registros ficam no banco com RLS por empresa, fonte/hash e linha de origem. O mesmo diretório está disponível às duas empresas autorizadas, sem conceder acesso cruzado a usuários.

## Distribuição por UF informada

SP 177; MG 45; PE 28; RJ 28; PR 25; CE 21; BA 17; RS 17; GO 15; ES 14; RN 13; PA 11; SC 9; AL 8; MT 8; PB 7; SE 7; DF 6; PI 6; AM 5; MA 5; TO 4; MS 3; AP 1; RO 1; RR 1; sem UF 2. Ausência de AC nesta lista não significa ausência de mercado.

## Funcionamento

Acesso: Radar B2B2C → Lojas cirúrgicas e referências regionais. Filtros por região, UF, cidade, loja, domínio ou segmento. Diretoria/superadm podem registrar conferência de localização com fonte pública, justificativa e versão do registro, além de pausar/retomar uma fonte elegível. Isso não certifica preços.

O Faro usa os mesmos jobs cip-faro-hourly e cip-faro-worker. Shopping: 24 tarefas/hora, até quatro produtos prioritários mantidos nas fontes existentes; demais tarefas de rodízio podem pesquisar um SKU em um domínio do diretório. Limite de 576 tarefas/dia e duas chamadas web/tarefa preservado. Nenhuma nova agenda ou pesquisa de demonstração foi criada.

Rodízio regional favorece domínios há mais tempo sem seleção e não repete domínio na mesma janela horária; depois alterna os registros/locais vinculados ao domínio. Novas pesquisas dependem dos SKUs elegíveis, das tarefas efetivamente processadas, do circuito e da capacidade. Não cobre todos os 484 registros, 190 domínios ou todos os SKUs a cada hora. Uma consulta a um SKU não representa leitura integral do catálogo do site. Distribuidora continua pausada, aguardando portfólio ABC explícito; o diretório permanece consultável.

Seleção da fonte, pesquisa concluída e evidência com preço têm datas distintas. Pesquisa vazia é válida. Uma falha preserva a última coleta concluída. Os preços ficam como candidatos com URL, vendedor, produto, coleta, correspondência e pendências. Localização cadastral não converte oferta nacional em preço da filial. Frete, marca, variante, embalagem e pagamento devem ser conferidos; sem comparabilidade não há gap ou queda comprovados.

O painel relê o banco a cada minuto enquanto visível, sem chamadas ao modelo. Alterações de sites são detectadas na próxima consulta bem-sucedida; não há webhook ou garantia de detecção instantânea de qualquer alteração externa.

## Validação pública inicial

Amostra consultada em 27/10/2026, separada da execução automática do Faro:

- CareShop: https://www.careshop.com.br/ informa lojas em Araraquara/SP e São Carlos/SP e catálogo TheraMart, Sigvaris, Venosan e outras marcas. Não comprova preço por filial.
- Santa Apolônia: https://www.santaapolonia.com.br/theramart oferece produtos da marca no e-commerce. Exemplo individual: almofada Theraactive TM312_BR, https://www.santaapolonia.com.br/produtos/almofada-theraactive-theramart-para-costas-e-lombar-2973300, preço candidato de R$224,96 no Pix e R$236,80 no cartão na página consultada. Frete/CEP e disponibilidade exigem conferência; nenhuma equivalência com SKU próprio foi presumida ou preço promovido.

## Próximas melhorias dependentes de dados

1. Conferir as 12 cidades pendentes e os dois registros sem UF, preservando a origem.
2. Validar situação, domínio oficial, segmento e locais de atendimento das referências candidatas. Links bloqueados e lojas com preço somente por CNPJ permanecem com lacunas explícitas.
3. Atualizar e conciliar estoque, custos e tabelas por empresa/loja pelo Procfit. A base de 19/10 não é estoque atual nem demonstra giro.
4. Priorizar pares produto/concorrente por marca, GTIN, embalagem e mix comprovados; não ampliar limites sem decisão explícita.
5. Medir resultados com vendas líquidas e contribuição por loja/período. Sem histórico, não prever elasticidade ou aumento de vendas.
