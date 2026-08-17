import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Marketing from './Marketing';
import Contact from './Contact';
import Signup from './Signup';
import Admin from './Admin';
import AppGate from './AppGate';
import MarketingConsent from './MarketingConsent';
import { captureAttribution, trackMarketing } from './lib/analytics';
import './brand-tokens.css';
import './styles.css';
import './app-v2.css';
import './brand-v2.css';
import './admin-brand.css';
import './pdv-v4.css';

const BASE='https://meuespetinho.gritnews.com.br';
function setMeta(name:string,content:string){let el=document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement|null;if(!el){el=document.createElement('meta');el.name=name;document.head.appendChild(el)}el.content=content}
function syncSeo(path:string){
  const canonical=document.querySelector('link[rel="canonical"]') as HTMLLinkElement|null;
  if(path.startsWith('/admin')||path.startsWith('/app')){setMeta('robots','noindex,nofollow,noarchive');document.title=path.startsWith('/admin')?'Meu Espetinho | Administração':'Meu Espetinho | Operação';if(canonical)canonical.href=BASE+'/';return}
  if(path.startsWith('/cadastro')){setMeta('robots','index,follow');setMeta('description','Crie sua conta no Meu Espetinho e organize vendas, comandas, clientes, fiado e caixa em um sistema simples para pequenos negócios.');document.title='Criar conta | Meu Espetinho';if(canonical)canonical.href=BASE+'/cadastro';return}
  setMeta('robots','index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');setMeta('description','Sistema simples para espetinho, churrasquinho, bar, trailer e food truck. Controle vendas, comandas, clientes, fiado, equipe, caixa e lista de compras pelo celular.');document.title='Meu Espetinho | Sistema para Espetinho, Comanda Digital e PDV';if(canonical)canonical.href=BASE+'/';
}

function Router() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    captureAttribution();
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    syncSeo(path);
    trackMarketing({ name: path === '/' ? 'view_landing' : 'page_view', params: { path } });
    return () => window.removeEventListener('popstate', sync);
  }, [path]);
  if (path.startsWith('/admin')) return <><Admin /><MarketingConsent /></>;
  if (path.startsWith('/cadastro')) return <><Signup /><MarketingConsent /></>;
  if (path.startsWith('/app')) return <><AppGate /><MarketingConsent /></>;
  if (path.startsWith('/contato')) return <><Contact /><MarketingConsent /></>;
  return <><Marketing /><MarketingConsent /></>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Router /></React.StrictMode>);
