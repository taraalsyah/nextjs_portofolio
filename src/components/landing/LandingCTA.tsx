'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './landing.module.css';

const LandingCTA = () => {
  return (
    <section id="pricing" className={styles.ctaSection}>
      <div className="section-container">
        <div className={styles.ctaBox}>
          <h2 className={styles.ctaTitle}>
            Ready to manage your projects better?
          </h2>
          <p className={styles.ctaDesc}>
            Start organizing your projects and tasks in one place. Streamline approvals, manage RBAC permissions, and deliver work on time.
          </p>
          <Link href="/register" className={styles.ctaBtn}>
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LandingCTA;
