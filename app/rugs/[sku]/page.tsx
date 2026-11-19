import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/server/catalog";
import { productPath } from "@/lib/store/catalog";
import { formatPrice } from "@/lib/store/shop-catalog";
import { jsonLd, productSchema } from "@/lib/store/seo";
import { site } from "@/lib/data/site";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/sections";
import ProductGallery from "@/components/store/ProductGallery";
import ProductActions from "@/components/store/ProductActions";
import ProductView from "@/components/store/ProductView";

export const dynamic = "force-dynamic";
async function find(sku: string) { return (await getCatalog()).products.find((product) => product.sku.toLowerCase() === sku.toLowerCase()); }
export async function generateMetadata({ params }: { params: Promise<{ sku: string }> }): Promise<Metadata> {
  const product = await find((await params).sku);
  if (!product) return { title: "Rug not found", robots: { index: false } };
  return { title: product.name, description: product.description || `Explore ${product.name} from ZARI. Request dimensions, material details and a personal quotation.`, alternates: { canonical: productPath(product.sku) }, openGraph: { title: product.name, url: productPath(product.sku), images: product.image ? [{ url: product.image, alt: product.name }] : [] } };
}
export default async function RugPage({ params }: { params: Promise<{ sku: string }> }) {
  const product = await find((await params).sku);
  if (!product) notFound();
  const collection = (await getCatalog()).collections.find((item) => item.slug === product.categorySlug);
  const breadcrumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Shop", item: site.url + "/shop" }, { "@type": "ListItem", position: 2, name: product.name, item: site.url + productPath(product.sku) }] };
  return <><Navbar surface="solid" /><main id="main-content" className="min-h-screen bg-white px-[var(--page-gutter)] pb-24 pt-32 text-neutral-900 md:pt-40">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productSchema(product)) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
    <ProductView sku={product.sku} />
    <nav aria-label="Breadcrumb" className="mb-8 flex gap-3 text-xs text-neutral-500"><Link href="/shop">Shop</Link><span aria-hidden="true">/</span><Link href={`/collections/${product.categorySlug}`}>{collection?.title ?? product.categorySlug}</Link></nav>
    <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-20">
      <ProductGallery product={product} />
      <section><p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{collection?.title ?? "ZARI"}</p><h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl leading-tight md:text-5xl">{product.name}</h1><p className="mt-6 leading-relaxed text-neutral-600">{product.description}</p><p className="mt-6 text-lg">{formatPrice(product.pricePaise)}</p>
        <dl className="mt-8 grid gap-5 border-y border-neutral-200 py-6 text-sm">{[["Reference", product.sku], ["Size", product.sizes?.join(", ") || "Confirm dimensions with our atelier"], ["Material", product.materials?.join(", ") || "Confirm materials with our atelier"], ["Weave", product.weave || "Confirm construction with our atelier"], ["Availability", product.stock > 0 ? "Availability confirmed with your request" : "Enquire about a commission"]].map(([label, value]) => <div key={label} className="grid grid-cols-[6rem_1fr] gap-5"><dt className="text-neutral-500">{label}</dt><dd>{value}</dd></div>)}</dl>
        <ProductActions sku={product.sku} name={product.name} stock={product.stock} />
        <p className="mt-6 text-sm leading-relaxed text-neutral-500">Our concierge confirms your piece, quotation and delivery before you finalise an order.</p>
        <Link href="/buying-guide" className="mt-5 inline-block text-sm underline underline-offset-4">Sizing, care and ordering guide</Link>
      </section>
    </div>
    <section className="mt-20 grid gap-8 border-t border-neutral-200 pt-10 md:grid-cols-3">{[["Made for your room", "Share your room dimensions, furniture layout and preferred palette with our atelier."], ["Delivery & timing", "Request the dispatch estimate, shipping charges and destination availability for your chosen piece."], ["Care & returns", "Ask for fibre-specific care instructions and the return or cancellation terms for your selection before confirming."]].map(([title, copy]) => <div key={title}><h2 className="font-[family-name:var(--font-display)] text-2xl">{title}</h2><p className="mt-4 text-sm leading-relaxed text-neutral-600">{copy}</p></div>)}</section>
  </main><Footer /></>;
}
