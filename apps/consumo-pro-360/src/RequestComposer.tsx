import {useState} from 'react';
import {Search, Plus, Trash2, ArrowLeft, Send} from 'lucide-react';

type Product={id:string;name:string;sku:string;unit:string;active:boolean};
type Item={product_id:string;quantity:number};
type Props={products:Product[];departments:{id:string;name:string}[];department:string;setDepartment:(value:string)=>void;items:Item[];setItems:(items:Item[])=>void;busy:boolean;submit:(e:React.FormEvent)=>void;cancel:()=>void};
const clean=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export default function RequestComposer({products,departments,department,setDepartment,items,setItems,busy,submit,cancel}:Props){
 const [query,setQuery]=useState('');
 const [review,setReview]=useState(false);
 const active=products.filter(p=>p.active);
 const matches=active.filter(p=>clean(p.name+' '+p.sku).includes(clean(query)));
 const valid=Boolean(department&&items.length&&items.every(i=>Number.isFinite(i.quantity)&&i.quantity>0));
 const add=(id:string)=>setItems(items.some(i=>i.product_id===id)?items.map(i=>i.product_id===id?{...i,quantity:i.quantity+1}:i):[...items,{product_id:id,quantity:1}]);
 return <form className="request-composer" onSubmit={e=>{e.preventDefault();if(review&&valid&&!busy)submit(e);}}>
  <ol className="request-steps" aria-label="Etapas da solicitação"><li className={!review?'current':''}>1. Escolher materiais</li><li className={review?'current':''}>2. Conferir e enviar</li></ol>
  {!review?<>
   <label>Para qual setor?<select required disabled={busy} value={department} onChange={e=>setDepartment(e.target.value)}>{!departments.length&&<option value="">Nenhum setor autorizado</option>}{departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
   <label className="request-search"><span>Qual material você precisa?</span><div><Search size={18}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busque pelo nome ou código"/></div></label>
   <div className="material-picker" aria-label="Materiais do catálogo">{matches.slice(0,30).map(p=><button type="button" className="material-choice" key={p.id} disabled={busy} onClick={()=>add(p.id)}><span><strong>{p.name}</strong><small>{p.sku} · unidade: {p.unit||'UN'}</small></span><Plus size={20}/><span className="sr-only">Adicionar {p.name}</span></button>)}
   {!matches.length&&<p className="request-hint">{active.length?'Nenhum material encontrado. Tente outro nome ou código.':'O catálogo ainda está vazio. Peça ao administrador para cadastrar os materiais antes de solicitar.'}</p>}
   {matches.length>30&&<p className="request-hint">Digite mais detalhes para encontrar o material desejado.</p>}</div>
  </>:<div className="review-intro"><h3>Confira sua solicitação</h3><p>Setor: <strong>{departments.find(d=>d.id===department)?.name}</strong></p><p>Depois do envio, o gestor analisa o pedido. Você acompanha cada etapa em Solicitações.</p></div>}
  <section className="request-basket" aria-label="Materiais escolhidos"><h3>{items.length} {items.length===1?'material escolhido':'materiais escolhidos'}</h3>
   {!items.length&&<p className="request-hint">Toque no material para incluí-lo. Depois, ajuste a quantidade.</p>}
   {items.map(item=>{const p=products.find(p=>p.id===item.product_id);return <div className="basket-item" key={item.product_id}><div><strong>{p?.name||'Material'}</strong><small>{p?.unit||'UN'}</small></div><label>Quantidade<input disabled={busy} aria-label={'Quantidade de '+p?.name} type="number" inputMode="decimal" min="0.001" step="0.001" required value={item.quantity} onChange={e=>setItems(items.map(i=>i.product_id===item.product_id?{...i,quantity:Number(e.target.value)}:i))}/></label><button disabled={busy} type="button" className="icon-button" aria-label={'Remover '+p?.name} onClick={()=>setItems(items.filter(i=>i.product_id!==item.product_id))}><Trash2 size={18}/></button></div>;})}
  </section>
  <div className="form-footer request-footer">{review?<button type="button" disabled={busy} className="btn secondary" onClick={()=>setReview(false)}><ArrowLeft size={17}/> Voltar</button>:<button type="button" disabled={busy} className="btn secondary" onClick={cancel}>Fechar</button>}
   {review?<button key="send" type="submit" disabled={busy||!valid} className="btn primary">{busy?'Enviando…':'Confirmar e enviar'}<Send size={17}/></button>:<button key="review" type="button" className="btn primary" disabled={!valid||busy} onClick={e=>{e.preventDefault();setReview(true);}}>Conferir pedido</button>}
  </div><p className="request-hint">{review?'O pedido será enviado uma única vez. Aguarde a confirmação.':'Você pode fechar e continuar este pedido enquanto esta tela permanecer aberta.'}</p>
 </form>;
}
