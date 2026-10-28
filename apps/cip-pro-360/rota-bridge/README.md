# Faro → Rota Pro: locadoras

Destino de consulta: https://rotapro.gritnews.com.br/territorio/?tab=radar
Receptor servidor: https://pvldaqxblirmgoixselx.supabase.co/functions/v1/cip-faro-rental-bridge

A ponte envia somente referências comerciais de locação, sem estoque, custo, clientes ou credenciais. Eventos usam HMAC-SHA256 sobre timestamp + corpo, janela de cinco minutos e identificador SHA256 do conteúdo. A chave foi provisionada separadamente nos dois bancos privados; não existe neste repositório.

`sender.sql` pertence ao CIP (`pcrwtoddavpvkaxwtstc`); `receiver.sql` pertence ao Rota (`pvldaqxblirmgoixselx`). `index.ts`/`handler.mjs` são a Edge Function receptora. JWT da plataforma fica desligado porque a autenticação ocorre pela assinatura; o RPC de ingestão é exclusivo de service_role. RLS bloqueia acesso direto às tabelas privadas.

Alterações em referências cadastradas como Locação e novas identificações de locação em `result.page_discovery.rental_candidate` geram eventos. Não se afirma que toda locadora possível foi descoberta. Os eventos são enviados após o commit por pg_net. As conclusões do Faro reconciliam confirmações e reenviam falhas com espera crescente, até seis tentativas. Não há cron novo. Falhas da ponte não interrompem a pesquisa. Eventos esgotados precisam de intervenção administrativa.

O receptor deduplica o evento e a fonte por domínio, inclusive www; mantém fontes existentes e suas decisões de revisão. Novas fontes entram como candidatas no radar existente, ativas para sua rotina de conferência. Região fica declarada, sem raio comprovado; nenhum preço é criado. Declarações de regiões/filiais permanecem nos recibos mesmo quando compartilham uma única fonte.

Verificação administrativa (sem ler autenticação):
- CIP: contagens de `cip_rota_bridge_private.outbox`, `delivered_at`, `attempts`, `last_state`.
- Rota: contagens de `cip_rota_bridge_private.receipts` e `source_id` distintos.

Validação inicial: 16 eventos aceitos, 12 fontes distintas, zero pendências e uma tentativa por evento. Não significa 12 empresas novas, nem preços aprovados. Testes SQL em rollback cobriram assinatura inválida, expiração, repetição e privilégios; testes HTTP cobriram métodos, chamadas de navegador, tamanho e respostas sem exposição de erro interno.

## Verificação do diretório de locadoras

`rental-scan.sql` adiciona a fila por domínio e RPCs vinculados ao lease de uma tarefa Faro já existente. Cada tarefa pode verificar um domínio ainda não consultado: robots, página inicial e no máximo uma página de locação, sem chamadas adicionais ao modelo/buscador. DNS privado, redirecionamentos, bloqueios e conteúdo excessivo são recusados. Texto explícito de aluguel/locação de equipamentos ou materiais gera evidência candidata, sem validar preço. Scripts e negações não qualificam a empresa.

Amostra sem evidência não significa que a empresa não alugue. Rechecagem após sete dias para amostras concluídas e um dia para pendências, sempre priorizando domínios ainda não tentados. Registros sem site permanecem pendentes: o módulo não inventa um endereço. Referências do próprio grupo ficam excluídas. O painel do diretório consulta somente contagens e evidências públicas permitidas ao usuário da empresa.

Universo inicial de Shopping: 497 registros, 19 do grupo excluídos, 478 referências externas, 205 domínios distintos e 107 registros sem site. Não equivale a 478 empresas únicas ou 205 páginas já verificadas.
