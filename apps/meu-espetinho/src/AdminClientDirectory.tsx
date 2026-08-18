import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ExternalLink, MessageCircle, Pencil, RefreshCw, Search, Send, ShieldCheck, Store, TrendingUp, UserRoundCheck, WalletCards, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { AdminSubscription, AdminTenant } from './AdminCustomers';
import './admin-client-directory.css';

type Props={tenants:AdminTenant[];subs:AdminSubscription[];onRefresh:()=>Promise<void>|void};
type Overview={tenant_id:string;tenant_name:string;phone?:string;subscription_status:string;setup_status?:string;orders_90d:number;revenue_90d:number;last_activity?:string;active_users:number;products_count:number;customers_count:number;open_orders:number;credit_balance:number;low_stock_products:number;last_access_at?:string;inactive_days:number};
type Detail={id:string;name:string;phone?:string;address?:string;primary_color?:string;subscription_status:string;setup_status?:string;created_at:string;acquisition_source?:string;acquisition_campaign?:string;trial_ends_at?:string|null;activation_paid_at?:string|null;activation_waived_at?:string|null;activation_waiver_reason?:string|null;courtesy_type?:'tasting'|'barter'|null;courtesy_started_at?:string|null;courtesy_ends_at?:string|null};
type AccessType='tasting'|'barter';
type AccessDays=15|30|60|90;
const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const digits=(v?:string)=>(v||'').replace(/\D/g,'');
const dateTime=(iso?:string|null)=>iso?new Date(iso).toLocaleString('pt-BR'):'—';

export default function AdminClientDirectory({tenants,subs,onRefresh}:Props){
 const[overview,setOverview]=useState<Record<string,Overview>>({});
 const[selected,setSelected]=useState<string|null>(null);
 const[detail,setDetail]=useState<Detail|null>(null);
 const[query,setQuery]=useState('');
 const[busy,setBusy]=useState(false);
 const[action,setAction]=useState('');
 const[msg,setMsg]=useState('');
 const[subject,setSubject]=useState('');
 const[message,setMessage]=useState('');
 const[accessType,setAccessType]=useState<AccessType>('tasting');
 const[accessDays,setAccessDays]=useState<AccessDays>(15);
 const[waiverReason,setWaiverReason]=useState('Liberação administrativa pelo Super Admin');

 async function load(){
  const sb=supabase;if(!sb)return;
  const{data}=await sb.rpc('admin_customer_overview');
  const map:Record<string,Overview>={};for(const row of (data||[]) as Overview[])map[row.tenant_id]=row;setOverview(map);
 }
 useEffect(()=>{void load()},[tenants.length]);
 async function openClient(id:string){
  const sb=supabase;if(!sb)return;setSelected(id);setMsg('');
  const{data,error}=await sb.from('tenants').select('id,name,phone,address,primary_color,subscription_status,setup_status,created_at,acquisition_source,acquisition_campaign,trial_ends_at,activation_paid_at,activation_waived_at,activation_waiver_reason,courtesy_type,courtesy_started_at,courtesy_ends_at').eq('id',id).single();
  if(error||!data){setMsg('Não foi possível carregar o perfil do cliente.');return}
  setDetail(data as Detail);if(data.courtesy_type==='tasting'||data.courtesy_type==='barter')setAccessType(data.courtesy_type);
 }
 async function refreshCurrent(id?:string){await onRefresh();await load();const target=id||detail?.id;if(target)await openClient(target)}
 const rows=useMemo(()=>tenants.map(t=>{const o=overview[t.id];const sub=subs.find(s=>s.tenant_id===t.id);return{t,o,sub}}).filter(x=>`${x.t.name} ${x.t.phone||''}`.toLowerCase().includes(query.toLowerCase())),[tenants,subs,overview,query]);
 const current=selected?rows.find(r=>r.t.id===selected):undefined;
 const courtesyActive=Boolean(detail?.courtesy_type&&detail?.courtesy_ends_at&&new Date(detail.courtesy_ends_at).getTime()>Date.now());
 const wa=detail?digits(detail.phone):'';

 async function save(){
  const sb=supabase;if(!sb||!detail)return;setBusy(true);setMsg('');
  const{data,error}=await sb.rpc('admin_update_tenant_profile',{p_tenant_id:detail.id,p_name:detail.name.trim(),p_phone:detail.phone||null,p_address:detail.address||null,p_primary_color:detail.primary_color||null});
  setBusy(false);if(error||!data?.ok){setMsg('Não foi possível salvar os dados do cliente.');return}setMsg('Dados atualizados com sucesso.');await refreshCurrent(detail.id);
 }
 async function grantAccess(){
  const sb=supabase;if(!sb||!detail)return;setAction('access');setMsg('');
  const{data,error}=await sb.rpc('admin_grant_tenant_courtesy',{p_tenant_id:detail.id,p_courtesy_type:accessType,p_days:accessDays,p_renew:Boolean(detail.courtesy_ends_at)});
  setAction('');if(error||!data?.ok){setMsg(`Não foi possível liberar o período${error?.message?`: ${error.message}`:''}.`);return}
  setMsg(accessType==='barter'?`Permuta liberada/renovada por ${accessDays} dias.`:`Trial liberado/renovado por ${accessDays} dias.`);await refreshCurrent(detail.id);
 }
 async function clearAccess(){
  const sb=supabase;if(!sb||!detail)return;setAction('clear');setMsg('');const{data,error}=await sb.rpc('admin_clear_tenant_courtesy',{p_tenant_id:detail.id});setAction('');
  if(error||!data?.ok){setMsg('Não foi possível encerrar o período administrativo.');return}setMsg('Trial/permuta administrativo encerrado.');await refreshCurrent(detail.id);
 }
 async function waiveActivation(){
  const sb=supabase;if(!sb||!detail)return;setAction('waive');setMsg('');const{data,error}=await sb.rpc('admin_waive_tenant_activation',{p_tenant_id:detail.id,p_reason:waiverReason.trim()||null});setAction('');
  if(error||!data?.ok){setMsg('Não foi possível liberar administrativamente a implantação.');return}setMsg('Implantação liberada administrativamente e registrada em auditoria.');await refreshCurrent(detail.id);
 }
 async function changeEnvironment(next:'suspend'|'reactivate'){
  const sb=supabase;if(!sb||!detail)return;setAction(next);setMsg('');const{data,error}=await sb.rpc('admin_set_tenant_access',{p_tenant_id:detail.id,p_action:next});setAction('');
  if(error||!data?.ok){setMsg('Não foi possível alterar o acesso do ambiente.');return}setMsg(next==='suspend'?'Ambiente suspenso.':'Ambiente reativado.');await refreshCurrent(detail.id);
 }
 async function support(){
  const sb=supabase;if(!sb||!detail)return;const{data,error}=await sb.rpc('admin_start_support_access',{p_tenant_id:detail.id,p_reason:'Análise e configuração pelo Cliente 360'});if(error||!data?.ok){setMsg('Não foi possível abrir o suporte seguro.');return}window.open(`/app?support_tenant=${encodeURIComponent(detail.id)}`,'_blank','noopener,noreferrer');
 }
 function suggestedText(kind:'improvement'|'thanks'){
  if(!current)return;if(kind==='thanks'){setSubject('Obrigado por fazer parte do Meu Espetinho');setMessage('Olá! Passando para agradecer pela confiança no Meu Espetinho. Conte com a nossa equipe para continuar simplificando o dia a dia do seu negócio.');return}
  const o=current.o;let tip='Mantenha produtos, preços e estoque atualizados para que os indicadores reflitam melhor a operação.';if((o?.low_stock_products||0)>0)tip=`Há ${o.low_stock_products} produto(s) com estoque baixo. Vale revisar a Lista de Compras.`;else if((o?.open_orders||0)>2)tip=`Existem ${o.open_orders} comandas abertas. Revisar contas antigas ajuda a manter caixa e indicadores corretos.`;setSubject('Dica para melhorar sua operação no Meu Espetinho');setMessage(`Olá! Analisamos sua operação e encontramos uma oportunidade simples de melhoria. ${tip}`);
 }
 async function sendEmail(){
  const sb=supabase;if(!sb||!detail||!subject.trim()||!message.trim())return;setBusy(true);const{data,error}=await sb.functions.invoke('admin-send-customer-email',{body:{tenant_id:detail.id,kind:'custom',subject:subject.trim(),message:message.trim()}});setBusy(false);setMsg(error||!data?.ok?(data?.message||'Não foi possível enviar a mensagem.'):'Mensagem enviada e registrada no histórico.');
 }

 return <section className="admin-client-directory">
  <div className="client-directory-head"><div><small>CLIENTES</small><h2>Carteira e Cliente 360º</h2><p>Cadastro, operação, implantação, trial, permuta, acesso e relacionamento em uma única visão.</p></div><button className="secondary-admin" onClick={load}><RefreshCw/> Atualizar</button></div>
  <div className="client-directory-layout">
   <aside className="client-list-panel"><label className="client-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente ou telefone"/></label><div className="client-list">{rows.map(({t,o,sub})=><button key={t.id} className={selected===t.id?'client-row active':'client-row'} onClick={()=>openClient(t.id)}><div className="client-avatar"><Store/></div><div><strong>{t.name}</strong><span>{t.phone||'Sem telefone'}</span><small>{sub?.status||t.subscription_status}</small></div><b>{money(Number(o?.revenue_90d||0))}<small>90 dias</small></b></button>)}</div></aside>
   <div className="client-detail-panel">{!detail?<div className="client-empty"><UserRoundCheck/><h3>Selecione um cliente</h3><p>Abra o perfil para administrar toda a jornada do estabelecimento.</p></div>:<>
    <div className="client-detail-top"><div><span className="client-status">{detail.subscription_status}</span><h2>{detail.name}</h2><p>Cliente desde {new Date(detail.created_at).toLocaleDateString('pt-BR')} • implantação {detail.setup_status||'—'}</p></div><button className="icon-button" onClick={()=>{setSelected(null);setDetail(null)}}><X/></button></div>
    <div className="client-kpis"><article><span>Faturamento 90d</span><strong>{money(Number(current?.o?.revenue_90d||0))}</strong></article><article><span>Pedidos 90d</span><strong>{current?.o?.orders_90d||0}</strong></article><article><span>Usuários ativos</span><strong>{current?.o?.active_users||0}</strong></article><article><span>Produtos</span><strong>{current?.o?.products_count||0}</strong></article><article><span>Comandas abertas</span><strong>{current?.o?.open_orders||0}</strong></article><article><span>Fiado</span><strong>{money(Number(current?.o?.credit_balance||0))}</strong></article></div>

    <section className="client-control-center"><div className="subhead"><WalletCards/><div><b>Controle administrativo</b><span>Exceções comerciais separadas do pagamento real e sempre auditadas</span></div></div>
     <div className="control-status-grid"><div><span>Implantação</span><strong>{detail.activation_paid_at?'Pagamento confirmado':detail.activation_waived_at?'Liberada pelo Super Admin':'Pendente'}</strong><small>{detail.activation_paid_at?dateTime(detail.activation_paid_at):detail.activation_waived_at?`${dateTime(detail.activation_waived_at)} • ${detail.activation_waiver_reason||''}`:'Aguardando pagamento ou liberação'}</small></div><div><span>Trial padrão</span><strong>{dateTime(detail.trial_ends_at)}</strong><small>Período original do ambiente</small></div><div><span>Extensão</span><strong>{courtesyActive?(detail.courtesy_type==='barter'?'Permuta ativa':'Trial estendido'):'Sem extensão ativa'}</strong><small>{courtesyActive?`Até ${dateTime(detail.courtesy_ends_at)}`:'15, 30, 60 ou 90 dias'}</small></div><div><span>Ambiente</span><strong>{detail.setup_status||'—'}</strong><small>Assinatura: {detail.subscription_status}</small></div></div>
     <div className="control-actions-grid"><div className="control-card"><b>Liberar implantação</b><p>Autorize comercialmente sem registrar pagamento fictício.</p><input value={waiverReason} onChange={e=>setWaiverReason(e.target.value)} placeholder="Motivo"/><button disabled={Boolean(action)||Boolean(detail.activation_paid_at)||Boolean(detail.activation_waived_at)} onClick={waiveActivation}>{action==='waive'?'Liberando...':'Liberar implantação'}</button></div><div className="control-card"><b>Trial / Permuta</b><p>Libere ou renove o acesso por um período definido.</p><div className="control-inline"><select value={accessType} onChange={e=>setAccessType(e.target.value as AccessType)}><option value="tasting">Trial / degustação</option><option value="barter">Permuta</option></select><select value={accessDays} onChange={e=>setAccessDays(Number(e.target.value) as AccessDays)}><option value={15}>15 dias</option><option value={30}>30 dias</option><option value={60}>60 dias</option><option value={90}>90 dias</option></select></div><button disabled={Boolean(action)} onClick={grantAccess}><CalendarPlus/> {action==='access'?'Salvando...':'Liberar / renovar'}</button>{courtesyActive&&<button className="danger-control" disabled={Boolean(action)} onClick={clearAccess}>Encerrar período</button>}</div><div className="control-card"><b>Acesso ao ambiente</b><p>Suspensão não apaga dados ou histórico.</p>{detail.setup_status==='suspended'?<button disabled={Boolean(action)} onClick={()=>changeEnvironment('reactivate')}>{action==='reactivate'?'Reativando...':'Reativar ambiente'}</button>:<button className="danger-control" disabled={Boolean(action)} onClick={()=>changeEnvironment('suspend')}>{action==='suspend'?'Suspendendo...':'Suspender ambiente'}</button>}</div></div>{msg&&<p className="client-message control-message">{msg}</p>}
    </section>

    <div className="client-detail-grid"><section><div className="subhead"><Pencil/><div><b>Dados do cliente</b><span>Edição segura pelo Super Admin</span></div></div><div className="client-form"><label>Nome<input value={detail.name} onChange={e=>setDetail({...detail,name:e.target.value})}/></label><label>WhatsApp<input value={detail.phone||''} onChange={e=>setDetail({...detail,phone:e.target.value})}/></label><label>Endereço<textarea rows={3} value={detail.address||''} onChange={e=>setDetail({...detail,address:e.target.value})}/></label><label>Cor<input value={detail.primary_color||''} onChange={e=>setDetail({...detail,primary_color:e.target.value})}/></label><button onClick={save} disabled={busy}>{busy?'Salvando...':'Salvar alterações'}</button></div></section><section><div className="subhead"><TrendingUp/><div><b>Leitura da operação</b><span>Indicadores para suporte consultivo</span></div></div><div className="client-insights"><div><span>Último acesso</span><strong>{current?.o?.last_access_at?dateTime(current.o.last_access_at):'Sem registro'}</strong></div><div><span>Estoque baixo</span><strong>{current?.o?.low_stock_products||0}</strong></div><div><span>Clientes cadastrados</span><strong>{current?.o?.customers_count||0}</strong></div><div><span>Origem</span><strong>{detail.acquisition_source||'Orgânico'}{detail.acquisition_campaign?` • ${detail.acquisition_campaign}`:''}</strong></div></div><button className="support-button" onClick={support}><ShieldCheck/> Abrir operação com suporte auditado <ExternalLink/></button></section></div>

    <section className="client-relationship"><div className="subhead"><MessageCircle/><div><b>Relacionamento</b><span>Dicas, agradecimentos e contato consultivo</span></div></div><div className="relationship-actions"><button onClick={()=>suggestedText('improvement')}>Gerar dica</button><button onClick={()=>suggestedText('thanks')}>Agradecer</button>{wa&&<a href={`https://wa.me/55${wa}`} target="_blank" rel="noreferrer"><MessageCircle/> WhatsApp</a>}</div><label>Assunto<input value={subject} onChange={e=>setSubject(e.target.value)}/></label><label>Mensagem<textarea rows={5} value={message} onChange={e=>setMessage(e.target.value)}/></label><button className="send-client-message" disabled={busy||!subject.trim()||!message.trim()} onClick={sendEmail}><Send/> Enviar por e-mail</button></section>
   </>}</div>
  </div>
 </section>;
}
