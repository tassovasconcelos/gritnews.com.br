# Marca-passo — F1 e plano incremental

Reaproveitar pricing-engine.mjs (piso, contribuição, alçada e concorrência), stock-action-engine.mjs (quantidade, reservas e elegibilidade), central de ações/RPCs e histórico existente. README na raiz não existe; README do aplicativo e testes foram lidos.

F1: funções puras de custo de carregamento, cobertura/CMV, capital excedente, piso de liquidação, compensação de volume e score com componentes completos. Sem score quando faltam componentes; sem probabilidade de venda inventada. Taxa gerencial de1,5% ao mês confirmada pelo solicitante. O cenário não é despesa/prejuízo realizado. Soma de receita/caixa e contribuição não é ganho.

Dados pendentes: TI/administrador Procfit libera vendas diárias180dias, reservas, saldos e unidades por filial/canal; Comercial/Compras valida equivalência/condições/concorrentes; Financeiro valida custo, tributos, despesas variáveis, contribuição e alçadas; direção aprova cobertura, taxa e regras. Estes são papéis propostos, não nomes atribuídos a pessoas nem integrações ativadas.

PRs previstos: F1fórmulas; F2dados/RLS/carga; F3modos/rating versionado; F4fila/alçadas; F5medição/reversão; F6concorrência/B2G; F7explicação por IA. Cada etapa depende de evidência e revisão. Melhorias de apresentação da central atual não equivalem à implementação deF2–F7.

Condições: mesma filial/canal, janela e base de estoque/CMV antes de usar coverageEconomics. Componentes de scoreMP são normalizados0–1 com política/fonte, não valores brutos. Pesos30/20/20/15/15 somam100; configuração exige versionamento e aceite antes de gerar fila. Ausência não vira zero. priceEconomics usa despesas já somadas no percentual, acrescidas de despesa monetária por unidade; não somar tributo em duplicidade. A comparação econômica usa mesmo volume hipotético e risco informado uma única vez. Sem elasticidade ou previsão implícita. Contribuição proposta não positiva torna a compensação de volume indisponível.

F1não autoriza liquidação abaixo da contribuição mínima. O servidor atual mantém seu bloqueio; exceção de diretoria com validade/obsolescência ainda exige desenvolvimento específico e aceite. Máximo5ações/dia, unicidade SKU/canal/filial, auditoria nova de política e mediçõesD+7/14/30 continuam no plano; não são declarados ativos por estas funções.
