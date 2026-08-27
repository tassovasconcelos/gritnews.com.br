import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://srpadeiro.gritnews.com.br",
  "https://meuespetinho.gritnews.com.br",
  "http://localhost:5173",
  "http://localhost:4173",
]);
const cors = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://gritnews.com.br",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
};
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
async function secret(sb: any, name: string) {
  const { data, error } = await sb.rpc("platform_secret_get", { secret_name: name });
  if (error) throw new Error(`secret_lookup_failed:${name}`);
  return String(data || "").trim();
}
const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);
    const auth = req.headers.get("Authorization");
    if (!auth) return json(req, { error: "unauthorized" }, 401);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json(req, { error: "unauthorized" }, 401);

    const body = await req.json();
    const organizationId = String(body.organization_id || "").trim();
    const tenantId = String(body.tenant_id || "").trim();
    const kind = String(body.kind || "");
    if ((!organizationId && !tenantId) || (organizationId && tenantId) || !["activation", "subscription"].includes(kind)) {
      return json(req, { error: "invalid_input" }, 400);
    }

    let product: "sr_padeiro" | "meu_espetinho";
    let entityId: string;
    let entityName: string;
    let activationPaidAt: string | null;
    let transactionTable: "srp_billing_transactions" | "billing_transactions";
    let returnUrl: string;

    if (organizationId) {
      const { data: member } = await sb.from("srp_members").select("role,active").eq("organization_id", organizationId).eq("user_id", user.id).maybeSingle();
      if (!member?.active || member.role !== "owner") return json(req, { error: "forbidden" }, 403);
      const { data: org } = await sb.from("srp_organizations").select("id,name,activation_paid_at").eq("id", organizationId).maybeSingle();
      if (!org) return json(req, { error: "organization_not_found" }, 404);
      product = "sr_padeiro";
      entityId = org.id;
      entityName = org.name;
      activationPaidAt = org.activation_paid_at;
      transactionTable = "srp_billing_transactions";
      returnUrl = "https://srpadeiro.gritnews.com.br/app";
    } else {
      const { data: tenant } = await sb.from("tenants").select("id,name,owner_user_id,activation_paid_at").eq("id", tenantId).maybeSingle();
      if (!tenant) return json(req, { error: "tenant_not_found" }, 404);
      let allowed = tenant.owner_user_id === user.id;
      if (!allowed) {
        const { data: membership } = await sb.from("tenant_users").select("role,active").eq("tenant_id", tenantId).eq("user_id", user.id).maybeSingle();
        allowed = Boolean(membership?.active && membership.role === "owner");
      }
      if (!allowed) return json(req, { error: "forbidden" }, 403);
      product = "meu_espetinho";
      entityId = tenant.id;
      entityName = tenant.name;
      activationPaidAt = tenant.activation_paid_at;
      transactionTable = "billing_transactions";
      returnUrl = "https://meuespetinho.gritnews.com.br/app";
    }

    if (kind === "activation" && activationPaidAt) return json(req, { error: "activation_already_paid" }, 409);
    if (kind === "subscription" && !activationPaidAt) return json(req, { error: "activation_required" }, 409);

    const mode = (Deno.env.get("ASAAS_MODE") || await secret(sb, "ASAAS_MODE") || "sandbox") === "production" ? "production" : "sandbox";
    const apiKey = Deno.env.get("ASAAS_API_KEY") || await secret(sb, "ASAAS_API_KEY");
    if (!apiKey) return json(req, { error: "asaas_not_configured", mode }, 503);

    const externalReference = `${product}_asaas_${kind}:${entityId}`;
    const entityColumn = product === "sr_padeiro" ? "organization_id" : "tenant_id";
    const { data: existing } = await sb.from(transactionTable)
      .select("provider_id,checkout_url,created_at")
      .eq(entityColumn, entityId).eq("provider", "asaas").eq("external_reference", externalReference).eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 55 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (existing?.checkout_url) return json(req, { checkout_url: existing.checkout_url, checkout_id: existing.provider_id, mode, reused: true });

    const amount = kind === "activation" ? 199 : 89;
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 5);
    const payload: Record<string, unknown> = {
      billingTypes: kind === "activation" ? ["PIX", "CREDIT_CARD"] : ["CREDIT_CARD"],
      chargeTypes: [kind === "activation" ? "DETACHED" : "RECURRENT"],
      minutesToExpire: 60,
      externalReference,
      callback: {
        successUrl: `${returnUrl}?payment=success`, cancelUrl: `${returnUrl}?payment=cancel`, expiredUrl: `${returnUrl}?payment=expired`,
      },
      items: [{
        name: kind === "activation" ? `Implantação ${product === "sr_padeiro" ? "Sr. Padeiro" : "Meu Espetinho"}` : `${product === "sr_padeiro" ? "Sr. Padeiro" : "Meu Espetinho"} mensal`,
        description: entityName, quantity: 1, value: amount,
      }],
    };
    if (kind === "subscription") payload.subscription = { cycle: "MONTHLY", nextDueDate: dateOnly(new Date()), endDate: dateOnly(endDate) };

    const base = mode === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
    const response = await fetch(`${base}/checkouts`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", access_token: apiKey, "User-Agent": "GRIT-Hybrid-Gateway/2.0" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      const providerCodes = data?.errors?.map((item: any) => item?.code).filter(Boolean) || [];
      console.error("asaas_checkout_rejected", { status: response.status, errors: providerCodes });
      return json(req, { error: "asaas_error", mode, provider_status: response.status, provider_codes: providerCodes }, 502);
    }

    const checkoutId = String(data.id || "");
    if (!checkoutId) return json(req, { error: "asaas_invalid_response", mode }, 502);
    const checkoutUrl = String(data.link || `${mode === "production" ? "https://asaas.com" : "https://sandbox.asaas.com"}/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`);
    const { error: insertError } = await sb.from(transactionTable).insert({
      [entityColumn]: entityId, kind, provider: "asaas", provider_id: checkoutId, status: "pending", amount, currency: "BRL",
      external_reference: externalReference, checkout_url: checkoutUrl, payload: { checkout_id: checkoutId, _integration_mode: mode, product },
    });
    if (insertError) {
      console.error("asaas_transaction_store_failed", { product, code: insertError.code });
      return json(req, { error: "transaction_store_failed" }, 500);
    }
    return json(req, { checkout_url: checkoutUrl, checkout_id: checkoutId, mode, reused: false });
  } catch (error) {
    console.error("create_asaas_checkout_failed", error);
    return json(req, { error: "internal_error" }, 500);
  }
});
