import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,CheckCircle2,Copy,CreditCard,Download,ExternalLink,Lock,Mail,QrCode,RefreshCw,ShieldCheck,Tag,User,Zap} from 'lucide-react';
import type {CommercialProduct,PlaybookOrder,SiteConfig} from '../../types';
import {COMMERCIAL_PRODUCTS,getProductById} from '../../data/commercialProducts';
import {addPlaybookOrder,getPlaybookOrders,getSiteConfig,updatePlaybookOrder} from '../../lib/storage';
import {checkMercadoPagoPaymentStatus,processMercadoPagoCheckout} from '../../lib/mercadoPagoService';

interface CheckoutViewProps{
  initialProductId?:string;
  onBackToHome:()=>void;
  onShowToast:(msg:string,type?:'success'|'info'|'error')=>void;
}

export const CheckoutView:React.FC<CheckoutViewProps>=({
  initialProductId='prod-playbook-emagrecimento',onBackToHome,onShowToast
})=>{
  const[siteConfig]=useState<SiteConfig>(()=>getSiteConfig());
  const[selectedProduct,setSelectedProduct]=useState<CommercialProduct>(()=>getProductById(initialProductId)||COMMERCIAL_PRODUCTS[0]);
  const[paymentMethod,setPaymentMethod]=useState<'pix'|'card'|'mercadopago_wallet'>('pix');
  const[customerName,setCustomerName]=useState('');
  const[customerEmail,setCustomerEmail]=useState('');
  const[customerPhone,setCustomerPhone]=useState('');
  const[customerCpf,setCustomerCpf]=useState('');
  const[couponInput,setCouponInput]=useState('');
  const[appliedCoupon,setAppliedCoupon]=useState<string|null>(null);
  const[busy,setBusy]=useState(false);
  const[completedOrder,setCompletedOrder]=useState<PlaybookOrder|null>(null);
  const[pixCode,setPixCode]=useState('');
  const[pixImage,setPixImage]=useState('');
  const[polling,setPolling]=useState(false);
  const[paymentConfirmed,setPaymentConfirmed]=useState(false);
  const pollRef=useRef<ReturnType<typeof setInterval>|null>(null);

  const previewAmount=useMemo(()=>{
    const base=selectedProduct.price;
    if(appliedCoupon==='GRIT10'||appliedCoupon==='BEMVINDO')return Number((base*.9).toFixed(2));
    if(appliedCoupon==='PROMO2026'||appliedCoupon==='DESCONTO5')return Math.max(.01,Number((base-5).toFixed(2)));
    return base;
  },[selectedProduct,appliedCoupon]);

  const markPaid=(order:PlaybookOrder)=>{
    const paid:{status:'PAID';accessSent:true;paidAt:string}={status:'PAID',accessSent:true,paidAt:new Date().toISOString()};
    updatePlaybookOrder(order.id,paid);
    setCompletedOrder({...order,...paid});
    setPaymentConfirmed(true);
    setPolling(false);
    if(pollRef.current)clearInterval(pollRef.current);
  };

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const params=new URLSearchParams(window.location.search);
    const paymentId=params.get('payment_id')||params.get('collection_id')||'';
    const reference=params.get('external_reference')||'';
    if(!paymentId||!reference)return;

    const existing=getPlaybookOrders().find(order=>order.id===reference);
    if(!existing)return;
    const product=existing.productId?getProductById(existing.productId):null;
    if(product)setSelectedProduct(product);
    setPaymentMethod(existing.paymentMethod==='card'?'card':existing.paymentMethod==='mercadopago_wallet'?'mercadopago_wallet':'pix');
    setCustomerName(existing.customerName);
    setCustomerEmail(existing.customerEmail);
    setCustomerPhone(existing.customerPhone);
    setCompletedOrder(existing);

    checkMercadoPagoPaymentStatus(paymentId).then(status=>{
      if(status.status==='approved'){
        markPaid({...existing,mercadoPagoPaymentId:paymentId});
        onShowToast('Pagamento confirmado pelo Mercado Pago.','success');
      }else{
        onShowToast('O pagamento ainda não foi confirmado pelo gateway.','info');
      }
    }).catch(()=>onShowToast('Não foi possível confirmar o pagamento agora.','error'));
  },[]);

  useEffect(()=>{
    const paymentId=completedOrder?.mercadoPagoPaymentId;
    if(!completedOrder||completedOrder.status==='PAID'||!paymentId||paymentMethod!=='pix')return;
    setPolling(true);
    pollRef.current=setInterval(async()=>{
      const result=await checkMercadoPagoPaymentStatus(paymentId);
      if(result.status==='approved')markPaid(completedOrder);
    },5000);
    return()=>{if(pollRef.current)clearInterval(pollRef.current)};
  },[completedOrder?.id,completedOrder?.mercadoPagoPaymentId,completedOrder?.status,paymentMethod]);

  const applyCoupon=(e:React.FormEvent)=>{
    e.preventDefault();
    const code=couponInput.trim().toUpperCase();
    if(['GRIT10','BEMVINDO','PROMO2026','DESCONTO5'].includes(code)){
      setAppliedCoupon(code);onShowToast('Cupom aplicado. O servidor validará o desconto no fechamento.','success');
    }else{
      setAppliedCoupon(null);onShowToast('Cupom inválido ou expirado.','error');
    }
  };

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(customerName.trim().length<2)return onShowToast('Informe seu nome completo.','error');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim()))return onShowToast('Informe um e-mail válido.','error');
    if(customerPhone.replace(/\D/g,'').length<10)return onShowToast('Informe um WhatsApp válido com DDD.','error');

    setBusy(true);
    try{
      const result=await processMercadoPagoCheckout({
        product:selectedProduct,
        customerName:customerName.trim(),
        customerEmail:customerEmail.trim().toLowerCase(),
        customerPhone:customerPhone.trim(),
        customerCpf:customerCpf.replace(/\D/g,'')||undefined,
        paymentMethod,
        couponCode:appliedCoupon||undefined,
        discountAmount:Math.max(0,selectedProduct.price-previewAmount),
        finalAmount:previewAmount,
        siteConfig,
      });
      addPlaybookOrder(result.order);
      setCompletedOrder(result.order);
      setPixCode(result.pixPayload||'');
      setPixImage(result.pixQrCodeDataUrl||'');
      onShowToast(result.message,'success');

      if(result.mercadoPagoInitPoint){
        window.location.assign(result.mercadoPagoInitPoint);
        return;
      }
    }catch(err){
      onShowToast(err instanceof Error?err.message:'Não foi possível iniciar o pagamento.','error');
    }finally{setBusy(false)}
  };

  const copy=async(value:string,label:string)=>{
    if(!value)return;
    await navigator.clipboard.writeText(value);
    onShowToast(`${label} copiado. `,'success');
  };

  const paid=completedOrder?.status==='PAID'&&completedOrder.accessSent===true;

  return <div className="min-h-screen bg-[#F7F9FC] text-[#0B2343] py-8 sm:py-12">
    <div className="max-w-5xl mx-auto px-4 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button onClick={onBackToHome} className="inline-flex items-center gap-2 text-xs font-bold bg-white px-4 py-2 rounded-full border border-slate-200"><ArrowLeft className="w-4 h-4"/>Voltar ao Portal GRIT</button>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200"><ShieldCheck className="w-4 h-4"/>Valor validado no servidor</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-full border border-sky-200"><Lock className="w-4 h-4"/>Cartão processado pelo Mercado Pago</span>
        </div>
      </header>

      {!completedOrder?
        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div><h1 className="text-2xl font-black">Checkout seguro</h1><p className="text-xs text-slate-500 mt-1">O GRIT News não recebe nem armazena número de cartão, validade ou CVV.</p></div>

            <div>
              <label className="text-xs font-bold block mb-2">Produto</label>
              <select value={selectedProduct.id} onChange={e=>{const p=getProductById(e.target.value);if(p){setSelectedProduct(p);setAppliedCoupon(null)}}} className="w-full border border-slate-200 rounded-xl p-3 text-sm">
                {COMMERCIAL_PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.title} — R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field icon={<User className="w-4 h-4"/>} label="Nome completo" value={customerName} onChange={setCustomerName}/>
              <Field icon={<Mail className="w-4 h-4"/>} label="E-mail" type="email" value={customerEmail} onChange={setCustomerEmail}/>
              <Field icon={<Zap className="w-4 h-4"/>} label="WhatsApp" value={customerPhone} onChange={setCustomerPhone}/>
              <Field label="CPF (opcional)" value={customerCpf} onChange={setCustomerCpf}/>
            </div>

            <div>
              <p className="text-xs font-bold mb-2">Forma de pagamento</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <Method active={paymentMethod==='pix'} onClick={()=>setPaymentMethod('pix')} icon={<QrCode className="w-5 h-5"/>} title="PIX" subtitle="QR Code oficial"/>
                <Method active={paymentMethod==='card'} onClick={()=>setPaymentMethod('card')} icon={<CreditCard className="w-5 h-5"/>} title="Cartão" subtitle="Checkout Pro"/>
                <Method active={paymentMethod==='mercadopago_wallet'} onClick={()=>setPaymentMethod('mercadopago_wallet')} icon={<Zap className="w-5 h-5"/>} title="Conta MP" subtitle="Ambiente oficial"/>
              </div>
              {paymentMethod==='card'&&<div className="mt-3 p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900">Os dados do cartão serão informados somente depois do redirecionamento ao Mercado Pago.</div>}
            </div>
          </section>

          <aside className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 h-fit">
            <div><h2 className="font-black">{selectedProduct.title}</h2><p className="text-xs text-slate-500 mt-1">{selectedProduct.subtitle}</p></div>
            <form onSubmit={applyCoupon} className="flex gap-2"><div className="relative flex-1"><Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={couponInput} onChange={e=>setCouponInput(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs" placeholder="Cupom"/></div><button type="submit" className="px-4 rounded-xl bg-slate-100 text-xs font-bold">Aplicar</button></form>
            <div className="border-t border-slate-100 pt-4 flex items-end justify-between"><span className="text-sm font-bold">Total</span><strong className="text-3xl">R$ {previewAmount.toFixed(2)}</strong></div>
            <p className="text-[11px] text-slate-500">O valor exibido é uma prévia. O preço final e o cupom são recalculados pelo servidor antes da cobrança.</p>
            <button disabled={busy} className="w-full bg-[#145EDB] text-white rounded-xl py-3 font-black text-sm disabled:opacity-50">{busy?'Criando cobrança…':paymentMethod==='pix'?'Gerar PIX seguro':'Continuar no Mercado Pago'}</button>
          </aside>
        </form>
      :
        <section className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${paid?'bg-emerald-100 text-emerald-600':'bg-sky-100 text-sky-600'}`}>
            {paid?<CheckCircle2 className="w-10 h-10"/>:<RefreshCw className={`w-8 h-8 ${polling?'animate-spin':''}`}/>}
          </div>
          <div><h2 className="text-2xl font-black">{paid?'Pagamento confirmado':'Pagamento aguardando confirmação'}</h2><p className="text-xs text-slate-500 mt-2">Pedido <strong>{completedOrder.id}</strong> • R$ {completedOrder.amount.toFixed(2)}</p></div>

          {paymentMethod==='pix'&&!paid&&<div className="text-left bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold text-emerald-900">PIX gerado pelo Mercado Pago. O acesso só será liberado após confirmação automática do gateway.</p>
            {pixImage&&<img src={pixImage} alt="QR Code PIX" className="w-56 h-56 mx-auto rounded-xl bg-white"/>}
            {pixCode&&<><div className="break-all font-mono text-[10px] bg-white border border-emerald-200 p-3 rounded-xl">{pixCode}</div><button onClick={()=>copy(pixCode,'Código PIX')} className="w-full bg-emerald-600 text-white rounded-xl py-3 text-xs font-bold inline-flex items-center justify-center gap-2"><Copy className="w-4 h-4"/>Copiar PIX Copia e Cola</button></>}
          </div>}

          {paid&&selectedProduct.downloadUrl&&<div className="text-left bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <p className="text-xs font-bold text-emerald-900 inline-flex items-center gap-2"><Download className="w-5 h-5"/>Material liberado após confirmação do pagamento</p>
            <a href={selectedProduct.downloadUrl} download className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl text-xs font-black"><Download className="w-4 h-4"/>Baixar material</a>
          </div>}

          {!paid&&paymentMethod!=='pix'&&<div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-xs text-sky-900">Conclua o pagamento no ambiente oficial do Mercado Pago. Ao retornar, o status será validado pelo gateway antes de qualquer liberação.</div>}

          <button onClick={onBackToHome} className="text-xs font-bold text-slate-600">Voltar ao portal</button>
        </section>
      }
    </div>
  </div>;
};

function Field({label,value,onChange,type='text',icon}:{label:string;value:string;onChange:(v:string)=>void;type?:string;icon?:React.ReactNode}){
  return <label className="text-xs font-bold">{label}<div className="relative mt-1">{icon&&<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} className={`w-full border border-slate-200 rounded-xl py-3 pr-3 text-sm ${icon?'pl-9':'pl-3'}`} /></div></label>;
}

function Method({active,onClick,icon,title,subtitle}:{active:boolean;onClick:()=>void;icon:React.ReactNode;title:string;subtitle:string}){
  return <button type="button" onClick={onClick} className={`p-4 rounded-2xl border-2 text-left ${active?'border-[#145EDB] bg-sky-50':'border-slate-200 bg-white'}`}><span className="text-[#145EDB]">{icon}</span><strong className="block text-xs mt-2">{title}</strong><span className="text-[11px] text-slate-500">{subtitle}</span></button>;
}
