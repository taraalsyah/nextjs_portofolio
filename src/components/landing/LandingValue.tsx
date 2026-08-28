'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Layers, 
  Target, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import styles from './landing.module.css';

const VALUE_POINTS = [
  {
    icon: Target,
    title: "Plan projects with clarity",
    desc: "Organize sprints, categorize deliverables, and maintain clear goals across team members."
  },
  {
    icon: Users,
    title: "Assign responsibilities seamlessly",
    desc: "Grant exact permissions per project using Owner, Admin, Member, and Viewer roles."
  },
  {
    icon: TrendingUp,
    title: "Track progress in real-time",
    desc: "Visual progress bars and task status counts keep everyone aligned on schedule."
  },
  {
    icon: ShieldCheck,
    title: "Enforce review & approval standards",
    desc: "Request-to-Done and Request-to-Close workflows prevent unauthorized state changes."
  }
];

const LandingValue = () => {
  return (
    <section className={styles.valueSection}>
      <div className="section-container">
        <div className={styles.valueGrid}>
          {/* Left Column Text & Value Points */}
          <div>
            <div className={styles.pillBadge}>ENTERPRISE EFFICIENCY</div>
            <h2 className={styles.sectionTitle}>
              From planning to <span className="text-gradient">successful completion</span>
            </h2>
            <p className={styles.sectionSubtitle} style={{ textAlign: 'left' }}>
              Eliminate guesswork with structured project tracking, atomic permission enforcement, and automated notification alerts.
            </p>

            <div className={styles.valuePoints}>
              {VALUE_POINTS.map((pt, idx) => {
                const Icon = pt.icon;
                return (
                  <div key={idx} className={styles.valuePoint}>
                    <div className={styles.pointIcon}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className={styles.pointTitle}>{pt.title}</div>
                      <div className={styles.pointText}>{pt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column Interactive Visual Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-modal)',
              padding: '2rem',
              boxShadow: '0 16px 36px -10px rgba(15, 23, 42, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--foreground)' }}>Core Project Metrics</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--secondary-text)' }}>Active Sprint & Completion Rate</p>
              </div>
              <span style={{ padding: '0.3rem 0.75rem', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '0.78rem', fontWeight: 700 }}>
                On Schedule
              </span>
            </div>

            {/* Overall Completion Ring / Bar */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                <span>Overall Completion</span>
                <span style={{ color: '#2563EB', fontWeight: 700 }}>88%</span>
              </div>
              <div style={{ height: '10px', background: '#E2E8F0', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ width: '88%', height: '100%', background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)', borderRadius: '100px' }}></div>
              </div>
            </div>

            {/* Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', fontWeight: 600 }}>Active Projects</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--foreground)' }}>4 Projects</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)', fontWeight: 600 }}>Pending Approvals</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>2 Requests</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LandingValue;
