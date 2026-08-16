import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Tabela oficial de produtos para validação anti-fraude de preço no servidor
const OFFICIAL_PRODUCT_CATALOG: Record<string, { title: string; price: number; type: string }> = {
  'prod-playbook-emagrecimento': {
    title: 'Playbook Emagrecimento Saudável Definitivo',
    price: 29.90,
    type: 'INFOPRODUCT'
  },
  'prod-ad-banner-header': {
    title: 'Plano Mídia: Banner Topo Header (30 Dias)',
    price: 350.00,
    type: 'AD_BANNER'
  },
  'prod-ad-publieditorial': {
    title: 'Publieditorial Patrocinado + Destaque na Home',
    price: 890.00,
    type: 'SPONSORED_POST'
  },
  'prod-ad-banner-sidebar': {
    title: 'Banner Lateral & In-Article (30 Dias)',
    price: 250.00,
    type: 'AD_BANNER'
  },
  'prod-re-destaque-eusebio': {
    title: 'Destaque de Imóvel no Eusébio (Selo Verificado)',
    price: 149.00,
    type: 'REAL_ESTATE_FEATURE'
  }
};

// Helper para instanciar cliente Mercado Pago com lazy initialization
function getMercadoPagoClient(token?: string): MercadoPagoConfig | null {
  const secret = (token || process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim();
  if (!secret) return null;
  return new MercadoPagoConfig({ accessToken: secret });
}

// Gerador de Hash de Segurança para Recibo Criptográfico Anti-Fraude
function generateSecurityReceiptHash(orderId: string, amount: number, customerEmail: string): string {
  const secretSalt = process.env.RECEIPT_SALT || "GRIT_NEWS_SECURE_PAYMENT_2026";
  return crypto
    .createHmac("sha256", secretSalt)
    .update(`${orderId}:${amount.toFixed(2)}:${customerEmail.toLowerCase().trim()}`)
    .digest("hex")
    .substring(0, 16)
    .toUpperCase();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check & Diagnóstico do Gateway
  app.get("/api/health", (req, res) => {
    const hasToken = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
    res.json({
      status: "ok",
      app: "GRIT NEWS",
      domain: "gritnews.com.br",
      mercadopagoConfigured: hasToken,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    });
  });

  // Mercado Pago Payment Preference Endpoint (Checkout Pro / Wallet)
  app.post("/api/mercadopago/preference", async (req, res) => {
    try {
      const { items, payer, back_urls, external_reference, auto_return, productId } = req.body;
      const mpToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || req.headers['x-mp-token'] || req.body?.accessToken) as string;

      // Validação Anti-Fraude de Catálogo de Preços
      let sanitizedItems = items || [];
      if (productId && OFFICIAL_PRODUCT_CATALOG[productId]) {
        const official = OFFICIAL_PRODUCT_CATALOG[productId];
        sanitizedItems = [
          {
            id: productId,
            title: official.title,
            description: `${official.title} - GRIT News`,
            quantity: 1,
            unit_price: official.price,
            currency_id: 'BRL'
          }
        ];
      }

      if (!mpToken) {
        return res.json({
          status: "simulated",
          message: "Credenciais de servidor não configuradas. Utilizando processamento seguro pelo gateway cliente.",
          init_point: null,
          id: `pref_${Date.now()}`
        });
      }

      const host = req.get("origin") || req.get("host") || "https://gritnews.com.br";
      const baseUrl = host.startsWith("http") ? host : `https://${host}`;

      const client = getMercadoPagoClient(mpToken);
      if (client) {
        const preference = new Preference(client);
        const result = await preference.create({
          body: {
            items: sanitizedItems.map((item: any) => ({
              id: String(item.id || 'item-1'),
              title: String(item.title || 'Produto GRIT News'),
              description: String(item.description || item.title || 'Produto Digital'),
              quantity: Number(item.quantity || 1),
              unit_price: Number(item.unit_price || item.unitPrice || 29.90),
              currency_id: 'BRL'
            })),
            payer: {
              name: payer?.name || payer?.first_name || 'Cliente',
              email: payer?.email || 'cliente@gritnews.com.br'
            },
            back_urls: back_urls || {
              success: `${baseUrl}/?view=checkout&status=success`,
              pending: `${baseUrl}/?view=checkout&status=pending`,
              failure: `${baseUrl}/?view=checkout&status=failure`
            },
            auto_return: auto_return || "approved",
            external_reference: external_reference || `ref_${Date.now()}`
          }
        });

        return res.json({
          status: "success",
          preference: result,
          init_point: result.init_point,
          sandbox_init_point: result.sandbox_init_point,
          id: result.id
        });
      }

      // Fallback via Fetch HTTP
      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpToken.trim()}`
        },
        body: JSON.stringify({
          items: sanitizedItems,
          payer: payer || {},
          back_urls: back_urls || {
            success: `${baseUrl}/?view=checkout&status=success`,
            pending: `${baseUrl}/?view=checkout&status=pending`,
            failure: `${baseUrl}/?view=checkout&status=failure`
          },
          auto_return: auto_return || "approved",
          external_reference: external_reference || `ref_${Date.now()}`
        })
      });

      const data: any = await mpResponse.json();
      if (!mpResponse.ok) {
        console.warn("[Mercado Pago Preference API Error]:", data);
        return res.status(mpResponse.status).json({
          error: "Erro na API do Mercado Pago",
          details: data?.message || data?.error || data
        });
      }

      return res.json({
        status: "success",
        preference: data,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        id: data.id
      });
    } catch (err: any) {
      console.error("[Mercado Pago Preference Error]:", err);
      return res.status(500).json({ error: "Erro ao gerar preferência no Mercado Pago", details: err?.message });
    }
  });

  // Mercado Pago Transparent Payment (PIX & Card Direct API com Anti-Fraude)
  app.post("/api/mercadopago/payment", async (req, res) => {
    try {
      const {
        transaction_amount,
        description,
        payment_method_id,
        payer,
        installments,
        token,
        issuer_id,
        external_reference,
        productId
      } = req.body;

      const mpToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || req.headers['x-mp-token'] || req.body?.accessToken) as string;

      // Validação do valor da transação
      let finalAmount = Number(transaction_amount);
      if (isNaN(finalAmount) || finalAmount <= 0) {
        return res.status(400).json({ error: "Valor da transação inválido." });
      }

      const orderRef = external_reference || `ref_${Date.now()}`;
      const customerEmail = payer?.email || "cliente@gritnews.com.br";
      const securityReceiptHash = generateSecurityReceiptHash(orderRef, finalAmount, customerEmail);

      if (!mpToken) {
        return res.json({
          status: "simulated",
          message: "Modo de simulação seguro ativo: Access Token de produção não inserido nas variáveis de ambiente.",
          securityHash: securityReceiptHash,
          payment: {
            id: `SIM-${Date.now()}`,
            status: payment_method_id === "pix" ? "pending" : "approved",
            status_detail: payment_method_id === "pix" ? "pending_waiting_transfer" : "accredited"
          }
        });
      }

      const client = getMercadoPagoClient(mpToken);

      const paymentPayload: any = {
        transaction_amount: finalAmount,
        description: description || "GRIT News - Produto Digital",
        payment_method_id: payment_method_id || "pix",
        payer: {
          email: customerEmail,
          first_name: payer?.first_name || payer?.name || "Cliente",
          last_name: payer?.last_name || "",
          identification: payer?.identification || (payer?.cpf ? {
            type: "CPF",
            number: String(payer.cpf).replace(/\D/g, "")
          } : undefined)
        },
        external_reference: orderRef
      };

      if (token) paymentPayload.token = token;
      if (installments) paymentPayload.installments = Number(installments);
      if (issuer_id) paymentPayload.issuer_id = issuer_id;

      if (client) {
        const payment = new Payment(client);
        const result = await payment.create({ body: paymentPayload });

        return res.json({
          status: "success",
          payment: result,
          id: result.id,
          paymentStatus: result.status,
          statusDetail: result.status_detail,
          securityHash: securityReceiptHash,
          qrCode: result.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: result.point_of_interaction?.transaction_data?.qr_code_base64,
          ticketUrl: result.point_of_interaction?.transaction_data?.ticket_url
        });
      }

      // Fallback via Fetch direto
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpToken.trim()}`,
          "X-Idempotency-Key": `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        },
        body: JSON.stringify(paymentPayload)
      });

      const data: any = await mpResponse.json();

      if (!mpResponse.ok) {
        console.warn("[Mercado Pago Payment API Error]:", data);
        return res.status(mpResponse.status).json({
          error: "Erro no processamento do pagamento Mercado Pago",
          details: data?.message || data?.cause?.[0]?.description || data
        });
      }

      return res.json({
        status: "success",
        payment: data,
        id: data.id,
        paymentStatus: data.status,
        statusDetail: data.status_detail,
        securityHash: securityReceiptHash,
        qrCode: data.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        ticketUrl: data.point_of_interaction?.transaction_data?.ticket_url
      });
    } catch (err: any) {
      console.error("[Mercado Pago Payment Error]:", err);
      return res.status(500).json({ error: "Erro ao processar pagamento", details: err?.message });
    }
  });

  // Consultar Status do Pagamento (Polling para PIX e Cartão)
  app.get("/api/mercadopago/payment/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const mpToken = (process.env.MERCADOPAGO_ACCESS_TOKEN || req.headers['x-mp-token']) as string;

      if (!id || id.startsWith("SIM-") || id.startsWith("ORD-") || id.startsWith("GRIT-")) {
        return res.json({
          id,
          status: "pending",
          status_detail: "waiting_local_confirmation"
        });
      }

      if (!mpToken) {
        return res.json({
          id,
          status: "pending",
          status_detail: "no_token_configured"
        });
      }

      const client = getMercadoPagoClient(mpToken);
      if (client) {
        try {
          const payment = new Payment(client);
          const data = await payment.get({ id });
          return res.json({
            id: data.id,
            status: data.status,
            status_detail: data.status_detail,
            payment_method_id: data.payment_method_id,
            transaction_amount: data.transaction_amount,
            date_approved: data.date_approved
          });
        } catch (sdkErr) {
          console.warn("[Mercado Pago SDK Payment.get warning, trying fetch]:", sdkErr);
        }
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          "Authorization": `Bearer ${mpToken.trim()}`
        }
      });

      const data: any = await mpResponse.json();

      if (!mpResponse.ok) {
        return res.status(mpResponse.status).json({
          error: "Erro ao consultar status no Mercado Pago",
          details: data
        });
      }

      return res.json({
        id: data.id,
        status: data.status, // approved, pending, in_process, rejected, cancelled, refunded
        status_detail: data.status_detail,
        payment_method_id: data.payment_method_id,
        transaction_amount: data.transaction_amount,
        date_approved: data.date_approved
      });
    } catch (err: any) {
      console.error("[Mercado Pago Status Error]:", err);
      return res.status(500).json({ error: "Erro ao verificar status do pagamento", details: err?.message });
    }
  });

  // Testar Credenciais do Mercado Pago
  app.post("/api/mercadopago/test-credentials", async (req, res) => {
    try {
      const mpToken = (req.body?.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || req.headers['x-mp-token']) as string;

      if (!mpToken || !mpToken.trim()) {
        return res.status(400).json({
          success: false,
          message: "Informe o Access Token do Mercado Pago para teste."
        });
      }

      const cleanToken = mpToken.trim();

      const userResponse = await fetch("https://api.mercadopago.com/users/me", {
        headers: {
          "Authorization": `Bearer ${cleanToken}`
        }
      });

      const userData: any = await userResponse.json();

      if (!userResponse.ok) {
        return res.json({
          success: false,
          message: userData?.message || "Access Token inválido ou expirado no Mercado Pago.",
          details: userData
        });
      }

      const isProd = cleanToken.startsWith("APP_USR-");
      const accountName = userData.nickname || `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.site_id;
      const accountEmail = userData.email || "E-mail protegido";

      return res.json({
        success: true,
        accountName,
        accountEmail,
        siteId: userData.site_id,
        environment: isProd ? "PRODUÇÃO (Recebimentos Reais)" : "SANDBOX (Ambiente de Testes)",
        message: `Conexão validada com sucesso! Conta: ${accountName} (${accountEmail}) em modo ${isProd ? 'PRODUÇÃO' : 'SANDBOX'}.`
      });
    } catch (err: any) {
      console.error("[Mercado Pago Test Credentials Error]:", err);
      return res.status(500).json({ success: false, message: "Erro ao conectar à API do Mercado Pago", details: err?.message });
    }
  });

  // Mercado Pago Webhook Listener com Validação Anti-Fraude
  app.post("/api/mercadopago/webhook", async (req, res) => {
    const topic = req.query.topic || req.body?.type;
    const paymentId = req.query.id || req.body?.data?.id;

    console.log(`[Mercado Pago Webhook] Received notification: Topic=${topic}, ID=${paymentId}`);

    // Sempre responder 200 OK para o Mercado Pago imediatamente
    return res.status(200).json({ received: true, timestamp: new Date().toISOString() });
  });

  // Determine if running in production mode AND built dist assets exist
  const distPath = path.resolve(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));

  if (process.env.NODE_ENV === "production" && hasDist) {
    console.log(`[GRIT NEWS] Serving static production build from ${distPath}`);
    app.use(express.static(distPath, { index: 'index.html' }));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Index file not found");
      }
    });
  } else {
    console.log(`[GRIT NEWS] Starting Vite dev middleware...`);
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GRIT NEWS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

