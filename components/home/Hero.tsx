import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import ScrollIndicator from "./ScrollIndicator";

export default function Hero() {
  return (
    <section className="relative h-screen overflow-hidden">
      <HeroBackground />

      <div className="relative z-20 flex h-full items-center">
        <HeroContent />
      </div>

      <ScrollIndicator />
    </section>
  );
}