import Link from "next/link";
import { site } from "@/lib/data/site";
import Container from "@/components/layout/Container";
import { Text } from "@/components/typography";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-white pt-24 pb-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 lg:gap-8 mb-24">
          
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="display-font text-3xl tracking-[0.25em]">
              {site.shortName}
            </Link>
            <Text className="mt-6 text-white/60 text-sm max-w-xs">
              {site.description}
            </Text>
          </div>

          {/* Explore Links Column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-8">
              Explore
            </h4>
            <ul className="flex flex-col gap-5">
              <li><Link href="#collections" className="text-[13px] tracking-widest uppercase text-white/80 hover:text-[#B89B5E] transition-colors">Collections</Link></li>
              <li><Link href="#craftsmanship" className="text-[13px] tracking-widest uppercase text-white/80 hover:text-[#B89B5E] transition-colors">Craftsmanship</Link></li>
              <li><Link href="#projects" className="text-[13px] tracking-widest uppercase text-white/80 hover:text-[#B89B5E] transition-colors">Projects</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-8">
              Concierge
            </h4>
            <ul className="flex flex-col gap-5 text-[13px] tracking-wide text-white/80">
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white transition-colors">{site.email}</a>
              </li>
              <li>{site.phone}</li>
              <li className="text-white/60 leading-relaxed mt-2">
                {site.address.city}, {site.address.state}<br/>
                {site.address.country}
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-8">
              Private Register
            </h4>
            <p className="text-[13px] text-white/60 mb-6 leading-relaxed">
              Subscribe to receive updates on bespoke projects and new collections.
            </p>
            <form className="flex border-b border-white/20 pb-3 group focus-within:border-white transition-colors">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="bg-transparent w-full text-[11px] tracking-[0.2em] outline-none placeholder:text-white/30 text-white"
              />
              <button 
                type="submit" 
                className="text-[10px] uppercase tracking-widest text-white/60 group-hover:text-white transition-colors ml-4"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-[10px] uppercase tracking-[0.2em] text-white/40">
          <p>&copy; {new Date().getFullYear()} {site.name}. All Rights Reserved.</p>
          <div className="flex gap-8 mt-6 md:mt-0">
            <a href={site.social.instagram} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>
            <a href={site.social.pinterest} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Pinterest</a>
            <a href={site.social.linkedin} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
