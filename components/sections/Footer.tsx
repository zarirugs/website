import Link from "next/link";
import { site } from "@/lib/data/site";
import Container from "@/components/layout/Container";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400" style={{ paddingTop: '100px', paddingBottom: '40px' }}>
      <Container>
        {/* Swapped from Grid to an indestructible Flexbox layout */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8 mb-24">
          
          {/* Brand Column - 33% width */}
          <div className="w-full lg:w-4/12 lg:pr-12">
            <Link href="/" className="display-font text-3xl tracking-widest text-white">
              {site.shortName}
            </Link>
            <p className="mt-8 text-sm leading-loose font-light max-w-sm">
              {site.description}
            </p>
          </div>

          {/* Explore Links Column - 16% width */}
          <div className="w-full lg:w-2/12">
            <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-100 mb-8">
              Explore
            </h4>
            <ul className="flex flex-col gap-4 text-sm font-light">
              <li><Link href="#collections" className="hover:text-white transition-colors">Collections</Link></li>
              <li><Link href="#craftsmanship" className="hover:text-white transition-colors">Craftsmanship</Link></li>
              <li><Link href="#projects" className="hover:text-white transition-colors">Projects</Link></li>
            </ul>
          </div>

          {/* Contact Column - 25% width */}
          <div className="w-full lg:w-3/12">
            <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-100 mb-8">
              Concierge
            </h4>
            <ul className="flex flex-col gap-4 text-sm font-light">
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white transition-colors">{site.email}</a>
              </li>
              <li>{site.phone}</li>
              <li className="leading-loose mt-2">
                {site.address.city}, {site.address.state}<br/>
                {site.address.country}
              </li>
            </ul>
          </div>

          {/* Newsletter Column - 25% width */}
          <div className="w-full lg:w-3/12">
            <h4 className="text-xs uppercase tracking-[0.2em] text-neutral-100 mb-8">
              Private Register
            </h4>
            <p className="text-sm font-light mb-8 leading-loose">
              Subscribe to receive updates on bespoke projects and new collections.
            </p>
            <form className="relative flex items-center border-b border-neutral-700 pb-3 group focus-within:border-neutral-400 transition-colors duration-500">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-transparent w-full text-sm text-white placeholder:text-neutral-600 outline-none font-light"
              />
              <button 
                type="submit" 
                className="absolute right-0 text-[10px] uppercase tracking-[0.15em] text-neutral-500 group-hover:text-white transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500">
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
