'use client';

import React from 'react';
import { 
  FolderKanban, 
  CheckSquare, 
  Users, 
  GitBranch, 
  Bell, 
  BarChart3 
} from 'lucide-react';
import styles from './landing.module.css';

const LandingCapabilities = () => {
  return (
    <section className={styles.capabilitiesSection}>
      <div className="section-container">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Everything your team needs to manage work effectively
        </div>
        <div className={styles.capabilitiesGrid}>
          <div className={styles.capabilityItem}>
            <div className={styles.capabilityIcon}><FolderKanban size={18} /></div>
            <span>Project Management</span>
          </div>
          <div className={styles.capabilityItem}>
            <div className={styles.capabilityIcon}><CheckSquare size={18} /></div>
            <span>Task Tracking</span>
          </div>
          <div className={styles.capabilityItem}>
            <div className={styles.capabilityIcon}><Users size={18} /></div>
            <span>Team Collaboration</span>
          </div>
          <div className={styles.capabilityItem}>
            <div className={styles.capabilityIcon}><GitBranch size={18} /></div>
            <span>Custom Workflows</span>
          </div>
          <div className={styles.capabilityItem}>
            <div className={styles.capabilityIcon}><Bell size={18} /></div>
            <span>Real-time Alerts</span>
          </div>
          <div className={styles.capabilityItem}>
            <div className={styles.capabilityIcon}><BarChart3 size={18} /></div>
            <span>Audit & Reports</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingCapabilities;
