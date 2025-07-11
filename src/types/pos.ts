export interface HeldTransaction {
  id: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    discount: number;
  }[];
  customerId?: string;
  discount: number;
  createdAt: string;
  note?: string;
}

export interface POSState {
  heldTransactions: HeldTransaction[];
}