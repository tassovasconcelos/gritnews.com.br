# Escola dos Agentes — Educação continuada

Implementação no CIP, compartilhada por empresa e acessível em Escola dos Agentes.

## Jornada

1. Biblioteca: orientações, links HTTPS e anexos privados PDF/TXT/MD/DOCX/XLSX (10 MB).
2. Registrar conteúdo relevante, agente responsável e próxima revisão. Anexos e links entram automaticamente na fila de extração no servidor.
3. Gestor da empresa ou superadm revisa e aprova a fonte.
4. Desenvolver habilidade com fontes aprovadas, instruções, limites, caso de teste e resposta esperada.
5. Revisor registra o resultado observado: fonte válida, cenário executado e limites respeitados. Avaliação é humana e declarativa, não execução automatizada.
6. A versão só pode ser aprovada após avaliação positiva nas três dimensões. Avaliação posterior negativa devolve a habilidade a rascunho.
7. Motor de consulta libera apenas habilidades aprovadas e atuais cujas fontes também estejam aprovadas e atuais. Fonte substituída ou retirada bloqueia o contexto dependente.
8. Doquita mostra orientações aprovadas por empresa. O contexto JSON pode incluir o texto integral aprovado e a consulta de Doquita busca trechos com referências de origem; não altera pesos de modelo ou permissões.

## Renovação

Conteúdo é imutável: qualquer correção cria uma nova versão ligada à anterior. O painel Revisão e renovação reúne pendências, vencimentos e habilidades bloqueadas. A fila é atendida a cada dois minutos (dois documentos por execução), mesmo com a escola fechada. Links são conferidos novamente após 24 horas. Falhas transitórias têm até três tentativas; leituras incompletas exigem intervenção. Mudanças de conteúdo retiram a fonte e suas habilidades dependentes da aprovação até revisão e nova avaliação. Isto automatiza ingestão e renovação, sem retreinar pesos de modelos. Os painéis mostram recorte explícito de 200 materiais, 200 habilidades e 400 avaliações recentes; fontes ausentes do recorte bloqueiam o contexto por segurança.

## Persistência e acesso

- Schema: `schema/academy.sql`, aplicado ao projeto GRIT existente como `cip_academy_continuous_learning`.
- Três tabelas com RLS e auditoria: materiais, habilidades e avaliações.
- Leitura segue `cip_can_access`; criação segue acesso de escrita da empresa.
- Revisão restrita ao superadm ou gestor ativo da empresa. Avaliações são append-only.
- Bucket privado `cip-academy`; caminho empresa/usuário/UUID.ext; sem sobrescrita de anexos.
- Usuário só pode remover upload próprio ainda não referenciado. Documentos referenciados permanecem preservados.
- Fontes de documentos são conteúdo de referência e não ganham autoridade para alterar instruções, executar ações ou liberar acessos.

## Verificação

`node --test apps/cip-pro-360/*.test.mjs apps/cip-pro-360/deploy/upload.test.mjs`

Testes transacionais no banco (rollback): criação, aprovação sem avaliação bloqueada, aprovação após avaliação positiva, regressão para rascunho, conteúdo imutável e leitura sem perfil bloqueada. Testes visuais usam banco simulado; não constituem homologação autenticada no domínio de produção.

## Leitura integral e limites explícitos

- PDF com texto: até 200 páginas, com referência da página. Páginas sem texto são sinalizadas para OCR; não são liberadas como leitura completa.
- DOCX: parágrafos, texto de tabelas, cabeçalhos, rodapés e notas. Objetos não textuais precisam de revisão.
- XLSX: abas, linhas, referências das células, strings e valores em cache; fórmulas são identificadas, sem recálculo. Gráficos e imagens não são interpretados.
- TXT/MD: texto UTF-8 integral.
- Links: HTML estático público, PDF e formatos suportados. Sem login, cookies, execução de JavaScript ou acesso a redes privadas. HTTPS com IP público fixado e certificado validado; cada redirecionamento é verificado.
- Até 10 MB por arquivo, 32 MB de XML descompactado e 1 milhão de caracteres por leitura. Limites excedidos não são truncados silenciosamente.
- Textos extraídos são versionados, com hash, localizadores, avisos e data. A aprovação se vincula a uma extração específica.
- Busca `cip_academy_search` consulta somente extrações completas, aprovadas, atuais e permitidas para a empresa. Resultados retornam até 20 trechos, com origem.
- Edge Function `cip-academy-ingest`: valida sessão e permissão da empresa para chamadas do app; cron usa token próprio protegido no Vault. A chave privilegiada permanece no servidor.
- Verificação da fila e estado: `cip_academy_ingestion_jobs`; evidência da leitura: `cip_academy_extractions`.
