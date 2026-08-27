import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function secret(sb: any, name: string) {
  const { data, error } = await sb.rpc("platform_secret_get", { secret_name: name });
  if (error) throw new Error(`secret_lookup_failed:${name}`);
  return String(data || "").trim();
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const expected = Deno.env.get("ASAAS_WEBHOOK_TOKEN") || await secret(sb, "ASAAS_WEBHOOK_TOKEN");
    const received = req.headers.get("asaas-access-token") || "";
    if (!expected || !equal(received, expected)) return json({ error: "invalid_signature" }, 401);

    const body = await req.json();
    const event = String(body.event || "");
    const checkout = body.checkout || {};
    const payment = body.payment || {};
    const providerId = String(checkout.id || payment.checkout?.id || payment.id || "");
    const externalReference = String(checkout.externalReference || payment.externalReference || "");
    if ((!providerId && !externalReference) || !event) return json({ error: "invalid_payload" }, 400);

    const eventId = String(body.id || `${event}:${providerId || externalReference}`);
    const eventKey = `asaas:${eventId}`;
    const { data: claim, error: eventError } = await sb.from("billing_webhook_events")
      .upsert({ event_key: eventKey, event_type: event, provider_id: providerId || null, payload: body }, { onConflict: "event_key", ignoreDuplicates: true })
      .select("id").maybeSingle();
    if (eventError) return json({ error: "event_store_failed" }, 500);
    if (!claim) return json({ ok: true, duplicate: true });

    const paid = ["CHECKOUT_PAID", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(event);
    const failed = ["CHECKOUT_CANCELED", "CHECKOUT_EXPIRED", "PAYMENT_DELETED", "PAYMENT_REFUNDED"].includes(event);
    if (!paid && !failed) return json({ ok: true, stored: true });

    let product: "sr_padeiro" | "meu_espetinho" | null = externalReference.startsWith("sr_padeiro_") ? "sr_padeiro" : externalReference.startsWith("meu_espetinho_") ? "meu_espetinho" : null;
    let transaction: any = null;
    if (product !== "meu_espetinho") {
      let query = sb.from("srp_billing_transactions").select("id,organization_id,kind,status,amount,external_reference").eq("provider", "asaas");
      query = externalReference ? query.eq("external_reference", externalReference) : query.eq("provider_id", providerId);
      const result = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
      transaction = result.data;
      if (transaction) product = "sr_padeiro";
    }
    if (!transaction && product !== "sr_padeiro") {
      let query = sb.from("billing_transactions").select("id,tenant_id,kind,status,amount,external_reference").eq("provider", "asaas");
      query = externalReference ? query.eq("external_reference", externalReference) : query.eq("provider_id", providerId);
      const result = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
      transaction = result.data;
      if (transaction) product = "meu_espetinho";
    }
    if (!transaction || !product) return json({ ok: true, ignored: "unknown_checkout" });

    const now = new Date().toISOString();
    const table = product === "sr_padeiro" ? "srp_billing_transactions" : "billing_transactions";
    if (paid) {
      await sb.from(table).update({ status: "approved", occurred_at: now, payload: body, updated_at: now }).eq("id", transaction.id);
      if (product === "sr_padeiro") {
        if (transaction.kind === "activation") await sb.from("srp_organizations").update({ activation_paid_at: now }).eq("id", transaction.organization_id).is("activation_paid_at", null);
        if (transaction.kind === "subscription") await sb.from("srp_subscriptions").upsert({ organization_id: transaction.organization_id, plan_code: "sr_padeiro_89", provider: "asaas", provider_subscription_id: providerId, status: "active", provider_status: event, monthly_amount: 89, updated_at: now }, { onConflict: "organization_id" });
      } else {
        if (transaction.kind === "activation") await sb.from("tenants").update({ subscription_status: "pending", setup_status: "pending_setup", activation_paid_at: now, setup_requested_at: now }).eq("id", transaction.tenant_id).is("activation_paid_at", null);
        if (transaction.kind === "subscription") {
          await sb.from("subscriptions").upsert({ tenant_id: transaction.tenant_id, plan_code: "meu_espetinho_89", provider: "asaas", provider_subscription_id: providerId, status: "active", provider_status: event, updated_at: now }, { onConflict: "tenant_id" });
          await sb.from("tenants").update({ subscription_status: "active" }).eq("id", transaction.tenant_id);
        }
      }
    } else {
      await sb.from(table).update({ status: event.toLowerCase(), payload: body, updated_at: now }).eq("id", transaction.id);
      if (event === "PAYMENT_REFUNDED" && transaction.kind === "subscription") {
        if (product === "sr_padeiro") await sb.from("srp_subscriptions").update({ status: "cancelled", provider_status: event, updated_at: now }).eq("organization_id", transaction.organization_id);
        else {
          await sb.from("subscriptions").update({ status: "cancelled", provider_status: event, updated_at: now }).eq("tenant_id", transaction.tenant_id);
          await sb.from("tenants").update({ subscription_status: "cancelled" }).eq("id", transaction.tenant_id);
        }
      }
    }
    return json({ ok: true });
  } catch (error) {
    console.error("asaas_webhook_failed", error);
    return json({ error: "internal_error" }, 500);
  }
});
