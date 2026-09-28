import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import ScrollIndicator from "./ScrollIndicator";
import { getSiteMedia, type SiteMedia } from "@/lib/server/site-media";

export default async function Hero() {
  let heroMedia: SiteMedia | undefined;
  try {
    heroMedia = (await getSiteMedia()).hero;
  } catch {
    heroMedia = undefined;
  }

  return (
    <section className="relative h-screen overflow-hidden">
      <HeroBackground media={heroMedia} />

      <div className="relative z-20 flex h-full items-center">
        <HeroContent />
      </div>

      <ScrollIndicator />
    </section>
  );
}
