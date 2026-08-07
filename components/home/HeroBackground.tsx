import Image from "next/image";

export default function HeroBackground() {
  return (
    <>
      <Image
        src="/images/hero.webp"
        alt="Luxury Interior"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
    </>
  );
}