'use client';

import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import styles from './landing.module.css';

const LandingFooter = () => {
  return (
    <footer className={styles.footer}>
      <div className="section-container">
        <div className={styles.footerGrid}>
          {/* Brand Info */}
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.footerLogo}>
              <Layers size={22} style={{ color: '#3B82F6' }} />
              <div className={styles.footerLogoText}>
                Task<span>tuntas</span>
              </div>
            </Link>
            <p className={styles.footerTagline}>
              An enterprise-grade SaaS project management platform built for modern engineering and software teams.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h3 className={styles.footerColTitle}>Product</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/#features">Features</Link></li>
              <li><Link href="/#projects">Projects</Link></li>
              <li><Link href="/#workflow">Workflow</Link></li>
              <li><Link href="/#pricing">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className={styles.footerColTitle}>Resources</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/blog">Blog & Guides</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/#features">Documentation</Link></li>
              <li><Link href="/#contact">Support</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className={styles.footerColTitle}>Company</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/#about">About Us</Link></li>
              <li><Link href="/#contact">Contact</Link></li>
              <li><Link href="/login">Account Login</Link></li>
              <li><Link href="/register">Sign Up</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className={styles.footerColTitle}>Legal</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/#privacy">Privacy Policy</Link></li>
              <li><Link href="/#terms">Terms of Service</Link></li>
              <li><Link href="/#security">Security</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className={styles.footerBottom}>
          <div>
            © {new Date().getFullYear()} Tasktuntas SaaS Project Management. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/#privacy">Privacy</Link>
            <Link href="/#terms">Terms</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
