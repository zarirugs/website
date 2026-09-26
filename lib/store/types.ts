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

export type CustomerOrderItem = {
  sku: string;
  name: string;
  quantity: number;
};

export type CustomerOrder = {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryAddress: string | null;
  items: CustomerOrderItem[];
};

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

export type WishlistItem = {
  sku: string;
  name: string;
  collection: string;
  description: string | null;
  imageUrl: string | null;
  pricePaise: number | null;
  stock: number;
  isActive: boolean;
};
