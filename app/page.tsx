import { Hero } from "@/components/home";
import { Navbar } from "@/components/navigation";

import {
  Collections,
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
        <Collections />
        <AtelierImage />
        <Philosophy />
        <OrderEnquiry />
        {/* <Projects /> */}
      </main>
      
      <Footer />
    </>
  );
}
