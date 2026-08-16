# Deploy automático — Meu Espetinho

Domínio de produção: `https://app.meuespetinho.gritnews.com.br`

O deploy é realizado pelo GitHub Actions através do workflow:

`.github/workflows/deploy-meu-espetinho.yml`

## Fluxo

1. Alteração é integrada na branch `main`.
2. O GitHub Actions detecta mudanças em `apps/meu-espetinho/**`.
3. O app é compilado com Node 20.
4. As variáveis públicas do Supabase são injetadas durante o build.
5. O conteúdo de `apps/meu-espetinho/dist/` é publicado via FTPS no diretório do subdomínio na Hostinger.
6. O `.htaccess` incluído em `public/` é copiado para o build e mantém o roteamento SPA.

Também é possível executar manualmente em GitHub > Actions > Deploy Meu Espetinho > Run workflow.

## Environment recomendado

Criar no GitHub:

`production-meu-espetinho`

## Secrets necessários

No repositório GitHub, cadastrar no environment `production-meu-espetinho`:

- `MEU_ESPETINHO_SUPABASE_URL`
- `MEU_ESPETINHO_SUPABASE_PUBLISHABLE_KEY`
- `MEU_ESPETINHO_FTP_SERVER`
- `MEU_ESPETINHO_FTP_USERNAME`
- `MEU_ESPETINHO_FTP_PASSWORD`
- `MEU_ESPETINHO_FTP_SERVER_DIR`

### Supabase

`MEU_ESPETINHO_SUPABASE_URL` deve usar a URL do projeto Supabase `gritnews`.

A chave usada em `MEU_ESPETINHO_SUPABASE_PUBLISHABLE_KEY` deve ser somente a chave publicável. Nunca usar `service_role` no frontend ou no GitHub workflow de build.

### Hostinger

Os dados FTP/FTPS devem vir do painel da Hostinger.

`MEU_ESPETINHO_FTP_SERVER_DIR` deve ser o diretório raiz configurado para o subdomínio `app.meuespetinho.gritnews.com.br`.

Exemplo ilustrativo (não copiar sem confirmar no painel):

`/domains/gritnews.com.br/public_html/app.meuespetinho/`

O caminho real deve ser confirmado na Hostinger.

## Segurança

- Nenhuma senha FTP fica armazenada no código.
- Nenhuma chave privada do Supabase fica no repositório.
- Deploys concorrentes são cancelados para evitar publicação simultânea.
- O workflow possui apenas permissão de leitura sobre o conteúdo do repositório.
- O deploy não utiliza `dangerous-clean-slate`, reduzindo risco de exclusão acidental de arquivos do servidor.

## Publicação

Depois que os secrets e o subdomínio estiverem configurados, integrar o PR do Meu Espetinho à `main` dispara automaticamente o primeiro deploy.
