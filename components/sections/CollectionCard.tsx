import Image from "next/image";
import Link from "next/link";

import { Collection } from "@/lib/data/collections";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({
  collection,
}: CollectionCardProps) {
  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-neutral-200">
        <Image
          src={collection.image}
          alt={collection.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="mt-8">
        <Heading
          as="h3"
          size="lg"
          className="font-normal"
        >
          {collection.title}
        </Heading>

        <Text
          size="md"
          className="mt-4 max-w-sm"
        >
          {collection.subtitle}
        </Text>

        <Link
          href="#"
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            text-sm
            uppercase
            tracking-[0.2em]
            transition-opacity
            hover:opacity-60
          "
        >
          Explore
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}