import {useEffect,useState} from 'react';
import {Cloud,CloudOff,RefreshCw} from 'lucide-react';
import {getConnectionState,watchConnection,type ConnectionState} from './lib/mobileRuntime';
import './mobile-shell.css';

export default function MobileConnectionBanner(){
 const[state,setState]=useState<ConnectionState|null>(null);
 useEffect(()=>{let stop:(()=>void)|undefined;getConnectionState().then(setState).catch(()=>{});watchConnection(setState).then(fn=>{stop=fn});return()=>stop?.()},[]);
 if(!state)return null;
 return <div className={`mobile-connection ${state.connected?'is-online':'is-offline'}`} role="status" aria-live="polite">
  <div className="mobile-connection__icon">{state.connected?<Cloud size={16}/>:<CloudOff size={16}/>}</div>
  <div className="mobile-connection__copy"><strong>{state.connected?'Online':'Modo offline'}</strong><small>{state.connected?'Dados conectados à nuvem':'Continue operando. Alterações locais serão sincronizadas quando a internet voltar.'}</small></div>
  {!state.connected&&<RefreshCw size={16} className="mobile-connection__spin"/>}
 </div>
}
