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
          <div className="max-w-xl">
            <Eyebrow className="mb-8">Global Portfolio</Eyebrow>
            <Heading as="h2" size="xl">
              Featured Projects
            </Heading>

            <Text size="lg" className="mt-10 leading-loose">
              Discover how ZARI rugs transform luxury residences, boutique hotels, and curated interiors across the globe.
            </Text>
          </div>
        </FadeIn>

        {/* Indestructible spacing using inline styles */}
        <Stagger 
          className="grid lg:grid-cols-3"
          style={{
            marginTop: 'clamp(100px, 12vw, 160px)',
            rowGap: '100px',
            columnGap: '50px'
          }}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
