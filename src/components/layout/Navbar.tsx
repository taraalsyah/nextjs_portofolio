import React from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={`${styles.navbar} glass`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span>Port</span>folio
        </Link>
        
        <ul className={styles.navLinks}>
          <li><Link href="/#about">About</Link></li>
          <li><Link href="/#projects">Projects</Link></li>
          <li><Link href="/#skills">Skills</Link></li>
          <li><Link href="/#certificates">Certificates</Link></li>
          <li><Link href="/#contact" className={styles.contactBtn}>Hire Me</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
