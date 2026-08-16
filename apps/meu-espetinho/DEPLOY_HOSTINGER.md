# Deploy — Meu Espetinho

Domínio de produção: `https://meuespetinho.gritnews.com.br`

## Modelo atual

A produção usa a integração nativa da Hostinger com o GitHub. O GitHub é a fonte única da verdade; não usar ZIP, upload manual ou edição direta no servidor.

Configuração do site na Hostinger:

- Repositório: `tassovasconcelos/gritnews.com.br`
- Branch: `main`
- Diretório raiz: `apps/meu-espetinho`
- Node: `22.x`
- Preset: Node.js / Express
- Arquivo de entrada: `server.js`
- Instalação: `npm install`
- Build: `npm run build`

O `server.js` serve o build Vite em `dist/` e mantém fallback SPA para `/`, `/cadastro`, `/app` e `/admin`.

## Health check

`https://meuespetinho.gritnews.com.br/health`

Resposta esperada:

```json
{"ok":true,"app":"meu-espetinho","node":"v22.x","dist":true}
```

## Variáveis públicas do frontend

As variáveis abaixo podem ser cadastradas em Hostinger > Variáveis de ambiente. IDs de marketing são opcionais e só carregam depois do consentimento do visitante.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_GTM_ID`
- `VITE_GA4_ID`
- `VITE_GOOGLE_ADS_ID`
- `VITE_META_PIXEL_ID`
- `VITE_ADSENSE_CLIENT_ID`

Nunca colocar `service_role`, Access Token do Mercado Pago ou qualquer segredo privado no frontend.

## Mercado Pago

Credenciais privadas são configuradas no Super Admin e armazenadas criptografadas no Supabase Vault. O frontend nunca recebe o Access Token.

Webhook:

`https://pcrwtoddavpvkaxwtstc.supabase.co/functions/v1/mercadopago-webhook`

## Fluxo de publicação

1. Alteração entra na `main`.
2. Hostinger detecta o push.
3. O projeto em `apps/meu-espetinho` é instalado e compilado.
4. O processo Node inicia `server.js`.
5. Executar `/health` e os smoke tests de `/`, `/cadastro`, `/app` e `/admin`.

## Segurança

- GitHub é a fonte única do código.
- Sem credenciais privadas versionadas.
- Supabase usa RLS para separar estabelecimentos.
- Mercado Pago fica no backend/Vault.
- Tracking de Google/Meta é condicionado a consentimento.
