import express from "express";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "GRIT NEWS",
      domain: "gritnews.com.br",
      timestamp: new Date().toISOString()
    });
  });

  // Mercado Pago Payment Preference Endpoint (Server-Side proxy)
  app.post("/api/mercadopago/preference", async (req, res) => {
    try {
      const { items, payer, back_urls, external_reference } = req.body;
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || req.headers['x-mp-token'] as string;

      if (!mpToken) {
        return res.json({
          status: "simulated",
          message: "Credenciais de servidor não configuradas. Utilizando processamento seguro pelo gateway cliente.",
          init_point: null,
          id: `pref_${Date.now()}`
        });
      }

      // If token is provided, call Mercado Pago API
      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mpToken}`
        },
        body: JSON.stringify({
          items: items || [],
          payer: payer || {},
          back_urls: back_urls || {
            success: "https://gritnews.com.br/?view=checkout&status=success",
            pending: "https://gritnews.com.br/?view=checkout&status=pending",
            failure: "https://gritnews.com.br/?view=checkout&status=failure"
          },
          auto_return: "approved",
          external_reference: external_reference || `ref_${Date.now()}`
        })
      });

      const data = await mpResponse.json();
      return res.json({ status: "success", preference: data });
    } catch (err: any) {
      console.error("[Mercado Pago Preference Error]:", err);
      return res.status(500).json({ error: "Erro ao gerar preferência no Mercado Pago", details: err?.message });
    }
  });

  // Mercado Pago Webhook Listener
  app.post("/api/mercadopago/webhook", (req, res) => {
    const topic = req.query.topic || req.body?.type;
    const paymentId = req.query.id || req.body?.data?.id;

    console.log(`[Mercado Pago Webhook] Received notification: Topic=${topic}, ID=${paymentId}`);
    return res.status(200).json({ received: true });
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
