import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/layout/HeroSection";
import ProjectCard from "@/components/ui/ProjectCard";
import SkillsGrid from "@/components/ui/SkillsGrid";
import styles from "./page.module.css";

const PROJECTS = [
  {
    title: "EcoSmart Dashboard",
    description: "An AI-powered environmental monitoring platform with real-time data visualization and predictive analytics.",
    tags: ["Next.js", "TypeScript", "Three.js", "PostgreSQL"],
    image: "/project1.png",
    github: "#",
    link: "#"
  },
  {
    title: "Nova Stream",
    description: "High-performance video streaming service with low-latency delivery and personalized content discovery.",
    tags: ["React", "Node.js", "Redis", "AWS"],
    image: "/project1.png",
    github: "#",
    link: "#"
  },
  {
    title: "Quantum Ledger",
    description: "A secure, decentralized finance application focusing on asset management and automated trading strategies.",
    tags: ["Next.js", "Solidity", "Ether.js", "Tailwind"],
    image: "/project1.png",
    github: "#",
    link: "#"
  }
];

export default function Home() {
  return (
    <main className={styles.main}>
      <Navbar />
      <HeroSection />
      
      <section id="projects" style={{ padding: '100px 0' }}>
        <div className="section-container">
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '3rem' }}>
            Featured <span className="text-gradient">Projects</span>
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '2.5rem' 
          }}>
            {PROJECTS.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>
      </section>

      <section id="skills" style={{ padding: '100px 0', background: 'hsla(230, 20%, 8%, 0.5)' }}>
        <div className="section-container">
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '3rem' }}>
            Mastered <span className="text-gradient">Tech Stack</span>
          </h2>
          <SkillsGrid />
        </div>
      </section>

      <footer id="contact" style={{ padding: '120px 0', textAlign: 'center' }}>
        <div className="section-container">
          <div className="glass" style={{ padding: '4rem', borderRadius: '40px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              Let's <span className="text-gradient">Work Together</span>
            </h2>
            <p style={{ 
              maxWidth: '600px', 
              margin: '0 auto 3rem', 
              fontSize: '1.2rem', 
              color: 'hsla(0, 0%, 100%, 0.6)' 
            }}>
              Currently available for new opportunities. Whether you have a question or just want to say hi, my inbox is always open.
            </p>
            <a href="mailto:hello@creative.dev" className={styles.contactBtn} style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '1.25rem 3rem',
              borderRadius: '100px',
              fontSize: '1.1rem',
              fontWeight: 600,
              display: 'inline-block',
              boxShadow: '0 10px 30px var(--primary-glow)'
            }}>
              Get In Touch
            </a>
          </div>
          
          <div style={{ marginTop: '5rem', opacity: 0.5, fontSize: '0.9rem' }}>
            © 2026 Creative Developer. Built with Next.js and Passion.
          </div>
        </div>
      </footer>
    </main>
  );
}
