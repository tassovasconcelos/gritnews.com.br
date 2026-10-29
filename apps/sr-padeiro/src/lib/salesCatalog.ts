type CatalogProduct = { id: string; active: boolean; fulfillment: string; sale_price: number };
type StockRow = { store_id: string; product_id: string; quantity: number };
export function storeInventory<T extends StockRow>(inventory: T[], storeId: string | null) {
  return inventory.filter(row => row.store_id === storeId);
}
export function saleCatalog<T extends CatalogProduct>(products: T[]) {
  return products.filter(p => p.active && ['pronta_entrega', 'encomenda'].includes(p.fulfillment) && Number(p.sale_price) > 0);
}
export function catalogReadiness(products: CatalogProduct[], inventory: StockRow[], storeId: string | null) {
  const sellable = saleCatalog(products);
  const stocked = new Set(storeInventory(inventory, storeId).filter(row => Number(row.quantity) > 0).map(row => row.product_id));
  return { total: products.length, inactive: products.filter(p => !p.active).length,
    pending: products.filter(p => p.fulfillment === 'confirmar').length,
    available: sellable.filter(p => stocked.has(p.id)).length,
    reason: !products.length ? 'empty' : !sellable.length ? 'release' : !sellable.some(p => stocked.has(p.id)) ? 'stock' : 'ready' };
}
