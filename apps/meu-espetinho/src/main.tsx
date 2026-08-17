import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Marketing from './Marketing';
import Contact from './Contact';
import Signup from './Signup';
import Admin from './Admin';
import AppGate from './AppGate';
import MarketingConsent from './MarketingConsent';
import { trackMarketing } from './lib/analytics';
import './brand-tokens.css';
import './styles.css';
import './app-v2.css';
import './brand-v2.css';
import './admin-brand.css';
import './pdv-v4.css';

function Router() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    trackMarketing({ name: path === '/' ? 'view_landing' : 'page_view', params: { path } });
    return () => window.removeEventListener('popstate', sync);
  }, [path]);
  if (path.startsWith('/admin')) return <><Admin /><MarketingConsent /></>;
  if (path.startsWith('/cadastro')) return <><Signup /><MarketingConsent /></>;
  if (path.startsWith('/app')) return <><AppGate /><MarketingConsent /></>;
  if (path.startsWith('/contato')) return <><Contact /><MarketingConsent /></>;
  return <><Marketing /><MarketingConsent /></>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Router /></React.StrictMode>,
);
