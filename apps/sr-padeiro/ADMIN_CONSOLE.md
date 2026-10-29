# Central administrativa do Sr. Padeiro

A rota `/admin` organiza uma carteira e uma ficha por cliente, seguindo o fluxo Cliente 360 do Meu Espetinho.

## Fluxo implementado

1. Novo cliente: negócio, identificador único e contato; criação transacional em homologação, sem criar assinatura ou pagamento. O Super Admin permanece responsável técnico pelo provisionamento, sem atribuir propriedade legal ao contato.
2. Cadastro e marca: nome, telefone, contato, cor, upload de logo PNG/JPG/WebP até 2 MB.
3. Equipe: vincular identidade existente ou solicitar convite pelo Supabase Auth; perfis owner, manager, cashier, stockist e viewer; bloqueio/reativação; nomes das pessoas em uma conta compartilhada. Um e-mail continua representando uma identidade, sem atribuição individual de autoria.
4. Produtos/cardápio: busca, categorias, variantes, preços, custo opcional, código de barras, ativação e modalidade. CSV/JSON com conferência antes da importação, chave externa por cliente e importação transacional. Importação mantém produtos inativos, não cria estoque e não transforma preço ausente em zero. Cento vira CAIXA com observação explícita de 100 unidades, preservando o preço do cento.
5. Estoque: saldo contado e mínimo por loja; validação do vínculo do produto e da loja; motivo obrigatório, movimentação e auditoria na mesma transação.
6. Caixa/vendas: consulta dos últimos 20 caixas e 30 vendas. Saldo esperado ausente aparece como “não apurado”. Não implementa novo fechamento financeiro nem relatórios completos.
7. Acesso: teste, permuta, suspensão, encerramento e liberação administrativa com motivo. Não cria pagamento fictício nem assinatura.
8. Histórico: últimos 50 eventos; acesso de suporte auditado. A operação aberta pelo Super Admin usa perfil de consulta, não faz vendas em nome do cliente.

## Backend e implantação

`supabase/admin-console.sql` é o SQL aditivo de provisionamento. O banco compartilhado `gritnews` recebeu as migrações `srp_admin_client_console` e `srp_admin_logo_upload` em 29/10/2026. A RPC pública é SECURITY INVOKER; a implementação privilegiada fica em `private`, exige auth.uid() e Super Admin ativo em toda chamada. Credenciais privilegiadas não vão ao navegador. Mudanças de ambiente, slug e proprietário são protegidas no banco.

A função `srp-admin-invite` valida JWT e Super Admin antes de consultar/criar uma identidade. Não persiste ou retorna senha, token de convite ou service role. O link usa o endereço oficial `/app`; confirmar allowlist e template do Auth no teste de entrega. A API só afirma que o provedor aceitou a solicitação; entrega/aceite não são presumidos. Se o vínculo falhar após criação da identidade, a repetição usa a conta existente e informa o estado parcial.

**Ainda não publicadas:** nova interface, função de convites e proteções de cobrança. A revisão automática de aprovação rejeitou a publicação da função de convite e de um endpoint de pagamento por falta de autorização explícita. Não houve tentativa por caminho alternativo. As três proteções preparadas rejeitam `environment=homologation` antes de qualquer chamada ao Mercado Pago/Asaas; não alteram o ramo Meu Espetinho da função compartilhada. Exigem autorização para publicação.

Não mesclar/publicar a interface como implantação concluída antes de aplicar/verificar as proteções e a função de convite. Não fazer checkout real durante os testes. A label de homologação, sozinha, não prova bloqueio de cobrança.

## Verificação

- `pnpm run build` e `pnpm run smoke`: compilação e artefatos.
- `pnpm run test:admin`: nove testes executáveis do importador e dos handlers reais com dependências simuladas. Cobrem valores ausentes/negativos, CSV com aspas, duplicatas, unidade cento, modalidades, bloqueio de cobrança em homologação sem chamar provedor, rejeição de não-admin e vínculo de conta existente sem novo envio.
- `scripts/test-admin-console.sql`: integração executada no banco com rollback de todas as escritas; criação repetida, duas importações sem duplicação, saldo/validação, referência de outro tenant, acesso, histórico e negativa de não-admin. Não substitui teste completo com sessões de funcionários.
- `scripts/admin-preview/index.html`: harness local com dados fictícios e requisições Supabase interceptadas. Não é entrada de produção. Verificados abertura da ficha, abas, filtro de encomendas, formulário de produto, item inativo enquanto modalidade pendente e Escape para fechar modal. Não comprova integração autenticada completa.
- Advisors consultados: retorno não apontou achados com prefixo `srp_`; há achados de outros sistemas no projeto compartilhado. Não representa aprovação global de segurança.

## Limites restantes

Ainda é necessário autorizar/publicar as funções e a interface, comprovar o commit servido pela Hostinger, testar convite/aceite e perfis com sessões reais, validar upload da logo pelo navegador e executar fluxo operacional completo. O cliente Delícias do Pão não foi provisionado por esta mudança; o cardápio de 102 registros continua preparado separadamente. Encomendas têm modalidade de catálogo, sem nova agenda de produção/retirada nesta entrega. Não ativar vendas ou cobranças reais sem validação.
