# Cadastro de produtos direto do Procfit

Origem: SQL Server já acessível pelo VPS e VPN existentes, views `st.TASS_D_PRODUTOS` e `st.TASS_D_PRODUTOS_EAN`. Não consulta nem altera o ROTA PRO. Produtos e EANs ficam separados para não multiplicar o cadastro ao relacionar vários códigos de barras.

Preservados todos os campos disponíveis: código, nome, seção, grupo, subgrupo, marca, família, grupo de marca, NCM, unidade e data de inclusão; registros EAN com código original, formatado e indicadores interno/impresso/válido. Códigos numéricos são serializados como texto decimal exato, sem conversão para ponto flutuante. EAN é texto, preservando zeros. Valores vazios permanecem vazios e aparecem como “Não informado”. Não se infere produto ativo, venda, preço ou disponibilidade deste cadastro.

`ops/cip-procfit/catalog.py` faz SELECT somente nas duas views, valida chaves e vínculos, guarda captura privada no VPS e transmite blocos de até 500 linhas. O endpoint `cip-procfit-catalog` exige assinatura Ed25519 do VPS, contrato específico e horário de envio válido. Chave privada permanece no VPS. Nunca colocar o arquivo de captura em repositório ou pacote público.

O lote fica em preparação até a conferência de contagens, nomes e vínculos. Publicação troca atomicamente o lote ativo. Lotes publicados são imutáveis; reenvios são idempotentes. Histórico anterior fica preservado; não apaga produtos de outras bases ou altera relatórios financeiros. A consulta `cip_procfit_catalog_search` tem paginação, filtro de marca e busca por código, nome, marca, grupo de marca ou EAN. Acesso inicial somente superadm ativo, com RLS; ampliar acesso exige definição explícita de escopo empresarial. Nenhum dado de catálogo é empacotado no site estático.

Tela: **Procfit & relatórios → Catálogo de produtos Procfit**. Mostra horário da captura e alerta após 24 horas; ficha expande todos os campos e EANs. Cadastro global da origem não comprova associação a cada empresa/filial. Data de inclusão não é data da última alteração. Indicador VALIDO preserva o ERP, não comprova validação GS1 independente.

Executar nova carga no VPS: `/opt/procfit/venv/bin/python /opt/cip-procfit/catalog.py`. A primeira carga é pontual. O timer existente de dez minutos continua verificando metadados de locação; não foi convertido silenciosamente para recarregar mais de cem mil registros a cada execução. Evolução recorrente requer controle de mudanças/remoções na origem e retenção de capturas. Duas leituras sob isolamento padrão não representam um corte transacional comercial; divergência de vínculos bloqueia publicação e exige nova captura.

Verificação: testes de validação, assinatura, escape HTML, manifesto estático e testes SQL em transação revertida (`schema/procfit-catalog.verify.sql`), incluindo bloqueio de publicação parcial, EAN órfão e reenvio em lote publicado. Conferir também negações de acesso anônimo/usuário sem superadm e consulta real autenticada após publicação.
