# Doquita no Telegram — estoque de referência e briefing opcional

## Resposta executiva unificada

Atualização de 19/10/2026: resultados de estoque começam pelo custo declarado das referências consultadas, com qualificação imediata de parcial e não conciliado. A composição por CD/lojas, datas, identificação dos lotes e memória de cálculo vêm em seguida; o ranking global exibe até cinco linhas entre as fontes, mantendo o denominador de todas as linhas do filtro. Não somar quantidades sem unidade de fornecimento nem contagens de SKUs entre fontes. Pedido que menciona CD e lojas consulta ambas as origens. /unidades preserva a estratificação por código.

`telegram/executive-reports.mjs` reúne respostas autorizadas por empresa, distingue base aprovada de referência e explicita empresas sem dados. Uma referência não complementa o saldo de uma base aprovada da mesma empresa; não entra no total conciliado de outra empresa. Estoques aprovados somente são somados quando captura e base de valorização coincidem; vendas exigem o mesmo período. Cobertura parcial nunca vira total da empresa. Não se soma um ranking limitado para inferir valor de todo o estoque sem vendas. Ausência de idade por lote permanece indisponível mesmo quando existe recorte antigo da planilha.

A próxima ação responde às pendências encontradas: conferir custos quando há divergências ou zeros; caso contrário, validar saldo, embalagem, reservas e demanda dos maiores itens antes de preço/transferência. Marca passo mantém os motivos de prioridade da base ERP. Não houve mudança de permissões, aprovação de fontes ou inscrição em rotina. O briefing já autorizado usa o novo formato; sem novos destinatários ou disparos de teste.

Verificação desta evolução: 159 testes locais passaram, incluindo handler com rede simulada para texto, áudio transcrito, fallback, segredo inválido, vínculo revogado e falha de leitura. Consulta autorizada em leitura às fontes reais conferiu resposta e memória de cálculo em arquivo reservado fora do repositório. A renderização do conteúdo real coube em uma mensagem; não comprova entrega em aparelho ou nova transcrição real. Dados e valores privados não foram adicionados ao código público.

## Entrega
Consultas privadas disponíveis para superadm e diretoria, revalidadas por empresa a cada pedido. CD e lojas permanecem fontes separadas; somente Shopping possui estas cargas nesta revisão. Acesso à Distribuidora não concede acesso à Shopping. Arquivos, linhas, custos e valores reais permanecem no banco privado, fora do Git e do pacote estático.

| Comando | Resultado |
|---|---|
| /bases | Fontes, cobertura, origem, datas e custo declarado de cada fonte |
| /cd | Saldo do arquivo do CD 100, sem inferir idade ou vendas |
| /lojas | Recorte das lojas; pode acrescentar `loja 5` |
| /produto CODIGO | SKU, descrição ou marca; consulta CD e lojas separadamente; pode acrescentar `loja 5` |
| /unidades | Custo declarado por código de loja, sem somar quantidades de produtos |
| /conferencia | Custos unitários zero, divergências e preço cadastrado abaixo do custo unitário |
| /prioridades | Cinco maiores linhas por custo de cada fonte e pauta de Giro, Prisma/Cifra, Elo e Sofia |
| /rotina | Ver situação e botões para ativar/desativar briefing diário |
| /rotina ativar | Autorizar briefing diário da Shopping no próprio chat privado |
| /rotina desativar | Interromper o briefing |

Interpretação por regras funciona sem chamadas de IA para os pedidos reconhecidos. Texto livre e voz usam a configuração OpenAI existente; áudios continuam limitados a três minutos e 10 MB. Respostas são texto, calculadas a partir do banco, sem números gerados pelo modelo. /estoque, /parados e /giro usam referências identificadas quando falta base financeira aprovada. /parados não passa a comprovar idade por lote. /vendas e /semvendas continuam exigindo evidência adequada.

## O que as fontes permitem
Custo declarado, ranking e concentração por unidade, busca de produto, saldo de origem por SKU/unidade, comparação dos campos de custo/preço disponíveis e pauta de conferência. Mesmo SKU no CD e em lojas pode ser localizado, mas isso não comprova equivalência de embalagem, estoque disponível para transferência ou demanda. CSV completo continua no painel Estoque Inteligente. Bot mostra cinco linhas por origem e os totais do filtro, sem fingir que é a lista completa.

CD não tem data do saldo, preço ou movimentação. Lojas são recorte +180 dias, com data-base deduzida e indicador da origem baseado na movimentação mais recente entre venda e entrada. Não equivalem a idade original do lote, inventário total da empresa, vendas, cobertura, lucro ou margem realizada. Atualização da planilha é pontual; a verificação Procfit a cada dez minutos não repõe automaticamente esses arquivos.

## Rotina e segurança
Ninguém foi inscrito automaticamente. Ativação/desativação exigem chat privado, vínculo ativo, perfil elegível e acesso Shopping; são auditadas. O briefing é da Shopping, independentemente da seleção interativa de empresa. Suspensão, revogação do vínculo e remoção do acesso Shopping impedem novos envios.

pg_cron verifica a cada dez minutos entre 08h00 e 19h59 de Brasília. Quem ativa durante a janela pode receber no próximo ciclo; fora dela, a partir do dia seguinte. Até cinco destinatários por ciclo e uma tentativa por usuário/dia, com claim atômico e status claimed/sent/failed. A opção conservadora evita reenvio após falha ambígua; não há garantia de entrega nem repetição automática. O usuário pode consultar /bases. Sem mudanças de dados, o briefing repete a mesma referência e suas datas, sem apresentar novidade fictícia.

O disparador usa segredo do webhook armazenado no Vault em cabeçalho interno, nunca no código do cron, no navegador ou em respostas. RPCs internas são service-only. SQL agrega no servidor, verifica contagens e valores do lote antes de servir, e limita detalhes. Não baixa toda a planilha para a Edge Function a cada pergunta. Mensagens têm proteção contra encaminhamento pelo recurso do Telegram; isso não impede captura de tela.

## Verificação e limites
Testes de roteamento, filtros e renderização com fixtures sintéticas. Testes transacionais sobre as fontes reais verificaram integridade, limites, isolamento de empresa/chat, suspensão e opt-in, com rollback. Handler exercitado com rede simulada: CD, fallback, tela da rotina, segredo incorreto e rotina sem inscritos. Nenhuma mensagem real enviada nos testes. Homologação de voz e entrega no aparelho do usuário continua sendo uma etapa real.
