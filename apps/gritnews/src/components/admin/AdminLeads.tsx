import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { Lead, NewsletterSubscriber } from '../../types';
import { getSupabaseClient } from '../../lib/supabase';

interface AdminLeadsProps {
  leads: Lead[];
  subscribers: NewsletterSubscriber[];
  onShowToast: (msg: string) => void;
}

type CommercialLead = {
  id:string; name:string; email:string|null; whatsapp:string|null; business_name:string|null; city:string|null;
  product:string|null; source:string; campaign:string|null; medium:string|null; content:string|null; utm_term:string|null;
  landing_page:string|null; status:string; score:number; gclid:string|null; fbclid:string|null; referral_code:string|null;
  consent_lgpd:boolean; created_at:string;
};

const csvEscape=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;

export const AdminLeads: React.FC<AdminLeadsProps> = ({ leads, subscribers, onShowToast }) => {
  const [activeTab,setActiveTab]=useState<'subscribers'|'leads'>('leads');
  const [remote,setRemote]=useState<CommercialLead[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');

  const loadRemote=async()=>{
    const client=getSupabaseClient();
    if(!client){setError('Supabase não configurado.');return;}
    setLoading(true); setError('');
    const {data,error}=await client.from('leads').select('id,name,email,whatsapp,business_name,city,product,source,campaign,medium,content,utm_term,landing_page,status,score,gclid,fbclid,referral_code,consent_lgpd,created_at').order('created_at',{ascending:false}).limit(1000);
    if(error){setError('A sessão atual não possui permissão para consultar os leads centrais.');setRemote([]);} else setRemote((data||[]) as CommercialLead[]);
    setLoading(false);
  };

  useEffect(()=>{loadRemote()},[]);

  const stats=useMemo(()=>({
    total:remote.length,
    meuEspetinho:remote.filter(l=>l.product==='meu-espetinho').length,
    propostas:remote.filter(l=>l.product==='grit-propostas').length,
    meta:remote.filter(l=>String(l.source).toLowerCase().includes('meta')||String(l.medium).toLowerCase().includes('paid_social')).length,
    google:remote.filter(l=>String(l.source).toLowerCase().includes('google')||!!l.gclid).length
  }),[remote]);

  const exportCSV=()=>{
    if(activeTab==='subscribers'){
      const rows=[['Email','Nome','Setores','Consentimento_LGPD','Data_Inscricao'],...subscribers.map(s=>[s.email,s.name,s.sectorInterests.join(';'),s.lgpdConsent,s.consentTimestamp])];
      download(rows,'grit_news_newsletter.csv'); return;
    }
    const rows=[['Nome','Email','WhatsApp','Negócio','Cidade','Produto','Origem','Meio','Campanha','Conteúdo','Termo','Status','Score','Landing','Referral','Data'],...remote.map(l=>[l.name,l.email,l.whatsapp,l.business_name,l.city,l.product,l.source,l.medium,l.campaign,l.content,l.utm_term,l.status,l.score,l.landing_page,l.referral_code,l.created_at])];
    download(rows,'grit_leads_comerciais.csv');
  };
  const download=(rows:unknown[][],name:string)=>{const csv=rows.map(r=>r.map(csvEscape).join(',')).join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);onShowToast('Exportação CSV iniciada.');};

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-2xl font-black text-[#0B2343]">Central Comercial GRIT</h1><p className="text-sm text-[#5C6B7A]">Leads reais, origem de aquisição e produtos em uma única visão.</p></div><div className="flex gap-2"><button onClick={loadRemote} disabled={loading} className="bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 items-center"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>Atualizar</button><button onClick={exportCSV} className="bg-[#22A06B] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex gap-2 items-center"><Download className="w-4 h-4"/>Exportar CSV</button></div></div>

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[['Leads',stats.total],['Meu Espetinho',stats.meuEspetinho],['GRIT Propostas',stats.propostas],['Meta',stats.meta],['Google',stats.google]].map(([label,value])=><article key={String(label)} className="bg-white border border-[#E2E8F0] rounded-2xl p-4"><span className="text-[11px] text-gray-500 font-bold uppercase">{label}</span><strong className="block text-2xl text-[#0B2343] mt-1">{value}</strong></article>)}</div>

    {error&&<div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex gap-2"><ShieldCheck className="w-4 h-4 shrink-0"/>{error}</div>}

    <div className="flex items-center gap-2 bg-[#F7F9FC] p-1.5 rounded-xl border border-[#E2E8F0] w-fit"><button onClick={()=>setActiveTab('leads')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab==='leads'?'bg-[#145EDB] text-white':'text-[#5C6B7A]'}`}>Leads comerciais ({remote.length})</button><button onClick={()=>setActiveTab('subscribers')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab==='subscribers'?'bg-[#145EDB] text-white':'text-[#5C6B7A]'}`}>Newsletter ({subscribers.length})</button></div>

    {activeTab==='leads'?<div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] uppercase"><tr><th className="p-4">Lead</th><th className="p-4">Produto</th><th className="p-4">Origem</th><th className="p-4">Campanha</th><th className="p-4">Status</th><th className="p-4">Data</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{remote.map(l=><tr key={l.id}><td className="p-4"><strong>{l.name}</strong><div className="text-gray-500">{l.email||l.whatsapp||'—'} · {l.business_name||'—'}</div></td><td className="p-4 font-bold">{l.product||'geral'}</td><td className="p-4">{l.source||'direto'}{l.medium?` / ${l.medium}`:''}</td><td className="p-4">{l.campaign||'—'}<div className="text-[10px] text-gray-400">{l.content||''}</div></td><td className="p-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-bold">{l.status}</span></td><td className="p-4 text-gray-500">{new Date(l.created_at).toLocaleDateString('pt-BR')}</td></tr>)}{!remote.length&&!loading&&<tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum lead central disponível para esta sessão.</td></tr>}</tbody></table></div></div>:<div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#F7F9FC] border-b border-[#E2E8F0] uppercase"><tr><th className="p-4">E-mail</th><th className="p-4">Nome</th><th className="p-4">Interesses</th><th className="p-4">LGPD</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{subscribers.map(s=><tr key={s.id}><td className="p-4 font-bold text-[#145EDB]">{s.email}</td><td className="p-4">{s.name}</td><td className="p-4">{s.sectorInterests.join(', ')}</td><td className="p-4">{s.lgpdConsent?'Consentido':'—'}</td></tr>)}</tbody></table></div></div>}

    {leads.length>0&&remote.length===0&&!error&&<p className="text-[11px] text-gray-400">Há {leads.length} registro(s) local(is) legado(s); a aquisição nova utiliza o Supabase central.</p>}
  </div>;
};
