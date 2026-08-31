'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Layers } from 'lucide-react';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Layers size={18} />
          </div>
          <div className={styles.logoText}>
            Task<span>tuntas</span>
          </div>
        </Link>
        
        {/* Desktop Nav Links */}
        <ul className={styles.navLinks}>
          <li><Link href="/#features" className={styles.navLink}>Features</Link></li>
          <li><Link href="/#preview" className={styles.navLink}>Solutions</Link></li>
          <li><Link href="/#workflow" className={styles.navLink}>Workflow</Link></li>
          <li><Link href="/#pricing" className={styles.navLink}>Pricing</Link></li>
          <li><Link href="/explore-demo" className={styles.navLink}>Explore Demo</Link></li>
          <li><Link href="/blog" className={styles.navLink}>Resources</Link></li>
        </ul>

        {/* Right Action Buttons */}
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>
            Login
          </Link>
          <Link href="/register" className={styles.getStartedBtn}>
            Get Started <ArrowRight size={15} />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className={styles.mobileMenuBtn}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <ul className={styles.mobileNavLinks}>
              <li>
                <Link href="/#features" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#preview" onClick={() => setMobileMenuOpen(false)}>
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/#workflow" onClick={() => setMobileMenuOpen(false)}>
                  Workflow
                </Link>
              </li>
              <li>
                <Link href="/#pricing" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/explore-demo" onClick={() => setMobileMenuOpen(false)}>
                  Explore Demo
                </Link>
              </li>
              <li>
                <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
                  Resources
                </Link>
              </li>
            </ul>

            <div className={styles.mobileActions}>
              <Link 
                href="/login" 
                className={styles.loginBtn}
                onClick={() => setMobileMenuOpen(false)}
                style={{ textAlign: 'center' }}
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className={styles.getStartedBtn}
                onClick={() => setMobileMenuOpen(false)}
                style={{ textAlign: 'center' }}
              >
                Get Started <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
