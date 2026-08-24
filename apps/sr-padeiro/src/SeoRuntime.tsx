import { useEffect } from 'react';

const names:Record<string,string>={
  '/sistema-para-padaria':'Sistema para Padaria',
  '/sistema-para-mercadinho':'Sistema para Mercadinho e Mercearia',
  '/pdv-simples':'PDV Simples para Pequeno Comércio',
  '/controle-de-estoque':'Controle de Estoque para Padaria e Mercadinho',
  '/controle-de-caixa':'Controle de Caixa Simples',
  '/controle-de-fiado':'Controle de Fiado e Clientes',
  '/gestao-pelo-celular':'Gestão pelo Celular',
  '/planos':'Planos e Preços do Sr. Padeiro'
};

export default function SeoRuntime({path}:{path:string}){
  useEffect(()=>{
    document.querySelectorAll('script[data-srp-schema="1"]').forEach(el=>el.remove());
    const base='https://srpadeiro.gritnews.com.br';
    const schemas=[
      {
        '@context':'https://schema.org','@type':'SoftwareApplication',name:'Sr. Padeiro',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:base,
        description:'Sistema simples para padarias, mercadinhos, mercearias e conveniências com PDV, estoque, caixa, despesas, clientes e gestão pelo celular.',
        offers:{'@type':'Offer',price:'99.00',priceCurrency:'BRL',description:'Mensalidade de manutenção. Implantação comercial de R$ 199.'},
        provider:{'@type':'Organization',name:'GRIT Soluções e Negócios',email:'contato@gritnews.com.br',url:'https://gritnews.com.br'}
      },
      {
        '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
          {'@type':'ListItem',position:1,name:'Sr. Padeiro',item:base+'/'},
          {'@type':'ListItem',position:2,name:names[path]||'Solução',item:base+path}
        ]
      }
    ];
    schemas.forEach(data=>{const script=document.createElement('script');script.type='application/ld+json';script.dataset.srpSchema='1';script.text=JSON.stringify(data);document.head.appendChild(script)});
    return()=>document.querySelectorAll('script[data-srp-schema="1"]').forEach(el=>el.remove());
  },[path]);
  return null;
}
