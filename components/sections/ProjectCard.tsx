import Image from "next/image";
import Link from "next/link";
import { Heading, Text } from "@/components/typography";
import type { Project } from "@/lib/data/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group cursor-pointer">
      <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-neutral-100">
        <Image
          src={project.image}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/5" />
      </div>

      <div className="mt-8">
        <Heading as="h3" size="lg" className="font-normal transition-colors duration-300 group-hover:text-[#B89B5E]">
          {project.title}
        </Heading>

        <Text size="md" className="mt-3">
          {project.location}
        </Text>

        <Link
          href="#"
          className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] transition-all duration-300 group-hover:gap-4 group-hover:text-[#B89B5E]"
        >
          View Project <span>→</span>
        </Link>
      </div>
    </article>
  );
}
