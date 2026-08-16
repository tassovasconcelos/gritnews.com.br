export type Product = { id: string; name: string; price: number; category: string; active: boolean };
export type OrderItem = { productId: string; name: string; qty: number; unitPrice: number };
export type Order = { id: string; label: string; customer?: string; openedAt: string; items: OrderItem[]; status: 'open' | 'paid' };
export type Settings = { businessName: string; address: string; whatsapp: string; logoUrl?: string };

const KEY = 'meu-espetinho-v1';

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
    { id: 'carne', name: 'Carne', price: 10, category: 'Espetinhos', active: true },
    { id: 'frango', name: 'Frango', price: 8, category: 'Espetinhos', active: true },
    { id: 'linguica', name: 'Linguiça', price: 8, category: 'Espetinhos', active: true },
    { id: 'cerveja', name: 'Cerveja', price: 8, category: 'Bebidas', active: true },
    { id: 'refrigerante', name: 'Refrigerante', price: 6, category: 'Bebidas', active: true },
  ],
  orders: [],
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
