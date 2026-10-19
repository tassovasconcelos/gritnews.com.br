# Escola dos Agentes — Educação continuada

Implementação no CIP, compartilhada por empresa e acessível em Escola dos Agentes.

## Jornada

1. Biblioteca: orientações, links HTTPS e anexos privados PDF/TXT/MD/DOCX/XLSX (10 MB).
2. Registrar conteúdo relevante, agente responsável e próxima revisão. Anexar um arquivo não extrai seu conteúdo automaticamente.
3. Gestor da empresa ou superadm revisa e aprova a fonte.
4. Desenvolver habilidade com fontes aprovadas, instruções, limites, caso de teste e resposta esperada.
5. Revisor registra o resultado observado: fonte válida, cenário executado e limites respeitados. Avaliação é humana e declarativa, não execução automatizada.
6. A versão só pode ser aprovada após avaliação positiva nas três dimensões. Avaliação posterior negativa devolve a habilidade a rascunho.
7. Motor de consulta libera apenas habilidades aprovadas e atuais cujas fontes também estejam aprovadas e atuais. Fonte substituída ou retirada bloqueia o contexto dependente.
8. Doquita mostra orientações aprovadas por empresa. O contexto JSON é preparado para futura conexão ao executor de IA; não altera pesos de modelo ou permissões.

## Renovação

Conteúdo é imutável: qualquer correção cria uma nova versão ligada à anterior. O painel Revisão e renovação reúne pendências, vencimentos e habilidades bloqueadas. A verificação ocorre na consulta da página/contexto, sem job de aprendizagem em segundo plano. Os painéis mostram recorte explícito de 200 materiais, 200 habilidades e 400 avaliações recentes; fontes ausentes do recorte bloqueiam o contexto por segurança.

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
