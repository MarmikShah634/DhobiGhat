import { create } from 'zustand';
import { Order } from '../api/orders';

interface OrderState {
  pendingOrders: Order[];
  activeOrders: Order[];
  setPendingOrders: (orders: Order[]) => void;
  setActiveOrders: (orders: Order[]) => void;
  updateOrder: (order: Order) => void;
  removePending: (id: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  pendingOrders: [], activeOrders: [],
  setPendingOrders: (pendingOrders) => set({ pendingOrders }),
  setActiveOrders: (activeOrders) => set({ activeOrders }),
  updateOrder: (updated) =>
    set((s) => ({
      pendingOrders: s.pendingOrders.map((o) => o.id === updated.id ? updated : o),
      activeOrders: s.activeOrders.map((o) => o.id === updated.id ? updated : o),
    })),
  removePending: (id) =>
    set((s) => ({ pendingOrders: s.pendingOrders.filter((o) => o.id !== id) })),
}));
