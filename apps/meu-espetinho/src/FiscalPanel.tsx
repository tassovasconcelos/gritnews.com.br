import { useCallback, useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

type FiscalDocument = { id:string; order_id:string; status:string; result_code:string|null; created_at:string };
export default function FiscalPanel({ tenantId, isOwner, canEmit }: { tenantId: string; isOwner: boolean; canEmit:boolean }) {
 const [settings, setSettings] = useState({ cnpj: '', state_registration: '', legal_name: '' });
 const [documents, setDocuments] = useState<FiscalDocument[]>([]);
 const [message, setMessage] = useState('');
 const [busy, setBusy] = useState(false);
 const refresh = useCallback(async () => {
  if (!supabase) throw new Error('Conexão indisponível.');
  const [config, docs] = await Promise.all([
   supabase.from('fiscal_settings').select('cnpj,state_registration,legal_name').eq('tenant_id',tenantId).maybeSingle(),
   supabase.from('fiscal_documents').select('id,order_id,status,result_code,created_at').eq('tenant_id',tenantId).order('created_at',{ascending:false}).limit(100),
  ]);
  if (config.error || docs.error) throw new Error('Não foi possível consultar o módulo fiscal.');
  if (config.data) setSettings(config.data);
  setDocuments(docs.data || []);
 }, [tenantId]);
 useEffect(() => { refresh().catch(e=>setMessage(e.message)); }, [refresh]);
 async function save() {
  if (!supabase || busy) return;
  setBusy(true);
  try {
   const { error } = await supabase.from('fiscal_settings').upsert({tenant_id:tenantId,...settings});
   if (error) throw error;
   setMessage('Dados de homologação salvos.');
  } catch { setMessage('Não foi possível salvar. Confira os dados e sua permissão.'); }
  finally { setBusy(false); }
 }
 async function simulate(orderId:string) {
  if (!supabase || busy) return;
  setBusy(true);
  try {
   const {data,error}=await supabase.functions.invoke('fiscal-nfce',{body:{tenant_id:tenantId,order_id:orderId}});
   if(error || data?.error) throw new Error();
   setMessage('Resultado registrado em homologação. A obrigação fiscal permanece pendente.');
   await refresh();
  } catch { setMessage('Falha de comunicação ou permissão. Atualize e consulte a mesma venda antes de tentar novamente.'); }
  finally { setBusy(false); }
 }
 const labels:Record<string,string>={pending:'Pendente',processing:'Em consulta',unknown:'Resultado incerto — consultar',rejected:'Rejeitada na simulação',simulated:'Simulada — sem validade fiscal'};
 return <section className="panel"><h2>NFC-e — homologação simulada</h2>
  <p role="note">O recibo não fiscal não substitui a NFC-e. Nenhuma simulação quita a obrigação fiscal. Emissão real bloqueada nesta versão.</p>
  {isOwner && <div className="form-grid">
   <label>CNPJ<input value={settings.cnpj} maxLength={14} inputMode="numeric" onChange={e=>setSettings({...settings,cnpj:e.target.value.replace(/\D/g,'')})}/></label>
   <label>Inscrição estadual<input value={settings.state_registration} maxLength={20} onChange={e=>setSettings({...settings,state_registration:e.target.value})}/></label>
   <label>Razão social<input value={settings.legal_name} maxLength={120} onChange={e=>setSettings({...settings,legal_name:e.target.value})}/></label>
   <p>UF: Ceará • Ambiente: homologação. Certificado e CSC serão configurados somente no servidor na etapa de integração real.</p>
   <button disabled={busy} onClick={save}>Salvar dados fiscais</button>
  </div>}
  <p role="status">{message}</p><button disabled={busy} onClick={()=>refresh().catch(e=>setMessage(e.message))}>Atualizar pendências</button>
  <p>Últimas 100 vendas com registro fiscal. Todas aguardam emissão fiscal real.</p>
  {documents.map(d=><article className="account-card static" key={d.id}><div><strong>Venda {d.order_id}</strong><span>{labels[d.status]} • {new Date(d.created_at).toLocaleString('pt-BR')}</span></div>{canEmit&&<button disabled={busy||d.status==='simulated'} onClick={()=>simulate(d.order_id)}>{['processing','unknown'].includes(d.status)?'Consultar simulação':'Simular NFC-e'}</button>}</article>)}
 </section>;
}
