import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Landing from './Landing';
import './styles.css';

function Router() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return path.startsWith('/app') ? <App /> : <Landing />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Router /></React.StrictMode>,
);
