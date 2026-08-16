import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const dist = path.join(__dirname, 'dist');

app.disable('x-powered-by');
app.use(express.static(dist, {
  maxAge: '1h',
  etag: true,
  index: false,
}));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, app: 'meu-espetinho' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Meu Espetinho online na porta ${port}`);
});
