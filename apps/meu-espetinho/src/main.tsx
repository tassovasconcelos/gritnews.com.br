import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './Landing';
import Signup from './Signup';
import Admin from './Admin';
import AppGate from './AppGate';
import MarketingConsent from './MarketingConsent';
import { trackMarketing } from './lib/analytics';
import './styles.css';

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
  return <><Landing /><MarketingConsent /></>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Router /></React.StrictMode>,
);
