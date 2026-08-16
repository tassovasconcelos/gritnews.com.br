import { supabase } from './lib/supabase';
import type { AppState, Order, OrderItem, Product, Settings } from './store';

export type CustomerCredit = {
  id: string;
  name: string;
  phone: string;
  creditEnabled: boolean;
  creditLimit: number | null;
  balance: number;
};

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
  const [tenantRes, categoriesRes, productsRes, ordersRes, itemsRes, customersRes] = await Promise.all([
    supabase.from('tenants').select('name,address,phone,logo_url').eq('id', tenantId).single(),
    supabase.from('categories').select('id,name').eq('tenant_id', tenantId),
    supabase.from('products').select('id,category_id,name,price,active').eq('tenant_id', tenantId).order('created_at'),
    supabase.from('orders').select('id,label,status,opened_at,customer_id').eq('tenant_id', tenantId).order('opened_at', { ascending: false }),
    supabase.from('order_items').select('order_id,product_id,product_name,unit_price,quantity').eq('tenant_id', tenantId),
    supabase.from('customers').select('id,name,phone').eq('tenant_id', tenantId),
  ]);
  if (tenantRes.error || productsRes.error || ordersRes.error || itemsRes.error) return null;
  const categoryMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.name]));
  const customerMap = new Map((customersRes.data || []).map((c: any) => [c.id, c]));
  const products: Product[] = (productsRes.data || []).map((p: any) => ({
    id: p.id, name: p.name, price: Number(p.price), category: categoryMap.get(p.category_id) || 'Outros', active: Boolean(p.active),
  }));
  const items = itemsRes.data || [];
  const orders: Order[] = (ordersRes.data || []).map((o: any) => {
    const customer = o.customer_id ? customerMap.get(o.customer_id) : null;
    return {
      id: o.id,
      label: o.label,
      customer: customer?.name || o.label,
      customerId: customer?.id,
      customerPhone: customer?.phone || undefined,
      source: customer ? 'customer' : o.label.toLowerCase().startsWith('mesa ') ? 'table' : 'free',
      openedAt: o.opened_at,
      status: o.status === 'closed' ? 'paid' : 'open',
      items: items.filter((i: any) => i.order_id === o.id).map((i: any) => ({ productId: i.product_id || `legacy-${o.id}-${i.product_name}`, name: i.product_name, qty: Number(i.quantity), unitPrice: Number(i.unit_price) })),
    } as Order;
  });
  const tenant = tenantRes.data as any;
  return {
    onboarded: true,
    settings: { businessName: tenant.name || 'Meu Espetinho', address: tenant.address || '', whatsapp: tenant.phone || '', logoUrl: tenant.logo_url || undefined },
    products,
    orders,
  };
}

export async function listCustomersWithCredit(tenantId: string): Promise<CustomerCredit[]> {
  if (!supabase) return [];
  const [customers, accounts, entries] = await Promise.all([
    supabase.from('customers').select('id,name,phone').eq('tenant_id', tenantId).order('name'),
    supabase.from('customer_credit_accounts').select('customer_id,enabled,credit_limit').eq('tenant_id', tenantId),
    supabase.from('customer_credit_entries').select('customer_id,entry_type,amount').eq('tenant_id', tenantId),
  ]);
  const accountMap = new Map((accounts.data || []).map((a: any) => [a.customer_id, a]));
  const balanceMap = new Map<string, number>();
  for (const e of entries.data || []) {
    const current = balanceMap.get((e as any).customer_id) || 0;
    const amount = Number((e as any).amount);
    balanceMap.set((e as any).customer_id, current + ((e as any).entry_type === 'charge' ? amount : (e as any).entry_type === 'payment' ? -amount : amount));
  }
  return (customers.data || []).map((c: any) => {
    const account = accountMap.get(c.id) as any;
    return { id: c.id, name: c.name, phone: c.phone || '', creditEnabled: Boolean(account?.enabled), creditLimit: account?.credit_limit == null ? null : Number(account.credit_limit), balance: Math.max(0, balanceMap.get(c.id) || 0) };
  });
}

export async function ensureCustomer(tenantId: string, name: string, phone: string): Promise<CustomerCredit | null> {
  if (!supabase || !name.trim()) return null;
  const normalizedPhone = phone.replace(/\D/g, '');
  let query = supabase.from('customers').select('id,name,phone').eq('tenant_id', tenantId).ilike('name', name.trim());
  if (normalizedPhone) query = query.eq('phone', normalizedPhone);
  const { data: existing } = await query.limit(1).maybeSingle();
  if (existing) return { id: existing.id, name: existing.name, phone: existing.phone || '', creditEnabled: false, creditLimit: null, balance: 0 };
  const { data, error } = await supabase.from('customers').insert({ tenant_id: tenantId, name: name.trim(), phone: normalizedPhone || null }).select('id,name,phone').single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, phone: data.phone || '', creditEnabled: false, creditLimit: null, balance: 0 };
}

export async function setCustomerCredit(tenantId: string, userId: string, customerId: string, enabled: boolean, creditLimit: number | null) {
  if (!supabase) return false;
  const { error } = await supabase.from('customer_credit_accounts').upsert({ tenant_id: tenantId, customer_id: customerId, enabled, credit_limit: creditLimit, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'customer_id' });
  return !error;
}

export async function receiveCustomerCredit(tenantId: string, userId: string, customerId: string, amount: number, paymentMethod: string) {
  if (!supabase || amount <= 0) return false;
  const { error } = await supabase.from('customer_credit_entries').insert({ tenant_id: tenantId, customer_id: customerId, entry_type: 'payment', amount, payment_method: paymentMethod, description: 'Baixa de conta fiada', created_by: userId });
  return !error;
}

export async function cloudCreateOrder(tenantId: string, userId: string, order: Order) {
  if (!supabase) return;
  await supabase.from('orders').insert({ id: order.id, tenant_id: tenantId, customer_id: order.customerId || null, label: order.label, status: 'open', subtotal: 0, total: 0, opened_by: userId, opened_at: order.openedAt });
}

export async function cloudSyncItem(tenantId: string, orderId: string, item: OrderItem | null, productId: string, orderTotal: number, userId: string) {
  if (!supabase) return;
  if (!item || item.qty <= 0) await supabase.from('order_items').delete().eq('tenant_id', tenantId).eq('order_id', orderId).eq('product_id', productId);
  else await supabase.from('order_items').upsert({ tenant_id: tenantId, order_id: orderId, product_id: item.productId, product_name: item.name, unit_price: item.unitPrice, quantity: item.qty, total: item.qty * item.unitPrice, created_by: userId }, { onConflict: 'order_id,product_id' });
  await supabase.from('orders').update({ subtotal: orderTotal, total: orderTotal }).eq('tenant_id', tenantId).eq('id', orderId);
}

export async function cloudCloseOrder(tenantId: string, userId: string, order: Order, amount: number, method: string) {
  if (!supabase) return false;
  const now = new Date().toISOString();
  const closed = await supabase.from('orders').update({ status: 'closed', subtotal: amount, total: amount, closed_by: userId, closed_at: now }).eq('tenant_id', tenantId).eq('id', order.id);
  if (closed.error) return false;
  if (method === 'fiado') {
    if (!order.customerId) return false;
    const { error } = await supabase.from('customer_credit_entries').insert({ tenant_id: tenantId, customer_id: order.customerId, order_id: order.id, entry_type: 'charge', amount, description: `Venda fiada - ${order.label}`, created_by: userId });
    return !error;
  }
  if (amount > 0) {
    const { error } = await supabase.from('payments_received').insert({ tenant_id: tenantId, order_id: order.id, method, amount, created_by: userId });
    return !error;
  }
  return true;
}

export async function cloudAddProduct(tenantId: string, product: Omit<Product, 'id'>): Promise<Product | null> {
  if (!supabase) return null;
  let { data: category } = await supabase.from('categories').select('id').eq('tenant_id', tenantId).eq('name', product.category).maybeSingle();
  if (!category) category = (await supabase.from('categories').insert({ tenant_id: tenantId, name: product.category }).select('id').single()).data;
  const { data, error } = await supabase.from('products').insert({ tenant_id: tenantId, category_id: category?.id || null, name: product.name, price: product.price, active: product.active }).select('id,name,price,active').single();
  if (error || !data) return null;
  return { id: data.id, name: data.name, price: Number(data.price), category: product.category, active: data.active };
}

export async function cloudSaveBusiness(tenantId: string, settings: Settings) {
  if (!supabase) return;
  await supabase.from('tenants').update({ name: settings.businessName, address: settings.address || null, phone: settings.whatsapp || null, logo_url: settings.logoUrl || null }).eq('id', tenantId);
}
