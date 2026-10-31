# Acesso por cliente — revisão de 30/10/2026

Implementação na branch `feat/sr-padeiro-gestao-plataforma`, PR #163. Nenhuma migração desta entrega foi aplicada em produção e nenhum cliente, usuário, estoque ou cobrança real foi alterado.

## Endereços preparados

| Cliente | Acesso | Instalação |
|---|---|---|
| Padaria Delícias do Pão | https://srpadeiro.gritnews.com.br/app/deliciadepao | https://srpadeiro.gritnews.com.br/instalar?cliente=deliciadepao |
| Orlandinho bar | https://meuespetinho.gritnews.com.br/app/orlandinhobar | https://meuespetinho.gritnews.com.br/instalar?cliente=orlandinhobar |

Os IDs foram conferidos por leitura do banco. O endereço anterior `/app/delicias-do-pao` da padaria também é preservado. O Orlandinho bar não é confundido com o cadastro distinto “bar do orlando”.

## Comportamento

- O nome no endereço seleciona a empresa. Login e vínculo ativo continuam obrigatórios; falha de resolução, endereço inválido e vínculo ausente não abrem outra empresa nem a implantação de um novo cliente.
- Caixa abre vendas. Estoquista do Sr. Padeiro abre estoque e compras. Atendimento do Meu Espetinho abre comandas. Proprietário e gerente recebem a visão de gestão, com as permissões já verificadas pela aplicação e pelo banco.
- As telas responsivas existentes se adaptam ao celular, tablet e computador. Tamanho de tela não concede permissões administrativas. O Super Admin usa a central e as sessões de suporte existentes; o endereço não o transforma em proprietário.
- Os painéis do cliente e da central mostram os links de acesso e instalação. Sem a nova migração, continuam apresentando o formato anterior com o identificador da empresa.
- Confirmação de e-mail e recuperação de senha preservam o endereço solicitado. O aplicativo instalado lembra a empresa escolhida no mesmo navegador e origem; outro aparelho precisa abrir o link novamente. Armazenamento bloqueado não impede o uso do endereço direto. Permissões são revalidadas no servidor.
- Novos clientes recebem automaticamente um endereço único. Colisões de nome recebem um sufixo; alterações no nome comercial não quebram links já distribuídos.

## Arquivos

- Compartilhados: `customerRoute.ts`, `AccessLinks.tsx`, `scope.ts`, `authLinks.ts`, `AccountConfirmation.tsx`, `index.ts` e testes de rotas.
- Meu Espetinho: `AppGate.tsx`, `CustomerLoginEntry.tsx`, `App.tsx`, `AdminClientDirectory.tsx`, configuração TypeScript, teste de abertura e migração `20261030114459_customer_named_access_routes.sql`.
- Sr. Padeiro: `App.tsx`, `Auth.tsx`, `Workspace.tsx`, `AdminClient.tsx` e configuração TypeScript.

## Validação

- 26 testes compartilhados: rotas, instalação, recuperação, isolamento, RLS, perfis ativos, senha temporária, convites, compras, gestão e cobrança. A nova migração foi executada num Postgres local via PGlite, usando as funções reais de autorização da migração base.
- TypeScript e compilação dos dois aplicativos; smoke tests dos dois produtos. Meu Espetinho também verifica `/app/orlandinhobar` e a página de instalação.
- Navegador local com o componente real do Sr. Padeiro e API simulada: proprietário em 1440×1000; caixa em 390×844 abrindo diretamente vendas; links personalizados nas configurações; endereço inexistente recusado. Sem transbordamento horizontal no celular. Sem login, gravação ou emissão real.
- As compilações mantêm os avisos de tamanho dos pacotes JavaScript já existentes.

![Proprietário no computador — dados fictícios](customer-owner-desktop.png)

![Caixa no celular — dados fictícios](customer-cashier-mobile.png)

## Pendências de publicação e homologação

Após aprovação: aplicar a migração compartilhada uma única vez no banco gritnews, respeitando as migrações anteriores de operações e contas; publicar ambos os aplicativos na hospedagem atual; conferir redirecionamentos de autenticação permitidos para `/app/*`; validar com contas autorizadas dos clientes e no aparelho real a instalação PWA, recuperação por e-mail e seleção da empresa. A instalação depende do suporte do navegador. Os links acima estão preparados no código e não devem ser anunciados como ativos antes dessa publicação. Esta entrega não constitui homologação fiscal.
