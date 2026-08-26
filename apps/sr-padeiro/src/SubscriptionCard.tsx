import { useEffect,useState } from 'react';
import { CreditCard } from 'lucide-react';
import { supabase } from './lib/supabase';
import { track } from './lib/tracking';

export default function SubscriptionCard({orgId,compact=false}:{orgId:string;compact?:boolean}){
  const [status,setStatus]=useState<string|null>(null);const [activationPaid,setActivationPaid]=useState(false);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>{Promise.all([supabase.from('srp_subscriptions').select('status').eq('organization_id',orgId).maybeSingle(),supabase.from('srp_organizations').select('activation_paid_at').eq('id',orgId).maybeSingle()]).then(([subscription,org])=>{setStatus(subscription.data?.status||null);setActivationPaid(Boolean(org.data?.activation_paid_at))})},[orgId]);
  async function checkout(kind:'activation'|'subscription'){setBusy(true);setMessage('');const activation=kind==='activation';track('begin_checkout',{product:'sr-padeiro',kind,plan:activation?'sr_padeiro_activation_199':'sr_padeiro_89',value:activation?199:89,currency:'BRL'});const fn=activation?'create-srp-activation-checkout':'create-srp-subscription';const {data,error}=await supabase.functions.invoke(fn,{body:{organization_id:orgId}});if(error||!data?.checkout_url){const code=data?.error||'';setMessage(code.includes('not_configured')?'O pagamento online está em configuração. Fale com a GRIT para ativação assistida.':code==='activation_required'?'Conclua primeiro a implantação de R$ 199.':'Não foi possível abrir o pagamento agora.');setBusy(false);return}location.href=data.checkout_url}
  if(status==='active')return <section className={compact?'subscription-card compact':'subscription-card'}><CreditCard/><div><strong>Plano ativo</strong><p>Sr. Padeiro — R$ 89/mês</p></div></section>;
  const kind=activationPaid?'subscription':'activation';
  return <section className={compact?'subscription-card compact':'subscription-card'}><CreditCard/><div><strong>{activationPaid?'Ative sua mensalidade':'Implantação do Sr. Padeiro'}</strong><p>{activationPaid?'Assinatura de R$ 89/mês. A liberação acontece após confirmação do Mercado Pago.':'Pagamento único de R$ 199. Depois, conclua a assinatura mensal de R$ 89.'}</p>{status&&<small>Status atual: {status}</small>}</div><button className="btn-orange" disabled={busy} onClick={()=>checkout(kind)}>{busy?'Abrindo pagamento...':activationPaid?'Assinar por R$ 89/mês':'Pagar implantação — R$ 199'}</button>{message&&<p className="subscription-message">{message}</p>}</section>
}
