import Image from "next/image";
import Link from "next/link";
import { Collection } from "@/lib/data/collections";
import { Heading, Text } from "@/components/typography";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <article className="group cursor-pointer">
      {/* Swapped aspect-ratio for explicit, foolproof responsive heights */}
      <div className="relative w-full h-[450px] lg:h-[600px] overflow-hidden rounded-sm bg-neutral-200">
        <Image
          src={collection.image}
          alt={collection.title}
          fill
          className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/10" />
      </div>

      <div className="mt-10 lg:mt-12">
        <Heading as="h3" size="md" className="transition-colors duration-300 group-hover:text-[#B89B5E]">
          {collection.title}
        </Heading>

        <Text size="sm" className="mt-4 max-w-xs text-neutral-500 leading-relaxed">
          {collection.subtitle}
        </Text>

        <Link
          href="#"
          className="mt-8 inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.3em] transition-all duration-300 group-hover:gap-6 group-hover:text-[#B89B5E] text-neutral-400"
        >
          Explore <span>→</span>
        </Link>
      </div>
    </article>
  );
}
