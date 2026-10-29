import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ManagedPasswordGate } from '@gritnews/operations';
import { supabase } from './lib/supabase';
import MarketingConsent from './MarketingConsent';
import { initTracking } from './lib/tracking';
import './styles.css';
import './workspace.css';
import './landing-v2.css';
import './marketing-consent.css';
import './subscription.css';

initTracking();
if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ManagedPasswordGate client={supabase}><App /></ManagedPasswordGate>
    <MarketingConsent />
  </React.StrictMode>,
);
