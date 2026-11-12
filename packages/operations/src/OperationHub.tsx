import {useEffect,useRef,useState} from 'react';
import type {OperationApp} from './SettingsPanel';
import {loadOperationClients,operationAreas,operationPlatforms,startOperationSupport,type OperationArea,type OperationClient} from './supportNavigation';
import './operation-hub.css';

export function OperationHub({client,currentApp}:{client:any;currentApp:OperationApp}) {
  const [product,setProduct]=useState<'all'|OperationApp>('all'),[search,setSearch]=useState(''),[rows,setRows]=useState<OperationClient[]>([]);
  const [area,setArea]=useState<OperationArea>('home'),[reason,setReason]=useState('Implantação e configuração da operação');
  const [page,setPage]=useState(0),[more,setMore]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  const request=useRef(0);
  useEffect(()=>{const v=++request.current;setLoading(true);setError('');setRows([]);setMore(false);
    const timer=setTimeout(()=>{loadOperationClients(client,product,search,page).then(r=>{if(v===request.current){setRows(r.rows);setMore(r.more);}}).catch(()=>{if(v===request.current)setError('Não foi possível consultar os clientes. Confira sua sessão Super Admin e tente novamente.');}).finally(()=>{if(v===request.current)setLoading(false);});},250);
    return()=>{clearTimeout(timer);request.current++;};
  },[client,product,search,page,revision]);
  async function enter(c:OperationClient){if(busy)return;setBusy(true);setError('');try{
    const origin=c.app===currentApp?location.origin:undefined;
    const target=await startOperationSupport(client,c.app,c.id,area,reason,origin);location.assign(target);
  }catch{setError('Não foi possível iniciar o suporte. Confira o motivo e a sessão. Nenhuma operação foi aberta.');setBusy(false);}}
  const status:Record<string,string>={approved:'Operação liberada',pending_setup:'Em implantação',awaiting_payment:'Aguardando ativação',suspended:'Suspenso',homologation:'Homologação',production:'Produção'};
  return <main className="operation-hub"><header><div><small>SUPER ADMIN · IMPLANTAÇÃO E SUPORTE</small><h1>Central de operações dos clientes</h1><p>Escolha a empresa e a área em que deseja trabalhar, usando sua própria conta administrativa.</p></div><a href="/admin">Voltar à administração</a></header>
    <section className="oh-controls"><label>Plataforma<select disabled={busy} value={product} onChange={e=>{setPage(0);setProduct(e.target.value as typeof product);}}><option value="all">Todas as integradas</option>{Object.entries(operationPlatforms).map(([id,p])=><option key={id} value={id}>{p.name}</option>)}</select></label><label>Buscar cliente<input disabled={busy} type="search" value={search} onChange={e=>{setPage(0);setSearch(e.target.value);}} placeholder="Nome da empresa"/></label><label>Abrir diretamente em<select disabled={busy} value={area} onChange={e=>setArea(e.target.value as OperationArea)}>{operationAreas.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><label>Finalidade do acesso<input disabled={busy} minLength={3} maxLength={240} value={reason} onChange={e=>setReason(e.target.value)}/></label></section>
    <p className="oh-notice">Acesso completo por até uma hora, com empresa e responsável registrados. Alterações afetam o cliente selecionado. Clientes suspensos também podem receber suporte, sem alterar sua liberação comercial.</p>
    <p>Gerencie os clientes do Meu Espetinho e do Sr. Padeiro. Se abrir outra plataforma, entre com a mesma conta Super Admin quando solicitado.</p>
    {error&&<p role="alert" className="oh-error">{error} <button disabled={busy||loading} onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button></p>}
    <section className="oh-clients" aria-label="Clientes e operações" aria-busy={loading}>{loading?<p role="status">Carregando clientes…</p>:!rows.length&&!error?<p>Nenhum cliente encontrado para esta busca.</p>:rows.map(c=><article key={`${c.app}-${c.id}`}><small>{operationPlatforms[c.app].name}</small><h2>{c.name}</h2><p>{status[c.status]||'Conferir cadastro'}</p><button disabled={busy||reason.trim().length<3} onClick={()=>void enter(c)} aria-label={`Entrar na operação de ${c.name} no ${operationPlatforms[c.app].name}`}>{busy?'Abrindo operação…':'Entrar na operação'}</button><a href={`${operationPlatforms[c.app].origin}/admin?client=${encodeURIComponent(c.id)}`}>Ver ficha administrativa</a></article>)}</section>
    <nav className="oh-pagination" aria-label="Páginas de clientes"><button disabled={loading||busy||page===0} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page+1}</span><button disabled={loading||busy||!more} onClick={()=>setPage(p=>p+1)}>Próxima</button><button disabled={loading||busy} onClick={()=>setRevision(n=>n+1)}>Atualizar clientes</button></nav>
  </main>;
}

export function StartOperationSupport({client,app,scopeId,area='settings'}:{client:any;app:OperationApp;scopeId:string;area?:OperationArea}) {
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="ops-panel"><h2>Configurar esta operação</h2><p>Você está em consulta. Entre no suporte para cadastrar produtos, importar cardápio, preparar estoque, usuários, logo e impressão.</p><button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{location.assign(await startOperationSupport(client,app,scopeId,area,'Implantação e configuração pela operação do cliente',location.origin));}catch{setBusy(false);setError('Não foi possível iniciar o suporte. Entre novamente ou tente pela central.');}}}>{busy?'Abrindo suporte…':'Entrar na operação completa'}</button> <a href="/admin/operacoes">Todos os clientes e operações</a>{error&&<p role="alert">{error}</p>}</section>;
}
