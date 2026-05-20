import { create } from 'zustand';
import { Order } from '../api/orders';

interface OrderState {
  activeOrder: Order | null;
  orders: Order[];
  setActiveOrder: (order: Order | null) => void;
  setOrders: (orders: Order[]) => void;
  updateOrder: (order: Order) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrder: null,
  orders: [],

  setActiveOrder: (order) => set({ activeOrder: order }),

  setOrders: (orders) => set({ orders }),

  updateOrder: (updated) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
      activeOrder: state.activeOrder?.id === updated.id ? updated : state.activeOrder,
    })),
}));
