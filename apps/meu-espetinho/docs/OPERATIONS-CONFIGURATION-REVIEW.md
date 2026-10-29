# Configurações e cadastros compartilhados — Meu Espetinho e Sr. Padeiro

Entrega de 29/10/2026 na branch `feat/meu-espetinho-fiscal-nfce`, continuando o PR #159. Nenhuma migração ou publicação foi executada em produção. Esta etapa substitui os componentes antigos de recibo listados no relatório fiscal pela implementação em `packages/operations`.

## O que mudou para o usuário

| Área | Meu Espetinho | Sr. Padeiro |
| --- | --- | --- |
| Configurações do cliente | Menu Configurações | Mais → Configurações da operação |
| Identidade e recibo | Nome, logo, endereço, contato, CPF/CNPJ informativo, rodapé e campos opcionais | Mesmas opções |
| Impressora | Papel 58/80 mm, letras de 10 a 18 px, 1 a 3 vias, identificação do equipamento e teste | Mesmas opções |
| Saída do recibo | Impressão, imagem e compartilhamento com os mesmos dados e regras | Mesmas opções, incluindo nova impressão térmica |
| Produtos | Cadastro/edição existente, busca e importação de cardápio | Cadastro rápido com estoque inicial, busca e importação de catálogo |
| Segmento | Comandas e itens em UN | Balcão e unidades UN/KG/G/L/ML/PACOTE/CAIXA, quantidade fracionada editável no PDV |
| Equipe | Proprietário, gerente, caixa e atendente | Proprietário, gerente, caixa, estoque e consulta |
| Superadministrador | Cliente 360 / Clientes → suporte abre Configurações | Central → ficha do cliente → Recibo e impressora ou Configurar / dar suporte |

As configurações são persistidas por aplicativo e empresa. O mesmo identificador de empresa em outra vertical não mistura os dados. A logo personalizada é usada no cabeçalho da operação e no recibo; a opção “mostrar logo” controla a saída do recibo.

A personalização nunca remove “RECIBO NÃO FISCAL” nem “Não substitui a NFC-e obrigatória”. A emissão NFC-e desta branch continua simulada, sem autorização real. O superadministrador pode configurar/testar o módulo fiscal dentro da sessão de suporte, com auditoria.

## Impressão: alcance real

- A formatação produz HTML com largura física em mm, altura calculada e vias separadas; a imagem dimensiona e quebra linhas para não cortar nomes longos ou o rodapé.
- A logo só aceita PNG/JPG/WebP até 2 MB, armazenada em caminho separado por aplicativo/empresa. URLs no HTML precisam usar HTTPS e todos os textos são escapados.
- O navegador abre a janela de impressão do sistema. O usuário seleciona a impressora instalada e confere o tamanho de papel no driver. Não há impressão silenciosa, descoberta automática de USB/Bluetooth ou instalação de driver.
- A identificação da impressora é uma orientação para a equipe, não uma conexão direta com hardware. Térmicas e aparelhos reais ainda precisam ser homologados.
- Falha ao carregar as configurações bloqueia a impressão/geração de imagem para evitar usar preferências incorretas silenciosamente.

## Importação e cadastro de produtos

CSV UTF-8 (inclusive BOM), ponto e vírgula, vírgula ou tabela TSV copiada do Excel. Arquivo até 1 MB, lote de até 500 produtos. Modelo baixável com colunas:

```text
nome;preco;categoria;unidade;estoque;custo
Espetinho de carne;12,00;Espetinhos;UN;50;5,20
```

Preço e custo usam até duas casas decimais; estoque inicial aceita três. Obrigatórios: nome e preço positivo. Não há leitura de `.xlsx`, foto, PDF ou OCR nesta entrega: para planilhas, colar a tabela ou exportar CSV.

O usuário vê a prévia e erros por linha e confirma explicitamente. Pode ignorar cadastros existentes ou atualizar preço, custo e categoria pelo nome exato, sem substituir estoque ou unidade existentes. Nomes ambíguos no banco bloqueiam o lote; nomes repetidos no arquivo também são recusados. No Meu Espetinho, outras unidades além de UN são rejeitadas na tela e no banco.

Na padaria, a identidade inclui nome e variante, preservando tamanhos/sabores distintos. O CSV aceita `variante` e `modalidade`; produtos novos sem modalidade ficam inativos como “a confirmar”. O cadastro rápido oferece pronta entrega/encomenda/a confirmar, e a lista de produtos permite conferir e liberar a modalidade. A nova central administrativa, sua importação avançada CSV/JSON, identidade dos clientes e as proteções de cobrança em homologação foram preservadas.

Importação e cadastro rápido usam uma transação de banco: categoria, produto e estoque inicial da padaria são gravados juntos. Qualquer linha inválida desfaz o lote. Um identificador de tentativa impede reimportação após perda de resposta; repetir sem editar consulta o mesmo lote. Uma trava por operação serializa importações simultâneas. Isso não adiciona uma restrição única global aos nomes cadastrados por outros caminhos.

## Equipe, convites e suporte

- Proprietário/gerente e superadministrador em suporte podem consultar equipe, criar convites e ativar/desativar membros. O proprietário canônico e o próprio usuário ficam protegidos contra desativação.
- Criar convite requer nome, e-mail e função permitida. Nenhum convite pode conceder proprietário. O painel entrega um link válido por sete dias; o operador copia e compartilha com a pessoa. Não há envio automático de mensagem nesta implementação.
- O token usa dois UUIDs aleatórios e só seu hash SHA-256 fica no banco. O link só é aceito com sessão autenticada e e-mail confirmado igual ao destinatário. Criar a conta a partir do convite não cria outro estabelecimento. Convites pendentes podem ser cancelados; reemitir para o mesmo e-mail invalida os anteriores.
- Páginas com parâmetro de convite não inicializam nem enviam eventos de marketing, evitando expor o token na URL a ferramentas de rastreamento. O Sr. Padeiro também não guarda esse parâmetro na atribuição de campanha.
- A aceitação verifica se o emissor ainda é gestor ou superadministrador ativo. Convites emitidos legitimamente pelo superadministrador continuam sujeitos à validade de sete dias após o fim da sessão de suporte; o acesso permanente só surge quando o destinatário aceita.
- Membros já cadastrados não têm sua função ou estado alterados silenciosamente pela aceitação de outro convite. Reativação exige a ação do gestor no painel.
- Suporte: somente superadministrador ativo, empresa existente, motivo obrigatório, validade de uma hora, aviso visível e ação Encerrar suporte. O cliente não compartilha senha. A tela verifica a sessão periodicamente; as RPCs novas verificam a validade a cada operação.
- A auditoria registra configurações, importações, convites, aceitação, cancelamento, alteração de status e início/fim de suporte. Não registra tokens, senhas ou credenciais fiscais.

## Revisão do banco

Consultas somente de leitura no projeto `gritnews` confirmaram os campos reais de produtos, estoque, membros e organizações. A fundação executável completa do Sr. Padeiro ainda não consta no repositório; `schema_v1.sql` documenta que foi aplicada diretamente. A migração compartilhada foi preparada para o banco atual, sem tentar reconstruir essa fundação.

Foi identificada no banco uma política `tenant memberships` de ALL em `tenant_users`, cujo predicado concedia escrita a membros da operação. A nova migração remove essa política ampla, conserva a leitura por vínculo e retira escrita direta de `authenticated` nessa tabela. Os novos fluxos de equipe escrevem por funções privadas com autorização por empresa. Serviços existentes que escrevem com credencial de servidor precisam ser verificados na homologação.

As novas tabelas têm RLS e grants explícitos. Os endpoints públicos são invoker; as funções que precisam acessar Auth ou alterar vínculos estão no schema privado, usam caminho de busca vazio e verificam identidade/escopo. O armazenamento verifica o caminho antigo e novo no UPDATE, impedindo mover logos entre empresas. A consulta de organização do Sr. Padeiro passa a incluir membros ativos de estoque e consulta, além dos demais perfis.

O PDV do Sr. Padeiro passa a chamar a RPC transacional `srp_complete_sale` já existente, em vez de cadastrar venda, itens e pagamento por solicitações separadas. A integração dessa RPC com dados reais permanece no roteiro de homologação; não foi transmitida venda de cliente.

## Validação realizada

| Verificação | Evidência |
| --- | --- |
| Módulo compartilhado | `pnpm --filter @gritnews/operations test`: cinco testes, com múltiplas asserções de parser, recibo e SQL/RLS |
| Regressão fiscal | `pnpm --filter meu-espetinho test:fiscal`: três testes usando o novo renderizador compartilhado |
| Central da padaria | `pnpm --filter sr-padeiro test:admin`: nove testes de catálogo, variantes, convite e bloqueio de cobrança em homologação |
| Builds | TypeScript e Vite dos dois aplicativos |
| Disponibilidade | Smoke test de cada aplicativo |
| Navegador local | Salvar nome/rodapé/papel 58 mm, ocultar endereço, conferir recibo, prévia de dois produtos, confirmar lote em cliente simulado, prévia KG e bloqueio de preço inválido; sem erros de console observados |
| Evidência visual | `operations-receipt-preview.png`: recibo configurado com dados locais de teste |

Os testes de SQL aplicam a migração integral em PostgreSQL PGlite, com fixtures dos contratos legados. Exercitam isolamento por empresa e aplicativo, negativa para atendente/anônimo, bloqueio de autopromoção, tipos de configuração inválidos, suporte e expiração, caminho de logo entre empresas, importação atômica, repetição da mesma tentativa, preservação de estoque, convite por e-mail verificado, negativa de proprietário, aceitação idempotente, cancelamento e desativação.

**Limites:** a interface de teste usa um cliente simulado, não uma sessão autenticada real de cliente. PGlite tem uma conexão e não comprova corridas entre várias conexões. A consulta remota foi de esquema/políticas, sem escrita. Não foram executados fluxo real de confirmação por e-mail, impressora física, venda real, advisors ou migração remota. Os builds mantêm aviso de bundle acima de 500 kB.

## Arquivos principais

- `packages/operations/src/`: SettingsPanel, CatalogImport, QuickProduct, TeamPanel/InviteAcceptance/SupportBanner, ReceiptOutput, parser e renderizador de recibos.
- `packages/operations/tests/operations.test.mjs`: testes da migração e das regras compartilhadas.
- `apps/meu-espetinho/src/`: App, AppGate, CustomerLoginEntry, AdminCustomers, AdminClientDirectory, store e cloudStore; componentes antigos de recibo substituídos.
- `apps/sr-padeiro/src/`: App, Admin e Workspace, com os mesmos módulos de configuração/equipe/importação.
- `apps/meu-espetinho/supabase/migrations/20261029141711_shared_operations_settings_catalog_team.sql`: migração compartilhada das duas verticais.
- Manifestos dos aplicativos, pacote e lockfile; workflows CI das duas verticais passam a testar o módulo quando seus arquivos mudam.

## Homologação e publicação

1. Usar cópia isolada do banco atual, com a fundação real do Sr. Padeiro, e aplicar primeiro a migração fiscal anterior e depois a migração compartilhada desta etapa. Ela está na pasta do Meu Espetinho, mas deve ser aplicada uma única vez ao banco compartilhado antes de liberar qualquer um dos aplicativos.
2. Executar advisors e testar matriz proprietário/gerente/caixa/atendente/estoque/consulta/superadministrador, incluindo suporte encerrado/expirado, troca de empresa e todos os fluxos antigos de cadastro/serviço que utilizam `tenant_users`.
3. Validar links de confirmação do Supabase Auth para `/app?convite=...` nos domínios reais de cada aplicativo. Confirmar convite em conta nova e existente, cancelamento, expiração e usuário inativo.
4. Testar logos reais, lotes com duplicados, falha de rede, duas importações simultâneas, cadastro rápido e venda fracionada com estoque da padaria. Validar a RPC de venda existente e o valor registrado no banco versus recibo.
5. Homologar papel/driver, número de vias, imagem/compartilhamento em celular e impressora física. O navegador não garante capacidades do driver.
6. Resolver as pendências de emissão fiscal real descritas no relatório anterior. Personalização do recibo não dá dispensa fiscal.
7. Apresentar os resultados e obter aprovação antes de merge/publicação em produção. Vercel não é o ambiente de publicação usado pelo projeto e não foi usado para esta entrega.
