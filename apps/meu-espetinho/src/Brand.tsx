import { Flame } from 'lucide-react';

export function Brand({ light = false }: { light?: boolean }) {
  return <div className={`me-brand ${light ? 'light' : ''}`} aria-label="Meu Espetinho">
    <span className="me-brand-symbol"><Flame size={25} strokeWidth={2.6}/><i/></span>
    <span className="me-brand-copy"><b>meu</b><strong>ESPETINHO</strong><small>gestão que dá gosto</small></span>
  </div>;
}
