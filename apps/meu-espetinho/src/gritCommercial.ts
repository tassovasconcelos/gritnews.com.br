export type ProductKey='meu-espetinho'|'sr-padeiro'|'sac-4'|'oportunidades-pro'|'meu-representante'|'meu-servico'|'meu-personal'|'minha-clinica';
export type ProductInfo={key:ProductKey;name:string;domain:string;status:'operational'|'staging'|'planned'};

export const COMMERCIAL_EMAIL='contato@gritnews.com.br';
export const COMMERCIAL_WHATSAPP='5585921716546';
export const FIRST_CONTACT_SLA_MINUTES=30;

export const GRIT_PRODUCTS:ProductInfo[]=[
 {key:'meu-espetinho',name:'Meu Espetinho',domain:'https://meuespetinho.gritnews.com.br',status:'operational'},
 {key:'sr-padeiro',name:'Sr. Padeiro',domain:'https://srpadeiro.gritnews.com.br',status:'staging'},
 {key:'sac-4',name:'SAC 4.0',domain:'https://apps.sactrial.gritnews.com.br',status:'operational'},
 {key:'oportunidades-pro',name:'OportunidadesPro',domain:'',status:'planned'},
 {key:'meu-representante',name:'Meu Representante',domain:'',status:'planned'},
 {key:'meu-servico',name:'Meu Serviço',domain:'',status:'planned'},
 {key:'meu-personal',name:'Meu Personal',domain:'',status:'planned'},
 {key:'minha-clinica',name:'Minha Clínica',domain:'',status:'planned'}
];

export const STAGES=['new','contacted','qualified','demo','trial','proposal','won','lost'] as const;
export const PRIORITIES=['low','normal','high','urgent'] as const;

export function inferProduct(product?:string):ProductKey{
 const p=(product||'').toLowerCase();
 if(p.includes('padeiro'))return 'sr-padeiro';
 if(p.includes('sac'))return 'sac-4';
 if(p.includes('oportun'))return 'oportunidades-pro';
 if(p.includes('represent'))return 'meu-representante';
 if(p.includes('servi'))return 'meu-servico';
 if(p.includes('personal')||p.includes('fitness')||p.includes('educador'))return 'meu-personal';
 if(p.includes('clinica')||p.includes('clínica')||p.includes('coleta'))return 'minha-clinica';
 return 'meu-espetinho';
}
export function productLabel(product?:string){return GRIT_PRODUCTS.find(p=>p.key===inferProduct(product))?.name||'GRIT'}
export const onlyDigits=(v?:string)=>String(v||'').replace(/\D/g,'');
