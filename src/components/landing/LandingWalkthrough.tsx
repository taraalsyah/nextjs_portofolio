'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './LandingWalkthrough.module.css';

const LandingWalkthrough = () => {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          const frameW = parseFloat(getComputedStyle(el).getPropertyValue('--frame-w')) || 1128;
          el.style.setProperty('--scale', String(width / frameW));
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className={styles.walkthroughSection} id="walkthrough">
      <div className={`section-container ${styles.walkthroughContainer}`}>
        <div className={styles.walkthroughIntro}>
          <span className={styles.eyebrow}>Walkthrough</span>
          <h2 className={styles.introTitle}>
            Lihat TaskTuntas bekerja dalam hitungan detik
          </h2>
          <p className={styles.introSubtitle}>
            Ikuti alur dari membuat task, membagi ke tim, memantau Gantt dan Kanban, sampai laporan dan download report, langsung dari dashboard.
          </p>
        </div>

        <motion.div 
          ref={frameRef}
          className={styles.frameContainer}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
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
