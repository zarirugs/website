import Image from "next/image";
import Link from "next/link";
import { Collection } from "@/lib/data/collections";
import { Text } from "@/components/typography";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const hasImage = Boolean(collection.image);
  const externalImage = /^https?:\/\//.test(collection.image);
  const mediaApiImage = collection.image.startsWith("/api/media/");
  const destination = collection.slug ? `/collections/${collection.slug}` : "#order";

  return (
    <article className="group cursor-pointer">
      <div
        className="relative w-full aspect-[5/6] overflow-hidden rounded-sm bg-[#f4f1eb]"
        style={collection.backgroundColor ? { backgroundColor: collection.backgroundColor } : undefined}
      >
        {hasImage && externalImage ? (
          <div
            role="img"
            aria-label={collection.title}
            className={`${collection.imageFit === "contain" ? "bg-contain" : "bg-cover"} h-full w-full bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.015]`}
            style={{ backgroundImage: `url(${collection.image})` }}
          />
        ) : hasImage ? (
          <Image
            src={collection.image}
            alt={collection.title}
            fill
            unoptimized={mediaApiImage}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
            className={`${collection.imageFit === "cover" ? "object-cover" : "object-contain"} transition-transform duration-[1.2s] ease-out group-hover:scale-[1.015]`}
          />
        ) : null}

        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/65 via-black/25 to-transparent" />
        <p className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.28em] text-white">
          {collection.title}
        </p>

        <div className="absolute inset-x-0 bottom-0 flex min-h-32 items-end bg-gradient-to-t from-black/75 via-black/40 to-transparent px-5 pb-5 sm:min-h-40 sm:px-6 sm:pb-6">
          <Text size="sm" className="max-w-xs text-white/90 leading-relaxed">
            {collection.subtitle}
          </Text>
        </div>

        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/10" />
      </div>

      <div className="mt-6 border-t border-black/10 pt-5 lg:mt-7">
        <Link href={destination} className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.26em] text-neutral-700 transition-all duration-300 group-hover:gap-5 group-hover:text-[#9d8655]">
          View collection <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
