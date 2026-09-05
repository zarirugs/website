import { Hero } from "@/components/home";
import { Navbar } from "@/components/navigation";

import {
  Collections,
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
        <Philosophy />
        <OrderEnquiry />
        {/* <Projects /> */}
      </main>
      
      <Footer />
    </>
  );
}
