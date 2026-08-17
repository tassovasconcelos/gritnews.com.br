export type Product = { id: string; name: string; price: number; category: string; active: boolean; stockQty?: number };
export type OrderItem = { productId: string; name: string; qty: number; unitPrice: number; createdAt?: string };
export type OrderSource = 'table' | 'customer' | 'free';
export type Order = {
  id: string;
  label: string;
  customer?: string;
  customerId?: string;
  customerPhone?: string;
  source?: OrderSource;
  assignedTo?: string;
  assignedName?: string;
  openedBy?: string;
  openedByName?: string;
  closedBy?: string;
  closedByName?: string;
  openedAt: string;
  items: OrderItem[];
  status: 'open' | 'paid';
};
export type Settings = { businessName: string; address: string; whatsapp: string; logoUrl?: string };

const LEGACY_KEY = 'meu-espetinho-v1';
const ACTIVE_TENANT_KEY = 'meu-espetinho-active-tenant';

export type AppState = {
  onboarded: boolean;
  settings: Settings;
  products: Product[];
  orders: Order[];
};

const initial: AppState = {
  onboarded: false,
  settings: { businessName: 'Meu Espetinho', address: '', whatsapp: '' },
  products: [
    { id: 'carne', name: 'Carne', price: 10, category: 'Espetinhos', active: true, stockQty: 0 },
    { id: 'frango', name: 'Frango', price: 8, category: 'Espetinhos', active: true, stockQty: 0 },
    { id: 'linguica', name: 'Linguiça', price: 8, category: 'Espetinhos', active: true, stockQty: 0 },
    { id: 'cerveja', name: 'Cerveja', price: 8, category: 'Bebidas', active: true, stockQty: 0 },
    { id: 'refrigerante', name: 'Refrigerante', price: 6, category: 'Bebidas', active: true, stockQty: 0 },
  ],
  orders: [],
};

function storageKey() {
  try {
    const tenantId = sessionStorage.getItem(ACTIVE_TENANT_KEY);
    return tenantId ? `${LEGACY_KEY}:${tenantId}` : null;
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  try {
    const key = storageKey();
    if (!key) return initial;
    const raw = localStorage.getItem(key);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

export function saveState(state: AppState) {
  try {
    const key = storageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Cache local é apenas contingência; a nuvem continua sendo a fonte oficial.
  }
}
