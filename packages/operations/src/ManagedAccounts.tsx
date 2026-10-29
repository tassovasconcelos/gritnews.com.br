import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PasswordSetup } from './AccountConfirmation';
import type { OperationApp } from './SettingsPanel';

type Account = { user_id: string; email: string; full_name: string; role: string; active: boolean; protected: boolean; email_confirmed: boolean; last_sign_in_at: string | null; password_required: boolean; temporary_expires_at: string | null };
const roleNames: Record<string, string> = { owner: 'Proprietário', manager: 'Gerente', cashier: 'Caixa', attendant: 'Atendente', stockist: 'Estoque', viewer: 'Consulta' };
const errorText: Record<string, string> = {
  account_exists_use_link: 'Esta conta já existe. Vincule pela equipe; para trocar a senha use a ação de redefinição.',
  protected_account: 'Esta conta administrativa é protegida. Use a recuperação de acesso da própria conta.',
  active_member_required: 'A conta precisa estar ativa e vinculada a este cliente.',
  account_busy: 'Já existe uma alteração em andamento para esta conta. Aguarde e atualize a ficha.',
  email_confirmation_required: 'Confirme a identidade e o endereço de e-mail antes de redefinir.',
  temporary_password_expired: 'A senha temporária expirou. Peça ao Super Admin uma nova senha.',
  temporary_login_required: 'Entre novamente usando a senha temporária recebida do Super Admin.',
  choose_different_password: 'Escolha uma senha diferente da temporária.',
  password_minimum_12: 'Use uma senha com pelo menos 12 caracteres.',
};
async function accountAction(client: any, body: Record<string, unknown>) {
  const { data, error } = await client.functions.invoke('ops-admin-accounts', { body });
  let details = data;
  if (error?.context instanceof Response) { try { details = await error.context.clone().json(); } catch { /* Gateway errors use the generic message. */ } }
  if (error || details?.error || !data) throw new Error(errorText[details?.error] || 'Não foi possível concluir. Confira a conexão, as permissões e tente novamente.');
  return data;
}

export function AdminAccounts({ client, app, scopeId }: { client: any; app: OperationApp; scopeId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [email, setEmail] = useState(''), [name, setName] = useState(''), [role, setRole] = useState('manager'), [reason, setReason] = useState('');
  const [verified, setVerified] = useState(false), [reset, setReset] = useState<Account | null>(null), [globalAck, setGlobalAck] = useState(false);
  const [credential, setCredential] = useState<{ email: string; temporary_password: string; expires_at: string } | null>(null), [show, setShow] = useState(false);
  const requestVersion = useRef(0);
  async function load() {
    const version = ++requestVersion.current; setLoading(true);
    try {
      const r = await client.rpc('ops_admin_accounts', { a: app, s: scopeId });
      if (r.error) throw r.error;
      if (version === requestVersion.current) setAccounts(r.data || []);
    } catch { if (version === requestVersion.current) setMessage('Não foi possível consultar as contas. Atualize a ficha ou confira a publicação do módulo.'); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }
  useEffect(() => { setAccounts([]); setCredential(null); setReset(null); setMessage(''); setReason(''); setEmail(''); setName(''); setRole('manager'); setVerified(false); setGlobalAck(false); void load(); return () => { requestVersion.current++; }; }, [app, scopeId]);
  useEffect(() => { if (!credential) return; const timer = setTimeout(() => { setCredential(null); setShow(false); }, 120000); return () => clearTimeout(timer); }, [credential]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage(''); setCredential(null); setShow(false);
    const view = requestVersion.current;
    try {
      const data = await accountAction(client, { action: reset ? 'reset' : 'create', app, scope_id: scopeId, email: email.trim(), full_name: name.trim(), role,
        user_id: reset?.user_id, reason, identity_verified: verified, confirm_email: verified, global_reset_ack: globalAck });
      if (view !== requestVersion.current) return;
      setCredential(data); setReset(null); setReason(''); setVerified(false); setGlobalAck(false); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Falha ao alterar a conta.'); }
    finally { setBusy(false); }
  }
  return <section className="ops-panel ops-accounts"><div className="ops-actions"><h2>Contas e senhas temporárias</h2><button type="button" disabled={busy || loading} onClick={() => void load()}>Atualizar contas</button></div>
    <p>Crie a conta com perfil definido ou gere outra senha para suporte. O perfil Proprietário administra este cliente e não concede Super Admin da plataforma. A senha temporária vale por 24 horas e exige troca no primeiro acesso.</p>
    {loading ? <p role="status">Carregando contas...</p> : <div className="ops-table-scroll"><table><thead><tr><th>Conta</th><th>Perfil</th><th>Situação</th><th>Acesso e suporte</th></tr></thead><tbody>{accounts.map(a => <tr key={a.user_id}><td><b>{a.full_name || a.email}</b><small>{a.email}</small></td><td>{roleNames[a.role] || a.role}</td><td>{!a.active ? 'Bloqueada' : a.password_required ? 'Troca de senha obrigatória' : !a.email_confirmed ? 'E-mail pendente' : 'Ativa'}<small>{a.last_sign_in_at ? `Último acesso: ${new Date(a.last_sign_in_at).toLocaleString('pt-BR')}` : 'Primeiro acesso pendente'}</small></td><td><button type="button" disabled={busy || a.protected || !a.active} onClick={() => { setReset(a); setReason(''); setVerified(false); setGlobalAck(false); setCredential(null); }}>Gerar nova senha temporária</button>{a.protected && <small>Conta administrativa protegida</small>}</td></tr>)}</tbody></table>{!accounts.length && <p>Nenhuma conta vinculada a este cliente.</p>}</div>}
    {credential && <div className="ops-credential" role="status"><h3>Senha gerada para {credential.email}</h3><p>Copie agora e entregue diretamente à pessoa. Este painel oculta a senha em dois minutos e não permite consultá-la novamente.</p><label>Senha temporária<input type={show ? 'text' : 'password'} readOnly autoComplete="off" value={credential.temporary_password} /></label><div className="ops-actions"><button type="button" onClick={() => setShow(v => !v)}>{show ? 'Ocultar' : 'Mostrar senha'}</button><button type="button" onClick={() => void navigator.clipboard.writeText(credential.temporary_password).then(() => setMessage('Senha copiada. Entregue-a diretamente à pessoa.')).catch(() => setMessage('Selecione a senha e copie manualmente.'))}>Copiar senha</button><button type="button" onClick={() => { setCredential(null); setShow(false); }}>Já entreguei. Fechar</button></div><small>Validade: {new Date(credential.expires_at).toLocaleString('pt-BR')}</small></div>}
    <form className="ops-form" onSubmit={submit}><h3>{reset ? `Redefinir acesso de ${reset.email}` : 'Criar usuário neste cliente'}</h3>
      {!reset && <div className="ops-field-grid"><label>Nome completo<input required minLength={2} maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label><label>E-mail<input type="email" required autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Perfil<select value={role} onChange={e => setRole(e.target.value)}>{['owner', 'manager', 'cashier', ...(app === 'sr-padeiro' ? ['stockist', 'viewer'] : ['attendant'])].map(r => <option key={r} value={r}>{roleNames[r]}</option>)}</select></label></div>}
      <label>Motivo / orientação de suporte<input required minLength={5} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <label className="ops-check"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} required />Confirmei a identidade e o endereço de e-mail da pessoa. A conta será validada administrativamente.</label>
      {reset && <label className="ops-check"><input type="checkbox" checked={globalAck} onChange={e => setGlobalAck(e.target.checked)} required />Entendo que a senha pertence à conta e será alterada em todos os aplicativos em que ela é usada. Sessões anteriores serão bloqueadas para operação até novo acesso.</label>}
      <div className="ops-actions"><button className="ops-primary" disabled={busy || !verified || (!!reset && !globalAck)}>{busy ? 'Processando...' : reset ? 'Redefinir e gerar senha temporária' : 'Criar usuário e gerar senha temporária'}</button>{reset && <button type="button" disabled={busy} onClick={() => { setReset(null); setVerified(false); setGlobalAck(false); }}>Cancelar redefinição</button>}</div>
    </form><p role="status">{message}</p>
  </section>;
}

export function ManagedPasswordGate({ client, children }: { client: any; children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'ready' | 'required' | 'login' | 'expired' | 'error'>('checking');
  const version = useRef(0);
  const operational = /^\/(app|admin|login|reset-password|auth|homologacao-gateway)(\/|$)/.test(location.pathname);
  async function check() {
    if (!client || !operational) { setState('ready'); return; }
    const current = ++version.current;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) { if (current === version.current) setState('ready'); return; }
      const status = await accountAction(client, { action: 'status' });
      if (current !== version.current) return;
      setState(status.expired ? 'expired' : !status.fresh_session ? 'login' : status.required ? 'required' : 'ready');
    } catch { if (current === version.current) setState('error'); }
  }
  useEffect(() => {
    void check(); if (!client || !operational) return;
    const listener = client.auth.onAuthStateChange(() => { setTimeout(() => void check(), 0); });
    const focus = () => void check(); window.addEventListener('focus', focus);
    return () => { version.current++; listener.data.subscription.unsubscribe(); window.removeEventListener('focus', focus); };
  }, [client, operational]);
  if (!operational || state === 'ready') return <>{children}</>;
  if (state === 'checking') return <div className="ops-panel ops-invite" role="status">Conferindo a segurança do seu acesso...</div>;
  if (state === 'required') return <PasswordSetup minLength={12} describeError={error => error instanceof Error ? error.message : 'Não foi possível salvar a senha. Tente novamente.'} client={{ auth: { updateUser: async ({ password }) => {
    try { await accountAction(client, { action: 'complete', new_password: password }); const r = await client.auth.refreshSession(); if (r.error) throw r.error; return { error: null }; }
    catch (error) { return { error }; }
  } } }} onDone={() => { setState('checking'); void check(); }} />;
  return <main className="ops-panel ops-invite"><h1>{state === 'login' ? 'Entre novamente na sua conta' : state === 'expired' ? 'Solicite uma nova senha temporária' : 'Não foi possível conferir seu acesso'}</h1><p>{state === 'login' ? 'Esta sessão é anterior à redefinição de senha. Saia e entre novamente com a senha atual da conta. Se recebeu uma senha temporária, use-a para criar sua senha pessoal.' : state === 'expired' ? 'A validade terminou. Peça ao Super Admin uma nova senha para continuar.' : 'Confira sua conexão e tente novamente.'}</p>{state === 'error' && <button onClick={() => { setState('checking'); void check(); }}>Tentar novamente</button>}<button onClick={async () => { await client.auth.signOut(); location.assign(location.pathname + location.search); }}>Sair e entrar novamente</button></main>;
}
