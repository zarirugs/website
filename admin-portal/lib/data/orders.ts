export const orderStages = [
  "new",
  "payment_pending",
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStage = (typeof orderStages)[number];

export const stockCommittedStages = new Set<OrderStage>([
  "paid",
  "in_production",
  "shipped",
  "delivered",
]);

export function displayOrderStage(stage: string) {
  return stage.replaceAll("_", " ");
}
