import { site } from "@/lib/data/site";
import { productPath } from "./catalog";
import type { ShopProduct } from "./shop-catalog";
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function productSchema(product: ShopProduct) {
  return {
    "@context": "https://schema.org", "@type": "Product", name: product.name, sku: product.sku,
    url: site.url + productPath(product.sku), description: product.description || undefined,
    image: [product.image, ...(product.images ?? []).map((image) => image.url)].filter(Boolean).map((url) => new URL(url, site.url).href),
    brand: { "@type": "Brand", name: site.name },
    material: product.materials?.length ? product.materials.join(", ") : undefined,
    // Never describe an unpriced enquiry as a free product or invent reviews.
    ...(product.pricePaise !== null ? { offers: { "@type": "Offer", priceCurrency: "INR", price: product.pricePaise / 100, availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: site.url + productPath(product.sku) } } : {}),
  };
}
