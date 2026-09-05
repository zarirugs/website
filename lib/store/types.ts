export type Customer = {
  id: string;
  email: string;
  fullName: string;
};

export type CartItem = {
  sku: string;
  name: string;
  collection: string;
  quantity: number;
  availableStock: number;
};

export type Cart = {
  items: CartItem[];
  itemCount: number;
};
