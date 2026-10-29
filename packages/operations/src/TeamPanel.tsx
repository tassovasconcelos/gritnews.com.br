import { useCallback, useEffect, useState } from "react";
import type { OperationApp } from "./SettingsPanel";
type Member = {
  user_id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
type Invite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted: boolean;
  revoked: boolean;
};
const labels: Record<string, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  cashier: "Caixa",
  attendant: "Atendente",
  stockist: "Estoque",
  viewer: "Consulta",
};
export function TeamPanel({
  client,
  app,
  scopeId,
  onChanged,
}: {
  client: any;
  app: OperationApp;
  scopeId: string;
  onChanged?: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]),
    [invites, setInvites] = useState<Invite[]>([]),
    [form, setForm] = useState({
      name: "",
      email: "",
      role: app === "sr-padeiro" ? "cashier" : "attendant",
    }),
    [message, setMessage] = useState(""),
    [link, setLink] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await client.rpc("ops_team", { a: app, s: scopeId });
    if (r.error) throw r.error;
    setMembers(r.data.members);
    setInvites(r.data.invites);
  }, [client, app, scopeId]);
  useEffect(() => {
    load().catch((error: { code?: string }) =>
      setMessage(
        error?.code === 'PGRST202' || error?.code === '42883'
          ? 'A central de usuários aguarda a atualização do banco. Solicite a publicação das funções de equipe ao administrador.'
          : "Não foi possível carregar a equipe. Verifique sua permissão.",
      ),
    );
  }, [load]);
  async function invite() {
    if (busy || !form.name.trim() || !form.email.trim()) return;
    setBusy(true);
    setLink("");
    try {
      const r = await client.rpc("ops_invite", {
        a: app,
        s: scopeId,
        email: form.email.trim(),
        full_name: form.name.trim(),
        member_role: form.role,
      });
      if (r.error) throw r.error;
      const url = new URL("/app", location.origin);
      url.searchParams.set("convite", r.data);
      url.searchParams.set("operation_app", app);
      setLink(url.href);
      setMessage(
        "Convite criado por 7 dias. Copie o link e envie ao usuário indicado. Não enviamos mensagens automaticamente.",
      );
      setForm({ ...form, name: "", email: "" });
      await load();
    } catch {
      setMessage(
        "Não foi possível criar o convite. Confira os campos e sua permissão.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function toggle(m: Member) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await client.rpc("ops_set_member", {
        a: app,
        s: scopeId,
        u: m.user_id,
        enabled: !m.active,
      });
      if (r.error) throw r.error;
      await load();
      onChanged?.();
      setMessage("Acesso atualizado.");
    } catch {
      setMessage(
        "Não foi possível alterar o acesso. O proprietário e o próprio usuário são protegidos.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function changeRole(m: Member, role: string) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await client.rpc('ops_set_role', { a: app, s: scopeId, u: m.user_id, member_role: role });
      if (r.error) throw r.error;
      await load(); onChanged?.();
      setMessage('Função atualizada e registrada no histórico.');
    } catch { setMessage('Não foi possível alterar a função. O proprietário e a própria conta são protegidos.'); }
    finally { setBusy(false); }
  }
  async function revoke(i: Invite) {
    if (busy) return;
    setBusy(true);
    try {
      const r = await client.rpc("ops_revoke_invite", {
        a: app,
        s: scopeId,
        i: i.id,
      });
      if (r.error) throw r.error;
      await load();
      setMessage(
        "Convite cancelado. O link anterior não permite aceitar o acesso.",
      );
    } catch {
      setMessage("Não foi possível cancelar este convite.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ops-panel">
      <h2>Equipe e acessos</h2>
      <p>
        Cada pessoa usa sua conta e suas permissões. Convites só podem ser
        aceitos com o e-mail confirmado do destinatário.
      </p>
      <div className="ops-grid">
        <label>
          Nome
          <input
            maxLength={120}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            maxLength={254}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Função
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {(app === "sr-padeiro"
              ? ["manager", "cashier", "stockist", "viewer"]
              : ["manager", "cashier", "attendant"]
            ).map((r) => (
              <option value={r} key={r}>
                {labels[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="ops-actions">
        <button
          className="ops-primary"
          disabled={busy || !form.name || !form.email}
          onClick={invite}
        >
          Criar convite de acesso
        </button>
      </div>
      <p role="status">{message}</p>
      {link && (
        <label>
          Link do convite
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <button
            onClick={() =>
              navigator.clipboard
                .writeText(link)
                .then(() => setMessage("Link copiado."))
                .catch(() => setMessage("Selecione e copie o link acima."))
            }
          >
            Copiar link
          </button>
        </label>
      )}
      <div className="ops-scroll">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Pessoa</th>
              <th>Função</th>
              <th>Acesso</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.user_id}>
                <td>
                  {m.name}
                  <br />
                  <small>{m.email}</small>
                </td>
                <td>{m.role === 'owner' ? labels.owner : <select aria-label={`Função de ${m.name || m.email}`} disabled={busy} value={m.role} onChange={e => changeRole(m, e.target.value)}>{(app === 'sr-padeiro' ? ['manager', 'cashier', 'stockist', 'viewer'] : ['manager', 'cashier', 'attendant']).map(role => <option key={role} value={role}>{labels[role]}</option>)}</select>}</td>
                <td>{m.active ? "Ativo" : "Inativo"}</td>
                <td>
                  {m.role !== "owner" && (
                    <button disabled={busy} onClick={() => toggle(m)}>
                      {m.active ? "Desativar" : "Ativar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Convites</h3>
      {invites
        .slice(-20)
        .reverse()
        .map((i) => (
          <p key={i.id}>
            {i.email} • {labels[i.role]} •{" "}
            {i.revoked
              ? "Cancelado"
              : i.accepted
                ? "Aceito"
                : new Date(i.expires_at).getTime() < Date.now()
                  ? "Expirado"
                  : `Válido até ${new Date(i.expires_at).toLocaleDateString("pt-BR")}`}{" "}
            {!i.revoked && !i.accepted && (
              <button disabled={busy} onClick={() => revoke(i)}>
                Cancelar convite
              </button>
            )}
          </p>
        ))}
    </section>
  );
}
export function InviteAcceptance({
  client,
  token,
}: {
  client: any;
  token: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [logged, setLogged] = useState(false);
  useEffect(() => {
    client.auth.getUser().then(({ data }: any) => setLogged(!!data.user));
    const { data } = client.auth.onAuthStateChange((_e: any, s: any) =>
      setLogged(!!s),
    );
    return () => data.subscription.unsubscribe();
  }, [client]);
  async function auth(create: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const r = create
        ? await client.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: location.href },
          })
        : await client.auth.signInWithPassword({ email, password });
      if (r.error) throw r.error;
      setMessage(
        create
          ? "Confirme seu e-mail, volte a este link e entre para aceitar o convite."
          : "Sessão iniciada. Agora aceite o convite.",
      );
    } catch {
      setMessage(
        "Não foi possível entrar ou cadastrar. Confira e-mail e senha.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function accept() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await client.rpc("ops_accept_invite", { token });
      if (r.error) throw r.error;
      location.assign(
        `/app?operation_scope=${encodeURIComponent(r.data.scope_id)}`,
      );
    } catch {
      setMessage(
        "Convite inválido, expirado ou destinado a outro e-mail. Entre com o e-mail confirmado do convite.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="ops-panel ops-invite">
      <h1>Acesso à equipe</h1>
      <p>
        Entre com o e-mail que recebeu o convite. Este cadastro não cria outro
        estabelecimento.
      </p>
      {logged ? (
        <>
          <button disabled={busy} onClick={accept}>
            Aceitar convite e abrir operação
          </button>
          <button disabled={busy} onClick={() => client.auth.signOut()}>
            Entrar com outra conta
          </button>
        </>
      ) : (
        <>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <div className="ops-actions">
            <button
              disabled={busy || !email || !password}
              onClick={() => auth(false)}
            >
              Entrar
            </button>
            <button
              disabled={busy || !email || password.length < 10}
              onClick={() => auth(true)}
            >
              Criar minha conta
            </button>
          </div>
        </>
      )}
      <p role="status">{message}</p>
    </main>
  );
}
export function SupportBanner({
  client,
  app,
  scopeId,
}: {
  client: any;
  app: OperationApp;
  scopeId: string;
}) {
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = setInterval(async () => {
      const r = await client.rpc("ops_support_context", { a: app, s: scopeId });
      if (r.error)
        setMessage("Não foi possível verificar a sessão de suporte.");
      else if (r.data !== true) location.assign("/admin");
    }, 30000);
    return () => clearInterval(timer);
  }, [client, app, scopeId]);
  return (
    <div className="ops-support">
      <strong>
        Suporte do superadministrador • sessão temporária e auditada
      </strong>
      <button
        onClick={async () => {
          const r = await client.rpc("ops_end_support", { a: app, s: scopeId });
          if (r.error)
            setMessage("Não foi possível encerrar. Tente novamente.");
          else location.assign("/admin");
        }}
      >
        Encerrar suporte
      </button>
      {message && <span role="alert">{message}</span>}
    </div>
  );
}
