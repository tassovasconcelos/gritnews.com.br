# CIP — Escola, Quartel e primeira Íris B2G

18/10/2026 · Entrega inicial, em fases.

## Implementado

- Catálogo de 14 personagens nomeados, com uniforme, cores, habilidades e animações; opção de movimento reduzido respeitada.
- Quartel com missão do time, empresa, especialista, contexto e estado persistidos.
- Escola com quatro práticas avaliadas e propostas de aprendizado para revisão; não há retreinamento automático.
- Uma tabela CIP dedicada a tarefas/lições, com RLS por empresa, autor autenticado, atualização restrita e auditoria.
- PNCP: coleta inicial de 150 publicações, 69 candidatas por texto e 16 resultados homologados; descrição/unidade/preço/fornecedor PJ/CNPJ/data e link de origem.
- Consulta PNCP acionada pelo usuário; correlação lexical para investigação, sem afirmar equivalência com SKU. Mais recente significa mais recente na amostra, não último preço global.
- Criação de missão B2G a partir de contratação, na Distribuidora, para revisão humana. Nenhum envio de proposta/lance.

## Verificação realizada

- 40 testes automatizados de pacote, regressão, escopo, dados, fonte oficial e resultados cancelados/não homologados.
- Ensaio SQL transacional: identidade autenticada sem perfil CIP não vê registros nem insere trabalho. Transação revertida.
- Navegador com superadm: registro de missão de homologação, alteração para concluída, leitura posterior e auditoria; proposta de aprendizado salva; prática B2G corrigida; dados e links do radar renderizados.
- Criação confirmada de missão B2G para contratação `07954480000179-1-024323/2026`, com fonte e checklist para revisão. Isso não significa recomendação de participar nem análise comercial concluída.
- Tela 390 × 844: módulos sem rolagem horizontal no teste de geometria; menu abriu e fechou na navegação. Tamanho restaurado após teste.
- Arquivos publicados comparados por HTTPS/HTTP 200/SHA-256 com pacote de CI. Logo original preservada.
- Auditoria de segurança geral do projeto compartilhado retornou avisos de outros aplicativos; não foram alterados. A nova tabela foi verificada quanto a RLS, grants e acesso negativo. Não representa auditoria completa de todos os sistemas.

## Registros de homologação mantidos

1. Missão na Shopping: “Homologação do Quartel: conferir persistência e auditoria”, concluída pelo time.
2. Aprendizado na Shopping: “PNCP: preço homologado exige contexto e unidade equivalente”, em revisão.
3. Missão na Distribuidora: revisão da contratação oficial citada acima, em revisão.

São registros identificados e auditados. Nenhuma ação comercial ou alteração ERP foi executada.

## Limites e próximas entregas

O catálogo e a colaboração do time estão operacionais; personagens animados não são prova de agentes autônomos. Não há motor de IA conversacional, execução ERP, coleta contínua, monitoramento automático Faro, treinamento de modelo, envio externo ou integração de todo o conjunto de portais. O backend persistente, fontes adicionais, catálogo Procfit e avaliações por função continuam necessários.

Homologação positiva com superadm e negativo sem perfil não substituem testes completos com contas de gestores restritas por empresa/filial. A pesquisa oficial não comprova execução contratual, entrega ou pagamento. Documento fonte, especificação, unidade e condições devem ser revistos antes de uso em decisão.

Referências oficiais: [PNCP](https://pncp.gov.br/api/consulta/swagger-ui/index.html), [dados abertos do Compras.gov.br](https://www.gov.br/compras/pt-br/cidadao/portal-de-dados-abertos).

## Publicação final
Commit: 39bdcaf1dfc6c49e2209cef7621f8dcd80be1580.
Workflow: https://github.com/tassovasconcelos/gritnews.com.br/actions/runs/39183475682 — concluído com sucesso.
Verificação independente: 14 recursos públicos com HTTP 200 e SHA-256 idêntico ao artefato CI; logo original preservada.
Consulta PNCP sob demanda confirmada em navegador. Criação de missão vinculada ao PNCP e leitura no Quartel da Distribuidora confirmadas. Tarefa e aprendizado da Shopping preservados em consulta posterior.
Evidências: cip-quartel-agentes.png, cip-escola-agentes.png, cip-radar-b2g.png e cip-escola-mobile.png.

