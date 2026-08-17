import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Store,
  Users,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import "./admin-customers.css";
import "./admin-customers-v2.css";

export type AdminTenant = {
  id: string;
  name: string;
  phone?: string;
  subscription_status: string;
  trial_ends_at: string;
  created_at: string;
  setup_status?: string;
  courtesy_type?: "tasting" | "barter" | null;
  courtesy_started_at?: string | null;
  courtesy_ends_at?: string | null;
};
export type AdminSubscription = {
  tenant_id: string;
  status: string;
  plan_code: string;
  provider_status?: string;
};
type Usage = {
  orders: number;
  revenue: number;
  lastActivity?: string;
  activeUsers: number;
  products: number;
  customers: number;
  openOrders: number;
  creditBalance: number;
  lowStock: number;
};
type OverviewRow = {
  tenant_id: string;
  tenant_name: string;
  phone?: string;
  subscription_status: string;
  setup_status?: string;
  plan_code?: string;
  provider_status?: string;
  orders_90d: number;
  revenue_90d: number;
  last_activity?: string;
  active_users: number;
  courtesy_type?: "tasting" | "barter" | null;
  courtesy_started_at?: string | null;
  courtesy_ends_at?: string | null;
  products_count: number;
  customers_count: number;
  open_orders: number;
  credit_balance: number;
  low_stock_products: number;
};
type Segment =
  | "all"
  | "risk"
  | "attention"
  | "healthy"
  | "excellent"
  | "inactive";
type EmailKind = "birthday" | "promotion" | "offer" | "custom";
type Props = {
  tenants: AdminTenant[];
  subs: AdminSubscription[];
  onRefresh: () => Promise<void> | void;
};
const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v,
  );
const digits = (v?: string) => (v || "").replace(/\D/g, "");
const healthClass = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
const daysSince = (iso?: string) =>
  iso
    ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000))
    : 999;

function health(t: AdminTenant, sub: AdminSubscription | undefined, u: Usage) {
  let score = 20;
  if (t.setup_status === "approved") score += 15;
  if (sub?.status === "active" || t.subscription_status === "active")
    score += 30;
  else if (sub?.status === "past_due") score -= 10;
  if (u.orders > 0) score += 10;
  if (u.orders >= 20) score += 10;
  if (u.orders >= 80) score += 5;
  if (u.activeUsers > 1) score += 5;
  if (u.lastActivity) {
    const days = daysSince(u.lastActivity);
    if (days <= 7) score += 15;
    else if (days <= 30) score += 8;
  }
  return Math.max(0, Math.min(100, score));
}
function healthLabel(score: number) {
  return score >= 85
    ? "Excelente"
    : score >= 65
      ? "Saudável"
      : score >= 40
        ? "Atenção"
        : "Risco";
}
function opportunity(score: number, u: Usage, sub?: AdminSubscription) {
  if (sub?.status === "past_due")
    return "Prioridade financeira: recuperar pagamento e evitar suspensão.";
  if (daysSince(u.lastActivity) > 14)
    return "Reativação: cliente sem movimento recente; vale contato consultivo.";
  if (score >= 65 && u.activeUsers >= 3)
    return "Expansão: bom uso da plataforma e potencial para usuário adicional ou novo módulo.";
  if (score < 40)
    return "Retenção: entender bloqueios de operação antes de ofertar qualquer evolução.";
  return "Relacionamento: acompanhar adoção e orientar melhores práticas de uso.";
}

export default function AdminCustomers({ tenants, subs, onRefresh }: Props) {
  const [usage, setUsage] = useState<Record<string, Usage>>({});
  const [overview, setOverview] = useState<Record<string, OverviewRow>>({});
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [courtesyType, setCourtesyType] = useState<"tasting" | "barter">(
    "tasting",
  );
  const [courtesyDays, setCourtesyDays] = useState<15 | 30 | 60 | 90>(15);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailKind, setEmailKind] = useState<EmailKind>("birthday");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  async function loadUsage() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_customer_overview");
    if (!error) {
      const rows = (data || []) as OverviewRow[];
      const u: Record<string, Usage> = {};
      const o: Record<string, OverviewRow> = {};
      for (const row of rows) {
        u[row.tenant_id] = {
          orders: Number(row.orders_90d || 0),
          revenue: Number(row.revenue_90d || 0),
          lastActivity: row.last_activity || undefined,
          activeUsers: Number(row.active_users || 1),
          products: Number(row.products_count || 0),
          customers: Number(row.customers_count || 0),
          openOrders: Number(row.open_orders || 0),
          creditBalance: Number(row.credit_balance || 0),
          lowStock: Number(row.low_stock_products || 0),
        };
        o[row.tenant_id] = row;
      }
      setUsage(u);
      setOverview(o);
    }
    setLoading(false);
  }
  useEffect(() => {
    loadUsage();
  }, [tenants.length]);
  const allRows = useMemo(
    () =>
      tenants
        .map((t) => {
          const ov = overview[t.id];
          const merged: AdminTenant = {
            ...t,
            phone: ov?.phone || t.phone,
            subscription_status:
              ov?.subscription_status || t.subscription_status,
            setup_status: ov?.setup_status || t.setup_status,
            courtesy_type: ov?.courtesy_type ?? t.courtesy_type,
            courtesy_started_at:
              ov?.courtesy_started_at ?? t.courtesy_started_at,
            courtesy_ends_at: ov?.courtesy_ends_at ?? t.courtesy_ends_at,
          };
          const sub =
            subs.find((s) => s.tenant_id === t.id) ||
            (ov
              ? {
                  tenant_id: t.id,
                  status: ov.provider_status || ov.subscription_status,
                  plan_code: ov.plan_code || "essential",
                  provider_status: ov.provider_status,
                }
              : undefined);
          const use = usage[t.id] || {
            orders: 0,
            revenue: 0,
            activeUsers: 1,
            products: 0,
            customers: 0,
            openOrders: 0,
            creditBalance: 0,
            lowStock: 0,
          };
          const score = health(merged, sub, use);
          const label = healthLabel(score);
          const mrr =
            (sub?.status === "active" || merged.subscription_status === "active"
              ? 89
              : 0) +
            Math.max(use.activeUsers - 3, 0) * 39;
          const stale = daysSince(use.lastActivity) > 14;
          return { t: merged, sub, use, score, label, mrr, stale };
        })
        .sort((a, b) => a.score - b.score),
    [tenants, subs, usage, overview],
  );
  const counts = useMemo(
    () => ({
      risk: allRows.filter((x) => x.score < 40).length,
      attention: allRows.filter((x) => x.score >= 40 && x.score < 65).length,
      healthy: allRows.filter((x) => x.score >= 65 && x.score < 85).length,
      excellent: allRows.filter((x) => x.score >= 85).length,
      inactive: allRows.filter((x) => x.stale).length,
    }),
    [allRows],
  );
  const rows = useMemo(
    () =>
      allRows
        .filter((x) =>
          `${x.t.name} ${x.t.phone || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .filter(
          (x) =>
            segment === "all" ||
            (segment === "risk" && x.score < 40) ||
            (segment === "attention" && x.score >= 40 && x.score < 65) ||
            (segment === "healthy" && x.score >= 65 && x.score < 85) ||
            (segment === "excellent" && x.score >= 85) ||
            (segment === "inactive" && x.stale),
        ),
    [allRows, query, segment],
  );
  const current = allRows.find((x) => x.t.id === selected) || null;
  async function changeAccess(
    t: AdminTenant,
    action: "suspend" | "reactivate",
  ) {
    if (!supabase) return;
    const label = action === "suspend" ? "suspender" : "reativar";
    if (!confirm(`Confirma ${label} o acesso operacional de ${t.name}?`))
      return;
    setBusy(t.id);
    const { data, error } = await supabase.rpc("admin_set_tenant_access", {
      p_tenant_id: t.id,
      p_action: action,
    });
    if (error || !data) {
      alert("Não foi possível atualizar o acesso do cliente.");
      setBusy(null);
      return;
    }
    await onRefresh();
    await loadUsage();
    setBusy(null);
  }
  async function grantCourtesy(t: AdminTenant) {
    if (!supabase) return;
    const renew = Boolean(
      t.courtesy_ends_at && new Date(t.courtesy_ends_at).getTime() > Date.now(),
    );
    const typeLabel = courtesyType === "tasting" ? "degustação" : "permuta";
    if (
      !confirm(
        `${renew ? "Renovar" : "Liberar"} ${typeLabel} para ${t.name} por ${courtesyDays} dias?`,
      )
    )
      return;
    setBusy(t.id);
    const { data, error } = await supabase.rpc("admin_grant_tenant_courtesy", {
      p_tenant_id: t.id,
      p_courtesy_type: courtesyType,
      p_days: courtesyDays,
      p_renew: renew,
    });
    if (error || !data?.ok) {
      alert("Não foi possível liberar o período administrativo.");
      setBusy(null);
      return;
    }
    await onRefresh();
    await loadUsage();
    setBusy(null);
  }
  const emailTemplates: Record<
    EmailKind,
    { subject: string; message: string }
  > = {
    birthday: {
      subject: "Feliz aniversário! 🎉",
      message:
        "Hoje é dia de celebrar você! A equipe Meu Espetinho deseja um novo ciclo cheio de saúde, conquistas e bons negócios.",
    },
    promotion: {
      subject: "Uma condição especial para o seu negócio",
      message:
        "Preparamos uma condição promocional especial para ajudar sua operação a evoluir. Responda este e-mail para conhecer todos os detalhes.",
    },
    offer: {
      subject: "Uma oportunidade para evoluir sua operação",
      message:
        "Identificamos uma oportunidade que pode ajudar seu negócio a ganhar mais agilidade e controle. Fale com nossa equipe para saber mais.",
    },
    custom: { subject: "Uma mensagem da equipe Meu Espetinho", message: "" },
  };
  function openEmail(kind: EmailKind = "birthday") {
    const template = emailTemplates[kind];
    setEmailKind(kind);
    setEmailSubject(template.subject);
    setEmailMessage(template.message);
    setEmailOpen(true);
  }
  function changeEmailKind(kind: EmailKind) {
    const template = emailTemplates[kind];
    setEmailKind(kind);
    setEmailSubject(template.subject);
    setEmailMessage(template.message);
  }
  async function sendEmail() {
    if (!supabase || !current || !emailSubject.trim() || !emailMessage.trim())
      return;
    setBusy(`email-${current.t.id}`);
    const { data, error } = await supabase.functions.invoke(
      "admin-send-customer-email",
      {
        body: {
          tenant_id: current.t.id,
          kind: emailKind,
          subject: emailSubject.trim(),
          message: emailMessage.trim(),
        },
      },
    );
    setBusy(null);
    if (error || !data?.ok) {
      alert(
        data?.message ||
          "Não foi possível enviar o e-mail. Verifique a configuração do remetente.",
      );
      return;
    }
    setEmailOpen(false);
    alert("E-mail enviado com sucesso e registrado no histórico.");
  }
  function openWhatsapp(
    t: AdminTenant,
    kind: "support" | "offer" | "reactivation" = "support",
  ) {
    const phone = digits(t.phone);
    if (!phone) {
      alert("Cliente sem WhatsApp cadastrado.");
      return;
    }
    const texts = {
      support: `Olá! Aqui é da equipe Meu Espetinho. Como está a operação de ${t.name}? Estamos à disposição para ajudar.`,
      offer: `Olá! Aqui é da equipe Meu Espetinho. Identificamos uma oportunidade para evoluir a operação de ${t.name}. Posso te apresentar?`,
      reactivation: `Olá! Aqui é da equipe Meu Espetinho. Percebemos que ${t.name} está há alguns dias sem movimentação no sistema. Posso te ajudar a retomar a operação ou ajustar alguma configuração?`,
    };
    window.open(
      `https://wa.me/55${phone}?text=${encodeURIComponent(texts[kind])}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  return (
    <section className="admin-panel customers-360">
      <div className="panel-title">
        <div>
          <small>GESTÃO DE ASSINANTES</small>
          <h2>
            <Store /> Clientes 360º
          </h2>
          <p>
            Saúde, uso, receita, equipe e ações de relacionamento em uma única
            visão.
          </p>
        </div>
        <button
          className="secondary-admin"
          onClick={loadUsage}
          disabled={loading}
        >
          <RefreshCw className={loading ? "spin" : ""} /> Atualizar uso
        </button>
      </div>
      <div className="customer-insights">
        <article>
          <span>Em risco</span>
          <b>{counts.risk}</b>
        </article>
        <article>
          <span>Precisam de atenção</span>
          <b>{counts.attention}</b>
        </article>
        <article>
          <span>Saudáveis + excelentes</span>
          <b>{counts.healthy + counts.excellent}</b>
        </article>
        <article>
          <span>Sem movimento +14d</span>
          <b>{counts.inactive}</b>
        </article>
      </div>
      <div className="customer-toolbar">
        <label>
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar estabelecimento ou WhatsApp..."
          />
        </label>
        <span>{rows.length} cliente(s)</span>
      </div>
      <div className="customer-segments">
        {(
          [
            ["all", "Todos", allRows.length],
            ["risk", "Risco", counts.risk],
            ["attention", "Atenção", counts.attention],
            ["healthy", "Saudáveis", counts.healthy],
            ["excellent", "Excelentes", counts.excellent],
            ["inactive", "Sem movimento", counts.inactive],
          ] as [Segment, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            className={segment === key ? "active" : ""}
            onClick={() => setSegment(key)}
          >
            {label}
            <strong>{count}</strong>
          </button>
        ))}
      </div>
      <div className="customer-layout">
        <div className="customer-list">
          <div className="customer-head">
            <span>Cliente</span>
            <span>Saúde</span>
            <span>Uso 90d</span>
            <span>MRR</span>
            <span />
          </div>
          {rows.map(({ t, sub, use, score, label, mrr, stale }) => (
            <button
              className={`${selected === t.id ? "customer-row active" : "customer-row"}${stale ? " is-stale" : ""}`}
              key={t.id}
              onClick={() => setSelected(t.id)}
            >
              <span>
                <b>{t.name}</b>
                <small>
                  {sub?.plan_code || "plano padrão"} •{" "}
                  {sub?.status || t.subscription_status}
                </small>
              </span>
              <span>
                <em className={`health h-${healthClass(label)}`}>
                  {score} • {label}
                </em>
              </span>
              <span>
                <b>{use.orders} pedidos</b>
                <small className={stale ? "stale-note" : ""}>
                  {stale
                    ? "Sem movimento recente"
                    : `${money(use.revenue)} processados`}
                </small>
              </span>
              <span>
                <b>{money(mrr)}</b>
                <small>{use.activeUsers} usuário(s)</small>
              </span>
              <ChevronRight />
            </button>
          ))}
        </div>
        <aside className="customer-detail">
          {!current ? (
            <div className="customer-empty">
              <Users />
              <h3>Selecione um assinante</h3>
              <p>Abra a ficha para acompanhar uso, saúde e executar ações.</p>
            </div>
          ) : (
            <>
              <div className="detail-title">
                <div>
                  <small>CLIENTE 360º</small>
                  <h3>{current.t.name}</h3>
                  <span className={`health h-${healthClass(current.label)}`}>
                    {current.score} • {current.label}
                  </span>
                </div>
              </div>
              <div className="detail-opportunity">
                <span>PRÓXIMA MELHOR AÇÃO</span>
                <b>{opportunity(current.score, current.use, current.sub)}</b>
              </div>
              <div className="detail-metrics">
                <div>
                  <span>Pedidos 90d</span>
                  <b>{current.use.orders}</b>
                </div>
                <div>
                  <span>Volume 90d</span>
                  <b>{money(current.use.revenue)}</b>
                </div>
                <div>
                  <span>Usuários</span>
                  <b>{current.use.activeUsers}</b>
                </div>
                <div>
                  <span>MRR estimado</span>
                  <b>{money(current.mrr)}</b>
                </div>
                <div>
                  <span>Produtos</span>
                  <b>{current.use.products}</b>
                </div>
                <div>
                  <span>Clientes</span>
                  <b>{current.use.customers}</b>
                </div>
                <div>
                  <span>Comandas abertas</span>
                  <b>{current.use.openOrders}</b>
                </div>
                <div>
                  <span>Fiado a receber</span>
                  <b>{money(current.use.creditBalance)}</b>
                </div>
              </div>
              <div className="detail-list">
                <div>
                  <span>Assinatura</span>
                  <b>{current.sub?.status || current.t.subscription_status}</b>
                </div>
                <div>
                  <span>Implantação</span>
                  <b>{current.t.setup_status || "-"}</b>
                </div>
                <div>
                  <span>Liberação especial</span>
                  <b>
                    {current.t.courtesy_type
                      ? `${current.t.courtesy_type === "tasting" ? "Degustação" : "Permuta"} até ${new Date(current.t.courtesy_ends_at || "").toLocaleDateString("pt-BR")}`
                      : "Não concedida"}
                  </b>
                </div>
                <div>
                  <span>Última operação</span>
                  <b>
                    {current.use.lastActivity
                      ? new Date(current.use.lastActivity).toLocaleDateString(
                          "pt-BR",
                        )
                      : "Sem movimento recente"}
                  </b>
                </div>
                <div>
                  <span>WhatsApp</span>
                  <b>{current.t.phone || "Não informado"}</b>
                </div>
                <div>
                  <span>Estoque baixo</span>
                  <b>{current.use.lowStock} produto(s)</b>
                </div>
              </div>
              <div className="courtesy-control">
                <strong>
                  <CalendarPlus /> Liberação administrativa
                </strong>
                <div>
                  <select
                    value={courtesyType}
                    onChange={(e) =>
                      setCourtesyType(e.target.value as "tasting" | "barter")
                    }
                  >
                    <option value="tasting">Degustação</option>
                    <option value="barter">Permuta</option>
                  </select>
                  <select
                    value={courtesyDays}
                    onChange={(e) =>
                      setCourtesyDays(
                        Number(e.target.value) as 15 | 30 | 60 | 90,
                      )
                    }
                  >
                    {[15, 30, 60, 90].map((days) => (
                      <option key={days} value={days}>
                        {days} dias
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={busy === current.t.id}
                  onClick={() => grantCourtesy(current.t)}
                >
                  <CalendarPlus />{" "}
                  {current.t.courtesy_ends_at &&
                  new Date(current.t.courtesy_ends_at).getTime() > Date.now()
                    ? "Renovar acesso"
                    : "Liberar cliente"}
                </button>
                <small>
                  A concessão não altera a assinatura nem cria cobrança no
                  Mercado Pago.
                </small>
              </div>
              <div className="detail-actions">
                <button onClick={() => openEmail("birthday")}>
                  <Mail /> Enviar e-mail
                </button>
                <button
                  onClick={() =>
                    openWhatsapp(
                      current.t,
                      current.stale ? "reactivation" : "support",
                    )
                  }
                >
                  <MessageCircle />{" "}
                  {current.stale
                    ? "Reativar relacionamento"
                    : "Enviar mensagem"}
                </button>
                <button
                  className="secondary-admin"
                  onClick={() => openWhatsapp(current.t, "offer")}
                >
                  <Sparkles /> Ofertar evolução
                </button>
                {current.t.setup_status === "suspended" ? (
                  <button
                    disabled={busy === current.t.id}
                    onClick={() => changeAccess(current.t, "reactivate")}
                  >
                    <CheckCircle2 /> Reativar operação
                  </button>
                ) : (
                  <button
                    className="danger-admin"
                    disabled={busy === current.t.id}
                    onClick={() => changeAccess(current.t, "suspend")}
                  >
                    <Ban /> Suspender operação
                  </button>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
      {emailOpen && current && (
        <div
          className="email-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEmailOpen(false);
          }}
        >
          <section
            className="email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-title"
          >
            <button
              className="email-close"
              onClick={() => setEmailOpen(false)}
              aria-label="Fechar"
            >
              <X />
            </button>
            <small>RELACIONAMENTO COM O CLIENTE</small>
            <h3 id="email-title">
              <Mail /> Enviar e-mail para {current.t.name}
            </h3>
            <label>
              Modelo
              <select
                value={emailKind}
                onChange={(e) => changeEmailKind(e.target.value as EmailKind)}
              >
                <option value="birthday">Aniversário</option>
                <option value="promotion">Promoção</option>
                <option value="offer">Oferta</option>
                <option value="custom">Mensagem personalizada</option>
              </select>
            </label>
            <label>
              Assunto
              <input
                maxLength={120}
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </label>
            <label>
              Mensagem
              <textarea
                maxLength={3000}
                rows={8}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </label>
            <p>
              O destinatário será o e-mail do responsável cadastrado. A mensagem
              sairá com a identidade Meu Espetinho e ficará registrada.
            </p>
            <div>
              <button
                className="secondary-admin"
                onClick={() => setEmailOpen(false)}
              >
                Cancelar
              </button>
              <button
                disabled={
                  busy === `email-${current.t.id}` ||
                  !emailSubject.trim() ||
                  !emailMessage.trim()
                }
                onClick={sendEmail}
              >
                <Send />{" "}
                {busy === `email-${current.t.id}`
                  ? "Enviando..."
                  : "Enviar agora"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

