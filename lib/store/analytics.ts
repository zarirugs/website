export type StoreEvent = "product_view" | "add_to_bag" | "enquiry_started" | "enquiry_submitted";
export function trackStoreEvent(event: StoreEvent, sku?: string) {
  if (typeof navigator === "undefined" || navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  void fetch("/api/store-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, sku }), keepalive: true }).catch(() => undefined);
}
