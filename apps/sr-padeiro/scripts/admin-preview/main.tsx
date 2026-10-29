// Browser-only QA harness. Not imported by the application's production entrypoint.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/styles.css';
const org={id:'11111111-1111-4111-8111-111111111111',name:'Padaria Aurora · exemplo',phone:'',contact_email:'equipe@example.invalid',slug:'padaria-aurora',logo_url:null,primary_color:'#bd7935',environment:'homologation',active:true,created_at:'2026-10-29T12:00:00Z',products_count:2,members_count:1,revenue_30d:0,access_mode:'trial',trial_ends_at:'2026-11-05T12:00:00Z'};
const products=[{id:'22222222-2222-4222-8222-222222222222',name:'Pão francês',variant:'',unit:'UN',sale_price:.8,cost_price:null,category_id:'bread',barcode:null,external_key:'bread-1',fulfillment:'pronta_entrega',catalog_notes:'',active:true},{id:'33333333-3333-4333-8333-333333333333',name:'Bolo de milho',variant:'P',unit:'UN',sale_price:11.5,cost_price:null,category_id:'cake',barcode:null,external_key:'cake-1',fulfillment:'encomenda',catalog_notes:'',active:false}];
const detail={organization:org,access:{access_mode:'trial',trial_ends_at:org.trial_ends_at,barter_until:null,notes:null},stores:[{id:'store-1',name:'Loja principal'}],members:[{user_id:'member-1',email:org.contact_email,role:'manager',active:true,confirmed:false,operator_names:['Equipe de exemplo']}],products,categories:[{id:'bread',name:'Pães'},{id:'cake',name:'Bolos'}],inventory:[{store_id:'store-1',product_id:products[0].id,quantity:48,minimum_quantity:10}],cash:[],sales:[],events:[{event_name:'admin_create',created_at:'2026-10-29T12:00:00Z',metadata:{reason:'Exemplo de cadastro em homologação'}}]};
const originalFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{
 const url=typeof input==='string'?input:input instanceof Request?input.url:String(input);
 if(url.includes('.supabase.co')){
   if(url.includes('/rest/v1/rpc/srp_admin_console')){
     const body=JSON.parse(String(init?.body||(input instanceof Request?await input.clone().text():'{}')));
     const data=body.p_action==='list'?[org]:body.p_action==='detail'?detail:body.p_action==='create'?{organization_id:org.id}:{ok:true};
     return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
   }
   return new Response(JSON.stringify({error:'Indisponível nesta prévia local.'}),{status:403,headers:{'Content-Type':'application/json'}});
 }
 return originalFetch(input,init);
};
const Admin=(await import('../../src/Admin')).default;
createRoot(document.getElementById('root')!).render(<Admin/>);
