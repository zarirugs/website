import { getCatalog } from "@/lib/server/catalog";
import { CatalogProvider } from "@/lib/store/use-catalog";
import type { Metadata } from "next";
import { Navbar } from "@/components/navigation";
import { Footer, Shop } from "@/components/sections";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop Handwoven Rugs", alternates: { canonical: "/shop" }, description: "Explore Heritage, Contemporary and Bespoke rugs from ZARI. Find your piece by size, color, material and weave, crafted with care in Bhadohi, India." };

export default async function ShopPage() {
  const catalog = await getCatalog().catch(() => null);
  return (
    <>
      <Navbar surface="solid" />
      <CatalogProvider initialCatalog={catalog}><main className={styles.page}>
        <Shop headingAs="h1" variant="catalogue" />
      </main></CatalogProvider>
      <Footer />
    </>
  );
}
