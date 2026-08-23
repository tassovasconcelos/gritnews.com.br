export type ProductKey='meu-espetinho'|'sr-padeiro'|'sac-4'|'oportunidades-pro';
export type ProductInfo={key:ProductKey;name:string;domain:string;status:'operational'|'staging'|'planned'};

export const COMMERCIAL_EMAIL='contato@gritnews.com.br';
export const COMMERCIAL_WHATSAPP='5585921716546';
export const FIRST_CONTACT_SLA_MINUTES=30;

export const GRIT_PRODUCTS:ProductInfo[]=[
 {key:'meu-espetinho',name:'Meu Espetinho',domain:'https://meuespetinho.gritnews.com.br',status:'operational'},
 {key:'sr-padeiro',name:'Sr. Padeiro',domain:'https://srpadeiro.gritnews.com.br',status:'staging'},
 {key:'sac-4',name:'SAC 4.0',domain:'https://apps.sactrial.gritnews.com.br',status:'operational'},
 {key:'oportunidades-pro',name:'OportunidadesPro',domain:'',status:'planned'}
];

export const STAGES=['new','contacted','qualified','demo','trial','proposal','won','lost'] as const;
export const PRIORITIES=['low','normal','high','urgent'] as const;

export function inferProduct(product?:string):ProductKey{
 const p=(product||'').toLowerCase();
 if(p.includes('padeiro'))return 'sr-padeiro';
 if(p.includes('sac'))return 'sac-4';
 if(p.includes('oportun'))return 'oportunidades-pro';
 return 'meu-espetinho';
}
export function productLabel(product?:string){return GRIT_PRODUCTS.find(p=>p.key===inferProduct(product))?.name||'GRIT'}
export const onlyDigits=(v?:string)=>String(v||'').replace(/\D/g,'');
