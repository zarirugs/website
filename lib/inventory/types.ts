export const orderStatuses = [
  "new",
  "confirmed",
  "in_production",
  "ready",
  "fulfilled",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export interface InventoryItem {
  sku: string;
  name: string;
  collection: string;
  stock: number;
  reorderLevel: number;
  isActive: boolean;
  updatedAt: string;
}

export interface OrderLine {
  sku: string;
  name: string;
  quantity: number;
}

export interface OrderRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderLine[];
}

export interface PublicOrderItem {
  sku: string;
  name: string;
  quantity: number;
}
