# GRIT RADAR 360° — Link União — Instalação no subdomínio

Destino: `uniao.gritnews.com.br` — pasta **`public_html/uniao`** confirmada no hPanel.

## Publicação via Gerenciador de Arquivos

1. No hPanel da Hostinger, abra **Gerenciador de Arquivos** e navegue até `public_html/uniao`.
2. Faça upload de `grit-link-uniao-hostinger.zip`.
3. Extraia o ZIP **dentro** de `public_html/uniao`, sem criar uma subpasta extra. Após extrair, devem existir no nível principal:
   - `index.html`
   - `acesso.html`
   - `.htaccess`
   - `health.json`
   - `robots.txt`
4. Confira se `.htaccess` está presente (habilite exibir arquivos ocultos no gerenciador, se necessário).
5. Abra `https://uniao.gritnews.com.br/health`. Deve retornar `ok:true`.
6. Abra `https://uniao.gritnews.com.br/login` e confira a tela **GRIT — Painel administrativo**.
7. Faça login com usuário GRIT previamente autorizado, sem expor senha.
8. Verifique `/admin`, `/equipe` e convite de proprietário pela rota `/?convite=<token_unico>`.

## Arquitetura
O frontend roda como HTML estático na Hostinger. A autenticação, as respostas, os convites e os relatórios usam a função `link-uniao-surveys` no Supabase existente `pcrwtoddavpvkaxwtstc`. Não use nem divulgue service role key no browser.

## Segurança e privacidade
Os convites dos proprietários não devem ser publicados no site. Respostas individuais da equipe nunca serão apresentadas à direção. O backend mantém os dados em tabelas com RLS e só libera consolidados quando o número mínimo de respostas é atingido.

## Atualizações
O repositório de origem é `tassovasconcelos/gritnews.com.br`, em `apps/link-uniao/`.
O pacote ZIP é construído por GitHub Actions. A publicação na Hostinger exige upload no hPanel ou configuração explícita de um mecanismo de deploy com permissão para `public_html/uniao`.
Não vincule a pasta a uma ação de deploy do portal principal para evitar sobrescrever arquivos de outras aplicações.


## Plano GRIT 360° (20/10/2026)

- Acesso: `/admin?modulo=plano-grit-360`, após login GRIT. O ADM também tem botão próprio.
- `plano.js` integra o painel; o workflow FTPS publica e compara o arquivo servido com o release, executando `tests/link-uniao-plan.test.mjs` antes do envio.
- Backend: função `link-uniao-plan`, com validação do usuário no Auth e na lista `lu_survey_admins` em cada operação. Mantém a compatibilidade de identidade GRIT já usada pelo Radar.
- Banco: `lu_plan_state`, `lu_plan_audit` e RPC transacional `lu_plan_commit`. RLS e bloqueio direto para anon/authenticated; somente o backend autorizado pode gravar. As tabelas de pesquisa não foram alteradas.
- Esquema aditivo em `supabase/plan-schema.sql`; migrações aplicadas: `link_uniao_plan_360` e `link_uniao_plan_explicit_deny`. Não reaplicar o arquivo em banco já instalado.
- Para atualizar o backend, publicar `supabase/functions/link-uniao-plan/index.ts` e `domain.ts` na função existente. A autenticação é validada dentro da função, como no backend original. Nunca colocar chave de serviço no frontend.
- Cada gravação exige motivo e versão esperada. Conflitos retornam 409. Histórico e estado são escritos na mesma transação; versões anteriores podem ser consultadas no ADM.
- A equipe aparece somente em agregado com mínimo de cinco respostas; comentários e recortes identificáveis não são lidos pelo módulo.
- Indicadores financeiros da pesquisa são declarações. Baselines e realizados continuam sem medição até conciliação humana; metas e incentivos são propostas editáveis.
- UNIÃO GANHA+ exige evento único, evidência, janela de qualidade e verificação GRIT. Não executa pagamentos.
- Consultoria: 30% como referência negociável, aplicado à margem incremental positiva ajustada. Registrar auditoria e evidência do acordo assinado pelas partes. Alterar campos financeiros invalida auditoria e aprovação anteriores. Não cria contrato nem cobrança automaticamente.
- Relatórios: tela executiva imprimível/PDF pelo navegador e exportação JSON. Exportações contêm informações restritas da gestão e devem ser guardadas pela GRIT.
