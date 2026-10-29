import { useCallback, useEffect, useState } from 'react';
type Product = { id: string; name: string; variant: string; active: boolean; fulfillment: string; sale_price: number };
export function CatalogRelease({ client, scopeId, onDone }: { client: any; scopeId: string; onDone: () => void }) {
  const [products, setProducts] = useState<Product[]>([]), [selected, setSelected] = useState<string[]>([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const r = await client.from('srp_products').select('id,name,variant,active,fulfillment,sale_price').eq('organization_id', scopeId).order('name');
    if (r.error) throw r.error;
    setProducts(r.data || []); setSelected([]);
  }, [client, scopeId]);
  useEffect(() => { load().catch(() => setMessage('Não foi possível verificar os produtos.')); }, [load]);
  const eligible = products.filter(p => !p.active && ['pronta_entrega', 'encomenda'].includes(p.fulfillment) && Number(p.sale_price) > 0);
  async function release() {
    if (busy || !selected.length) return;
    setBusy(true); setMessage('');
    try {
      const r = await client.rpc('ops_release_products', { s: scopeId, ids: selected });
      if (r.error) throw r.error;
      setMessage(`${r.data} produtos liberados. Confira o saldo físico no estoque antes de vender.`);
      await load(); onDone();
    } catch { setMessage('Não foi possível liberar. Confira permissões, conexão e se preço e modalidade continuam válidos.'); }
    finally { setBusy(false); }
  }
  return <section className="ops-panel"><h2>Preparar produtos para venda</h2><p>{products.length} cadastrados · {products.filter(p => p.active).length} ativos · {products.filter(p => p.fulfillment === 'confirmar').length} com modalidade a confirmar</p><p>Confira preço e modalidade antes de liberar. Produtos sem saldo continuam indisponíveis para venda; esta ação não cria estoque.</p>{eligible.length > 0 && <><details><summary>Conferir {eligible.length} produtos inativos com modalidade definida</summary><div className="ops-actions"><button disabled={busy} onClick={() => setSelected(eligible.map(p => p.id))}>Selecionar os conferidos</button><button disabled={busy} onClick={() => setSelected([])}>Limpar seleção</button></div>{eligible.map(p => <label key={p.id} style={{ display: 'block' }}><input type="checkbox" disabled={busy} checked={selected.includes(p.id)} onChange={e => setSelected(old => e.target.checked ? [...old, p.id] : old.filter(id => id !== p.id))} /> {p.name} {p.variant} · {Number(p.sale_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {p.fulfillment === 'encomenda' ? 'Encomenda' : 'Pronta entrega'}</label>)}</details><button disabled={busy || !selected.length} onClick={release}>{busy ? 'Liberando…' : `Liberar ${selected.length} produtos conferidos`}</button></>}<p role="status">{message}</p></section>;
}
