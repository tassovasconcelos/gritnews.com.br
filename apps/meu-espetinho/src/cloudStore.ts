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

export type OperationUser = {
  userId: string;
  name: string;
  role: 'owner' | 'manager' | 'attendant';
  active: boolean;
};

export type SeatSummary = {
  activeUsers: number;
  includedUsers: number;
  extraUsers: number;
  extraMonthlyAmount: number;
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

async function profileMapFor(ids: string[]) {
  if (!supabase || !ids.length) return new Map<string,string>();
  const { data } = await supabase.from('profiles').select('id,full_name').in('id', [...new Set(ids)]);
  return new Map((data || []).map((p:any)=>[p.id,p.full_name || 'Usuário']));
}

export async function hydrateCloudState(tenantId: string): Promise<AppState | null> {
  if (!supabase) return null;
  await ensureSeedProducts(tenantId);
  const [tenantRes, categoriesRes, productsRes, ordersRes, itemsRes, customersRes] = await Promise.all([
    supabase.from('tenants').select('name,address,phone,logo_url').eq('id', tenantId).single(),
    supabase.from('categories').select('id,name').eq('tenant_id', tenantId),
    supabase.from('products').select('id,category_id,name,price,active').eq('tenant_id', tenantId).order('created_at'),
    supabase.from('orders').select('id,label,status,opened_at,customer_id,assigned_to,opened_by,closed_by').eq('tenant_id', tenantId).order('opened_at', { ascending: false }),
    supabase.from('order_items').select('order_id,product_id,product_name,unit_price,quantity').eq('tenant_id', tenantId),
    supabase.from('customers').select('id,name,phone').eq('tenant_id', tenantId),
  ]);
  if (tenantRes.error || productsRes.error || ordersRes.error || itemsRes.error) return null;
  const categoryMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.name]));
  const customerMap = new Map((customersRes.data || []).map((c: any) => [c.id, c]));
  const userIds=(ordersRes.data||[]).flatMap((o:any)=>[o.assigned_to,o.opened_by,o.closed_by]).filter(Boolean) as string[];
  const names=await profileMapFor(userIds);
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
      assignedTo: o.assigned_to || undefined,
      assignedName: o.assigned_to ? names.get(o.assigned_to) : undefined,
      openedBy: o.opened_by || undefined,
      openedByName: o.opened_by ? names.get(o.opened_by) : undefined,
      closedBy: o.closed_by || undefined,
      closedByName: o.closed_by ? names.get(o.closed_by) : undefined,
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

export async function loadOperationUsers(tenantId:string):Promise<{users:OperationUser[];summary:SeatSummary}> {
  if(!supabase) return {users:[],summary:{activeUsers:0,includedUsers:3,extraUsers:0,extraMonthlyAmount:0}};
  const [tenantRes,membersRes]=await Promise.all([
    supabase.from('tenants').select('owner_user_id').eq('id',tenantId).single(),
    supabase.from('tenant_users').select('user_id,role,active').eq('tenant_id',tenantId)
  ]);
  const ownerId=(tenantRes.data as any)?.owner_user_id as string|undefined;
  const ids=[...(ownerId?[ownerId]:[]),...(membersRes.data||[]).map((m:any)=>m.user_id)];
  const names=await profileMapFor(ids);
  const users:OperationUser[]=[];
  if(ownerId) users.push({userId:ownerId,name:names.get(ownerId)||'Proprietário',role:'owner',active:true});
  for(const m of membersRes.data||[]) users.push({userId:(m as any).user_id,name:names.get((m as any).user_id)||'Usuário',role:(m as any).role==='manager'?'manager':'attendant',active:Boolean((m as any).active)});
  const activeUsers=users.filter(u=>u.active).length;
  return {users,summary:{activeUsers,includedUsers:3,extraUsers:Math.max(activeUsers-3,0),extraMonthlyAmount:Math.max(activeUsers-3,0)*39}};
}

export async function inviteOperationUser(tenantId:string,fullName:string,email:string,role:'manager'|'attendant') {
  if(!supabase) return {ok:false,error:'offline'};
  const {data,error}=await supabase.functions.invoke('invite-tenant-user',{body:{tenant_id:tenantId,full_name:fullName,email,role}});
  if(error) return {ok:false,error:error.message};
  if(data?.error) return {ok:false,error:data.error};
  return {ok:true,...data};
}

export async function assignOrder(tenantId:string,orderId:string,userId:string) {
  if(!supabase) return false;
  const {error}=await supabase.from('orders').update({assigned_to:userId}).eq('tenant_id',tenantId).eq('id',orderId);
  return !error;
}

export async function listOrderActivity(tenantId:string,orderId:string) {
  if(!supabase) return [];
  const {data}=await supabase.from('order_activity_logs').select('id,user_id,action,details,created_at').eq('tenant_id',tenantId).eq('order_id',orderId).order('created_at',{ascending:true});
  const names=await profileMapFor((data||[]).map((x:any)=>x.user_id).filter(Boolean));
  return (data||[]).map((x:any)=>({...x,userName:x.user_id?names.get(x.user_id)||'Usuário':'Sistema'}));
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
  await supabase.from('orders').insert({ id: order.id, tenant_id: tenantId, customer_id: order.customerId || null, label: order.label, status: 'open', subtotal: 0, total: 0, opened_by: userId, assigned_to:order.assignedTo||userId, opened_at: order.openedAt });
}

export async function cloudSyncItem(tenantId: string, orderId: string, item: OrderItem | null, productId: string, orderTotal: number, userId: string) {
  if (!supabase) return;
  if (!item || item.qty <= 0) await supabase.from('order_items').delete().eq('tenant_id', tenantId).eq('order_id', orderId).eq('product_id', productId);
  else await supabase.from('order_items').upsert({ tenant_id: tenantId, order_id: orderId, product_id: item.productId, product_name: item.name, unit_price: item.unitPrice, quantity: item.qty, total: item.qty * item.unitPrice, created_by: userId }, { onConflict: 'order_id,product_id' });
  await supabase.from('orders').update({ subtotal: orderTotal, total: orderTotal }).eq('tenant_id', tenantId).eq('id', orderId);
}

export async function cloudCloseOrder(tenantId: string, userId: string, order: Order, amount: number, method: string) {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('close_order_atomic', {
    p_tenant_id: tenantId,
    p_order_id: order.id,
    p_user_id: userId,
    p_amount: amount,
    p_method: method,
    p_customer_id: order.customerId || null,
  });
  if (error) {
    console.error('Falha no fechamento atômico da conta', error);
    return false;
  }
  return Boolean((data as any)?.ok);
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
