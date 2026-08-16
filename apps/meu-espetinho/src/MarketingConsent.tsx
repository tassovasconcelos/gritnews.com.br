import { useEffect, useState } from 'react';
import { initMarketing } from './lib/analytics';

const KEY='meu-espetinho-marketing-consent';
export default function MarketingConsent(){
  const[visible,setVisible]=useState(false);
  useEffect(()=>{const v=localStorage.getItem(KEY);if(v==='accepted')initMarketing();else if(!v)setVisible(true)},[]);
  if(!visible)return null;
  return <div className="cookie-consent"><div><strong>Privacidade e experiência</strong><span>Usamos métricas para entender a navegação e melhorar o Meu Espetinho. Você pode aceitar ou continuar apenas com recursos essenciais.</span></div><div><button className="cookie-secondary" onClick={()=>{localStorage.setItem(KEY,'essential');setVisible(false)}}>Só essenciais</button><button onClick={()=>{localStorage.setItem(KEY,'accepted');initMarketing();setVisible(false)}}>Aceitar</button></div></div>;
}
