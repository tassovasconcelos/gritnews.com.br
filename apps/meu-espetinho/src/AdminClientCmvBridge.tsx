import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {supabase} from './lib/supabase';

type Row={tenant_id:string;tenant_name:string;revenue_90d:number;cmv_90d:number;gross_profit_90d:number;gross_margin_pct:number;products_count:number;products_with_cost:number};
const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));

export default function AdminClientCmvBridge(){
 const[rows,setRows]=useState<Row[]>([]);const[target,setTarget]=useState<Element|null>(null);const[name,setName]=useState('');
 useEffect(()=>{let alive=true;async function load(){if(!supabase)return;const{data}=await supabase.rpc('admin_customer_overview');if(alive)setRows((data||[]) as Row[])}load();const sync=()=>{const metric=document.querySelector('.customer-detail .detail-metrics');const title=document.querySelector('.customer-detail .detail-title h3')?.textContent?.trim()||'';setTarget(metric);setName(title)};sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,characterData:true});return()=>{alive=false;observer.disconnect()}},[]);
 const row=useMemo(()=>rows.find(r=>r.tenant_name===name)||null,[rows,name]);if(!target||!row)return null;
 const coverage=row.products_count>0?Math.round((Number(row.products_with_cost||0)/Number(row.products_count))*100):0;
 const reliable=coverage===100;
 return createPortal(<>
  <div className="cmv-kpi"><span>CMV 90d</span><b>{money(row.cmv_90d)}</b><small>{reliable?'custos completos':'estimativa parcial'}</small></div>
  <div className="cmv-kpi"><span>Lucro bruto 90d</span><b>{money(row.gross_profit_90d)}</b><small>faturamento − CMV</small></div>
  <div className="cmv-kpi"><span>Margem bruta</span><b>{Number(row.gross_margin_pct||0).toFixed(1)}%</b><small>antes das despesas</small></div>
  <div className={`cmv-kpi ${reliable?'cmv-ok':'cmv-warn'}`}><span>Cobertura de custo</span><b>{coverage}%</b><small>{row.products_with_cost}/{row.products_count} produtos com custo</small></div>
 </>,target);
}
