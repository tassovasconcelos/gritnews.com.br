import { spawn } from 'node:child_process';

const port = 4177;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

server.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', d => process.stderr.write(`[server] ${d}`));

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForHealth() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${base}/health`);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('Servidor não respondeu /health');
}

try {
  const health = await waitForHealth();
  if (!health.ok || !health.dist) throw new Error(`Health inválido: ${JSON.stringify(health)}`);
  console.log('✓ /health', health);

  for (const path of ['/', '/cadastro', '/app', '/admin']) {
    const r = await fetch(`${base}${path}`);
    const html = await r.text();
    if (r.status !== 200) throw new Error(`${path}: HTTP ${r.status}`);
    if (!html.includes('<div id="root"></div>')) throw new Error(`${path}: index do app não encontrado`);
    console.log(`✓ ${path} HTTP 200`);
  }

  console.log('Smoke test Meu Espetinho: APROVADO');
} finally {
  server.kill('SIGTERM');
}
