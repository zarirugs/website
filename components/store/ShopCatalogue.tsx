"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/lib/store/use-catalog";
import { emptyFilters, filterOptions, formatPrice, productMatches, sortProducts, type ShopFilters, type ShopProduct, type ShopSort } from "@/lib/store/shop-catalog";
import { site } from "@/lib/data/site";
import styles from "./ShopCatalogue.module.css";

function RugImage({ src, alt, eager = false, fit = "cover" }: { src: string; alt: string; eager?: boolean; fit?: "cover" | "contain" }) {
  const [failed, setFailed] = useState(false);
  // Local R2 has no published photography; use the same public brand assets in development.
  const imageSrc = process.env.NODE_ENV === "development" && src.startsWith("/api/media/media-default-") ? `${site.url}${src}` : src;
  // Catalog images may come from the administrator's own media hosts.
  // eslint-disable-next-line @next/next/no-img-element
  return failed || !src ? <div className={styles.imageUnavailable}>Photograph coming soon</div> : <img src={imageSrc} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" style={{ objectFit: fit }} onError={() => setFailed(true)} />;
}

const colorHex: Record<string, string> = { Ivory: "#f0eade", Beige: "#cbbb9b", Brown: "#785943", Blue: "#768c99", Green: "#7d8668", Red: "#9d5448", Grey: "#a19e97", Multicolor: "linear-gradient(135deg,#a05843,#d6bf8a,#7d8d93)" };
const filterLabels = { size: "Size", color: "Color", material: "Material", price: "Price", weave: "Weave type" };

export default function ShopCatalogue() {
  const { collections, products } = useCatalog();
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState<ShopFilters>(emptyFilters);
  const [sort, setSort] = useState<ShopSort>("featured");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<1 | 2 | 3>(1);
  const filterDialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selectedCount = Object.values(filters).flat().length;
  const categoryProducts = useMemo(() => products.filter((p) => (category === "all" || p.categorySlug === category) && `${p.name} ${p.description ?? ""} ${p.sku}`.toLowerCase().includes(query.trim().toLowerCase())), [products, category, query]);
  const visible = useMemo(() => sortProducts(categoryProducts.filter((p) => productMatches(p, filters)), sort), [categoryProducts, filters, sort]);

  useEffect(() => {
    if (!selected) return;
    dialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [selected]);

  useEffect(() => {
    if (!filtersOpen) return;
    filterDialog.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [filtersOpen]);

  function closeFilters() { filterDialog.current?.close(); setFiltersOpen(false); }

  function toggleFilter(key: keyof ShopFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((v) => v !== value) : [...current[key], value] }));
  }
  function reset() { setFilters(emptyFilters); setCategory("all"); setQuery(""); }
  function closeDialog() { dialog.current?.close(); setSelected(null); }

  return (
    <div className={styles.shop}>
      <header className={styles.intro}>
        <div className={styles.headingRow}><h1 id="shop-title">Rugs</h1><label className={styles.search}><Search size={16} strokeWidth={1.3} /><input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the collection" aria-label="Search rugs" />{query && <button aria-label="Clear search" onClick={() => { setQuery(""); search.current?.focus(); }}><X size={15} /></button>}</label></div>
        <p>Expressions of craft. Made to be lived with.</p>
      </header>
      <nav className={styles.categoryNav} aria-label="Rug collections">
        <button onClick={() => setCategory("all")} aria-pressed={category === "all"}>View all</button>
        {collections.filter((c) => c.slug).map((collection) => <button key={collection.id} onClick={() => setCategory(collection.slug!)} aria-pressed={category === collection.slug}>{collection.title}</button>)}
        <a href={`mailto:${site.email}`}>Find your rug <ArrowUpRight size={13} /></a>
      </nav>
      <section className={styles.categories} aria-label="Explore collections">
        <div className={styles.categoryGrid}>
          {collections.filter((c) => c.slug).map((collection, index) => <button key={collection.id} className={`${styles.categoryCard} ${category === collection.slug ? styles.categorySelected : ""}`} onClick={() => setCategory(category === collection.slug ? "all" : collection.slug!)} aria-pressed={category === collection.slug}>
            <div className={styles.categoryImage}><RugImage src={collection.image} alt={`${collection.title} collection`} eager /></div>
            <span className={styles.categoryText}>{collection.title}<small>0{index + 1}</small></span>
          </button>)}
        </div>
        <div className={styles.categoryNote}><span>THE ZARI COLLECTION</span><p>Woven by hand.<br />Chosen by you.</p></div>
      </section>

      <section id="all-rugs" className={styles.catalogue} aria-label="Shop rugs">
        <div className={styles.toolbar}>
          <div className={styles.results} aria-live="polite">{category === "all" ? "All rugs" : collections.find((c) => c.slug === category)?.title}<span>{visible.length} {visible.length === 1 ? "piece" : "pieces"}</span></div>
          <div className={styles.viewControls} aria-label="Product layout"><span>VIEW</span>{([1, 2, 3] as const).map((layout) => <button key={layout} onClick={() => setView(layout)} aria-pressed={view === layout} aria-label={layout === 1 ? "Editorial view" : `${layout} column view`}>{layout}</button>)}</div>
        </div>
        {(selectedCount > 0 || category !== "all" || query) && <div className={styles.activeFilters}>{category !== "all" && <button onClick={() => setCategory("all")}>{collections.find((c) => c.slug === category)?.title}<X size={12} /></button>}{Object.entries(filters).flatMap(([key, values]) => values.map((value) => <button key={`${key}-${value}`} onClick={() => toggleFilter(key as keyof ShopFilters, value)} aria-label={`Remove ${value} filter`}>{value}<X size={12} /></button>))}<button className={styles.clearAll} onClick={reset}>Clear all</button></div>}
        {visible.length ? <div className={styles.productGrid} data-view={view} data-editorial={view === 1 && category === "all" && !selectedCount && !query}>
          {view === 1 && category === "all" && !selectedCount && !query && <div className={styles.campaign}><RugImage src="/api/media/media-default-hero" alt="A quiet moment on a handwoven ZARI rug" eager /><div className={styles.campaignCopy}><span>THE ART OF EVERYDAY LIVING</span><h2>Quietly extraordinary.</h2><Link href="/collections/heritage">Explore Heritage <ArrowRight size={17} strokeWidth={1.2} /></Link></div></div>}
          {visible.map((product, index) => <article key={product.sku} className={styles.productCard}>
          <button className={styles.productImage} onClick={() => setSelected(product)} aria-label={`Quick view: ${product.name}`} style={{ background: product.backgroundColor ?? undefined }}>
            <RugImage src={product.image} alt={product.name} fit={product.imageFit} eager={index < 3} />
          </button>
          <div className={styles.productInfo}>
            <p className={styles.productCollection}>{collections.find((c) => c.slug === product.categorySlug)?.title ?? "ZARI"}</p>
            <h3><button onClick={() => setSelected(product)}>{product.name.replace(/ — /g, " · ")}</button></h3>
            <p className={styles.productPrice}>{formatPrice(product.pricePaise)}</p>
            <button className={styles.productPlus} onClick={() => setSelected(product)} aria-label={`Details: ${product.name}`}><Plus size={19} strokeWidth={1} /></button>
          </div>
        </article>)}</div> : <div className={styles.empty}><Search size={28} strokeWidth={1} /><h3>A different combination, perhaps?</h3><p>No pieces match this selection. Try fewer filters, or let our atelier help you find the right rug.</p><button onClick={reset}>Explore all rugs <ArrowRight size={16} /></button></div>}
        <p className={styles.collectionEnd}>You’ve viewed {visible.length} of {products.length} pieces</p>
      </section>
      <section className={styles.bespoke}><span>THE BESPOKE ATELIER</span><h2>A rug, entirely your own.</h2><p>A particular size. A personal palette. A new perspective.</p><Link href="/collections/bespoke">Create with us <ArrowUpRight size={15} /></Link></section>
      <button className={styles.floatingFilter} onClick={() => setFiltersOpen(true)} aria-haspopup="dialog"><SlidersHorizontal size={17} strokeWidth={1.3} />Filter &amp; Sort{selectedCount > 0 && <span>{selectedCount}</span>}</button>
      <dialog ref={filterDialog} className={styles.filterDialog} onCancel={closeFilters} onClose={() => setFiltersOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) closeFilters(); }} aria-labelledby="filter-title">
        <div className={styles.filterPanel}>
          <header className={styles.filterHeader}><h2 id="filter-title">Filter &amp; Sort</h2><button autoFocus onClick={closeFilters} aria-label="Close filters"><X size={22} strokeWidth={1.3} /></button></header>
          <div className={styles.filterBody}>
            <label className={styles.sort}><span>Sort by</span><select aria-label="Sort rugs" value={sort} onChange={(e) => setSort(e.target.value as ShopSort)}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="popular">Popularity</option><option value="newest">New arrivals</option></select></label>
            {(Object.keys(filterLabels) as Array<keyof ShopFilters>).map((key) => <details className={styles.filter} key={key}>
              <summary>{filterLabels[key]}{filters[key].length > 0 && ` (${filters[key].length})`}<ChevronDown size={15} strokeWidth={1.3} /></summary>
              <div className={styles.filterMenu}>{Array.from(new Set([...filterOptions[key], ...products.flatMap((p) => key === "size" ? p.sizes ?? [] : key === "color" ? p.colors ?? [] : key === "material" ? p.materials ?? [] : key === "weave" && p.weave ? [p.weave] : [])])).map((value) => {
                const count = categoryProducts.filter((p) => productMatches(p, { ...filters, [key]: [value] })).length;
                return <label key={value}><input type="checkbox" checked={filters[key].includes(value)} onChange={() => toggleFilter(key, value)} />{key === "color" && <span className={styles.swatch} style={{ background: colorHex[value] ?? "#ccc" }} />}<span>{value}</span><small>{count}</small></label>;
              })}</div>
            </details>)}
            <p className={styles.filterHint}>Only pieces with matching details are shown.</p>
          </div>
          <footer className={styles.filterFooter}><button onClick={() => setFilters(emptyFilters)}>Clear filters</button><button onClick={closeFilters}>View {visible.length} {visible.length === 1 ? "piece" : "pieces"}<ArrowRight size={16} /></button></footer>
        </div>
      </dialog>
      <dialog ref={dialog} className={styles.dialog} onCancel={closeDialog} onClose={() => setSelected(null)} onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }} aria-labelledby="quick-view-title">
        {selected && <div className={styles.dialogContent}><button autoFocus className={styles.closeDialog} onClick={closeDialog} aria-label="Close quick view"><X size={22} /></button><div className={styles.dialogImage}><RugImage src={selected.image} alt={selected.name} eager fit={selected.imageFit} /></div><div className={styles.dialogInfo}><p className={styles.eyebrow}>{selected.categorySlug} COLLECTION</p><h2 id="quick-view-title">{selected.name}</h2><p>{selected.description}</p><strong>{formatPrice(selected.pricePaise)}</strong><dl><div><dt>Size</dt><dd>{selected.sizes?.join(", ") || "Ask our atelier"}</dd></div><div><dt>Material</dt><dd>{selected.materials?.join(", ") || "Ask our atelier"}</dd></div><div><dt>Weave</dt><dd>{selected.weave || "Ask our atelier"}</dd></div><div><dt>Reference</dt><dd>{selected.sku}</dd></div></dl><a className={styles.enquire} href={`mailto:${site.email}?subject=${encodeURIComponent(`Enquiry: ${selected.name} (${selected.sku})`)}`}>Enquire about this piece <ArrowUpRight size={18} /></a><Link className={styles.collectionLink} href={`/collections/${selected.categorySlug}`}>Explore the collection <ArrowRight size={15} /></Link><small>Our consultants can help with sizing, pricing and availability.</small></div></div>}
      </dialog>
    </div>
  );
}
