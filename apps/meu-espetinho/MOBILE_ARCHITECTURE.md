# Meu Espetinho — Arquitetura Mobile Android/iOS

## Objetivo

Evoluir o mesmo produto React/Vite para Web, PWA, Android e iOS sem criar uma segunda base de código. O app nativo deve abrir diretamente a operação do cliente e reutilizar autenticação, regras de tenant, Supabase e componentes existentes.

## Arquitetura

- UI compartilhada: React + Vite.
- Backend: Supabase/PostgreSQL + Edge Functions.
- Container nativo: Capacitor.
- Android: projeto gerado por `npx cap add android`.
- iOS: projeto gerado por `npx cap add ios`.
- Conectividade: `@capacitor/network` com fallback Web.
- Preferências locais: `@capacitor/preferences` apenas para dados não sensíveis.
- Sessões e tokens: não gravar manualmente em Preferences. A autenticação continua centralizada no Supabase; a próxima fase deve migrar armazenamento sensível para Keychain/Keystore por adaptador seguro.

## Segurança obrigatória

1. Super Admin não deve ser uma função operacional do app distribuído nas lojas. A administração da plataforma permanece prioritariamente no portal web `/admin`.
2. Toda autorização continua server-side por RLS/RPC. A interface nunca é fonte de verdade para permissão.
3. Tenant deve ser resolvido a partir da sessão autenticada, nunca de um ID arbitrário persistido pelo cliente.
4. URLs de suporte administrativo devem permanecer auditadas e fora da navegação normal do app.
5. Não inserir service role, Mercado Pago access token, credenciais Google/Meta ou qualquer segredo no bundle nativo.
6. Deep links de recuperação de senha e autenticação deverão usar Universal Links/App Links antes da publicação pública.
7. Android deve operar somente HTTPS (`cleartext: false`).
8. Permissões nativas devem ser mínimas e justificadas.

## Navegação mobile

A experiência nativa abre em `/app` e deve priorizar:

- Início / contas em aberto;
- Nova venda;
- Comandas;
- Produtos;
- Clientes;
- Mais (compras, gerencial, usuários e configurações conforme permissão).

A navegação deve manter alvos de toque de pelo menos 44 px e evitar telas administrativas extensas no fluxo de atendimento.

## Offline-first — fases

### Fase 1 — Foundation
- Capacitor e projetos nativos;
- detecção de conectividade;
- splash/status bar;
- app abre direto em `/app`;
- build compartilhado.

### Fase 2 — Persistência local
- banco SQLite local;
- cache por tenant;
- fila Outbox de eventos;
- IDs UUID gerados no aparelho;
- indicador Online/Offline/Sincronizando.

### Fase 3 — Sync Engine
- sincronização incremental;
- idempotência;
- retries com backoff;
- resolução de conflitos;
- eventos imutáveis para pedidos/comandas;
- nunca apagar evento local antes de ACK do servidor.

### Fase 4 — Recursos nativos
- impressão Bluetooth;
- câmera/galeria;
- compartilhamento de comprovantes;
- push notifications;
- App Links/Universal Links;
- biometria opcional para reentrada no app.

## Pagamentos offline

O app pode registrar dinheiro e pagamento externo realizado em maquininha. PIX/cartão integrados a gateway somente podem ser marcados como confirmados após resposta válida do provedor. Nunca simular aprovação quando estiver offline.

## Comandos

```bash
npm install
npm run build
npx cap add android
npx cap add ios
npm run mobile:sync
npm run android
npm run ios
```

`ios` exige macOS + Xcode. Android exige Android Studio/JDK compatíveis com Capacitor.

## Gate antes das lojas

- CI verde;
- smoke test Web;
- testes Android em aparelho físico;
- testes iOS em aparelho físico;
- política de privacidade e termos publicados;
- exclusão de conta disponível conforme regras das lojas;
- deep links de recuperação validados;
- revisão de permissões;
- ícones/splash oficiais;
- assinatura e secrets de release fora do GitHub público;
- teste de atualização sem perda de dados locais.
