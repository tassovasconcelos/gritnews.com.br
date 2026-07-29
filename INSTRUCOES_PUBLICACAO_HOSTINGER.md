# Guia de Publicação - APP GRIT SAC 4.0 / SACPROH

Este guia explica como publicar o aplicativo **GRIT SAC 4.0 (SACPROH)** no diretório **`gritnews.com.br/sacproh`** e como configurar o repositório GitHub para automatizar a compilação e deploy.

---

## 1. Estrutura do Subdiretório

O aplicativo está configurado com `VITE_BASE_PATH=/sacproh/` no arquivo `vite.config.ts`, permitindo que todos os scripts, estilos e recursos sejam carregados corretamente a partir de:

> **URL de Produção:** `https://gritnews.com.br/sacproh`

---

## 2. Automação via GitHub Actions

O repositório já conta com o arquivo de workflow `.github/workflows/deploy-grit-sac.yml`.

### Opção A: Publicação Automática via FTP no Hostinger
Se você possui acesso FTP da Hostinger para a pasta `public_html/sacproh/`:
1. No seu repositório GitHub, vá em **Settings** > **Secrets and variables** > **Actions**.
2. Adicione os seguintes segredos (*Repository Secrets*):
   - `FTP_SERVER`: Exemplo `ftp.gritnews.com.br` ou o IP da Hostinger
   - `FTP_USERNAME`: Usuário FTP da sua conta Hostinger
   - `FTP_PASSWORD`: Senha do usuário FTP
3. Cada `git push` na branch `main` ou `master` irá compilar o projeto e enviar os arquivos atualizados automaticamente para a pasta `/sacproh/`.

---

### Opção B: Download dos Arquivos Compilados (Build Automático)
Se preferir subir os arquivos manualmente no Gerenciador de Arquivos da Hostinger:
1. Faça o `git push` das suas alterações.
2. Acesse a aba **Actions** no seu GitHub.
3. Clique no workflow **Deploy APP GRIT SAC 4.0 (SACPROH)** recém executado.
4. Na seção **Artifacts**, baixe o arquivo **`grit-sacproh-build.zip`**.
5. Extraia o conteúdo e envie os arquivos para a pasta `public_html/sacproh/` na Hostinger.

---

## 3. Configuração do `.htaccess` na Hostinger (Pasta `/sacproh`)

Para garantir que o Roteamento SPA e subdomínios funcionem sem erros 404 ao recarregar a página, crie ou edite o arquivo `public_html/sacproh/.htaccess` na Hostinger com o conteúdo:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /sacproh/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /sacproh/index.html [L]
</IfModule>
```

---

## 4. Teste Local de Compilação

Para compilar e testar localmente antes de enviar para o GitHub:

```bash
# Compilar projeto
npm run build

# Executar servidor
npm run start
```
