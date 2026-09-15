import { Navbar } from "@/components/navigation";
import { Footer, Shop } from "@/components/sections";
import styles from "./page.module.css";

export default function ShopPage() {
  return (
    <>
      <Navbar surface="solid" />
      <main className={styles.page}>
        <Shop headingAs="h1" />
      </main>
      <Footer />
    </>
  );
}
