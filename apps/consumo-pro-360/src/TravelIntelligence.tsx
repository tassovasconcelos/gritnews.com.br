import {useCallback,useEffect,useMemo,useState} from "react";
import {
 ArrowRight,BrainCircuit,CalendarDays,Check,ChevronDown,Clock3,ExternalLink,
 FilePlus2,RefreshCw,Save,ShieldAlert,Ticket,TrainFront,TrendingDown,Wallet
} from "lucide-react";
import {db} from "./lib/supabase";
import {
 CITY_NAMES,DEFAULT_COSTS,cheapestObserved,evaluateScenario,makeScenarios,
 quoteKey,rankComplete,recommendations,validateDates,type QuoteInput,
 type RouteKind,type TravelCosts,type TravelDates,type TripCity,type Mode
} from "./lab/travelEngine";
import "./travel-lab.css";

type Obj=Record<string,unknown>;
type SavedRow={id:string;title:string;created_at:string;status:string;inputs:Obj;results:Obj};
type QuoteRow={
 id:string;from_code:TripCity;to_code:TripCity;travel_date:string;mode:Mode;
 provider:string;fare:number;baggage:number;fees:number;duration_minutes:number|null;
 source_url:string;observed_at:string;notes:string;
};
type QuoteDraft={from:TripCity;to:TripCity;mode:Mode;date:string;provider:string;fare:string;hours:string;url:string;baggage:string;fees:string;notes:string};
type LiveOffer={quote_id:string;price:number;currency:string;duration_hours:number|null;carrier_codes:string[];segments_count:number};
type LiveDate={from:TripCity;to:TripCity;date:string;status:string;offers:LiveOffer[]};
type LiveSearch={provider:string;checked_at:string;results:LiveDate[];warning:string};
const brl=(value:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
const labelDate=(value:string)=>value?new Date(value+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const formatTime=(raw:string)=>raw?new Date(raw).toLocaleString("pt-BR"):"—";
const blankQuote=(date:string):QuoteDraft=>({
 from:"FOR",to:"SLZ",mode:"air",date,provider:"",fare:"",hours:"",
 url:"",baggage:"0",fees:"0",notes:""
});
const moneyInput=(raw:string)=>{
 if(!raw.trim())return null;
 const n=Number(raw.replace(",","."));
 return Number.isFinite(n)&&n>0?n:null;
};
const providerUrl=(from:string,to:string,mode:Mode)=>{
 if(mode==="air"&&from==="FOR"&&to==="SLZ")
  return "https://www.latamairlines.com/br/pt/destinos/voos-de-fortaleza-para-sao-luis";
 if(mode==="air")return "https://www.latamairlines.com/br/pt";
 if(mode==="bus"&&from==="SLZ"&&to==="THE")
  return "https://parcerias.clickbus.com.br/onibus/sao-luis-ma/teresina-pi";
 return "https://www.clickbus.com.br/";
};
const canUseUrl=(s:string)=>{try{return new URL(s).protocol==="https:";}catch{return false;}};

export default function TravelIntelligence({companyId,userId}:{companyId:string;userId:string}){
 // Editable example dates, not a company travel commitment or a booking.
 const [dates,setDates]=useState<TravelDates>({outbound:"2026-11-10",connection:"2026-11-12",inbound:"2026-11-14"});
 const [costs,setCosts]=useState<TravelCosts>(DEFAULT_COSTS);
 const [quotes,setQuotes]=useState<Record<string,QuoteInput>>({});
 const [tab,setTab]=useState<"scenarios"|"radar"|"saved">("scenarios");
 const [history,setHistory]=useState<QuoteRow[]>([]);
 const [liveSearch,setLiveSearch]=useState<LiveSearch|null>(null);
 const [airSearching,setAirSearching]=useState(false);
 const [studies,setStudies]=useState<SavedRow[]>([]);
 const [quoteDraft,setQuoteDraft]=useState<QuoteDraft>(()=>blankQuote("2026-11-10"));
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const scenarios=useMemo(()=>makeScenarios(dates),[dates]);
 const rows=useMemo(()=>scenarios.map(s=>evaluateScenario(s,quotes,costs)),[scenarios,quotes,costs]);
 const ranked=useMemo(()=>rankComplete(rows),[rows]);
 const messages=useMemo(()=>recommendations(rows,dates),[rows,dates]);
 const dateErrors=useMemo(()=>validateDates(dates),[dates]);
 const lowest=useMemo(()=>cheapestObserved(history.map(q=>({
  from:q.from_code,to:q.to_code,mode:q.mode,date:q.travel_date,price:Number(q.fare),
  observedAt:q.observed_at,source:q.source_url
 }))),[history]);
 const refresh=useCallback(async()=>{
  if(!db||!companyId)return;
  const [s,h]=await Promise.all([
   db.from("cp_lab_studies").select("id,title,created_at,status,inputs,results")
    .eq("company_id",companyId).eq("area","travel").order("created_at",{ascending:false}).limit(30),
   db.from("cp_travel_quotes").select("id,from_code,to_code,travel_date,mode,provider,fare,baggage,fees,duration_minutes,source_url,observed_at,notes")
    .eq("company_id",companyId).order("observed_at",{ascending:false}).limit(150)
  ]);
  if(s.error||h.error){setNotice("Não foi possível carregar a base do laboratório: "+(s.error?.message||h.error?.message));return;}
  setStudies((s.data||[]) as SavedRow[]);
  setHistory((h.data||[]) as QuoteRow[]);
 },[companyId]);
 useEffect(()=>{void refresh();},[refresh]);
 const setQuoteField=(route:RouteKind,index:number,field:keyof QuoteInput,value:string)=>{
  setQuotes(all=>{
   const key=quoteKey(route,index);
   const prior=all[key]||{price:null,hours:null,baggage:null,fees:null,source:"",provider:"",checkedAt:""};
   const updated:QuoteInput={...prior};
   if(["price","hours","baggage","fees"].includes(field)){
    const trimmed=value.trim();
    (updated as unknown as Record<string,unknown>)[field]=trimmed===""?null:Number(trimmed.replace(",","."));
   }else (updated as unknown as Record<string,unknown>)[field]=value;
   return {...all,[key]:updated};
  });
 };
 const useObservedQuote=(scenario:RouteKind,index:number,q:QuoteRow)=>{
  setQuotes(all=>({...all,[quoteKey(scenario,index)]:{
   price:Number(q.fare),hours:q.duration_minutes?Number(q.duration_minutes)/60:null,
   baggage:Number(q.baggage),fees:Number(q.fees),
   source:q.source_url,provider:q.provider,checkedAt:q.observed_at
  }}));
  setNotice("Cotação registrada aplicada ao cenário. Verifique novamente a disponibilidade no fornecedor.");
 };
 const saveStudy=async()=>{
  if(!db||!companyId||!userId)return;
  setBusy(true);setNotice("");
  try{
   const {error}=await db.from("cp_lab_studies").insert({
    company_id:companyId,created_by:userId,area:"travel",status:"draft",
    title:"São Luís + Teresina · "+labelDate(dates.outbound),
    hypothesis:"Avaliar combinação de avião e ônibus contra modelos aéreo e rodoviário, sem compra automática.",
    inputs:{dates,costs,quotes},results:{
     scenarios:rows.map(r=>({id:r.id,confidence:r.confidence,directCost:r.directCost,
       decisionCost:r.decisionCost,travelHours:r.travelHours,warnings:r.warnings})),
     recommendation:ranked[0]?.id||null,
     methodology:"Custo total ajustado = transportes + despesas + contingência + custo-hora de deslocamento."
    },evidence:[]
   });
   if(error)throw error;
   setNotice("Estudo salvo com data e autoria. Não constitui autorização de viagem ou compra.");
   await refresh();
  }catch(e){setNotice("Não foi possível salvar estudo: "+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 };
 const loadStudy=(study:SavedRow)=>{
  const inputs=study.inputs||{};
  if(inputs.dates&&typeof inputs.dates==="object"){
   const d=inputs.dates as TravelDates;
   if(typeof d.outbound==="string"&&typeof d.connection==="string"&&typeof d.inbound==="string")setDates(d);
  }
  if(inputs.costs&&typeof inputs.costs==="object")setCosts({...DEFAULT_COSTS,...(inputs.costs as TravelCosts)});
  if(inputs.quotes&&typeof inputs.quotes==="object")setQuotes(inputs.quotes as Record<string,QuoteInput>);
  setTab("scenarios");setNotice("Estudo carregado em modo de simulação; nenhuma compra foi realizada.");
 };
 const searchFlights=async()=>{
  if(!db||!companyId)return;
  if(quoteDraft.mode!=="air"){setNotice("A consulta aérea exige modalidade avião.");return;}
  if(quoteDraft.from===quoteDraft.to||!quoteDraft.date){setNotice("Selecione uma rota e data válida.");return;}
  setAirSearching(true);setLiveSearch(null);setNotice("");
  const start=new Date(quoteDraft.date+"T12:00:00Z");
  const referenceMonth=quoteDraft.date.slice(0,7);
  const candidates=[-2,-1,0,1,2].map(delta=>{
   const candidate=new Date(start.getTime()+delta*86400000);
   return candidate.toISOString().slice(0,10);
  }).filter(x=>x.slice(0,7)===referenceMonth&&x>=new Date().toISOString().slice(0,10));
  try{
   if(!candidates.length)throw Error("Selecione um dia futuro para pesquisar.");
   const {data,error}=await db.functions.invoke("cp-travel-flight-search",{body:{
    company_id:companyId,adults:Math.max(1,Math.min(4,Math.floor(costs.travelers))),
    legs:candidates.map(date=>({from:quoteDraft.from,to:quoteDraft.to,date}))
   }});
   if(error)throw Error("API aérea ainda não habilitada ou indisponível: "+error.message);
   if(!data?.results)throw Error(String(data?.error||"Provedor ainda não retornou cotações."));
   setLiveSearch(data as LiveSearch);
   setNotice("AERO consultou o fornecedor. Os resultados são indicativos e exigem reconfirmação antes da compra.");
  }catch(e){setNotice(e instanceof Error?e.message:String(e));}
  finally{setAirSearching(false);}
 };
 const applyLiveFare=(day:LiveDate,offer:LiveOffer)=>{
  const target=makeScenarios(dates);
  let matches=0;
  setQuotes(prev=>{
   const next={...prev};
   for(const scenario of target){
    scenario.legs.forEach((leg,i)=>{
     if(leg.mode!=="air"||leg.from!==day.from||leg.to!==day.to||leg.date!==day.date)return;
     next[quoteKey(scenario.id,i)]={
      price:offer.price,hours:offer.duration_hours,baggage:null,fees:null,
      source:"API Amadeus Production (consulta autenticada; sem URL de bilhete)",
      provider:offer.carrier_codes.join(",")||"Companhia a confirmar",
      checkedAt:liveSearch?.checked_at||new Date().toISOString()
     };matches++;
    });
   }
   return next;
  });
  setTab("scenarios");
  setNotice(matches?("Oferta indicativa aplicada a "+matches+" cenário(s). Confirme bagagem e impostos diretamente antes de aprovar."):"Data consultada difere do roteiro. Ajuste a data do cenário antes de aplicar.");
 };
 const saveFare=async()=>{
  if(!db||!companyId||!userId)return;
  const fare=moneyInput(quoteDraft.fare),hours=moneyInput(quoteDraft.hours);
  if(!fare||!hours||quoteDraft.from===quoteDraft.to||!quoteDraft.date||
   !quoteDraft.provider.trim()||!canUseUrl(quoteDraft.url)){
   setNotice("Informe cidades distintas, data, fornecedor, valor positivo, duração e URL HTTPS da pesquisa.");
   return;
  }
  setBusy(true);setNotice("");
  try{
   const {error}=await db.from("cp_travel_quotes").insert({
    company_id:companyId,recorded_by:userId,from_code:quoteDraft.from,to_code:quoteDraft.to,
    travel_date:quoteDraft.date,mode:quoteDraft.mode,provider:quoteDraft.provider.trim(),
    fare, duration_minutes:Math.round(hours*60),
    baggage:Math.max(0,Number(quoteDraft.baggage)||0),
    fees:Math.max(0,Number(quoteDraft.fees)||0),
    source_url:quoteDraft.url.trim(),notes:quoteDraft.notes.trim().slice(0,1000)
   });
   if(error)throw error;
   setNotice("Pesquisa registrada como cotação informada, não como passagem reservada.");
   setQuoteDraft(blankQuote(quoteDraft.date));
   await refresh();
  }catch(e){setNotice("Falha ao registrar cotação: "+(e instanceof Error?e.message:String(e)));}
  finally{setBusy(false);}
 };
 return <div className="travel-lab">
  <div className="travel-hero">
   <div><span className="travel-eyebrow"><BrainCircuit size={15}/> AERO · AGENTE DE VIAGENS CORPORATIVAS</span>
    <h2>Decidir a rota antes de comprar.</h2>
    <p>Compare avião, ônibus, tempo, diárias e riscos. Os valores são preenchidos a partir de cotações identificadas; sem preços confirmados, não há vencedor.</p></div>
   <div className="travel-hero-right"><span className="travel-status">Ambiente de estudo · sem emissão</span>
    <button className="btn primary" onClick={()=>void saveStudy()} disabled={busy}><Save size={16}/> Salvar estudo</button></div>
  </div>
  <div className="travel-tabs" role="tablist" aria-label="Inteligência de viagens">
   <button role="tab" aria-selected={tab==="scenarios"} className={tab==="scenarios"?"active":""} onClick={()=>setTab("scenarios")}>Cenários</button>
   <button role="tab" aria-selected={tab==="radar"} className={tab==="radar"?"active":""} onClick={()=>setTab("radar")}>Radar de tarifas</button>
   <button role="tab" aria-selected={tab==="saved"} className={tab==="saved"?"active":""} onClick={()=>setTab("saved")}>Estudos salvos ({studies.length})</button>
  </div>
  {notice&&<div className="notice"><span>{notice}</span><button className="icon-button" aria-label="Fechar aviso" onClick={()=>setNotice("")}>×</button></div>}
  {tab==="scenarios"&&<>
   <section className="panel travel-settings"><div className="panel-header"><h3><CalendarDays size={18}/> Roteiro de novembro de 2026</h3><span className="muted">Datas ilustrativas, totalmente editáveis</span></div>
    <div className="travel-form-grid">
     {([["outbound","Saída de Fortaleza"],["connection","Mudança de cidade"],["inbound","Retorno a Fortaleza"]] as [keyof TravelDates,string][]).map(([key,label])=>
      <label key={key}>{label}<input type="date" value={dates[key]} onChange={e=>setDates(old=>({...old,[key]:e.target.value}))}/></label>)}
    </div>
    {dateErrors.length>0&&<div className="travel-warning"><ShieldAlert size={16}/>{dateErrors.join(" ")}</div>}
    <div className="travel-form-grid travel-cost-grid">
     {([
      ["travelers","Pessoas","1"],
      ["hotelNights","Diárias de hospedagem","0"],
      ["hotelNightly","Valor por diária (R$)","0"],
      ["meals","Alimentação por pessoa (R$)","0"],
      ["localTransfers","Táxi, aplicativo e deslocamentos (R$)","0"],
      ["timeValue","Custo-hora de viagem por pessoa (R$)","0"],
      ["bufferPercent","Contingência (%)","0"],
      ["maxBudget","Teto de orçamento (R$)","0"]
     ] as [keyof TravelCosts,string,string][]).map(([key,label,min])=>
      <label key={key}>{label}<input min={min} type="number" step={key==="travelers"||key==="hotelNights"?"1":"0.01"}
       value={costs[key]} onChange={e=>setCosts(old=>({...old,[key]:Number(e.target.value)}))}/></label>)}
    </div>
   </section>
   <div className="travel-summary">
    <div className="travel-stat"><span>Modelos em avaliação</span><b>{rows.length}</b><small>Com roteiros diferentes</small></div>
    <div className="travel-stat"><span>Cenários completos</span><b>{ranked.length}</b><small>Tarifa e duração de todos os trechos</small></div>
    <div className="travel-stat"><span>Menor custo ajustado</span><b>{ranked[0]?.decisionCost!==null&&ranked[0]?brl(ranked[0].decisionCost!):"Sem cotação"}</b><small>Somente entre estudos completos</small></div>
    <div className="travel-stat"><span>Perfil</span><b>{costs.travelers} pessoa(s)</b><small>Custos extras informados</small></div>
   </div>
   <section className="panel travel-comparison"><div className="panel-header"><h3><TrendingDown size={18}/> Comparativo executivo</h3><span className="muted">Ordenação apenas com dados completos</span></div>
    <div className="table-scroll"><table><thead><tr><th>Modelo</th><th>Trechos cotados</th><th>Passagens + extras</th><th>Custo ajustado*</th><th>Em trânsito</th><th>Orçamento</th></tr></thead>
     <tbody>{[...rows].sort((a,b)=>(a.decisionCost??Infinity)-(b.decisionCost??Infinity)).map(r=>
      <tr key={r.id}><td className="strong-cell">{r.label}</td><td>{r.quotedLegs}/{r.totalLegs}</td><td>{r.directCost===null?"—":brl(r.directCost)}</td>
       <td>{r.decisionCost===null?"—":brl(r.decisionCost)}</td><td>{r.travelHours===null?"—":r.travelHours.toFixed(1)+" h"}</td>
       <td>{r.withinBudget===null?"A calcular":r.withinBudget?"Dentro":"Acima"}</td></tr>)}</tbody>
    </table></div><p className="muted travel-footnote">* Custo ajustado = passagens, bagagem, taxas, hospedagem, despesas, contingência e custo-hora de deslocamento. Não inclui compra de passagens.</p>
   </section>
   <div className="travel-scenario-grid">{rows.map(r=>
    <section className="panel travel-route-card" key={r.id}>
     <div className="travel-route-top"><div><small>ESTUDO {r.id.toUpperCase()}</small><h3>{r.label}</h3><p>{r.description}</p></div>
      {r.confidence==="complete"?<span className="travel-tag ready">Cotado</span>:<span className="travel-tag">{r.quotedLegs}/3 cotações</span>}
     </div>
     <div className="travel-route-legs">{r.legs.map((leg,i)=>{
      const key=quoteKey(r.id,i);
      const q=quotes[key];
      const previous=history.filter(x=>x.from_code===leg.from&&x.to_code===leg.to&&x.mode===leg.mode&&x.travel_date===leg.date);
      return <div className="travel-leg" key={key}>
       <div className="travel-leg-head"><div className="travel-mode">{leg.mode==="air"?<Ticket size={17}/>:<TrainFront size={17}/>}</div>
        <div><b>{CITY_NAMES[leg.from]} <ArrowRight size={13}/> {CITY_NAMES[leg.to]}</b>
         <small>{leg.label} · {labelDate(leg.date)} · {leg.mode==="air"?"Avião":"Ônibus"}</small></div>
        <a href={providerUrl(leg.from,leg.to,leg.mode)} target="_blank" rel="noreferrer" title="Consultar fornecedor em nova aba">Pesquisar <ExternalLink size={13}/></a>
       </div>
       <div className="travel-leg-form">
        <label>Tarifa (R$)<input aria-label={"Tarifa "+r.label+" trecho "+(i+1)} type="number" min="0" step="0.01" placeholder="Não cotado"
         value={q?.price??""} onChange={e=>setQuoteField(r.id,i,"price",e.target.value)}/></label>
        <label>Duração (h)<input aria-label={"Duração "+r.label+" trecho "+(i+1)} type="number" min="0" step="0.1" placeholder="—"
         value={q?.hours??""} onChange={e=>setQuoteField(r.id,i,"hours",e.target.value)}/></label>
        <label>Bagagem (R$)<input type="number" min="0" step="0.01" value={q?.baggage??""} onChange={e=>setQuoteField(r.id,i,"baggage",e.target.value)}/></label>
        <label>Taxas (R$)<input type="number" min="0" step="0.01" value={q?.fees??""} onChange={e=>setQuoteField(r.id,i,"fees",e.target.value)}/></label>
       </div>
       {previous.length>0&&<div className="travel-observations"><small>Cotações cadastradas para este dia:</small>
        {previous.slice(0,3).map(p=><button key={p.id} onClick={()=>useObservedQuote(r.id,i,p)} title="Aplicar cotação salva ao cenário">
         {p.provider} · {brl(Number(p.fare))} · {formatTime(p.observed_at)} <Check size={13}/></button>)}</div>}
       {q&&q.price!==null&&<label className="travel-source-input">Fonte da tarifa (URL da pesquisa)<input type="url" placeholder="https://..." value={q.source} onChange={e=>setQuoteField(r.id,i,"source",e.target.value)}/></label>}
      </div>;
     })}</div>
     {r.warnings.length>0&&<div className="travel-warnings">{r.warnings.map((w,i)=><p key={i}><ShieldAlert size={14}/>{w}</p>)}</div>}
     <div className="travel-route-footer"><span>{r.confidence==="complete"?brl(r.decisionCost!):"Aguardando cotações dos trechos"}</span><small>{r.travelHours===null?"—":r.travelHours.toFixed(1)+" horas totais"}</small></div>
    </section>)}</div>
   <section className="panel travel-agent"><div className="panel-header"><h3><BrainCircuit size={19}/> AERO · parecer do agente</h3><span className="muted">Motor de regras transparentes, não IA de preços em tempo real</span></div>
    <div className="travel-insights">{messages.map((m,i)=><p key={i}><Check size={16}/>{m}</p>)}</div>
   </section>
  </>}
  {tab==="radar"&&<>
   <section className="panel"><div className="panel-header"><h3><Ticket size={18}/> Registrar pesquisa de passagem</h3><span className="muted">Valores reais informados por operador · URL obrigatória</span></div>
    <p className="travel-hint">Pesquise com a companhia ou plataforma, registre o preço com bagagem e taxas, e use o histórico para comparar dias e modalidades. Este painel não consulta bilheterias automaticamente.</p>
    <div className="travel-form-grid">
     <label>Origem<select value={quoteDraft.from} onChange={e=>setQuoteDraft(s=>({...s,from:e.target.value as TripCity}))}>
      {Object.entries(CITY_NAMES).map(([code,name])=><option key={code} value={code}>{name} ({code})</option>)}</select></label>
     <label>Destino<select value={quoteDraft.to} onChange={e=>setQuoteDraft(s=>({...s,to:e.target.value as TripCity}))}>
      {Object.entries(CITY_NAMES).map(([code,name])=><option key={code} value={code}>{name} ({code})</option>)}</select></label>
     <label>Modalidade<select value={quoteDraft.mode} onChange={e=>setQuoteDraft(s=>({...s,mode:e.target.value as Mode}))}>
      <option value="air">Aéreo</option><option value="bus">Rodoviário</option></select></label>
     <label>Data da viagem<input type="date" value={quoteDraft.date} onChange={e=>setQuoteDraft(s=>({...s,date:e.target.value}))}/></label>
     <label>Operadora / agência<input placeholder="Ex.: LATAM, Guanabara" value={quoteDraft.provider} onChange={e=>setQuoteDraft(s=>({...s,provider:e.target.value}))}/></label>
     <label>Tarifa (R$)<input type="number" min="0" step="0.01" value={quoteDraft.fare} onChange={e=>setQuoteDraft(s=>({...s,fare:e.target.value}))}/></label>
     <label>Duração do trecho (horas)<input type="number" min="0.1" step="0.1" value={quoteDraft.hours} onChange={e=>setQuoteDraft(s=>({...s,hours:e.target.value}))}/></label>
     <label>Bagagem (R$)<input type="number" min="0" step="0.01" value={quoteDraft.baggage} onChange={e=>setQuoteDraft(s=>({...s,baggage:e.target.value}))}/></label>
     <label>Taxas adicionais (R$)<input type="number" min="0" step="0.01" value={quoteDraft.fees} onChange={e=>setQuoteDraft(s=>({...s,fees:e.target.value}))}/></label>
     <label>Link HTTPS da fonte<input type="url" placeholder="https://..." value={quoteDraft.url} onChange={e=>setQuoteDraft(s=>({...s,url:e.target.value}))}/></label>
    </div>
    <label>Observações / regras da tarifa<textarea rows={2} placeholder="Tipo de assento, escalas, alterações, bagagem incluída..." value={quoteDraft.notes} onChange={e=>setQuoteDraft(s=>({...s,notes:e.target.value}))}/></label>
    <div className="travel-actions"><a className="btn secondary" target="_blank" rel="noreferrer" href={providerUrl(quoteDraft.from,quoteDraft.to,quoteDraft.mode)}>
     Consultar fornecedor <ExternalLink size={15}/></a>
     <button className="btn primary" disabled={busy} onClick={()=>void saveFare()}><FilePlus2 size={15}/> Registrar cotação</button></div>
    {quoteDraft.mode==="air"&&<div className="travel-api-block">
     <div><b><BrainCircuit size={17}/> AERO · Pesquisa aérea por cinco datas</b>
      <p>Pesquisa até dois dias antes/depois da data escolhida, dentro do mês. Usa somente a API Amadeus de produção, quando contratada e configurada.</p></div>
     <button className="btn secondary" disabled={airSearching} onClick={()=>void searchFlights()}><TrendingDown size={15}/>{airSearching?"Pesquisando…":"Pesquisar menor preço aéreo"}</button>
    </div>}
    {liveSearch&&<section className="travel-live">
     <h4>{liveSearch.provider} · consultado em {formatTime(liveSearch.checked_at)}</h4>
     <p>{liveSearch.warning}</p>
     <div className="table-scroll"><table><thead><tr><th>Dia</th><th>Rota</th><th>Menor preço consultado</th><th>Voo</th><th>Aplicar</th></tr></thead><tbody>
      {liveSearch.results.map(day=>{
       const offer=day.offers?.[0];
       return <tr key={day.from+"-"+day.to+"-"+day.date}><td>{labelDate(day.date)}</td><td>{day.from} → {day.to}</td>
        <td>{offer?brl(Number(offer.price)):"Sem tarifa no provedor"}</td>
        <td>{offer?(offer.carrier_codes.join(", ")||"A confirmar")+" · "+(offer.duration_hours?.toFixed(1)||"—")+"h · "+offer.segments_count+" segmento(s)":"—"}</td>
        <td>{offer&&<button className="btn secondary small" onClick={()=>applyLiveFare(day,offer)}>Usar no roteiro</button>}</td></tr>;
      })}</tbody></table></div>
    </section>}
   </section>
   <section className="panel"><div className="panel-header"><h3><TrendingDown size={18}/> Menores tarifas registradas</h3><span className="muted">Apenas fontes registradas há até 48h · sem confirmação de assento</span></div>
    {lowest.length===0?<div className="travel-empty"><Ticket size={24}/><b>Nenhuma pesquisa recente com fonte.</b><p>Registre preços de novembro para o agente comparar datas de verdade, sem estimar valores falsos.</p></div>:
     <div className="table-scroll"><table><thead><tr><th>Rota</th><th>Dia</th><th>Modal</th><th>Menor valor registrado</th><th>Fonte</th></tr></thead><tbody>
      {lowest.slice(0,30).map((q,i)=><tr key={i}><td>{q.from} → {q.to}</td><td>{labelDate(q.date)}</td><td>{q.mode==="air"?"Avião":"Ônibus"}</td>
       <td className="strong-cell">{brl(q.price)}</td><td><a href={q.source} target="_blank" rel="noreferrer">Verificar <ExternalLink size={13}/></a></td></tr>)}
     </tbody></table></div>}
   </section>
   <section className="panel"><div className="panel-header"><h3>Histórico de pesquisas</h3><button className="btn secondary small" onClick={()=>void refresh()}><RefreshCw size={14}/> Atualizar</button></div>
    {history.length===0?<div className="travel-empty"><Clock3 size={22}/><p>Nenhuma tarifa registrada. O histórico é compartilhado apenas com perfis autorizados da empresa.</p></div>:
     <div className="table-scroll"><table><thead><tr><th>Consulta</th><th>Trecho</th><th>Viagem</th><th>Fornecedor</th><th>Preço</th><th>Status</th></tr></thead><tbody>
      {history.slice(0,50).map(q=><tr key={q.id}><td>{formatTime(q.observed_at)}</td><td>{q.from_code} → {q.to_code}</td><td>{labelDate(q.travel_date)}</td>
       <td>{q.provider}</td><td>{brl(Number(q.fare)+Number(q.baggage)+Number(q.fees))}</td>
       <td>{(Date.now()-Date.parse(q.observed_at))<48*3600000?"Recente · confirmar":"Desatualizada"}</td></tr>)}
     </tbody></table></div>}
   </section>
  </>}
  {tab==="saved"&&<section className="panel"><div className="panel-header"><h3><Wallet size={18}/> Estudos comparativos</h3><span className="muted">Rascunhos compartilhados por empresa</span></div>
   {studies.length===0?<div className="travel-empty"><BrainCircuit size={23}/><b>Sem estudos salvos</b><p>Monte os cenários e salve uma versão para auditoria e comparação posterior.</p></div>:
    <div className="travel-saved">{studies.map(st=><div className="travel-saved-row" key={st.id}>
     <div><b>{st.title}</b><small>{formatTime(st.created_at)} · {st.status} · sem autorização financeira</small></div>
     <button className="btn secondary small" onClick={()=>loadStudy(st)}>Reabrir <ChevronDown size={14}/></button>
    </div>)}</div>}
  </section>}
  <div className="travel-disclaimer"><ShieldAlert size={16}/> Laboratório de viagens: não emite bilhetes, não aprova reembolso e não faz reservas. Valores informados são observações datadas; comprar exige validação de preço, política e responsável humano.</div>
 </div>;
}
