import React,{useEffect,useState} from 'react';
import {CheckCircle2,CreditCard,ExternalLink,Lock,RefreshCw,Server,ShieldCheck} from 'lucide-react';

interface AdminPaymentsProps{onShowToast:(msg:string)=>void}

export const AdminPayments:React.FC<AdminPaymentsProps>=({onShowToast})=>{
  const[checking,setChecking]=useState(false);
  const[online,setOnline]=useState<boolean|null>(null);

  const checkApp=async()=>{
    setChecking(true);
    try{
      const response=await fetch('/api/health',{cache:'no-store',credentials:'same-origin'});
      setOnline(response.ok);
      onShowToast(response.ok?'Backend do GRIT News respondeu normalmente.':'Backend indisponível.');
    }catch{
      setOnline(false);
      onShowToast('Não foi possível consultar o backend.');
    }finally{setChecking(false)}
  };

  useEffect(()=>{checkApp().catch(()=>undefined)},[]);

  return <div className="space-y-6 max-w-5xl">
    <header>
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 inline-flex items-center gap-1"><ShieldCheck className="w-4 h-4"/>Gateway protegido</span>
      </div>
      <h1 className="text-2xl font-black text-[#0B2343] mt-2">Pagamentos & Mercado Pago</h1>
      <p className="text-sm text-slate-600 mt-1">Credenciais privadas são mantidas exclusivamente no servidor. O painel não exibe, recebe nem armazena Access Token ou segredo de webhook.</p>
    </header>

    <section className="grid md:grid-cols-3 gap-4">
      <SecurityCard icon={<Lock className="w-5 h-5"/>} title="Segredo fora do browser" text="Access Token, webhook secret e chaves de assinatura não entram no bundle, localStorage ou formulário do navegador."/>
      <SecurityCard icon={<CreditCard className="w-5 h-5"/>} title="Cartão no Checkout Pro" text="Número do cartão, validade e CVV são informados somente no ambiente oficial do Mercado Pago."/>
      <SecurityCard icon={<ShieldCheck className="w-5 h-5"/>} title="Valor no servidor" text="Produto, cupom e preço final são recalculados no backend antes da criação da cobrança."/>
    </section>

    <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-[#0B2343]">Saúde da aplicação</h2>
          <p className="text-xs text-slate-500">Esta verificação confirma somente que o backend está respondendo; ela não revela credenciais nem detalhes da conta do gateway.</p>
        </div>
        <button type="button" onClick={checkApp} disabled={checking} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#145EDB] text-white text-xs font-bold disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${checking?'animate-spin':''}`}/>{checking?'Verificando…':'Verificar backend'}
        </button>
      </div>
      <div className={`rounded-2xl border p-4 flex items-center gap-3 text-sm ${online===true?'bg-emerald-50 border-emerald-200 text-emerald-900':online===false?'bg-rose-50 border-rose-200 text-rose-900':'bg-slate-50 border-slate-200 text-slate-700'}`}>
        {online===true?<CheckCircle2 className="w-5 h-5"/>:<Server className="w-5 h-5"/>}
        <span>{online===true?'Backend online.':online===false?'Backend não respondeu corretamente.':'Aguardando verificação.'}</span>
      </div>
    </section>

    <section className="bg-slate-950 text-white rounded-3xl p-6 space-y-4">
      <h2 className="font-black">Política operacional do gateway</h2>
      <p className="text-xs text-slate-300">Alterações de credenciais devem ser feitas somente no ambiente seguro de hospedagem/segredos do servidor. Nunca cole um Access Token em componentes do site, variáveis VITE_ ou armazenamento do navegador.</p>
      <a href="https://www.mercadopago.com.br/developers/panel/credentials" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-sky-300 hover:text-sky-200">
        Abrir painel oficial do Mercado Pago <ExternalLink className="w-4 h-4"/>
      </a>
    </section>
  </div>;
};

function SecurityCard({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){
  return <article className="bg-white border border-slate-200 rounded-2xl p-5"><div className="w-10 h-10 rounded-xl bg-sky-50 text-[#145EDB] flex items-center justify-center">{icon}</div><h3 className="font-black text-sm mt-3 text-[#0B2343]">{title}</h3><p className="text-xs text-slate-600 mt-2 leading-relaxed">{text}</p></article>;
}
