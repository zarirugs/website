import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { FadeIn, Stagger } from "@/components/motion";
import { Heading, Text, Eyebrow } from "@/components/typography";
import ProjectCard from "./ProjectCard";
import { projects } from "@/lib/data/projects";

export default function Projects() {
  return (
    <Section id="projects">
      <Container>
        <FadeIn>
          <div className="max-w-3xl">
            <Eyebrow className="mb-6">Global Portfolio</Eyebrow>
            <Heading as="h2" size="xl">
              Featured Projects
            </Heading>

            <Text size="lg" className="mt-8">
              Discover how ZARI rugs transform luxury residences, boutique hotels, and curated interiors across the globe.
            </Text>
          </div>
        </FadeIn>

        <Stagger className="mt-24 grid gap-16 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
