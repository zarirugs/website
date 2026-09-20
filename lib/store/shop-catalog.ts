export type ShopProduct = {
  sku: string;
  name: string;
  description: string | null;
  categorySlug: string;
  image: string;
  backgroundColor?: string | null;
  imageFit?: "contain" | "cover";
  pricePaise: number | null;
  stock: number;
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  weave?: string | null;
  createdAt?: string;
  popularity?: number;
};

export type ShopFilters = Record<"size" | "color" | "material" | "weave" | "price", string[]>;
export const emptyFilters: ShopFilters = { size: [], color: [], material: [], weave: [], price: [] };
export type ShopSort = "featured" | "price-asc" | "price-desc" | "popular" | "newest";
export const filterOptions: Record<keyof ShopFilters, string[]> = {
  size: ["3 × 5 ft", "4 × 6 ft", "5 × 8 ft", "6 × 9 ft", "8 × 10 ft", "9 × 12 ft", "Custom size"],
  color: ["Ivory", "Beige", "Brown", "Blue", "Green", "Red", "Grey", "Multicolor"],
  material: ["Wool", "Silk", "Wool & silk", "Cotton", "Jute"],
  weave: ["Hand-knotted", "Hand-tufted", "Flatweave"],
  price: ["Under ₹50,000", "₹50,000 – ₹1,00,000", "₹1,00,000 and above", "Price on request"],
};
export function productMatches(product: ShopProduct, filters: ShopFilters) {
  const fields = { size: product.sizes ?? [], color: product.colors ?? [], material: product.materials ?? [], weave: product.weave ? [product.weave] : [] };
  return (Object.keys(fields) as Array<keyof typeof fields>).every((key) => !filters[key].length || filters[key].some((value) => fields[key].includes(value))) &&
    (!filters.price.length || filters.price.some((value) => {
      const price = product.pricePaise;
      if (value === "Price on request") return price === null;
      if (price === null) return false;
      if (value === "Under ₹50,000") return price < 5000000;
      if (value === "₹50,000 – ₹1,00,000") return price >= 5000000 && price < 10000000;
      return price >= 10000000;
    }));
}
export function sortProducts(products: ShopProduct[], sort: ShopSort) {
  return [...products].sort((a, b) => {
    if (sort === "price-asc" || sort === "price-desc") {
      if (a.pricePaise === null) return b.pricePaise === null ? 0 : 1;
      if (b.pricePaise === null) return -1;
      return (a.pricePaise - b.pricePaise) * (sort === "price-asc" ? 1 : -1);
    }
    if (sort === "popular") return (b.popularity ?? 0) - (a.popularity ?? 0);
    if (sort === "newest") return (Date.parse(b.createdAt ?? "") || 0) - (Date.parse(a.createdAt ?? "") || 0);
    return 0;
  });
}
export function formatPrice(value: number | null) {
  return value === null ? "Price on request" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}
