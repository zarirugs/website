import { Hero } from "@/components/home";
import { Navbar } from "@/components/navigation";

import {
  Shop,
  AtelierImage,
  Philosophy,
  Footer,
  OrderEnquiry,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      <Navbar />

{/* hello  */}
      <main>
        <Hero />
        <Shop />
        <AtelierImage />
        <Philosophy />
        <OrderEnquiry />
        {/* <Projects /> */}
      </main>
      
      <Footer />
    </>
  );
}
