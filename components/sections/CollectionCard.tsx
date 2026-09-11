import Image from "next/image";
import Link from "next/link";
import { Collection } from "@/lib/data/collections";
import { Heading, Text } from "@/components/typography";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const externalImage = /^https?:\/\//.test(collection.image);
  const destination = collection.slug ? `/collections/${collection.slug}` : "#order";
  const index = String(collection.id).padStart(2, "0");

  return (
    <article className="group cursor-pointer">
      <div className="relative w-full aspect-[5/6] overflow-hidden rounded-sm bg-[#f4f1eb]">
        {externalImage ? (
          <div
            role="img"
            aria-label={collection.title}
            className={`${collection.imageFit === "contain" ? "bg-contain" : "bg-cover"} h-full w-full bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.015]`}
            style={{ backgroundImage: `url(${collection.image})` }}
          />
        ) : <Image
          src={collection.image}
          alt={collection.title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
          className={`${collection.imageFit === "cover" ? "object-cover" : "object-contain"} transition-transform duration-[1.2s] ease-out group-hover:scale-[1.015]`}
        />}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/10" />
        <p className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.28em] text-white/85">{index}</p>
      </div>

      <div className="mt-6 border-t border-black/10 pt-5 lg:mt-7">
        <Heading as="h3" size="md" className="text-[1.65rem] leading-none transition-colors duration-300 group-hover:text-[#9d8655] lg:text-[2rem]">
          {collection.title}
        </Heading>

        <Text size="sm" className="mt-3 max-w-xs text-neutral-500 leading-relaxed">
          {collection.subtitle}
        </Text>

        <div className="mt-6">
          <Link href={destination} className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.26em] transition-all duration-300 group-hover:gap-5 group-hover:text-[#9d8655] text-neutral-700">View collection <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </article>
  );
}