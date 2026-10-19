# Quartel, Escola e Radar B2G — entrega inicial

18/10/2026. Mesmo aplicativo CIP, Hostinger, sem Vercel.

## Capacidades implementadas

- Catálogo de 14 personagens com cores, nomes, habilidades e uniforme com a logo original do grupo. Animações leves, estados descritos por texto e respeito a movimento reduzido.
- Quartel: filtrar especialistas por empresa/nome/competência, registrar missão do time e atualizar o estado com auditoria.
- Escola: quatro práticas de conhecimento com correção objetiva; caderno de propostas de aprendizado persistidas para revisão humana.
- `cip_agent_work`: tabela com RLS por empresa via `cip_can_access`, autor autenticado, identidade/empresa imutáveis para clientes, atualização restrita a título/notas/estado e auditoria existente. Nenhuma permissão de negócio é concedida por concluir tarefa.
- Radar Íris: amostra pública do PNCP, filtros por texto, contratações, resultados homologados por item, preço unitário/unidade, fornecedor PJ/CNPJ, data e link para a evidência. Consultas ao PNCP sob demanda no navegador, sujeitas à disponibilidade/CORS do portal.
- Coleta publicada com 150 publicações consultadas, 69 candidatas por filtro textual e 16 resultados homologados. Data/período e limites registrados no JSON. Nem todas as candidatas correspondem ao catálogo do grupo; é necessário revisar especificação/unidade.

## Estados e limites

Personagens animados não são evidência de autonomia. Missões e lições são registradas pelo time e segregadas por empresa. Não há motor conversacional/modelo de IA, execução ERP, busca contínua em segundo plano, instalação automática de habilidades ou envio de mensagens nessa entrega.

Íris só consulta fontes públicas permitidas e estrutura resultados. Não submete proposta ou lance, não interpreta estimativa como preço homologado e não afirma que um resultado homologado comprova contrato/entrega/pagamento. “Mais recente” refere-se ao filtro/amostra, não a toda a base pública. Correlação lexical não comprova equivalência de produto ou SKU.

O Radar de concorrência do Faro continua como especialidade planejada e tarefas humanas; não há monitoramento automático de sites de concorrentes ativado. Compras.gov.br está disponível como referência oficial; coleta integrada inicial é apenas PNCP, modalidade 6, Ceará. Ampliação de fontes, periodicidade, catálogo Procfit e IA requerem uma etapa de backend com controle de custo, fonte e avaliação.

## Atualização da amostra

`node apps/cip-pro-360/collect-b2g.mjs AAAAMMDD_FIM AAAAMMDD_INICIO`

Consulta no máximo três páginas de 50 publicações e oito contratações para itens/resultados, com limite de 16 resultados. Retém apenas fornecedor PJ em resultados ativos de itens homologados. Não usa credenciais. Requer revisão do pacote e publicação normal para atualizar a amostra compartilhada; consulta no navegador não regrava o arquivo publicado.

Fontes: https://pncp.gov.br/api/consulta/swagger-ui/index.html e https://www.gov.br/compras/pt-br/cidadao/portal-de-dados-abertos . Nenhuma garantia de cobertura completa ou disponibilidade contínua.

## Verificação

40 testes locais antes da publicação: regressão existente, segregação do catálogo, validação de tarefa, escapes, bloqueio de URL externa, filtro de compras de saúde, exclusão de resultados cancelados/não homologados, cronologia da amostra e integridade do pacote. Teste SQL transacional negativo confirmou identidade autenticada sem perfil CIP sem visibilidade e sem inserção; nenhuma linha de teste permaneceu desse ensaio.

Homologação positiva de navegador e persistência deve acompanhar o relatório desta entrega; teste negativo por JWT sem perfil não equivale a homologação de todos os papéis restritos. Avisos de segurança de outros aplicativos no projeto compartilhado não foram alterados.
