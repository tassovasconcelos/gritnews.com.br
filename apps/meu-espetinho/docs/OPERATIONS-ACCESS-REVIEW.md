# Central de usuários, liberações e preparação de vendas

Entrega de 29/10/2026 na branch `feat/meu-espetinho-fiscal-nfce`, PR #159. A base remota foi aplicada e testada na etapa de recuperação descrita ao final. Publicação das interfaces em verificação. Não utiliza Vercel.

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
- No Meu Espetinho instalado, abrir o ícone preserva a sessão existente, que continua sendo validada pelo aplicativo e pelo banco. O comportamento de entrada pública no navegador é preservado. Não força uma saída local a cada abertura do aplicativo instalado.

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

## Revisão de continuidade — 29/10/2026

- Confirmadas as verificações do GitHub no commit `6043367`: builds e smoke das duas verticais aprovados. O status Vercel é de uma integração externa antiga; não representa a hospedagem atual.
- Confirmado no banco compartilhado: as duas migrações administrativas do Sr. Padeiro constam no histórico; as três migrações fiscal/operacionais desta branch ainda não constam e `ops_team` não existe. Publicar apenas as interfaces manteria a falha de equipe.
- Corrigida incompatibilidade com o fluxo npm da Hostinger: dependência local `file:../../packages/operations` e `.npmrc` com `install-links=true` nos dois aplicativos. Validado `npm install` e build de cada aplicativo em cópia limpa sem `node_modules` do workspace; ambos aprovados.
- Reexecutados os 22 testes existentes: dez compartilhados, três fiscais e nove administrativos; todos aprovados. As simulações não comprovam emissão fiscal real.
- Painel Hostinger alcançado, porém exige autenticação nesta sessão. Não houve merge, publicação dos aplicativos, aplicação de migração remota ou liberação de catálogo nesta revisão.

## Recuperação e validação remota — 29/10/2026

A etapa de recuperação aplicou a migração fiscal (apenas homologação), as fundações compartilhadas e a liberação de catálogo no projeto gritnews. A chamada integral da migração compartilhada expirou sem alteração. A aplicação foi concluída em três partes rastreadas: `shared_operations_settings_support_foundation`, `shared_operations_team_invites` e `shared_operations_catalog_storage_permissions`. Chamadas que removiam políticas retornaram erro de estado da solicitação; foram preservados os objetos de política existentes. A escrita direta em `tenant_users` foi revogada, mantendo a gestão pelas RPCs auditadas; a política de leitura da padaria foi alterada sem remoção. O arquivo versionado preserva esse comportamento e suporta também uma base sem a política da padaria.

Testes remotos transacionais, todos com rollback:
- fechamento pela RPC real, repetição idempotente, pagamento único, snapshot fiscal e bloqueio de edição de itens fechados;
- suporte com prazo, consulta de equipe nas duas verticais, preferências, importação de produto e repetição idempotente;
- criação de convite manual sem envio de mensagem, encerramento de suporte e negativa sem autenticação.

A consulta de permissões confirmou ausência de INSERT direto para authenticated em tenant_users. Advisors não apontaram novos endpoints públicos SECURITY DEFINER; as tabelas operation_imports e operation_invites permanecem sem política direta porque são acessadas pelas funções privadas e não recebem grants diretos aos clientes. Não houve envio à SEFAZ, venda de cliente, convite externo, liberação do catálogo real ou criação de estoque.

O navegador Hostinger continuou indisponível por timeout mesmo após tentativa de reinicialização. A publicação será acionada pela integração GitHub existente e só poderá ser declarada concluída após conferir os arquivos servidos nos dois domínios.
