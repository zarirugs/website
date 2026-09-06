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

  return (
    <article className="group cursor-pointer">
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-sm bg-[#f4f1eb]">
        {externalImage ? (
          <div
            role="img"
            aria-label={collection.title}
            className={`${collection.imageFit === "contain" ? "bg-contain" : "bg-cover"} h-full w-full bg-center transition-transform duration-[2s] ease-out group-hover:scale-[1.02]`}
            style={{ backgroundImage: `url(${collection.image})` }}
          />
        ) : <Image
          src={collection.image}
          alt={collection.title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
          className={`${collection.imageFit === "cover" ? "object-cover" : "object-contain"} transition-transform duration-[2s] ease-out group-hover:scale-[1.02]`}
        />}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/10" />
      </div>

      <div className="mt-10 lg:mt-12">
        <Heading as="h3" size="md" className="transition-colors duration-300 group-hover:text-[#B89B5E]">
          {collection.title}
        </Heading>

        <Text size="sm" className="mt-4 max-w-xs text-neutral-500 leading-relaxed">
          {collection.subtitle}
        </Text>

        <div className="mt-8">
          <Link href={destination} className="inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.3em] transition-all duration-300 group-hover:gap-6 group-hover:text-[#B89B5E] text-neutral-400">Explore <span>→</span></Link>
        </div>
      </div>
    </article>
  );
}
