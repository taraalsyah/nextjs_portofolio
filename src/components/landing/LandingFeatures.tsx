'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FolderKanban, 
  CheckSquare, 
  ShieldCheck, 
  GitMerge, 
  BellRing, 
  FileText,
  Check
} from 'lucide-react';
import styles from './landing.module.css';

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Project Management",
    desc: "Organize workspace projects with structured roles, milestone tracking, and full team access controls.",
    bullets: ["Organize projects", "Track milestone progress", "Manage project members"]
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    desc: "Assign tasks to team members with granular priorities, due dates, checklists, and status transitions.",
    bullets: ["Assign tasks to members", "Track status & priority", "Due dates & checklists"]
  },
  {
    icon: ShieldCheck,
    title: "Team Roles & Permissions",
    desc: "Dual-layer RBAC system ensuring system-wide and project-level role permissions (Owner, Admin, Member, Viewer).",
    bullets: ["Multi-role RBAC", "Configurable permissions", "Secure member access"]
  },
  {
    icon: GitMerge,
    title: "Approval Workflows",
    desc: "Interactive Request-to-Done and Request-to-Close review flows with recipient validation and reviewer verification.",
    bullets: ["Custom workflow states", "Request to Done review", "Request to Close approval"]
  },
  {
    icon: BellRing,
    title: "Real-time Notifications",
    desc: "Instant notifications and automated email alerts for task assignments, state changes, and approval requests.",
    bullets: ["Real-time system alerts", "Task status updates", "Email notifications"]
  },
  {
    icon: FileText,
    title: "Activity & Audit Reports",
    desc: "Comprehensive activity logging, project status filtering, exportable reports, and historical change tracking.",
    bullets: ["Detailed audit logs", "Task status breakdown", "Filterable project reports"]
  }
];

const LandingFeatures = () => {
  return (
    <section id="features" className={styles.featuresSection}>
      <div className="section-container">
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>POWERFUL CAPABILITIES</div>
          <h2 className={styles.sectionTitle}>
            Everything you need to <span className="text-gradient">manage your projects</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Built with enterprise-grade security, interactive review workflows, and real-time project collaboration tools.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={styles.featureCard}
              >
                <div className={styles.featureIconWrapper}>
                  <Icon size={24} />
                </div>
                <h3 className={styles.featureTitle}>{feat.title}</h3>
                <p className={styles.featureDesc}>{feat.desc}</p>
                <ul className={styles.featureBullets}>
                  {feat.bullets.map((b, i) => (
                    <li key={i} className={styles.featureBullet}>
                      <Check size={15} className={styles.bulletCheck} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
