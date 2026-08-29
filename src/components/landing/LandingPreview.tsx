'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Kanban, 
  ListTodo, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import styles from './landing.module.css';

const LandingPreview = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'activity'>('kanban');

  return (
    <section id="preview" className={styles.previewSection}>
      <div className="section-container">
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>PRODUCT PREVIEW</div>
          <h2 className={styles.sectionTitle}>
            See your projects <span className="text-gradient">clearly</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Switch effortlessly between interactive Kanban boards, detailed task lists, and audit history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabControls}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'kanban' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            <Kanban size={16} /> Board View
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'list' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <ListTodo size={16} /> Task List View
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={16} /> Audit & Activity
          </button>
        </div>

        {/* Interactive View Mockup Container */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={styles.previewFrame}
        >
          {activeTab === 'kanban' && (
            <div className={styles.kanbanGrid}>
              {/* Backlog Column */}
              <div className={styles.kanbanCol}>
                <div className={styles.kanbanHeader}>
                  <span>BACKLOG</span>
                  <span className={styles.kanbanCount}>2</span>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle}>Database schema update</div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>Medium</span>
                    <span>Aug 30</span>
                  </div>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle}>Export PDF report option</div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Low</span>
                    <span>Sep 02</span>
                  </div>
                </div>
              </div>

              {/* Open Column */}
              <div className={styles.kanbanCol}>
                <div className={styles.kanbanHeader}>
                  <span>OPEN</span>
                  <span className={styles.kanbanCount}>2</span>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle}>Setup Nodemailer transport</div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#DC2626', fontWeight: 600 }}>High</span>
                    <span>Aug 29</span>
                  </div>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle}>Refactor mobile touch navigation</div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>Medium</span>
                    <span>Aug 31</span>
                  </div>
                </div>
              </div>

              {/* In Progress Column */}
              <div className={styles.kanbanCol}>
                <div className={styles.kanbanHeader}>
                  <span>IN PROGRESS</span>
                  <span className={styles.kanbanCount}>2</span>
                </div>
                <div className={styles.kanbanCard} style={{ borderColor: '#BFDBFE', background: '#EFF6FF' }}>
                  <div className={styles.kanbanCardTitle} style={{ color: '#1E40AF' }}>
                    Request-to-Done approval flow
                  </div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#B91C1C', fontWeight: 600 }}>High</span>
                    <span>Today</span>
                  </div>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle}>Capacitor native safe areas</div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#1D4ED8', fontWeight: 600 }}>Medium</span>
                    <span>Tomorrow</span>
                  </div>
                </div>
              </div>

              {/* Done Column */}
              <div className={styles.kanbanCol}>
                <div className={styles.kanbanHeader}>
                  <span>DONE</span>
                  <span className={styles.kanbanCount}>3</span>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle} style={{ textDecoration: 'line-through', opacity: 0.85 }}>
                    NextAuth authentication setup
                  </div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#15803D', fontWeight: 600 }}>Completed</span>
                    <span>Aug 25</span>
                  </div>
                </div>
                <div className={styles.kanbanCard}>
                  <div className={styles.kanbanCardTitle} style={{ textDecoration: 'line-through', opacity: 0.85 }}>
                    Glassmorphism card layout
                  </div>
                  <div className={styles.kanbanCardFooter}>
                    <span style={{ color: '#15803D', fontWeight: 600 }}>Completed</span>
                    <span>Aug 26</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Task Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assignee</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Design landing page UI layout</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 600 }}>
                        In Progress
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#DC2626', fontWeight: 600 }}>High</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Lead Developer</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary-text)' }}>Aug 29, 2026</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Request-to-Close validation logic</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#FEF3C7', color: '#B45309', fontSize: '0.75rem', fontWeight: 600 }}>
                        Review Pending
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#D97706', fontWeight: 600 }}>Medium</td>
                    <td style={{ padding: '0.85rem 1rem' }}>System Admin</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary-text)' }}>Aug 30, 2026</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Prisma transaction safety audit</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '0.75rem', fontWeight: 600 }}>
                        Done
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#2563EB', fontWeight: 600 }}>Medium</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Backend Lead</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary-text)' }}>Aug 27, 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <CheckCircle2 size={20} style={{ color: '#16A34A' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Project Owner approved Request-to-Done for "Authentication API"</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>10 minutes ago • Reviewed by Owner</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <Clock size={20} style={{ color: '#2563EB' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>New task assigned: "Implement glassmorphic navigation"</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>1 hour ago • Priority: High</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <AlertCircle size={20} style={{ color: '#D97706' }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Request-to-Close submitted for Task #402</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--secondary-text)' }}>3 hours ago • Email notification sent to Project Owner</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingPreview;
