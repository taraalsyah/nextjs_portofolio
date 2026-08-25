'use client';

import { useState } from 'react';
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/layout/HeroSection";
import ProjectCard from "@/components/ui/ProjectCard";
import SkillsGrid from "@/components/ui/SkillsGrid";
import CertificatesSection from "@/components/layout/CertificatesSection";
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
    title: "Task Management",
    description: "An enterprise-grade task management system featuring multi-role RBAC permissions, interactive Request-to-Done & Request-to-Close approval workflows, real-time activity logging, automated email notifications, and detailed project tracking.",
    tags: ["Next.js", "TypeScript", "Prisma", "MySQL", "NextAuth"],
    image: "/project2.png",
    images: ["/project2.png", "/project1.png", "/project3.png"],
    github: "#",
    link: "/dashboard"
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
      
      <section id="projects" style={{ padding: '90px 0' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.25rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.4rem 1rem',
              borderRadius: '100px',
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              Selected Work
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Featured <span className="text-gradient">Projects</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              Explore key software applications and engineering projects built with modern technologies.
            </p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem' 
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

      <section id="skills" style={{ padding: '90px 0', background: 'var(--surface-hover)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.25rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.4rem 1rem',
              borderRadius: '100px',
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              Technical Proficiency
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Mastered <span className="text-gradient">Tech Stack</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              Technologies and tools I work with to build robust, scalable applications.
            </p>
          </div>
          <SkillsGrid />
        </div>
      </section>

      <CertificatesSection />

      <ContactSection />

      <footer style={{ padding: '3.5rem 0', textAlign: 'center', fontSize: '0.9rem', color: 'var(--secondary-text)', borderTop: '1px solid var(--border)', width: '100%', background: 'var(--surface)' }}>
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
