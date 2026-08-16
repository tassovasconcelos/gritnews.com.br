import { supabase } from './lib/supabase';
import type { AppState, Order, OrderItem, Product, Settings } from './store';

const DEFAULT_PRODUCTS = [
  { name: 'Carne', price: 10, category: 'Espetinhos' },
  { name: 'Frango', price: 8, category: 'Espetinhos' },
  { name: 'Linguiça', price: 8, category: 'Espetinhos' },
  { name: 'Cerveja', price: 8, category: 'Bebidas' },
  { name: 'Refrigerante', price: 6, category: 'Bebidas' },
];

async function ensureSeedProducts(tenantId: string) {
  if (!supabase) return;
  const { data: existing } = await supabase.from('products').select('id').eq('tenant_id', tenantId).limit(1);
  if (existing?.length) return;

  const categoryNames = ['Espetinhos', 'Bebidas', 'Acompanhamentos', 'Outros'];
  const { data: currentCategories } = await supabase.from('categories').select('id,name').eq('tenant_id', tenantId);
  const categories = [...(currentCategories || [])] as { id: string; name: string }[];
  for (let i = 0; i < categoryNames.length; i++) {
    const name = categoryNames[i];
    if (categories.some(c => c.name === name)) continue;
    const { data } = await supabase.from('categories').insert({ tenant_id: tenantId, name, sort_order: i }).select('id,name').single();
    if (data) categories.push(data as { id: string; name: string });
  }

  await supabase.from('products').insert(DEFAULT_PRODUCTS.map(product => ({
    tenant_id: tenantId,
    category_id: categories.find(c => c.name === product.category)?.id || null,
    name: product.name,
    price: product.price,
    active: true,
  })));
}

export async function hydrateCloudState(tenantId: string): Promise<AppState | null> {
  if (!supabase) return null;
  await ensureSeedProducts(tenantId);
  const [tenantRes, categoriesRes, productsRes, ordersRes, itemsRes] = await Promise.all([
    supabase.from('tenants').select('name,address,phone,logo_url').eq('id', tenantId).single(),
    supabase.from('categories').select('id,name').eq('tenant_id', tenantId),
    supabase.from('products').select('id,category_id,name,price,active').eq('tenant_id', tenantId).order('created_at'),
    supabase.from('orders').select('id,label,status,opened_at').eq('tenant_id', tenantId).order('opened_at', { ascending: false }),
    supabase.from('order_items').select('order_id,product_id,product_name,unit_price,quantity').eq('tenant_id', tenantId),
  ]);
  if (tenantRes.error || productsRes.error || ordersRes.error || itemsRes.error) return null;

  const categoryMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.name]));
  const products: Product[] = (productsRes.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    category: categoryMap.get(p.category_id) || 'Outros',
    active: Boolean(p.active),
  }));
  const items = itemsRes.data || [];
  const orders: Order[] = (ordersRes.data || []).map((o: any) => ({
    id: o.id,
    label: o.label,
    customer: o.label,
    openedAt: o.opened_at,
    status: o.status === 'closed' ? 'paid' : 'open',
    items: items.filter((i: any) => i.order_id === o.id).map((i: any) => ({
      productId: i.product_id || `legacy-${o.id}-${i.product_name}`,
      name: i.product_name,
      qty: Number(i.quantity),
      unitPrice: Number(i.unit_price),
    })),
  }));
  const tenant = tenantRes.data as any;
  return {
    onboarded: true,
    settings: {
      businessName: tenant.name || 'Meu Espetinho',
      address: tenant.address || '',
      whatsapp: tenant.phone || '',
      logoUrl: tenant.logo_url || undefined,
    },
    products,
    orders,
  };
}

export async function cloudCreateOrder(tenantId: string, userId: string, order: Order) {
  if (!supabase) return;
  await supabase.from('orders').insert({
    id: order.id,
    tenant_id: tenantId,
    label: order.label,
    status: 'open',
    subtotal: 0,
    total: 0,
    opened_by: userId,
    opened_at: order.openedAt,
  });
}

export async function cloudSyncItem(tenantId: string, orderId: string, item: OrderItem | null, productId: string, orderTotal: number, userId: string) {
  if (!supabase) return;
  if (!item || item.qty <= 0) {
    await supabase.from('order_items').delete().eq('tenant_id', tenantId).eq('order_id', orderId).eq('product_id', productId);
  } else {
    await supabase.from('order_items').upsert({
      tenant_id: tenantId,
      order_id: orderId,
      product_id: item.productId,
      product_name: item.name,
      unit_price: item.unitPrice,
      quantity: item.qty,
      total: item.qty * item.unitPrice,
      created_by: userId,
    }, { onConflict: 'order_id,product_id' });
  }
  await supabase.from('orders').update({ subtotal: orderTotal, total: orderTotal }).eq('tenant_id', tenantId).eq('id', orderId);
}

export async function cloudCloseOrder(tenantId: string, userId: string, order: Order, amount: number, method: string) {
  if (!supabase) return;
  const now = new Date().toISOString();
  await supabase.from('orders').update({
    status: 'closed',
    subtotal: amount,
    total: amount,
    closed_by: userId,
    closed_at: now,
  }).eq('tenant_id', tenantId).eq('id', order.id);
  if (amount > 0) await supabase.from('payments_received').insert({
    tenant_id: tenantId,
    order_id: order.id,
    method,
    amount,
    created_by: userId,
  });
}

export async function cloudAddProduct(tenantId: string, product: Omit<Product, 'id'>): Promise<Product | null> {
  if (!supabase) return null;
  let { data: category } = await supabase.from('categories').select('id').eq('tenant_id', tenantId).eq('name', product.category).maybeSingle();
  if (!category) {
    const created = await supabase.from('categories').insert({ tenant_id: tenantId, name: product.category }).select('id').single();
    category = created.data;
  }
  const { data, error } = await supabase.from('products').insert({
    tenant_id: tenantId,
    category_id: category?.id || null,
    name: product.name,
    price: product.price,
    active: product.active,
  }).select('id,name,price,active').single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, price: Number(data.price), category: product.category, active: data.active };
}

export async function cloudSaveBusiness(tenantId: string, settings: Settings) {
  if (!supabase) return;
  await supabase.from('tenants').update({
    name: settings.businessName,
    address: settings.address || null,
    phone: settings.whatsapp || null,
    logo_url: settings.logoUrl || null,
  }).eq('id', tenantId);
}
