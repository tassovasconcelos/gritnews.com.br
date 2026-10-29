import { useEffect, useRef, useState } from 'react';
import type { OperationApp } from './SettingsPanel';

type Report = {
  revenue_30d: number; previous_revenue_30d: number; sales_30d: number; ticket_30d: number | null; open_orders: number;
  products: number; active_products: number; pending_fulfillment: number; stock_records: number; low_stock: number; last_sale_at: string | null;
  accounts: { active: boolean; email_confirmed: boolean; last_sign_in_at: string | null; password_required: boolean }[];
  plan: { revenue_goal: number | null; next_action: string; responsible: string; due_date: string | null; updated_at: string } | null;
};
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function clientActions(report: Report) {
  const accounts = report.accounts.filter(a => a.active);
  const actions: string[] = [];
  if (!accounts.length) actions.push('Vincular a equipe e definir os perfis de acesso.');
  if (accounts.some(a => !a.email_confirmed || a.password_required || !a.last_sign_in_at)) actions.push('Concluir o primeiro acesso das contas pendentes e orientar a equipe.');
  if (!report.products) actions.push('Cadastrar o cardápio com preço, unidade e categoria.');
  else if (report.active_products < report.products) actions.push('Conferir os produtos inativos antes de liberar o catálogo.');
  if (report.pending_fulfillment) actions.push(`Definir pronta entrega ou encomenda para ${report.pending_fulfillment} produto(s).`);
  if (report.products && !report.stock_records) actions.push('Contar e registrar o estoque físico por loja.');
  if (report.low_stock) actions.push(`Conferir a reposição de ${report.low_stock} saldo(s) baixo(s).`);
  if (!report.sales_30d) actions.push('Treinar atendimento, fechamento e recibo antes de iniciar as vendas reais.');
  else if (Number(report.revenue_30d) < Number(report.previous_revenue_30d)) actions.push('Revisar disponibilidade, mix e atendimento para recuperar as vendas do período anterior.');
  else actions.push('Acompanhar ticket médio e produtos procurados para orientar a próxima ação de venda.');
  if (report.open_orders) actions.push(`Conferir ${report.open_orders} comanda(s) aberta(s).`);
  return actions;
}

export function ClientSuccessPanel({ client, app, scopeId }: { client: any; app: OperationApp; scopeId: string }) {
  const [report, setReport] = useState<Report | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [saved, setSaved] = useState('');
  const [goal, setGoal] = useState(''), [action, setAction] = useState(''), [responsible, setResponsible] = useState(''), [due, setDue] = useState('');
  const version = useRef(0);
  async function load() {
    const current = ++version.current; setError('');
    try {
      const r = await client.rpc('ops_client_success', { a: app, s: scopeId });
      if (r.error) throw r.error;
      if (current !== version.current) return;
      const next = r.data as Report; setReport(next); setGoal(next.plan?.revenue_goal == null ? '' : String(next.plan.revenue_goal)); setAction(next.plan?.next_action || ''); setResponsible(next.plan?.responsible || ''); setDue(next.plan?.due_date || '');
    } catch { if (current === version.current) setError('Não foi possível carregar o acompanhamento. Atualize a ficha ou confira as permissões.'); }
  }
  useEffect(() => { setReport(null); setSaved(''); void load(); return () => { version.current++; }; }, [app, scopeId]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(''); setSaved(''); const current = version.current;
    try {
      const r = await client.rpc('ops_success_plan_save', { a: app, s: scopeId, goal: goal === '' ? null : Number(goal), next_action: action, responsible, due_date: due || null });
      if (r.error) throw r.error;
      if (current !== version.current) return;
      setSaved('Plano de acompanhamento salvo e registrado no histórico.'); await load();
    } catch { if (current === version.current) setError('Não foi possível salvar o plano. Confira os campos e tente novamente.'); }
    finally { setBusy(false); }
  }
  return <section className="ops-panel ops-success"><div className="ops-actions"><h2>Acompanhamento e resultados do cliente</h2><button type="button" disabled={busy} onClick={() => void load()}>Atualizar indicadores</button></div>
    <p>Vendas fechadas nos últimos 30 dias, comparadas aos 30 dias anteriores. Vendas a prazo compõem este total; o indicador não representa somente dinheiro recebido.</p>
    {error && <p role="alert">{error}</p>}{!report && !error && <p role="status">Carregando acompanhamento...</p>}
    {report && <><div className="ops-success-kpis">
      <article><span>Vendas em 30 dias</span><strong>{money(Number(report.revenue_30d))}</strong><small>Período anterior: {money(Number(report.previous_revenue_30d))}</small></article>
      <article><span>Vendas concluídas</span><strong>{report.sales_30d}</strong><small>Ticket médio: {report.ticket_30d == null ? 'Sem vendas' : money(Number(report.ticket_30d))}</small></article>
      <article><span>Catálogo ativo</span><strong>{report.active_products} / {report.products}</strong><small>{report.pending_fulfillment} modalidade(s) a conferir</small></article>
      <article><span>Estoque</span><strong>{report.stock_records ? `${report.low_stock} saldo(s) baixo(s)` : 'Saldo não informado'}</strong><small>{report.last_sale_at ? `Última venda: ${new Date(report.last_sale_at).toLocaleString('pt-BR')}` : 'Nenhuma venda registrada'}</small></article>
    </div><h3>Próximas ações sugeridas</h3><ul className="ops-next-actions">{clientActions(report).map(item => <li key={item}>{item}</li>)}</ul>
    <form className="ops-form" onSubmit={save}><h3>Plano de suporte e crescimento</h3><div className="ops-field-grid"><label>Meta de referência de vendas para 30 dias (R$)<input type="number" min="0" max="999999999999" step="0.01" value={goal} onChange={e => setGoal(e.target.value)} /></label><label>Responsável<input maxLength={120} value={responsible} onChange={e => setResponsible(e.target.value)} /></label><label>Próximo acompanhamento<input type="date" value={due} onChange={e => setDue(e.target.value)} /></label></div><label>Próxima ação combinada<textarea maxLength={500} rows={3} value={action} onChange={e => setAction(e.target.value)} placeholder="Ex.: registrar o estoque inicial e treinar o fechamento de caixa" /></label><button className="ops-primary" disabled={busy}>{busy ? 'Salvando...' : 'Salvar acompanhamento'}</button><p role="status">{saved}</p></form>
    {Number(report.plan?.revenue_goal) > 0 ? <p>Vendas dos últimos 30 dias em relação à meta: <b>{(Number(report.revenue_30d) / Number(report.plan?.revenue_goal) * 100).toFixed(1)}%</b>.</p> : <p>A meta de vendas ainda não foi definida.</p>}</>}
  </section>;
}
