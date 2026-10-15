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
