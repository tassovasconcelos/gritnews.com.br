# Central de usuários, liberações e preparação de vendas

Entrega de 29/10/2026 na branch `feat/meu-espetinho-fiscal-nfce`, PR #159. Atualizações preparadas para revisão; banco e clientes de produção não foram alterados. Não utiliza Vercel.

## Diagnóstico e correções

- No catálogo de padaria investigado, os 102 registros estavam inativos: 30 com modalidade a confirmar, 45 de encomenda e 27 de pronta entrega. Não havia saldo cadastrado. A consulta da venda excluía os inativos, sem explicar a ausência. Agora o PDV informa o motivo, e a preparação do catálogo permite conferir e selecionar os itens para liberação. Não ativamos registros reais nem criamos estoque fictício.
- As funções `ops_team` e a tabela `operation_invites` estavam ausentes no banco publicado. A central da etapa anterior depende da publicação de sua migração; o erro agora informa explicitamente essa dependência. O cliente de espetinhos investigado possuía permuta vigente; vencimento não explica essa falha. Identidades e condições comerciais individuais foram omitidas deste documento.
- O estoque da venda da padaria passa a considerar apenas a loja selecionada pela operação, escolhida de maneira determinística. Saldos de outra loja não habilitam produtos nesta loja. Falhas nas consultas deixam de parecer catálogo vazio.
- Links de empresa no Meu Espetinho exigem vínculo à empresa solicitada, sem fallback silencioso para outro negócio. A resolução de contexto após autenticação é agendada fora do callback de autenticação.

## Funcionalidades entregues

- Meu Espetinho: Cliente 360 → ficha → Central de usuários. Sessão assistida de até uma hora, com encerramento explícito. Convites, alteração de função, ativação, bloqueio e cancelamento de convite. A mesma equipe também é administrada pelo proprietário/gerente dentro da operação.
- Sr. Padeiro: preserva a central administrativa existente e oferece os mesmos controles de equipe na operação. A preparação de produtos aparece no catálogo administrativo e no menu Produtos do cliente.
- Alterar a própria função ou a do proprietário é bloqueado no servidor. Papéis são validados por produto; atendente não existe na padaria, estoque/consulta não existem no espetinho. Ações ficam registradas na auditoria.
- Trial e permuta por dias ou até 12 meses de calendário, com motivo obrigatório. É possível iniciar hoje ou renovar a partir da validade atual. Não registra pagamento e não cria assinatura. Suspensão de estabelecimento no Meu Espetinho continua exigindo reativação explícita.
- Links individuais de acesso e instalação com copiar/abrir nas fichas administrativas e nas configurações dos clientes. URL direta: `/app?operation_scope=<id>`. O endereço exige autenticação e autorização; não é uma credencial.
- Página `/instalar?operation_scope=<id>` nos dois produtos, botão de instalação quando o navegador oferece, orientações para Android/computador e iOS, e retorno à empresa indicada. Ícones PNG reais em 192 e 512 px, derivados das marcas existentes, mais ícone de tela inicial. O Sr. Padeiro registra service worker sem armazenar dados de clientes; vendas precisam de conexão. A instalação não concede acesso.

## Arquivos principais

- `packages/operations/src/AccessLinks.tsx`, `TeamPanel.tsx`, `CatalogRelease.tsx`, `scope.ts`, `operations.css`, `index.ts`.
- `apps/meu-espetinho/src/AdminClientDirectory.tsx`, `App.tsx`, `AppGate.tsx`, `main.tsx`.
- `apps/sr-padeiro/src/AdminClient.tsx`, `App.tsx`, `Workspace.tsx`, `main.tsx`, `lib/salesCatalog.ts`.
- Manifestos, ícones e `index.html` de ambos; `apps/sr-padeiro/public/sw.js`.
- Migração compartilhada `20261029152119_operations_access_and_catalog_release.sql` e testes em `packages/operations/tests/operations.test.mjs`.

## Verificação

- 10 testes compartilhados: repetição do cenário de 102 produtos, estoque por loja, empresa exata no link, liberação atômica/idempotente, papéis, autorização, auditoria, permuta anual e renovação, além dos testes anteriores de configurações/importação/convites.
- 9 testes administrativos da padaria: importação e bloqueio de cobrança em homologação, convite negado e vínculo existente.
- 3 testes fiscais: migração e isolamento, simulação e recibo não fiscal. NFC-e permanece simulada e não dispensa obrigação fiscal.
- Checagem TypeScript, geração de ambos os aplicativos e smoke tests dos dois produtos. Os geradores continuam avisando sobre os pacotes grandes; esse aviso não impede a geração.
- Navegador com componentes reais e servidor simulado local: convite manual, alteração caixa → estoque, desativação, seleção explícita e liberação de produto. Estado atualizado, sem erros de console. Não é teste integrado de produção. Evidência: `operations-access-preview.png`.
- Instalação em aparelhos reais, aceitação de convite com provedor de e-mail, drivers de impressora e homologação fiscal continuam pendentes.

## Publicação e preparação operacional

1. Revisar e aprovar o PR. Preservar o bloqueio de publicação definido na solicitação inicial.
2. No banco compartilhado, aplicar a base administrativa da padaria, a migração fiscal e `20261029141711_shared_operations_settings_catalog_team.sql`, conforme o relatório anterior; depois aplicar `20261029152119_operations_access_and_catalog_release.sql`, uma única vez. A migração adicional usa funções privilegiadas privadas, wrappers invoker e permissões explícitas. Não chama APIs de cobrança.
3. Publicar os dois aplicativos no ambiente atual de hospedagem. Validar `/app`, `/admin`, `/instalar`, manifestos e ícones. Publicar somente a interface sem as funções do banco mantém os fluxos indisponíveis.
4. Na ficha do cliente, conferir conta e papéis, gerar convite e testar seu aceite com conta autorizada. Conferir expiração e suspensão antes de liberar operação real.
5. Na padaria, conferir os 72 itens de modalidade definida, selecionar apenas os aprovados e liberar. Resolver os 30 pendentes individualmente. Registrar saldos físicos por loja, sem estimativas; então validar venda, baixa de estoque e recibo em ambiente de teste.
6. Validar instalação em Android/Chrome, iOS/Safari e computador. Homologar impressora e emissão fiscal separadamente antes da operação fiscal real.
