# Sr. Padeiro — publicação Hostinger

## Estado
Código de produção em `main`.
App: `apps/sr-padeiro`
Build: `apps/sr-padeiro/dist`
Domínio: `srpadeiro.gritnews.com.br`

## Configuração do subdomínio
No hPanel do domínio `gritnews.com.br`:
1. Criar o subdomínio `srpadeiro`.
2. Apontar o document root do subdomínio para a pasta de publicação do Sr. Padeiro.
3. Se o site usar Git/Deploy Hook, configurar o deploy da branch `main` e o build:
   - `npm --prefix apps/sr-padeiro install --no-audit --no-fund`
   - `npm --prefix apps/sr-padeiro run build`
4. Publicar o conteúdo de `apps/sr-padeiro/dist` como document root do subdomínio.
5. Habilitar SSL para `srpadeiro.gritnews.com.br`.

## SPA routing
O host deve retornar `index.html` para rotas que não correspondam a arquivo físico, preservando:
- `/`
- `/login`
- `/app`
- `/admin`

Exemplo Apache `.htaccess` dentro do document root:

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

## Variáveis públicas de build
- `VITE_SUPABASE_URL=https://pcrwtoddavpvkaxwtstc.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key do projeto gritnews>`
- `VITE_APP_URL=https://srpadeiro.gritnews.com.br`
- `VITE_WHATSAPP_NUMBER=<número comercial em E.164>`
- `VITE_GA4_ID=<GA4 oficial do Sr. Padeiro>`
- `VITE_META_PIXEL_ID=<Pixel oficial do Sr. Padeiro>`

Nunca usar `service_role` no frontend.

## Checklist pós-publicação
- `https://srpadeiro.gritnews.com.br/` retorna 200 e landing
- `/login` retorna 200 e autenticação
- `/app` sem sessão redireciona/mostra login
- `/admin` exige Super Admin
- `/robots.txt` retorna 200
- `/sitemap.xml` retorna 200
- formulário de lead grava `product=sr-padeiro`
- WhatsApp abre destino configurado
- cadastro cria trial de 7 dias
- Super Admin consegue: liberar, renovar trial, permuta e suspender
- venda grava pagamento + baixa de estoque
- logo/cor do cliente persistem

## Gate comercial
Só ativar mídia paga quando DNS + SSL + formulário + tracking + WhatsApp forem confirmados em produção.
