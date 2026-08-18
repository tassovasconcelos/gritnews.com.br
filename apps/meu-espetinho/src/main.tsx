import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Marketing from './Marketing';
import IntentLanding, { getIntentFromPath } from './IntentLanding';
import Contact from './Contact';
import Signup from './Signup';
import Admin from './Admin';
import AppGate from './AppGate';
import AuthCallback from './AuthCallback';
import MarketingConsent from './MarketingConsent';
import { captureAttribution, trackMarketing } from './lib/analytics';
import './brand-tokens.css';import './styles.css';import './app-v2.css';import './brand-v2.css';import './admin-brand.css';import './pdv-v4.css';
const BASE='https://meuespetinho.gritnews.com.br';
const seoPages:Record<string,{title:string;description:string}>={
'/sistema-para-espetinho':{title:'Sistema para Espetinho | Comanda, Caixa e Fiado | Meu Espetinho',description:'Sistema simples para espetinho: vendas, comandas, caixa, clientes, fiado, comprovante e lista de compras pelo celular.'},
'/sistema-para-churrasquinho':{title:'Sistema para Churrasquinho | PDV e Comanda | Meu Espetinho',description:'Organize vendas, mesas, bebidas, caixa e fiado no churrasquinho com um sistema simples para celular, tablet ou computador.'},
'/comanda-digital-para-espetinho':{title:'Comanda Digital para Espetinho e Bar | Meu Espetinho',description:'Comanda digital por mesa ou cliente, fechamento rápido e comprovante para imprimir ou compartilhar.'},
'/controle-de-fiado':{title:'Controle de Fiado para Espetinho e Bar | Meu Espetinho',description:'Controle clientes, valores fiados, pagamentos e saldo a receber sem depender de caderno ou memória.'},
'/sistema-para-bar-pequeno':{title:'Sistema Simples para Bar Pequeno e Boteco | Meu Espetinho',description:'PDV, comandas, caixa, clientes, fiado e lista de compras para bares pequenos e botecos.'},
'/pdv-para-espetinho':{title:'PDV para Espetinho pelo Celular | Meu Espetinho',description:'PDV simples para lançar pedidos, receber e fechar contas de espetinhos diretamente pelo celular.'},
'/sistema-para-food-truck':{title:'Sistema para Food Truck e Trailer | Meu Espetinho',description:'Venda pelo celular, controle pedidos, caixa e clientes em food trucks, trailers e operações móveis.'},
'/sistema-para-barraca-de-comida':{title:'Sistema para Barraca de Comida | Vendas pelo Celular',description:'Organize vendas, comandas, caixa e recebimentos de barracas e pequenos negócios de alimentação.'},
'/controle-de-caixa-para-espetinho':{title:'Controle de Caixa para Espetinho | Meu Espetinho',description:'Acompanhe dinheiro, PIX, cartão, fiado, vendas e fechamento do seu espetinho em uma única operação.'},
'/lista-de-compras-para-espetinho':{title:'Lista de Compras para Espetinho | Meu Espetinho',description:'Use o histórico de vendas para ajudar a planejar reposição de espetos, bebidas, carvão, gelo e outros itens.'},
'/sistema-para-mei-alimentacao':{title:'Sistema para MEI de Alimentação | Meu Espetinho',description:'Sistema simples e acessível para MEI organizar vendas, comandas, caixa, clientes e fiado pelo celular.'},
'/aplicativo-para-controlar-vendas':{title:'Aplicativo para Controlar Vendas pelo Celular | Meu Espetinho',description:'Controle pedidos, recebimentos, clientes e indicadores do pequeno negócio diretamente pelo celular.'}
};
function setMeta(name:string,content:string){let el=document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement|null;if(!el){el=document.createElement('meta');el.name=name;document.head.appendChild(el)}el.content=content}
function setProperty(property:string,content:string){let el=document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement|null;if(!el){el=document.createElement('meta');el.setAttribute('property',property);document.head.appendChild(el)}el.content=content}
function syncSeo(path:string){const clean=path.replace(/\/$/,'')||'/';const canonical=document.querySelector('link[rel="canonical"]') as HTMLLinkElement|null;if(path.startsWith('/admin')||path.startsWith('/app')||path.startsWith('/auth/')){setMeta('robots','noindex,nofollow,noarchive');document.title=path.startsWith('/admin')?'Meu Espetinho | Administração':path.startsWith('/auth/')?'Confirmando acesso | Meu Espetinho':'Meu Espetinho | Operação';if(canonical)canonical.href=BASE+'/';return}if(path.startsWith('/cadastro')){setMeta('robots','index,follow');setMeta('description','Crie sua conta no Meu Espetinho e organize vendas, comandas, clientes, fiado e caixa.');document.title='Criar conta | Meu Espetinho';if(canonical)canonical.href=BASE+'/cadastro';return}const page=seoPages[clean];const description=page?.description||'Sistema simples para espetinho, churrasquinho, bar, trailer e food truck. Controle vendas, comandas, clientes, fiado, equipe, caixa e lista de compras pelo celular.';const title=page?.title||'Meu Espetinho | Sistema para Espetinho, Comanda Digital e PDV';setMeta('robots','index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');setMeta('description',description);setProperty('og:title',title);setProperty('og:description',description);setProperty('og:url',BASE+(page?clean:'/'));setMeta('twitter:title',title);setMeta('twitter:description',description);document.title=title;if(canonical)canonical.href=BASE+(page?clean:'/')}
function Router(){const[path,setPath]=useState(window.location.pathname);useEffect(()=>{captureAttribution();const sync=()=>setPath(window.location.pathname);window.addEventListener('popstate',sync);syncSeo(path);trackMarketing({name:path==='/'?'view_landing':'page_view',params:{path}});return()=>window.removeEventListener('popstate',sync)},[path]);if(path.startsWith('/auth/callback'))return <AuthCallback/>;if(path.startsWith('/admin'))return <><Admin/><MarketingConsent/></>;if(path.startsWith('/cadastro'))return <><Signup/><MarketingConsent/></>;if(path.startsWith('/app'))return <><AppGate/><MarketingConsent/></>;if(path.startsWith('/contato'))return <><Contact/><MarketingConsent/></>;const intent=getIntentFromPath(path);if(intent)return <><IntentLanding intent={intent}/><MarketingConsent/></>;return <><Marketing/><MarketingConsent/></>}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Router/></React.StrictMode>);
