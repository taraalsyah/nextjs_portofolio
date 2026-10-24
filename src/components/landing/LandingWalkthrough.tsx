'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import styles from './LandingWalkthrough.module.css';

const LandingWalkthrough = () => {
  return (
    <section className={styles.walkthroughSection} id="walkthrough">
      <div className="section-container">
        <motion.div 
          className={styles.sectionHeader}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.badge}>
            <Sparkles size={14} />
            <span>Interactive Platform Tour</span>
          </div>
          <h2 className={styles.title}>
            Satu Ekosistem Lengkap untuk Seluruh Tahap Proyek
          </h2>
          <p className={styles.subtitle}>
            Saksikan alur kerja otomatis dari All Tasks, Kanban Board, Calendar due date, Timeline Gantt, Sprint Flow diagram, Laporan statistik, hingga asisten AI.
          </p>
        </motion.div>

        <motion.div 
          className={styles.frameContainer}
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <iframe
            src="/hero-animation.html"
            title="TaskTuntas – Animasi Manajemen Proyek"
            className={styles.iframe}
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default LandingWalkthrough;
