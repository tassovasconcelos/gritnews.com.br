import { useEffect, useState } from 'react';
import type { OperationApp } from './SettingsPanel';

export function operationLinks(origin: string, scopeId: string) {
  const access = new URL('/app', origin);
  access.searchParams.set('operation_scope', scopeId);
  const install = new URL('/instalar', origin);
  install.searchParams.set('operation_scope', scopeId);
  return { access: access.href, install: install.href };
}

export function AccessLinks({ scopeId }: { scopeId: string }) {
  const links = operationLinks(location.origin, scopeId);
  const [message, setMessage] = useState('');
  return <section className="ops-panel ops-links"><h2>Acesso e instalação do cliente</h2><p>Compartilhe o acesso desta empresa. Cada pessoa entra com sua própria conta e precisa estar liberada na equipe.</p><div className="ops-link-grid">{[['Abrir operação', links.access, 'Vendas, caixa e rotina do negócio'], ['Instalar aplicativo', links.install, 'Um atalho na tela inicial do aparelho']].map(([label, url, description]) => <article key={label} className="ops-link-card"><strong>{label}</strong><p>{description}</p><label>Endereço para {label.toLowerCase()}<input readOnly value={url} onFocus={e => e.target.select()} /></label><div className="ops-actions"><a href={url}>{label} <span aria-hidden="true">↗</span></a><button onClick={() => navigator.clipboard.writeText(url).then(() => setMessage('Link copiado.')).catch(() => setMessage('Selecione e copie o endereço.'))}>Copiar link</button></div></article>)}</div><p role="status">{message}</p></section>;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export function InstallApp({ name }: { name: string }) {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(matchMedia('(display-mode: standalone)').matches);
  const [message, setMessage] = useState('');
  const scope = new URLSearchParams(location.search).get('operation_scope');
  const access = scope ? operationLinks(location.origin, scope).access : '/app';
  useEffect(() => {
    const ready = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent); };
    const done = () => { setInstalled(true); setEvent(null); };
    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', ready); window.removeEventListener('appinstalled', done); };
  }, []);
  return <main className="ops-panel ops-invite"><h1>{name} no seu aparelho</h1><p>Acesse vendas e sua operação pela tela inicial do celular ou computador.</p>{installed ? <p role="status">Aplicativo aberto no modo instalado.</p> : <><button className="ops-primary" disabled={!event} onClick={async () => { if (!event) return; try { await event.prompt(); const choice = await event.userChoice; setMessage(choice.outcome === 'accepted' ? 'Instalação solicitada ao navegador.' : 'Você pode instalar quando quiser.'); setEvent(null); } catch { setMessage('Use o menu do navegador para instalar.'); } }}>Instalar aplicativo</button><h2>Se o botão não estiver disponível</h2><p><b>Android ou computador:</b> abra o menu do Chrome ou Edge e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.</p><p><b>iPhone ou iPad:</b> abra no Safari, toque em Compartilhar e em “Adicionar à Tela de Início”.</p></>}<a href={access}>Entrar na minha operação</a><p>A instalação não libera uma conta. Peça ao responsável da empresa um convite de acesso. As operações de venda precisam de conexão.</p><p role="status">{message}</p></main>;
}

export function AssistedTeam({ client, app, scopeId, children }: { client: any; app: OperationApp; scopeId: string; children: React.ReactNode }) {
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { setReady(false); setMessage(''); }, [scopeId]);
  async function start() {
    setBusy(true);
    try {
      const r = await client.rpc('ops_start_support', { a: app, s: scopeId, reason: 'Gestão de equipe e liberação pela central do cliente' });
      if (r.error) throw r.error;
      setReady(true);
    } catch { setMessage('Central indisponível. Verifique se a atualização do banco foi publicada e se sua conta é Super Admin.'); }
    finally { setBusy(false); }
  }
  return ready ? <><div className="ops-panel"><p>Gestão assistida: sessão temporária e auditada, válida por até uma hora.</p><button onClick={async () => { const r = await client.rpc('ops_end_support', { a: app, s: scopeId }); if (r.error) setMessage('Não foi possível encerrar o suporte.'); else setReady(false); }}>Encerrar gestão assistida</button><p role="status">{message}</p></div>{children}</> : <section className="ops-panel"><h2>Central de usuários deste cliente</h2><p>Crie convites, veja as pessoas vinculadas e ative ou bloqueie o acesso em uma sessão de suporte registrada.</p><button disabled={busy} onClick={start}>{busy ? 'Abrindo…' : 'Gerenciar usuários e liberações'}</button><p role="status">{message}</p></section>;
}
