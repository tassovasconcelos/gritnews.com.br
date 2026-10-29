# Fiscal: auditoria e entrega para revisão — 29/10/2026

Branch: `feat/meu-espetinho-fiscal-nfce`. Base inspecionada: `47bd71a8b8c9b339461422e8ad81f233dd272190`.

## Estado da entrega

Implementação de recibo não fiscal e módulo fiscal **somente simulado**. Não está apta à emissão real nem à publicação em produção. Não houve alteração em banco remoto, implantação de função, transmissão à SEFAZ ou publicação do aplicativo.

## Auditoria do PDV

| Área | Código encontrado | Resultado |
| --- | --- | --- |
| Pedidos/comandas | `src/App.tsx`, `src/store.ts`, `src/cloudStore.ts` | Mesa, cliente ou comanda livre; cache local por empresa; sincronização de itens via Data API. |
| Fechamento | `cloudCloseOrder`, RPC `close_order_atomic`, implementação mais recente em `20260817203200_inventory_movements_on_sale.sql` | Trava a venda, evita segundo pagamento e baixa estoque; operação privilegiada está no schema privado. |
| Pagamentos | `payments_received`, `customer_credit_entries` | PIX, dinheiro, crédito, débito, outro e fiado. Fiado não é recebimento imediato. |
| Caixa | `cash_registers`, `cash_movements` no schema; resumo gerencial no App | Não foi identificado um fluxo completo de abertura/sangria/fechamento conectado ao fechamento da comanda. O novo módulo não resolve essa lacuna. |
| Impressão | `ReceiptModal.tsx` | HTML térmico em janela separada e imagem canvas. Acrescentada identificação não fiscal nos três formatos. HTML agora escapa dados da loja, itens e comanda. |
| Permissões | `loadOperationUsers`, `tenant_users`, helpers privados | Preservado papel cashier, antes convertido em attendant pelo frontend. Configuração fiscal só pelo proprietário; simulação por proprietário, gerente ou caixa; atendente pode consultar. Suporte temporário não recebe acesso fiscal automaticamente. |

## Auditoria do banco e decisões

- Auditoria baseada nos arquivos versionados; não atesta a configuração de um projeto remoto.
- Políticas existentes usam `private.user_has_tenant_access`, que também incorpora assinatura e concessões temporárias de suporte. O módulo fiscal verifica vínculo ativo efetivo e papel em `private.fiscal_access`, sem depender de metadados editáveis do JWT.
- Várias tabelas legadas possuem `tenant_id` e FK simples por ID; isso não equivale a uma FK composta que garanta vínculo entre empresas. O novo bloqueio de itens exige pai e empresa correspondentes. A revisão global de todas as relações legadas permanece pendente.
- O fechamento aceitava total calculado pelo cliente. A nova validação compara o fechamento com a soma dos itens persistidos, descontando o desconto da venda. Fechamento sem itens ou com total divergente falha com rollback.
- O fechamento registra uma obrigação fiscal na mesma transação por gatilho, inclusive quando a mudança de estado ocorre por outro caminho. Documento único por venda, snapshot dos itens e valor, histórico separado e sem permissão de escrita direta para clientes.
- Edição dos itens trava a comanda, serializando com o fechamento. Venda fechada não pode ser reaberta ou ter seus campos financeiros alterados; itens fechados ficam bloqueados. Isso pode revelar tentativas tardias de sincronização existentes no PDV: homologar conexões lentas.
- RLS habilitada nas três tabelas novas, privilégios explícitos, funções privilegiadas no schema privado com identidade validada. RPC de resultado é invoker e exclusiva de `service_role`.
- Toda venda nova fechada mantém `obligation_pending=true`. Não há configuração de dispensa fiscal. Simulação, impressão e compartilhamento não quitam a obrigação. A decisão jurídica sobre obrigatoriedade por operação não foi automatizada.
- Vendas já fechadas antes da migração não são retroativamente classificadas. Inventariar o histórico antes de qualquer implantação.

## Fluxo fiscal e API

1. Fechar a venda gera `fiscal_documents` e `fiscal_events` atomicamente.
2. O recibo não fiscal é a ação principal; o botão separado abre Fiscal / NFC-e.
3. Proprietário informa CNPJ, inscrição estadual e razão social individuais por empresa, com UF CE e ambiente de homologação fixos. Essas informações ainda não formam um cadastro fiscal completo.
4. `POST /functions/v1/fiscal-nfce` recebe `{tenant_id, order_id}` e exige sessão válida. O banco decide o acesso, sem confiar na permissão exibida pela tela.
5. `claim_fiscal_simulation` trava o documento; solicitações repetidas em processing/unknown reutilizam `attempt_id`. A Edge Function usa credencial de servidor somente para registrar o resultado.
6. Estados: pending → processing → simulated/rejected/unknown. Rejeição permite nova tentativa; resultado incerto exige consulta da mesma tentativa. Resultado terminal simulado não é rebaixado por uma resposta tardia.

O adaptador não gera chave de acesso, protocolo real, XML assinado nem DANFE. `SIMULATED_100` e `SIMULATED_539` são fixtures de teste, não respostas recebidas da SEFAZ. Chamadas simultâneas podem consultar o simulador com a mesma tentativa; ele não tem efeitos externos. Um adaptador real exigirá deduplicação e reconciliação no provedor antes de enviar novamente.

Configuração para **ambiente isolado de homologação**, após aplicar e revisar a migração:

```text
FISCAL_SIMULATION_ENABLED=true
FISCAL_ALLOWED_ORIGIN=https://ENDERECO-DA-HOMOLOGACAO
FISCAL_SIMULATION_SCENARIO=success
```

`FISCAL_SIMULATION_SCENARIO` aceita success, reject ou timeout; nunca é controlado pelo browser. Sem habilitação explícita a função retorna 503. Usar a validação JWT padrão da plataforma e `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` somente no runtime da função. Nenhum certificado, CSC ou segredo é salvo no frontend.

## Testes e evidências

Executar na pasta do aplicativo:

```text
pnpm test:fiscal
pnpm build
```

- Suíte PostgreSQL PGlite aplica a migração fiscal integral contra fixture mínima do schema legado e executa a função real de fechamento com baixa de estoque versionada no repositório. Valida fechamento repetido com um só pagamento/documento, snapshot, bloqueio de edição/reabertura, RLS entre empresas, negativa para anônimo e membro inativo, configuração exclusiva do proprietário, negativa de emissão para atendente, negativa de resultado para cliente, consulta da mesma tentativa após unknown e preservação da obrigação após sucesso simulado.
- Suíte do adaptador: sucesso determinístico, rejeição, timeout, dados vazios e bloqueio de produção.
- Suíte de impressão HTML: identificação não fiscal, total, pagamento e escape de conteúdo injetado.
- Compilação TypeScript/Vite validada; há aviso de bundle acima de 500 kB.
- O teste usa PostgreSQL embarcado com fixtures, não uma instalação completa do Supabase. Não comprova concorrência de múltiplas conexões, todas as migrações históricas nem JWT/RLS em projeto remoto.
- Não foram executados: Edge Function no runtime Deno/HTTP real, navegação autenticada, impressora física, compartilhamento em celular, teste completo de fiado/limite, advisors contra projeto remoto, integração SVRS ou homologação fiscal oficial.

## Arquivos da entrega

| Arquivo | Alteração |
| --- | --- |
| `src/App.tsx` | Navegação para módulo fiscal e ação do recibo. |
| `src/ReceiptModal.tsx` | Recibo explicitamente não fiscal no preview, térmica e imagem. |
| `src/receiptHtml.ts` | HTML térmico testável com escape dos campos. |
| `src/FiscalPanel.tsx` | Cadastro individual, últimas 100 pendências, solicitação/consulta de simulação e mensagens de estado. |
| `src/cloudStore.ts` | Preserva o papel cashier. |
| `supabase/migrations/20261029133731_fiscal_nfce_homologation.sql` | Configuração, obrigação, auditoria, RLS, gatilhos de integridade e RPCs. |
| `supabase/functions/fiscal-nfce/index.ts` | API autenticada para simulação. |
| `supabase/functions/fiscal-nfce/simulator.mjs` | Adaptador sem efeitos fiscais externos. |
| `scripts/fiscal.test.mjs` | Testes de banco, adaptador e recibo. |
| `package.json`, `../../pnpm-lock.yaml` | Script e dependência fixa de PostgreSQL embarcado para teste. |
| Este relatório | Evidências, riscos e critérios restantes. |

## Pendências que impedem emissão real e produção

1. Definir integração direta SVRS ou provedor fiscal e seu contrato de idempotência, consulta e webhooks. Implementar o adaptador real e tratar timeouts ambíguos sem retransmissão cega.
2. Validar enquadramento tributário e obrigatoriedade com responsável fiscal. Completar cadastro do emitente, endereço fiscal, CRT, IE, série/numeração, produtos/NCM/CFOP/CST/CSOSN, tributos vigentes, pagamentos e regras de consumidor.
3. Provisionar certificado, CSC e credenciamento por empresa/ambiente em armazenamento de segredos do servidor; implementar rotação e controle de acesso.
4. Implementar assinatura/validação de XML, autorização e consulta, DANFE/QR Code, armazenamento e retenção, cancelamento, inutilização e contingência conforme especificações aplicáveis.
5. Aplicar em Supabase de homologação, executar advisors e testes das políticas com usuários reais e múltiplas conexões; testar a Edge Function com JWT válido/inválido e requisições concorrentes.
6. Homologar vendas, estoque, fiado, sincronização lenta, caixa, impressão e celular; revisar histórico anterior e inconsistências existentes antes da migração.
7. Apresentar os resultados de homologação e obter aprovação expressa para publicação. Não fazer deploy ou merge enquanto estes pontos estiverem pendentes.

## Fontes consultadas

- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): combinação de grants e políticas, autorização por linha e testes.
- [SEFAZ Ceará — homologação NFC-e via SVRS](https://www.ce.gov.br/sefaz/2025/05/13/autorizacao-da-nota-fiscal-de-consumidor-eletronica-nfc-e-ambiente-de-homologacao-disponivel/): referência oficial de infraestrutura. Endereços e especificações precisam ser reconfirmados na integração real.
- [PGlite — documentação](https://pglite.dev/docs/): execução local de PostgreSQL para testes. Acesso ao changelog markdown do Supabase falhou no navegador de pesquisa; nenhuma suposição de mudança recente foi usada para habilitar funcionalidades novas da plataforma.
