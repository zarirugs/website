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
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-neutral-100">
        <Image
          src={collection.image}
          alt={collection.title}
          fill
          className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
        />
        {/* Subtle darkening overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/5" />
      </div>

      <div className="mt-8">
        <Heading as="h3" size="lg" className="font-normal transition-colors duration-300 group-hover:text-[#B89B5E]">
          {collection.title}
        </Heading>

        <Text size="md" className="mt-4 max-w-sm">
          {collection.subtitle}
        </Text>

        <Link
          href="#"
          className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] transition-all duration-300 group-hover:gap-4 group-hover:text-[#B89B5E]"
        >
          Explore Collection <span>→</span>
        </Link>
      </div>
    </article>
  );
}
