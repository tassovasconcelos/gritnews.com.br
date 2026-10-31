import { useEffect, useState } from 'react';
import type { OperationApp } from './SettingsPanel';

export const operationChecks = [
  ['identity', 'Cadastro, marca e configurações conferidos'],
  ['team', 'Usuários e permissões testados'],
  ['catalog', 'Produtos e preços disponíveis para venda'],
  ['stock', 'Estoque e compras conferidos'],
  ['sale', 'Fluxo de atendimento e venda validado'],
  ['cash', 'Pagamentos e fechamento de caixa conferidos'],
  ['receipt', 'Recibo e impressão testados no aparelho'],
] as const;

export function SuperAdminOperation({ client, app, scopeId, name }: {
  client: any; app: OperationApp; scopeId: string; name: string;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState('pending');
  const [reviewedAt, setReviewedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    setReady(false);
    client.rpc('ops_operation_review', { a: app, s: scopeId }).then((r: any) => {
      if (!active) return;
      if (r.error) { setMessage('A conferência está indisponível. Verifique a atualização do banco e seu perfil Super Admin.'); return; }
      setChecks(r.data?.checks || {}); setNotes(r.data?.notes || '');
      setStatus(r.data?.status || 'pending'); setReviewedAt(r.data?.updated_at || null); setReady(true);
    }).catch(() => { if (active) setMessage('Não foi possível carregar a conferência.'); });
    return () => { active = false; };
  }, [client, app, scopeId]);
  async function open(purpose: string, settings = false) {
    if (reason.trim().length < 3) { setMessage('Informe o motivo do acesso, com pelo menos 3 caracteres.'); return; }
    setBusy(true); setMessage('');
    try {
      const r = await client.rpc('ops_start_support', { a: app, s: scopeId, reason: `${purpose}: ${reason.trim()}` });
      if (r.error || !r.data?.expires_at) throw new Error('support_unavailable');
      const target = new URL('/app', location.origin);
      target.searchParams.set(app === 'sr-padeiro' ? 'support_org' : 'support_tenant', scopeId);
      if (settings) target.searchParams.set('section', 'settings');
      location.assign(target.href);
    } catch { setMessage('Não foi possível abrir a sessão auditada. Verifique suas permissões e tente novamente.'); setBusy(false); }
  }
  async function save() {
    setBusy(true); setMessage('');
    try {
      const r = await client.rpc('ops_operation_review', { a: app, s: scopeId, payload: { checks, notes, status } });
      if (r.error) throw r.error;
      setReviewedAt(r.data.updated_at); setMessage('Conferência salva com seu usuário no histórico de auditoria.');
    } catch { setMessage('Não foi possível salvar. Para aprovar, confira todos os itens e registre as evidências nas observações.'); }
    finally { setBusy(false); }
  }
  return <section id="superadmin-operation" className="ops-panel ops-review">
    <h2>Operação assistida e homologação</h2><p><strong>{name}</strong> · acesso exclusivo do Super Admin, com a própria conta, por até uma hora. A sessão permite acompanhar e atuar nos cadastros, equipe, configurações, vendas, estoque e caixa.</p>
    <label>Motivo do acesso<input value={reason} maxLength={240} onChange={e => setReason(e.target.value)} placeholder="Ex.: conferir permissões e treinar o fechamento de caixa" /></label>
    <div className="ops-actions"><button disabled={busy} onClick={() => void open('Auditoria e acompanhamento')}>Entrar para auditar</button><button disabled={busy} onClick={() => void open('Suporte e configuração', true)}>Configurar e dar suporte</button><button disabled={busy} onClick={() => void open('Homologação operacional')}>Testar operação do cliente</button></div>
    <p>Você atuará na operação real selecionada. Alterações e vendas têm efeito nessa empresa. Para testes fictícios, utilize um cliente de homologação.</p>
    <fieldset disabled={!ready || busy}><legend>Conferência da operação</legend>
      {operationChecks.map(([key, label]) => <label className="ops-check" key={key}><input type="checkbox" checked={checks[key] === true} onChange={e => setChecks({ ...checks, [key]: e.target.checked })} />{label}</label>)}
      <label>Parecer<select value={status} onChange={e => setStatus(e.target.value)}><option value="pending">Em conferência</option><option value="needs_attention">Com pendências</option><option value="approved">Operação homologada</option></select></label>
      <label>Evidências e pendências<textarea rows={3} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Registre o que foi testado, aparelho e impressora utilizados, resultados e pendências." /></label>
      <button onClick={() => void save()} disabled={busy || !ready}>{busy ? 'Aguarde…' : 'Salvar conferência'}</button>
    </fieldset>
    {reviewedAt && <p>Última conferência: {new Date(reviewedAt).toLocaleString('pt-BR')}.</p>}
    <p>A homologação operacional não emite documentos fiscais, não substitui a homologação fiscal e não altera cobrança ou liberação comercial.</p>
    <p role="status">{message}</p>
  </section>;
}
