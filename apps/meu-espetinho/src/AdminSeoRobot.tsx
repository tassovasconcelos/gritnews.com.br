import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, FileText, Globe2, PlayCircle, Search, Settings2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import './seo-robot.css';

type Config={id:string;enabled:boolean;mode:'recommend'|'draft'|'auto_safe';target_market:string;max_new_pages_per_week:number;max_content_refreshes_per_week:number};
type Opportunity={id:string;keyword:string;intent:string;cluster:string;priority:number;status:string;target_path?:string|null};
type Queue={id:string;action_type:string;title:string;target_path?:string|null;keyword?:string|null;rationale?:string|null;status:string;priority:number};
type Run={id:string;pages_checked:number;actions_created:number;status:string;created_at:string};

const actionLabel:Record<string,string>={new_landing:'Nova landing',new_guide:'Novo guia',refresh_page:'Atualizar página',internal_links:'Links internos',metadata:'Metadados',schema:'Dados estruturados',sitemap:'Sitemap',index_check:'Indexação'};

export default function AdminSeoRobot(){
 const[config,setConfig]=useState<Config|null>(null);const[ops,setOps]=useState<Opportunity[]>([]);const[queue,setQueue]=useState<Queue[]>([]);const[runs,setRuns]=useState<Run[]>([]);const[busy,setBusy]=useState(false);const[msg,setMsg]=useState('');
 useEffect(()=>{load()},[]);
 async function load(){if(!supabase)return;setBusy(true);const[c,o,q,r]=await Promise.all([
  supabase.from('seo_robot_config').select('*').limit(1).maybeSingle(),
  supabase.from('seo_keyword_opportunities').select('*').order('priority',{ascending:false}).limit(30),
  supabase.from('seo_content_queue').select('*').eq('status','open').order('priority',{ascending:false}).limit(30),
  supabase.from('seo_robot_runs').select('*').order('created_at',{ascending:false}).limit(5)
 ]);setConfig(c.data as Config|null);setOps((o.data||[]) as Opportunity[]);setQueue((q.data||[]) as Queue[]);setRuns((r.data||[]) as Run[]);setBusy(false)}
 async function runRobot(){if(!supabase)return;setBusy(true);setMsg('Analisando sitemap, clusters e oportunidades...');const{data,error}=await supabase.functions.invoke('seo-growth-robot',{body:{source:'admin'}});setMsg(error||!data?.ok?`Falha ao executar robô SEO: ${data?.error||error?.message||'erro desconhecido'}.`:`Rodada concluída: ${data.pages_checked||0} páginas verificadas • ${data.actions_created||0} novas ações.`);await load();setBusy(false)}
 async function saveMode(mode:Config['mode']){if(!supabase||!config)return;await supabase.from('seo_robot_config').update({mode,updated_at:new Date().toISOString()}).eq('id',config.id);setConfig({...config,mode})}
 async function toggle(){if(!supabase||!config)return;await supabase.from('seo_robot_config').update({enabled:!config.enabled,updated_at:new Date().toISOString()}).eq('id',config.id);setConfig({...config,enabled:!config.enabled})}
 async function markDone(id:string){if(!supabase)return;await supabase.from('seo_content_queue').update({status:'done',completed_at:new Date().toISOString()}).eq('id',id);await load()}
 const last=runs[0];
 return <section className="seo-robot-panel">
  <div className="seo-robot-head"><div><small>SEO & AUTHORITY ROBOT</small><h3><Bot/> Presença orgânica contínua</h3><p>Transforma oportunidades de busca em uma fila segura de conteúdo, SEO técnico, links internos, sitemap e indexação.</p></div><button className="seo-run" onClick={runRobot} disabled={busy}><PlayCircle/> {busy?'Executando...':'Executar robô agora'}</button></div>
  <div className="seo-robot-stats"><article><Globe2/><span>Páginas verificadas</span><strong>{last?.pages_checked||0}</strong></article><article><Search/><span>Palavras monitoradas</span><strong>{ops.length}</strong></article><article><FileText/><span>Ações abertas</span><strong>{queue.length}</strong></article><article><CheckCircle2/><span>Modo</span><strong>{config?.mode==='auto_safe'?'Auto seguro':config?.mode==='draft'?'Rascunho':'Recomendar'}</strong></article></div>
  {config&&<div className="seo-controls"><div><Settings2/><div><b>Automação editorial</b><small>Não publica páginas repetitivas nem usa keyword stuffing. Prioriza conteúdo único e útil.</small></div></div><button className={config.enabled?'auto-on':'auto-off'} onClick={toggle}>{config.enabled?'Robô ON':'Robô OFF'}</button><select value={config.mode} onChange={e=>saveMode(e.target.value as Config['mode'])}><option value="recommend">Só recomendar</option><option value="draft">Preparar rascunhos</option><option value="auto_safe">Automação segura</option></select></div>}
  <div className="seo-grid"><div><h4>Fila prioritária</h4><div className="seo-queue">{!queue.length?<p>Nenhuma ação pendente.</p>:queue.slice(0,12).map(a=><article key={a.id}><div><span>{actionLabel[a.action_type]||a.action_type}</span><b>{a.title}</b>{a.target_path&&<small>{a.target_path}</small>}<p>{a.rationale}</p></div><div><em>{a.priority}</em><button onClick={()=>markDone(a.id)}>Concluir</button></div></article>)}</div></div><div><h4>Radar de palavras-chave</h4><div className="seo-keywords">{ops.slice(0,16).map(o=><article key={o.id}><div><b>{o.keyword}</b><small>{o.intent} • {o.cluster}</small></div><span>{o.priority}</span></article>)}</div></div></div>
  <div className="seo-guardrail"><CheckCircle2/><span><b>Objetivo:</b> ampliar relevância para PMEs de alimentação com páginas úteis, técnicas corretas e medição contínua. Ranking é resultado, não promessa.</span></div>
  {msg&&<p className="growth-message">{msg}</p>}
 </section>;
}
