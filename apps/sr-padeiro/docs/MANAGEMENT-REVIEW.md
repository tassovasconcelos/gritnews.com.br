# Gestão ampliada do Sr. Padeiro

Entrega de 30/10/2026 em `feat/sr-padeiro-gestao-plataforma`, baseada na versão principal que já incorporou as entregas anteriores de operações e contas administradas. Esta etapa não foi publicada e não alterou banco, clientes, usuários, estoque ou cobranças de produção.

## Experiência entregue

| Área | Comportamento |
| --- | --- |
| Operação no computador | Menu lateral, área ampla e conta ao lado dos produtos. |
| Tablet | Produtos e conta lado a lado, navegação inferior e controles de toque. |
| Celular | Grade de produtos, atalho para a conta, navegação inferior e formulários em uma coluna. |
| Conta em atendimento | Permanece ao alternar entre telas. A troca de loja fica bloqueada enquanto houver itens. Atualizar/fechar o navegador ainda pode descartar a conta não confirmada. |
| Lojas | Seleção da loja ativa. Vendas de hoje, estoque e caixa seguem a loja escolhida; relatório gerencial é explicitamente consolidado de todas as lojas. |
| Gestão | Períodos de 7/30/90 dias, faturamento, quantidade de vendas, ticket, despesas, compras recebidas, custo dos itens vendidos e resultado gerencial. |
| Análise | Movimento por dia, distribuição dos pagamentos, produtos com maior venda e até 100 vendas recentes com identificação do operador; exportação CSV. Indicadores consideram todo o período, não apenas as 100 vendas da lista. |
| Compras e estoque | Recebimento por produto, fornecedor, referência, quantidade e custo; entrada automática no estoque. Contagem física, mínimo e diferença registrada no histórico. Últimos 50 recebimentos e 100 movimentos. |
| Despesas | Registro de despesas operacionais com descrição, categoria e loja. Não cria pagamento bancário nem débito automático no caixa de atendimento. |
| Personalização e pessoas | Preserva logo, recibo, impressora, equipe, perfis e contas administradas; acrescenta novamente o controle de cor na operação. |
| Super Admin | Amplia a ficha com Resultados, Estoque e compras e Implantação e cobrança. Preserva a criação de clientes, contas, acompanhamento consultivo e controle de acesso da versão principal. |

## Implantação e cobrança

- Novo cliente continua começando em homologação, sem cobrança. A ficha permite registrar configuração inicial, treinamento, pronto para operar e produção.
- A promoção para produção exige etapa salva como pronta, conta ativa de gestão com e-mail confirmado, produto ativo de modalidade definida e saldo positivo. Para cobrança online, exige também proprietário confirmado. As condições são verificadas novamente no servidor; não basta habilitar o botão na interface.
- Métodos por cliente: Asaas, Mercado Pago, ambos com um preferido, ou tratativa manual sem checkout no app. Os três endpoints de checkout verificam a política no servidor. Política indisponível bloqueia antes de chamar o provedor. Homologação e senha temporária mantêm seus bloqueios anteriores.
- Desabilitar um método afeta novos checkouts; não cancela cobranças nem assinaturas que já existam no provedor.
- Preços do pacote continuam R$ 199 de implantação e R$ 89/mês, definidos no servidor. Esta etapa não implementa preços negociados, troca automática de planos nem cancelamento da assinatura no provedor. Permuta e liberação por período permanecem no Controle de acesso, sem pagamento fictício.
- Credenciais, habilitação de PIX e webhooks continuam sendo configurações seguras da integração, sem exibição de chaves na interface. A escolha de um provedor não provisiona a conta nele.
- Histórico mostra registros reais dos provedores. Alterações comerciais exigem motivo e são auditadas. A promoção do ambiente não cria cobrança, não renova acesso e não representa homologação fiscal.

## Integridade e limites dos resultados

- Novos itens vendidos recebem o custo de referência do produto no instante do registro. O custo gravado não pode ser alterado depois. Mudanças no cadastro ou em recebimentos futuros não reescrevem esse custo histórico.
- Compras podem atualizar o custo de referência das próximas vendas somente se a opção for marcada. Não há cálculo automático de custo médio ponderado.
- Vendas anteriores à migração não recebem custo presumido. Se faltar custo ou item em alguma venda concluída do período, CMV e resultado ficam indisponíveis com indicação da pendência.
- Resultado gerencial: vendas concluídas menos custo histórico dos itens vendidos menos despesas operacionais. Compras recebidas aparecem separadamente para evitar dupla dedução. O cálculo não representa lucro contábil nem saldo bancário.
- Recebimento e contagem são transações atômicas, com loja e produto da mesma empresa, valores validados, bloqueios de concorrência e identificador de solicitação para repetição segura. Receber compra não efetua pagamento ao fornecedor.
- Não há exclusão silenciosa de recebimentos. Correções de quantidade são registradas como contagem/ajuste; correções documentais e de custos exigem análise administrativa.
- A autorização usa associação ativa, papéis e sessões de suporte existentes. Estoquista pode abastecer e contar; despesas e resultados são gerenciais; configuração comercial e promoção são exclusivas do Super Admin. A política de senha temporária/revogação também protege as novas tabelas e o novo RPC.

## Arquivos e publicação coordenada

- `src/Management.tsx`, `management.css`, `Workspace.tsx`: gestão, abastecimento e disposição responsiva.
- `src/AdminClient.tsx`: integração na ficha do cliente.
- `src/SubscriptionCard.tsx`: oferta dos métodos permitidos, inclusive tratativa manual.
- `supabase/functions/create-asaas-checkout/index.ts`, `create-srp-activation-checkout/index.ts`, `create-srp-subscription/index.ts`: bloqueio de provedor no servidor, preservando os guardas existentes.
- `supabase/migrations/20261030110922_srp_management_purchases_commercial.sql`: compras, política comercial, custo histórico, índices, RLS e funções autorizadas. Depende da base administrativa e das migrações compartilhadas de operações, contas administradas e revogação de sessões já presentes na versão principal.
- `scripts/test-admin-edge.mjs` e `packages/operations/tests/srp-management.test.mjs`: validação das novas regras e preservação dos guardas anteriores.

Após aprovação: aplicar a migração no banco compartilhado, publicar os três endpoints coordenadamente e então a interface. Se publicar somente a interface, as novas ações informarão a necessidade de atualizar o banco. A função `create-asaas-checkout` também atende o Meu Espetinho: a nova verificação comercial está somente no ramo do Sr. Padeiro. Não aplicar esta migração duplicada pelo projeto do outro aplicativo. Hospedagem atual preservada, sem Vercel.

## Verificação

- 24 testes compartilhados aprovados, incluindo compras, repetição sem duplicação, rollback, isolamento entre empresas/lojas, papéis, senha temporária, RLS, custo histórico imutável, tratamento de histórico sem custo e promoção sem cobrança.
- 24 testes administrativos/Edge aprovados: catálogo, contas, homologação, senha temporária, provedor desabilitado, falha da política e caminho permitido com provedor inteiramente simulado.
- TypeScript, build e smoke do Sr. Padeiro aprovados. Permanece aviso de pacote JavaScript acima de 500 kB; divisão adicional pode ser feita em uma etapa de desempenho.
- Interface com componentes reais e API simulada: consulta de resultados; conta preservada ao alternar telas; bloqueio de loja com conta aberta; recebimento de 10 unidades levando saldo de 85 para 95; condição manual salva sem cobrança; nenhum erro de console.
- Verificação visual em celular 390×844, tablet 834×1112 e janela ampla. No celular, largura do conteúdo igual à largura disponível, sem rolagem horizontal.
- Evidências com dados fictícios: `management-results-preview.png`, `sales-mobile-preview.png`, `sales-tablet-preview.png`.
- Pendências para liberação: integração em homologação com banco real, aparelhos/impressoras reais e confirmação dos provedores em sandbox. Nenhuma cobrança externa foi criada nesta execução.
