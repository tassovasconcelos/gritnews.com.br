import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "https://meuespetinho.gritnews.com.br",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await sb.auth.getUser(auth.slice(7));
    if (userError || !user) return json({ error: "unauthorized" }, 401);
    const { data: admin } = await sb.from("admin_users").select("active,role").eq("user_id", user.id).maybeSingle();
    if (!admin?.active || !["superadmin", "admin"].includes(admin.role)) return json({ error: "forbidden" }, 403);

    const body = await req.json();
    const tenantId = String(body?.tenant_id || "");
    const action = String(body?.action || "");
    if (!tenantId) return json({ error: "missing_tenant" }, 400);
    if (!["start", "approve", "suspend"].includes(action)) return json({ error: "invalid_action" }, 400);

    const { data: tenant } = await sb.from("tenants")
      .select("id,owner_user_id,setup_status,activation_paid_at,activation_waived_at,courtesy_type,courtesy_ends_at")
      .eq("id", tenantId).maybeSingle();
    if (!tenant) return json({ error: "tenant_not_found" }, 404);

    const now = new Date();
    const courtesyActive = Boolean(tenant.courtesy_type && tenant.courtesy_ends_at && new Date(tenant.courtesy_ends_at).getTime() > now.getTime());
    const eligible = Boolean(tenant.activation_paid_at || tenant.activation_waived_at || courtesyActive);
    if ((action === "start" || action === "approve") && !eligible) return json({ error: "payment_required", setup_status: tenant.setup_status }, 409);

    if (action === "start") {
      const stamp = now.toISOString();
      const { error } = await sb.from("setup_requests").upsert({tenant_id: tenantId,owner_user_id: tenant.owner_user_id,status: "in_progress",assigned_admin: user.id,requested_at: stamp,updated_at: stamp},{ onConflict: "tenant_id" });
      if (error) return json({ error: "setup_request_update_failed", detail: error.message }, 500);
      return json({ ok: true, status: "in_progress" });
    }

    if (action === "approve") {
      const stamp = now.toISOString();
      const trialEnds = new Date(now.getTime() + 3 * 86400000).toISOString();
      const { error: tenantError } = await sb.from("tenants").update({setup_status: "approved",setup_approved_at: stamp,setup_approved_by: user.id,trial_started_at: stamp,trial_ends_at: trialEnds}).eq("id", tenantId);
      if (tenantError) return json({ error: "tenant_update_failed", detail: tenantError.message }, 500);
      const { error: requestError } = await sb.from("setup_requests").upsert({tenant_id: tenantId,owner_user_id: tenant.owner_user_id,status: "approved",assigned_admin: user.id,approved_at: stamp,updated_at: stamp},{ onConflict: "tenant_id" });
      if (requestError) return json({ error: "setup_request_update_failed", detail: requestError.message }, 500);
      return json({ ok: true, status: "approved", trial_ends_at: trialEnds });
    }

    const { error } = await sb.from("tenants").update({ setup_status: "suspended" }).eq("id", tenantId);
    if (error) return json({ error: "tenant_update_failed", detail: error.message }, 500);
    return json({ ok: true, status: "suspended" });
  } catch (error) {
    console.error("manage-tenant-setup", error);
    return json({ error: "internal_error", detail: error instanceof Error ? error.message : String(error) }, 500);
  }
});
