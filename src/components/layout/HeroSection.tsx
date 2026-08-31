'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  CheckSquare, 
  FolderKanban, 
  Users, 
  Clock, 
  TrendingUp, 
  Layers,
  Sparkles
} from 'lucide-react';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className="section-container">
        <div className={styles.heroGrid}>
          {/* Left Column: SaaS Value Proposition */}
          <div className={styles.content}>
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={styles.badge}
            >
              <span className={styles.badgeDot}></span>
              PROJECT MANAGEMENT PLATFORM
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={styles.title}
            >
              Manage Projects. <br />
              <span className="text-gradient">Get Things Done.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={styles.description}
            >
              Plan projects, manage tasks, collaborate with your team, and track progress — all in one streamlined enterprise workplace.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={styles.actions}
            >
              <Link href="/register" className={styles.primaryBtn}>
                Get Started <ArrowRight size={18} />
              </Link>
              <Link href="/explore-demo" className={styles.secondaryBtn}>
                <Play size={15} fill="currentColor" /> Explore Demo
              </Link>
            </motion.div>

            {/* Trust & Capability Checkmarks */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={styles.trustItems}
            >
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustCheck} />
                <span>Task Management</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustCheck} />
                <span>Team Collaboration</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={16} className={styles.trustCheck} />
                <span>Project Tracking</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Hero Visual UI Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.mockupContainer}
          >
            {/* Top Floating Badge Card */}
            <div className={styles.floatingCard1}>
              <div className={styles.iconBoxSuccess}>
                <CheckSquare size={18} />
              </div>
              <div>
                <div className={styles.cardVal}>12 Tasks</div>
                <div className={styles.cardSub}>Completed this week</div>
              </div>
            </div>

            {/* Bottom Floating Badge Card */}
            <div className={styles.floatingCard2}>
              <div className={styles.iconBox}>
                <TrendingUp size={18} />
              </div>
              <div>
                <div className={styles.cardVal}>Team Progress 84%</div>
                <div className={styles.cardSub}>Sprint on Schedule</div>
              </div>
            </div>

            {/* Product UI Mockup Card */}
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <div className={styles.dots}>
                  <span className={`${styles.dot} ${styles.dotRed}`}></span>
                  <span className={`${styles.dot} ${styles.dotYellow}`}></span>
                  <span className={`${styles.dot} ${styles.dotGreen}`}></span>
                </div>
                <div className={styles.mockupTitle}>
                  <Layers size={13} /> Project Workspace — Sprint 4
                </div>
                <div style={{ width: 40 }}></div>
              </div>

              <div className={styles.mockupBody}>
                {/* Mockup Sidebar */}
                <div className={styles.mockupSidebar}>
                  <div className={sidebarHeadingStyle}>Workspace</div>
                  <div className={`${styles.sidebarItem} ${styles.sidebarActive}`}>
                    <FolderKanban size={14} /> Main Sprint
                  </div>
                  <div className={styles.sidebarItem}>
                    <Users size={14} /> Design System
                  </div>
                  <div className={styles.sidebarItem}>
                    <Clock size={14} /> Backlog
                  </div>
                </div>

                {/* Mockup Main View */}
                <div className={styles.mockupContent}>
                  <div className={styles.projectOverviewBar}>
                    <div>
                      <div className={styles.progressLabel}>Sprint Progress</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                        72% completed (18 of 25 tasks)
                      </div>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div className={styles.progressBarFill}></div>
                    </div>
                  </div>

                  {/* Task Table */}
                  <table className={styles.taskTable}>
                    <thead>
                      <tr>
                        <th>Task Name</th>
                        <th>Status</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Design homepage layout</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.statusBadgeDone}`}>
                            Done
                          </span>
                        </td>
                        <td style={{ color: '#DC2626', fontWeight: 600 }}>High</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>API route integration</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.statusBadgeProgress}`}>
                            In Progress
                          </span>
                        </td>
                        <td style={{ color: '#2563EB', fontWeight: 600 }}>Medium</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Request to Close review</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles.statusBadgeReview}`}>
                            Review
                          </span>
                        </td>
                        <td style={{ color: '#B45309', fontWeight: 600 }}>Medium</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const sidebarHeadingStyle = styles.sidebarHeading;

export default HeroSection;
