import type { Metadata } from "next";
import { Navbar } from "@/components/navigation";
import { Footer, Shop } from "@/components/sections";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Shop Handwoven Rugs", description: "Explore Heritage, Contemporary and Bespoke rugs from ZARI. Find your piece by size, color, material and weave, crafted with care in Bhadohi, India." };

export default function ShopPage() {
  return (
    <>
      <Navbar surface="solid" />
      <main className={styles.page}>
        <Shop headingAs="h1" variant="catalogue" />
      </main>
      <Footer />
    </>
  );
}
