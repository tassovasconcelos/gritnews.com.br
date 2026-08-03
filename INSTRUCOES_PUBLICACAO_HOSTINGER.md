# Guia de Publicação - Portal GRIT NEWS

Este guia explica como publicar o portal **GRIT NEWS** no domínio principal **`gritnews.com.br`** e como configurar o repositório para compilação e deploy.

---

## 1. Estrutura do Portal

O portal está configurado para servir a aplicação principal a partir da raiz:

> **URL de Produção:** `https://gritnews.com.br`

---

## 2. Configuração do `.htaccess` na Hostinger (`public_html`)

Para garantir que o Roteamento SPA funcione perfeitamente sem erros 404 ao recarregar a página, crie ou edite o arquivo `public_html/.htaccess` na Hostinger:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 3. Teste Local de Compilação

Para compilar e testar localmente antes de enviar para o GitHub:

```bash
# Compilar projeto
npm run build

# Executar servidor
npm run start
```

