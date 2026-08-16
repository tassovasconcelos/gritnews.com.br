import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './Landing';
import Signup from './Signup';
import Admin from './Admin';
import AppGate from './AppGate';
import './styles.css';

function Router() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  if (path.startsWith('/admin')) return <Admin />;
  if (path.startsWith('/cadastro')) return <Signup />;
  if (path.startsWith('/app')) return <AppGate />;
  return <Landing />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Router /></React.StrictMode>,
);
