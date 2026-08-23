import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTracking } from './lib/tracking';
import './styles.css';
import './workspace.css';
import './landing-v2.css';

initTracking();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
