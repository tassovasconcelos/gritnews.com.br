import {useEffect,useState} from 'react';
import {db} from './lib/supabase';
import {readWithDeadline} from './lib/async-read.mjs';
import type {OperationCompany} from './OperationSwitcher';
type Row=Record<string,any>;
export default function OperationSettings({company,departments,canConfigure,canSetTarget,onSaved}:{company:OperationCompany;departments:Row[];canConfigure:boolean;canSetTarget:boolean;onSaved:()=>Promise<void>}){
 const [people,setPeople]=useState<Row[]>([]),[approver,setApprover]=useState(company.requisition_approver_user_id||'');
 const [target,setTarget]=useState(company.savings_target_percent==null?'':String(company.savings_target_percent));
 const [codes,setCodes]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{setCodes(Object.fromEntries(departments.map(d=>[d.id,d.external_code||''])));},[departments]);
 useEffect(()=>{
  if(!db||!canConfigure)return;let live=true;
  readWithDeadline(db.from('cp_user_directory').select('id,full_name,email,auth_user_id,company_id,requested_role').eq('status','active'))
   .then(({data,error})=>{if(!live)return;if(error)throw error;setPeople((data||[]).filter(p=>p.auth_user_id&&["manager","director","group_admin"].includes(p.requested_role)&&(!p.company_id||p.company_id===company.id)));})
   .catch(()=>{if(live)setMessage('Não foi possível consultar as contas para vínculo.');});
  return()=>{live=false;};
 },[company.id,canConfigure]);
 async function action(run:()=>PromiseLike<{error:any}>,success:string){
  setBusy(true);setMessage('');try{const r=await run();if(r.error)throw r.error;setMessage(success);await onSaved();}
  catch(e){setMessage('Não concluído: '+(e instanceof Error?e.message:'Confira as permissões e os dados informados.'));}
  finally{setBusy(false);}
 }
 return <section className="panel operation-config"><h3>Responsável e centros de consumo · {company.name}</h3>
  <p>Liberação de requisições: <strong>{company.requisition_approver_name||'A definir'}</strong>. {company.requisition_approver_user_id?'Conta vinculada.':'Aguardando vínculo à conta corporativa correta.'}</p>
  <p className="muted">O vínculo exige perfil ativo de gestor, diretoria ou administração com alçada em toda esta operação. O suporte GRIT não recebe autorização para despesas.</p>
  {message&&<p role="status" className="notice">{message}</p>}
  {canConfigure?<form className="form-grid" onSubmit={e=>{e.preventDefault();if(!db)return;void action(()=>db!.rpc('cp_configure_operation',{p_company:company.id,p_approver:approver||null,p_target:target===''?null:Number(target)}),'Configuração registrada na auditoria.');}}>
   <label>Conta de {company.requisition_approver_name}<select value={approver} onChange={e=>setApprover(e.target.value)}><option value="">Aguardando conta autorizada</option>{people.map(p=><option key={p.id} value={p.auth_user_id}>{p.full_name} · {p.email}</option>)}</select></label>
   <label>Meta de economia de preço (%)<input disabled={!canSetTarget} type="number" min="0" max="100" step="0.01" value={target} onChange={e=>setTarget(e.target.value)} placeholder="Definir após analisar a referência"/></label>
   <button className="btn primary" disabled={busy}>{canSetTarget?"Salvar responsável e meta":"Salvar responsável"}</button>
  </form>:<p className="muted">A administração do Grupo deve concluir o vínculo e definir a meta.</p>}
  <h4>Vincular {company.operation_key==='retail'?'lojas':'setores'} ao código de origem no Procfit</h4><p className="muted">Use exatamente o código da view. Esse vínculo não altera a view nem as movimentações do ERP.</p>
  {departments.map(d=><form className="registry-toolbar" key={d.id} onSubmit={e=>{e.preventDefault();if(!db)return;void action(()=>db!.rpc('cp_map_cost_center',{p_department:d.id,p_code:codes[d.id]||null}),'Código do Procfit vinculado.');}}><label>{d.name}<input aria-label={'Código Procfit de '+d.name} value={codes[d.id]||''} onChange={e=>setCodes({...codes,[d.id]:e.target.value})} placeholder="Código no Procfit"/></label><button className="btn secondary" disabled={busy}>Vincular código</button></form>)}
  {!departments.length&&<p className="muted">Cadastre as lojas reais para receber requisições e mapear seus centros de consumo.</p>}
 </section>;
}
