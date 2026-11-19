import { getCatalog } from "@/lib/server/catalog";
import { CatalogProvider } from "@/lib/store/use-catalog";
import { Hero } from "@/components/home";
import { Navbar } from "@/components/navigation";

import {
  Shop,
  AtelierImage,
  Philosophy,
  Footer,
  OrderEnquiry,
} from "@/components/sections";

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const catalog = await getCatalog().catch(() => null);
  return (
    <>
      <Navbar />


      <CatalogProvider initialCatalog={catalog}><main>
        <Hero />
        <Shop headingLink />
        <AtelierImage />
        <Philosophy />
        <OrderEnquiry />
      </main></CatalogProvider>
      
      <Footer />
    </>
  );
}
