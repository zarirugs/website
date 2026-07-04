import Image from "next/image";
import Link from "next/link";

import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";

import type { Project } from "@/lib/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({
  project,
}: ProjectCardProps) {
  return (
    <article
      className="
        group
        cursor-pointer
        transition-transform
        duration-500
        hover:-translate-y-2
      "
    >
      <div
        className="
          relative
          aspect-[16/10]
          overflow-hidden
          rounded-sm
          bg-neutral-100
        "
      >
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="
            object-cover
            transition-transform
            duration-700
            group-hover:scale-105
          "
        />
      </div>

      <div className="mt-8">
        <Heading
          as="h3"
          size="lg"
          className="font-normal"
        >
          {project.title}
        </Heading>

        <Text
          size="md"
          className="mt-3"
        >
          {project.location}
        </Text>

        <Link
          href="#"
          className="
            mt-6
            inline-flex
            items-center
            gap-2
            text-xs
            uppercase
            tracking-[0.25em]
            transition-all
            duration-300
            hover:gap-4
          "
        >
          View Project →
        </Link>
      </div>
    </article>
  );
}