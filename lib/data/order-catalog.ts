import type { PublicOrderItem } from "@/lib/inventory/types";

/**
 * These SKUs are seeded in db/migrations/0001_initial_schema.sql. Keep the
 * public enquiry choices aligned with the inventory items managed in /admin.
 */
export const orderCatalog: Array<PublicOrderItem & { description: string }> = [
  {
    sku: "ZAR-HER-001",
    name: "Heritage — hand-knotted rug",
    quantity: 1,
    description: "A timeless Persian-inspired hand-knotted piece.",
  },
  {
    sku: "ZAR-CON-001",
    name: "Contemporary — hand-knotted rug",
    quantity: 1,
    description: "A modern, minimal hand-knotted piece.",
  },
  {
    sku: "ZAR-BES-001",
    name: "Bespoke — consultation order",
    quantity: 1,
    description: "A made-to-measure commission with our atelier.",
  },
];
