import {useCallback,useEffect,useMemo,useState} from "react";
import {BrainCircuit,CheckCircle2,ClipboardCheck,Compass,ExternalLink,FlaskConical,
 Lightbulb,PlaneTakeoff,Plus,RefreshCw,ShieldAlert,TrendingUp} from "lucide-react";
import {db} from "./lib/supabase";
import "./travel-lab.css";

type LabArea="consumption"|"procurement"|"operations";
type Study={id:string;title:string;area:LabArea;hypothesis:string;inputs:Record<string,unknown>;results:Record<string,unknown>;created_at:string;status:string};
const AGENTS=[
 {name:"AERO · Mobilidade",icon:PlaneTakeoff,mission:"Pesquisa assistida de passagens, ônibus, rotas e datas. Compara custos comprovados e segurança dos deslocamentos."},
 {name:"RADAR · Mercado",icon:Compass,mission:"Transforma referências, custos e reclamações em hipóteses testáveis, com fonte e data."},
 {name:"PRISMA · Evidências",icon:ClipboardCheck,mission:"Confere métricas, diferenças de cenário e qualidade das fontes antes de emitir conclusões."},
 {name:"SENTINELA · Governança",icon:ShieldAlert,mission:"Revisa acesso, riscos, orçamento e limites de autonomia dos estudos e agentes."}
];
const RESEARCH=[
 {title:"Curva ABC + criticidade",area:"consumption" as LabArea,detail:"Separar materiais por gasto, demanda, criticidade e risco de ruptura; testar impacto no ciclo de reposição.",metric:"Rupturas por mês",reference:"https://www.oracle.com/scm/inventory-management/"},
 {title:"Reposição com consumo confirmado",area:"procurement" as LabArea,detail:"Projetar consumo com base em baixas reais por setor, mínimo/máximo e prazo fornecedor; compras continuam sujeitas a aprovação.",metric:"Dias de cobertura e economias",reference:"https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment/reordering_rules.html"},
 {title:"Conferência fiscal assistida",area:"operations" as LabArea,detail:"Medir qualidade da leitura XML e, futuramente, OCR de foto/PDF; exigir aprovação humana para preço, conversão de unidade e estoque.",metric:"Tempo e erros por NF",reference:"https://www.nfe.fazenda.gov.br/portal/principal.aspx"},
 {title:"Total Cost of Trip (TCT)",area:"operations" as LabArea,detail:"Comparar avião, ônibus, hospedagem, traslados, custo-hora e política antes da viagem corporativa.",metric:"Custo total por visita realizada",reference:"https://www.deloitte.com/us/en/insights/industry/transportation/corporate-business-travel-survey.html"}
];
const titleDate=(iso:string)=>new Date(iso).toLocaleString("pt-BR");
export default function MarketLab({
 companyId,userId,onTravel,inventoryCount,pendingRequests
}:{companyId:string;userId:string;onTravel:()=>void;inventoryCount:number;pendingRequests:number}){
 const [title,setTitle]=useState("");
 const [area,setArea]=useState<LabArea>("operations");
 const [hypothesis,setHypothesis]=useState("");
 const [metric,setMetric]=useState("");
 const [baseline,setBaseline]=useState("");
 const [target,setTarget]=useState("");
 const [source,setSource]=useState("");
 const [records,setRecords]=useState<Study[]>([]);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState("");
 const reload=useCallback(async()=>{
  if(!db||!companyId)return;
  const {data,error}=await db.from("cp_lab_studies").select("id,title,area,hypothesis,inputs,results,created_at,status")
   .eq("company_id",companyId).neq("area","travel").order("created_at",{ascending:false}).limit(50);
  if(error)setMessage("Leitura do laboratório indisponível: "+error.message);
  else setRecords((data||[]) as Study[]);
 },[companyId]);
 useEffect(()=>{void reload();},[reload]);
 const learning=useMemo(()=>{
  const insights:string[]=[];
  if(inventoryCount===0)insights.push("Catálogo ainda vazio: primeiro experimento recomendado é padronizar o cadastro e importar dados reais.");
  else insights.push("Com produtos cadastrados, medir concentração de consumo e classes de criticidade por unidade.");
  if(pendingRequests>0)insights.push("Existem solicitações em andamento: estudar lead time por alçada, sem modificar aprovações automaticamente.");
  insights.push("Nenhum agente deve afirmar tendência de mercado sem fonte, período e tamanho de amostra.");
  return insights;
 },[inventoryCount,pendingRequests]);
 const pick=(r:typeof RESEARCH[number])=>{
  setTitle(r.title);setArea(r.area);setHypothesis(r.detail);setMetric(r.metric);setSource(r.reference);
  setMessage("Hipótese carregada. Defina baseline e meta para registrar um teste sem afetar a operação.");
 };
 const add=async()=>{
  if(!db||!companyId||!userId)return;
  if(title.trim().length<4||hypothesis.trim().length<12||metric.trim().length<3){
   setMessage("Informe título, hipótese objetiva e métrica mensurável antes de salvar.");return;
  }
  if(source.trim()){
   try{if(new URL(source).protocol!=="https:")throw Error("HTTPS obrigatório");}
   catch{setMessage("A evidência precisa ter URL HTTPS válida.");return;}
  }
  setLoading(true);setMessage("");
  const {error}=await db.from("cp_lab_studies").insert({
   company_id:companyId,created_by:userId,title:title.trim(),area,hypothesis:hypothesis.trim(),
   inputs:{metric:metric.trim(),baseline:baseline.trim(),target:target.trim(),source:source.trim()},
   results:{actual:null,improvement:null,reviewStatus:"not_measured"},
   status:"draft",evidence:source.trim()?[{url:source.trim(),recorded_at:new Date().toISOString()}]:[]
  });
  setLoading(false);
  if(error){setMessage("Estudo não salvo: "+error.message);return;}
  setTitle("");setHypothesis("");setMetric("");setBaseline("");setTarget("");setSource("");
  setMessage("Teste registrado em rascunho. Métricas reais e validação humana ainda são necessárias.");
  await reload();
 };
 return <div className="market-lab">
  <div className="travel-hero"><div><span className="travel-eyebrow"><FlaskConical size={16}/> GRIT · LABORATÓRIO DE INTELIGÊNCIA</span>
   <h2>Aprender, testar e evoluir a operação.</h2>
   <p>Agentes especialistas propõem hipóteses com indicadores, fontes e validação humana. Estudos não alteram estoque, preços, orçamento ou permissões automaticamente.</p></div>
   <div className="travel-hero-right"><span className="travel-status">Sandbox segregado do ERP</span><button className="btn primary" onClick={onTravel}><PlaneTakeoff size={16}/> Abrir viagens</button></div>
  </div>
  <div className="market-agent-grid">{AGENTS.map(a=>{const Icon=a.icon;return <div className="market-agent" key={a.name}><Icon size={22}/><b>{a.name}</b><p>{a.mission}</p></div>;})}</div>
  <section className="panel"><div className="panel-header"><h3><Lightbulb size={19}/> Próximas melhores ações</h3><span className="muted">Com base nos dados disponíveis e regras explícitas</span></div>
   <div className="travel-insights">{learning.map((msg,i)=><p key={i}><CheckCircle2 size={16}/>{msg}</p>)}</div>
  </section>
  <section className="panel"><div className="panel-header"><h3><TrendingUp size={19}/> Práticas de mercado a testar</h3><span className="muted">Clique para transformar em experimento</span></div>
   <div className="market-risks">{RESEARCH.map(r=><div key={r.title}>
    <b>{r.title}</b><p>{r.detail}</p><p><strong>Indicador:</strong> {r.metric}</p>
    <div className="market-test-actions">
     <a href={r.reference} rel="noreferrer" target="_blank" className="btn secondary small">Fonte <ExternalLink size={13}/></a>
     <button className="btn secondary small" onClick={()=>pick(r)}><Plus size={14}/> Criar teste</button>
    </div>
   </div>)}</div>
  </section>
  <section className="panel"><div className="panel-header"><h3><FlaskConical size={19}/> Novo experimento</h3><span className="muted">Sem impacto operacional até homologação</span></div>
   <div className="travel-form-grid"><label className="wide">Título do estudo<input maxLength={180} value={title} onChange={e=>setTitle(e.target.value)}
    placeholder="Ex.: reduzir rupturas em 30 dias"/></label>
    <label>Área<select value={area} onChange={e=>setArea(e.target.value as LabArea)}>
     <option value="operations">Operação</option><option value="consumption">Consumo</option><option value="procurement">Compras</option></select></label>
    <label>Métrica-alvo<input value={metric} onChange={e=>setMetric(e.target.value)} placeholder="Ex.: lead time médio"/></label>
    <label>Baseline (valor medido)<input value={baseline} onChange={e=>setBaseline(e.target.value)} placeholder="A confirmar, sem inventar"/></label>
    <label>Meta do experimento<input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Ex.: -15%"/></label>
    <label className="wide">Fonte / referência HTTPS<input type="url" value={source} onChange={e=>setSource(e.target.value)} placeholder="https://..."/></label>
   </div>
   <label>Hipótese e método<textarea rows={4} maxLength={3000} value={hypothesis} onChange={e=>setHypothesis(e.target.value)}
    placeholder="O que vamos testar, de onde vêm os dados, qual decisão será tomada e como medir o resultado?"/></label>
   <div className="travel-actions"><button className="btn secondary" disabled={loading} onClick={()=>void reload()}><RefreshCw size={14}/> Atualizar</button>
    <button className="btn primary" disabled={loading} onClick={()=>void add()}><Plus size={16}/> Registrar estudo</button></div>
   {message&&<p className="travel-hint" role="status">{message}</p>}
  </section>
  <section className="panel"><div className="panel-header"><h3>Estudos e aprendizados</h3><span className="muted">{records.length} registro(s) na empresa</span></div>
   {records.length===0?<div className="travel-empty"><BrainCircuit size={24}/><p>Ainda não há histórico de estudos. Selecione uma hipótese e estabeleça a medição inicial.</p></div>:
    <div className="table-scroll"><table><thead><tr><th>Estudo</th><th>Área</th><th>Métrica</th><th>Meta</th><th>Registro</th><th>Status</th></tr></thead><tbody>
     {records.map(r=><tr key={r.id}><td><b>{r.title}</b><p className="muted">{r.hypothesis.slice(0,120)}</p></td>
      <td>{r.area}</td><td>{String(r.inputs?.metric||"A definir")}</td><td>{String(r.inputs?.target||"A definir")}</td><td>{titleDate(r.created_at)}</td><td>{r.status}</td></tr>)}
    </tbody></table></div>}
  </section>
  <div className="travel-disclaimer"><ShieldAlert size={16}/> O laboratório é um ambiente controlado de experimentação. A melhoria só é considerada validada após medição de resultado e aprovação do responsável. Não existe coleta autônoma de notícias/preços ou treinamento automático neste MVP.</div>
 </div>;
}
