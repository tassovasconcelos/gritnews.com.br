// Network-only: never cache a client's business data or authenticated pages.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Sem conexão</title><body><h1>Conecte-se para abrir o Sr. Padeiro</h1><p>As vendas precisam de conexão para confirmar estoque e pagamentos.</p><button onclick="location.reload()">Tentar novamente</button></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )));
});
