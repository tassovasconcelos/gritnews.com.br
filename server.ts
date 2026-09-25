import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const OFFICIAL_PRODUCT_CATALOG: Record<string, { title: string; price: number; type: string }> = {
  'prod-playbook-emagrecimento': { title: 'Playbook Emagrecimento Saudável Definitivo', price: 29.90, type: 'INFOPRODUCT' },
  'prod-ad-banner-header': { title: 'Plano Mídia: Banner Topo Header (30 Dias)', price: 350.00, type: 'AD_BANNER' },
  'prod-ad-publieditorial': { title: 'Publieditorial Patrocinado + Destaque na Home', price: 890.00, type: 'SPONSORED_POST' },
  'prod-ad-banner-sidebar': { title: 'Banner Lateral & In-Article (30 Dias)', price: 250.00, type: 'AD_BANNER' },
  'prod-re-destaque-eusebio': { title: 'Destaque de Imóvel no Eusébio (Selo Verificado)', price: 149.00, type: 'REAL_ESTATE_FEATURE' },
  'prod-re-consultoria-vip': { title: 'Consultoria Imobiliária VIP no Eusébio', price: 490.00, type: 'REAL_ESTATE_CONSULTING' },
  'prod-tenpets-apoio-50': { title: 'Cota de Apoio TenPets: Ração & Primeiros Cuidados', price: 50.00, type: 'DONATION_TENPETS' },
  'prod-tenpets-apoio-150': { title: 'Cota TenPets: Tratamento Clínico & Cirurgias', price: 150.00, type: 'DONATION_TENPETS' },
  'prod-grit-membership-pro': { title: 'Clube GRIT News Pro (Assinatura Anual)', price: 199.00, type: 'MEMBERSHIP' }
};

const OFFICIAL_COUPONS: Record<string, { kind: 'percent' | 'fixed'; value: number }> = {
  GRIT10: { kind: 'percent', value: 10 },
  BEMVINDO: { kind: 'percent', value: 10 },
  PROMO2026: { kind: 'fixed', value: 5 },
  DESCONTO5: { kind: 'fixed', value: 5 },
};

function calculateOfficialPrice(productId: string, couponValue?: unknown) {
  const product = OFFICIAL_PRODUCT_CATALOG[productId];
  if (!product) return null;
  const couponCode = String(couponValue || '').trim().toUpperCase().slice(0, 40);
  const coupon = couponCode ? OFFICIAL_COUPONS[couponCode] : undefined;
  let amount = product.price;
  if (coupon?.kind === 'percent') amount = amount * (1 - coupon.value / 100);
  if (coupon?.kind === 'fixed') amount = amount - coupon.value;
  amount = Math.max(0.01, Number(amount.toFixed(2)));
  return { product, amount, couponCode: coupon ? couponCode : null };
}

const CANONICAL_ORIGIN = "https://gritnews.com.br";

function getMercadoPagoClient(): MercadoPagoConfig | null {
  const secret = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
  if (!secret) return null;
  return new MercadoPagoConfig({ accessToken: secret });
}

function generateSecurityReceiptHash(orderId: string, amount: number, customerEmail: string): string {
  const secretSalt = (process.env.RECEIPT_SALT || '').trim();
  if (!secretSalt) return '';
  return crypto.createHmac("sha256", secretSalt)
    .update(`${orderId}:${amount.toFixed(2)}:${customerEmail.toLowerCase().trim()}`)
    .digest("hex").substring(0, 16).toUpperCase();
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function validMercadoPagoSignature(req: express.Request, dataId: string) {
  const secret = (process.env.MERCADOPAGO_WEBHOOK_SECRET || '').trim();
  const signature = String(req.headers['x-signature'] || '');
  const requestId = String(req.headers['x-request-id'] || '');
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')));
  if (!secret || !parts.ts || !parts.v1 || !requestId || !dataId) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return safeEqual(expected, parts.v1);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
  app.use(express.json({ limit: '64kb' }));

  // Compatibilidade Hostinger: se o subdomínio Meu Espetinho estiver apontando para
  // a aplicação raiz do monorepo, servimos automaticamente o build correto pelo Host.
  const meuEspetinhoDist = path.resolve(process.cwd(), "apps", "meu-espetinho", "dist");
  const meuEspetinhoIndex = path.join(meuEspetinhoDist, "index.html");
  const requestHost = (req: express.Request) => {
    const forwarded = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
    const direct = String(req.headers.host || "").trim();
    return (forwarded || direct).split(":")[0].toLowerCase();
  };

  app.use((req, res, next) => {
    if (requestHost(req) !== "meuespetinho.gritnews.com.br") return next();

    const buildReady = fs.existsSync(meuEspetinhoIndex);
    if (req.path === "/health") {
      return res.status(buildReady ? 200 : 503).json({
        ok: buildReady,
        app: "meu-espetinho",
        domain: "meuespetinho.gritnews.com.br",
        node: process.version,
        dist: buildReady,
        servedBy: "gritnews-root-host-router"
      });
    }

    if (!buildReady) {
      return res.status(503).json({ ok: false, app: "meu-espetinho", error: "build_not_found" });
    }

    let relative = "";
    try {
      relative = decodeURIComponent(req.path).replace(/^\/+/, "");
    } catch {
      return res.status(400).send("Bad request");
    }
    const requested = path.resolve(meuEspetinhoDist, relative || "index.html");
    const rel = path.relative(meuEspetinhoDist, requested);
    if (rel.startsWith("..") || path.isAbsolute(rel)) return res.status(400).send("Bad request");

    if (fs.existsSync(requested) && fs.statSync(requested).isFile()) {
      return res.sendFile(requested);
    }

    return res.sendFile(meuEspetinhoIndex);
  });

  app.get("/api/health", (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ status: "ok", app: "GRIT NEWS" });
  });

  app.post("/api/mercadopago/preference", async (req, res) => {
    try {
      const productId = String(req.body?.productId || '');
      const priced = calculateOfficialPrice(productId, req.body?.couponCode);
      if (!priced) return res.status(400).json({ error: "Produto inválido." });
      const {product: official, amount, couponCode} = priced;

      const client = getMercadoPagoClient();
      if (!client) return res.status(503).json({ error: "Pagamento temporariamente indisponível." });

      const payerEmail = String(req.body?.payer?.email || '').trim().toLowerCase();
      if (payerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
        return res.status(400).json({ error: "E-mail do pagador inválido." });
      }
      const payerName = String(req.body?.payer?.name || req.body?.payer?.first_name || 'Cliente').trim().slice(0, 120);
      const externalReference = `GRIT-${crypto.randomUUID()}`;
      const preference = new Preference(client);
      const body: any = {
        items: [{
          id: productId,
          title: official.title,
          description: `${official.title} - GRIT News`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'BRL',
        }],
        back_urls: {
          success: `${CANONICAL_ORIGIN}/?view=checkout&status=success`,
          pending: `${CANONICAL_ORIGIN}/?view=checkout&status=pending`,
          failure: `${CANONICAL_ORIGIN}/?view=checkout&status=failure`,
        },
        auto_return: "approved",
        external_reference: externalReference,
        metadata: { product_id: productId, product_type: official.type, coupon_code: couponCode },
      };
      if (payerEmail) body.payer = { name: payerName, email: payerEmail };
      const result = await preference.create({ body });
      return res.json({ status: "success", init_point: result.init_point, id: result.id, external_reference: externalReference, amount, coupon_code: couponCode });
    } catch (err: any) {
      console.error("[Mercado Pago Preference Error]:", err?.message || err);
      return res.status(502).json({ error: "Não foi possível iniciar o checkout." });
    }
  });

  app.post("/api/mercadopago/payment", async (req, res) => {
    try {
      const productId = String(req.body?.productId || '');
      const priced = calculateOfficialPrice(productId, req.body?.couponCode);
      if (!priced) return res.status(400).json({ error: "Produto inválido." });
      const {product: official, amount, couponCode} = priced;

      const client = getMercadoPagoClient();
      if (!client) return res.status(503).json({ error: "Pagamento temporariamente indisponível." });

      const payer = req.body?.payer || {};
      const customerEmail = String(payer?.email || '').trim().toLowerCase();
      if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        return res.status(400).json({ error: "E-mail do pagador inválido." });
      }

      const paymentMethod = String(req.body?.payment_method_id || 'pix').slice(0, 40);
      const orderRef = `GRIT-${crypto.randomUUID()}`;
      const paymentPayload: any = {
        transaction_amount: amount,
        description: official.title,
        payment_method_id: paymentMethod,
        payer: {
          email: customerEmail,
          first_name: String(payer?.first_name || payer?.name || "Cliente").slice(0, 120),
          last_name: String(payer?.last_name || "").slice(0, 120),
          identification: payer?.identification || (payer?.cpf ? { type: "CPF", number: String(payer.cpf).replace(/\D/g, "").slice(0, 14) } : undefined),
        },
        external_reference: orderRef,
        metadata: { product_id: productId, product_type: official.type, coupon_code: couponCode },
      };

      if (req.body?.token) paymentPayload.token = String(req.body.token).slice(0, 512);
      const installments = Number(req.body?.installments);
      if (Number.isInteger(installments) && installments >= 1 && installments <= 12) paymentPayload.installments = installments;
      if (req.body?.issuer_id) paymentPayload.issuer_id = String(req.body.issuer_id).slice(0, 80);

      const payment = new Payment(client);
      const result = await payment.create({ body: paymentPayload });
      const securityReceiptHash = generateSecurityReceiptHash(orderRef, amount, customerEmail);

      return res.json({
        status: "success",
        id: result.id,
        paymentStatus: result.status,
        statusDetail: result.status_detail,
        external_reference: orderRef,
        amount,
        coupon_code: couponCode,
        securityHash: securityReceiptHash || undefined,
        qrCode: result.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
        ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url,
      });
    } catch (err: any) {
      console.error("[Mercado Pago Payment Error]:", err?.message || err);
      return res.status(502).json({ error: "Não foi possível processar o pagamento." });
    }
  });

  app.get("/api/mercadopago/payment/:id", async (req, res) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!/^\d{1,30}$/.test(id)) return res.status(400).json({ error: "Pagamento inválido." });
      const client = getMercadoPagoClient();
      if (!client) return res.status(503).json({ error: "Pagamento temporariamente indisponível." });
      const payment = new Payment(client);
      const data = await payment.get({ id });
      return res.json({ id: data.id, status: data.status, status_detail: data.status_detail });
    } catch (err: any) {
      console.error("[Mercado Pago Status Error]:", err?.message || err);
      return res.status(502).json({ error: "Não foi possível verificar o pagamento." });
    }
  });

  app.post("/api/mercadopago/test-credentials", async (req, res) => {
    const expected = (process.env.PAYMENT_ADMIN_PROBE_SECRET || '').trim();
    const received = String(req.headers['x-admin-probe-secret'] || '');
    if (!expected || !safeEqual(received, expected)) return res.status(404).json({ error: "not_found" });
    try {
      const mpToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
      if (!mpToken) return res.status(503).json({ success: false, message: "Pagamento não configurado." });
      const userResponse = await fetch("https://api.mercadopago.com/users/me", { headers: { "Authorization": `Bearer ${mpToken}` } });
      if (!userResponse.ok) return res.status(502).json({ success: false, message: "Credencial do gateway inválida ou indisponível." });
      return res.json({ success: true, environment: mpToken.startsWith("APP_USR-") ? "production" : "sandbox" });
    } catch (err: any) {
      console.error("[Mercado Pago Probe Error]:", err?.message || err);
      return res.status(502).json({ success: false, message: "Falha na verificação do gateway." });
    }
  });

  app.post("/api/mercadopago/webhook", async (req, res) => {
    const topic = String(req.query.type || req.query.topic || req.body?.type || '');
    const paymentId = String(req.query['data.id'] || req.query.id || req.body?.data?.id || '');
    if (topic !== "payment" || !(await validMercadoPagoSignature(req, paymentId))) {
      return res.status(401).json({ error: "invalid_signature" });
    }
    console.log("[Mercado Pago Webhook] verified payment notification", { paymentId });
    return res.status(200).json({ received: true });
  });

  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV === "production" && hasDist) {
    console.log(`[GRIT NEWS] Serving static production build from ${distPath}`);
    console.log(`[MEU ESPETINHO] Host router ${fs.existsSync(meuEspetinhoIndex) ? 'ready' : 'build missing'} from ${meuEspetinhoDist}`);
    app.use(express.static(distPath, { index: 'index.html' }));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) res.sendFile(indexPath);
      else res.status(404).send("Index file not found");
    });
  } else {
    console.log(`[GRIT NEWS] Starting Vite dev middleware...`);
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GRIT NEWS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
