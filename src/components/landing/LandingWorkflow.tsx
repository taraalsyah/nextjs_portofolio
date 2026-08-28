'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FilePlus, 
  UserPlus, 
  Activity, 
  ShieldCheck, 
  CheckCircle 
} from 'lucide-react';
import styles from './landing.module.css';

const STEPS = [
  {
    num: "1",
    icon: FilePlus,
    title: "Plan & Create Tasks",
    desc: "Define project scope, break down objectives into tasks, set due dates, and specify priorities."
  },
  {
    num: "2",
    icon: UserPlus,
    title: "Assign Team Members",
    desc: "Assign tasks to team members based on RBAC project permissions and responsibility scope."
  },
  {
    num: "3",
    icon: Activity,
    title: "Track Live Progress",
    desc: "Monitor status transitions in real-time as tasks progress from Open to In Progress."
  },
  {
    num: "4",
    icon: ShieldCheck,
    title: "Review & Approval Flow",
    desc: "Submit Request-to-Done or Request-to-Close for strict validation and Project Owner approval."
  },
  {
    num: "5",
    icon: CheckCircle,
    title: "Project Completion",
    desc: "Tasks move to Done or Closed upon reviewer approval with full activity audit logging."
  }
];

const LandingWorkflow = () => {
  return (
    <section id="workflow" className={styles.workflowSection}>
      <div className="section-container">
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>STREAMLINED WORKFLOW</div>
          <h2 className={styles.sectionTitle}>
            From initial planning to <span className="text-gradient">verified completion</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            A structured execution pipeline designed to eliminate bottlenecks, ensure quality reviews, and guarantee task completion.
          </p>
        </div>

        <div className={styles.workflowGrid}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={styles.workflowStepCard}
              >
                <div className={styles.stepNumber}>{step.num}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingWorkflow;
