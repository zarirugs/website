import { Hero } from "@/components/home";
import { Navbar } from "@/components/navigation";

import {
  Collections,
  Philosophy,
  Projects,
  Footer,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Collections />
        <Philosophy />
        {/* <Projects /> */}
      </main>
      
      <Footer />
    </>
  );
}
