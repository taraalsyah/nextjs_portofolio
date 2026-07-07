'use client';

import { useState } from 'react';
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/layout/HeroSection";
import ProjectCard from "@/components/ui/ProjectCard";
import SkillsGrid from "@/components/ui/SkillsGrid";
import ContactSection from "@/components/layout/ContactSection";
import ProjectModal from "@/components/ui/ProjectModal";
import styles from "./page.module.css";

interface Project {
  title: string;
  description: string;
  tags: string[];
  image: string;
  images: string[];
  github?: string;
  link?: string;
}

const PROJECTS: Project[] = [
  {
    title: "EcoSmart Dashboard",
    description: "An AI-powered environmental monitoring platform with real-time data visualization and predictive analytics. It aggregates air quality indices, carbon emissions metrics, water pollution stats, and renewable energy usage in a glassmorphic user dashboard featuring geographic mapping and interactive trends.",
    tags: ["Next.js", "TypeScript", "Three.js", "PostgreSQL"],
    image: "/project2.png",
    images: ["/project2.png", "/project1.png", "/project3.png"],
    github: "#",
    link: "#"
  },
  {
    title: "Nova Stream",
    description: "High-performance video streaming SaaS platform featuring low-latency playback delivery, customized algorithmic content recommendation systems, interactive library management, user watchlists, and robust analytics controls built into a sleek glassmorphic navigation layout.",
    tags: ["React", "Node.js", "Redis", "AWS"],
    image: "/project3.png",
    images: ["/project3.png", "/project2.png", "/project1.png"],
    github: "#",
    link: "#"
  },
  {
    title: "Quantum Ledger",
    description: "A secure, decentralized finance application focusing on asset management and automated trading strategies. It includes cryptographic ledger integrations, multi-token wallets, interactive balance graphs, and historical transaction tracking layouts.",
    tags: ["Next.js", "Solidity", "Ether.js", "Tailwind"],
    image: "/project1.png",
    images: ["/project1.png", "/project3.png", "/project2.png"],
    github: "#",
    link: "#"
  }
];

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

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
              <ProjectCard 
                key={index} 
                {...project} 
                onClick={() => handleOpenModal(project)}
              />
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

      <ContactSection />

      <footer style={{ padding: '4rem 0 3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem', borderTop: '1px solid var(--surface-border)', width: '100%' }}>
        <div className="section-container">
          © 2026 Creative Developer. Built with Next.js and Passion.
        </div>
      </footer>

      {/* Project Details Modal */}
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        project={selectedProject} 
      />
    </main>
  );
}
