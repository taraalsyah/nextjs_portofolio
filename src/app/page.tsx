'use client';

import { useState } from 'react';
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/layout/HeroSection";
import LandingCapabilities from "@/components/landing/LandingCapabilities";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingPreview from "@/components/landing/LandingPreview";
import LandingWorkflow from "@/components/landing/LandingWorkflow";
import LandingValue from "@/components/landing/LandingValue";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import ProjectCard from "@/components/ui/ProjectCard";
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
    title: "Task Management SaaS",
    description: "An enterprise-grade task management system featuring multi-role RBAC permissions, interactive Request-to-Done & Request-to-Close approval workflows, real-time activity logging, automated email notifications, and detailed project tracking.",
    tags: ["Next.js", "TypeScript", "Prisma", "MySQL", "NextAuth"],
    image: "/task_management.png",
    images: ["/task_management.png", "/task_management_2.png", "/task_management_3.png"],
    github: "#",
    link: "/dashboard"
  },
  {
    title: "Nova Stream SaaS",
    description: "High-performance video streaming SaaS platform featuring low-latency playback delivery, customized algorithmic content recommendation systems, interactive library management, user watchlists, and robust analytics controls.",
    tags: ["React", "Node.js", "Redis", "AWS"],
    image: "/project3.png",
    images: ["/project3.png", "/project2.png", "/project1.png"],
    github: "#",
    link: "#"
  },
  {
    title: "Quantum Ledger",
    description: "A secure, decentralized finance application focusing on asset management and automated trading strategies with cryptographic ledger integrations and interactive balance graphs.",
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
      {/* 1. Navbar */}
      <Navbar />

      {/* 2 & 3. Hero Section & Hero Visual Mockup */}
      <HeroSection />

      {/* 4. Social Proof & Core Capabilities */}
      <LandingCapabilities />

      {/* 5. Features Section */}
      <LandingFeatures />

      {/* 6. Product Preview Section */}
      <LandingPreview />

      {/* 7. Workflow Section */}
      <LandingWorkflow />

      {/* 8. Project Management Value Section */}
      <LandingValue />

      {/* Featured Projects Showcase (Preserved Functionality) */}
      <section id="projects" style={{ padding: '90px 0', background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.25rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.4rem 1rem',
              borderRadius: '100px',
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1rem'
            }}>
              FEATURED APPLICATIONS
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
              Built for <span className="text-gradient">Real Workplaces</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--secondary-text)', lineHeight: 1.6 }}>
              Explore our production-ready software systems, SaaS web applications, and project management integrations.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
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

      {/* 9. CTA Section */}
      <LandingCTA />

      {/* 10. Footer */}
      <LandingFooter />

      {/* Project Details Modal */}
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        project={selectedProject} 
      />
    </main>
  );
}
