'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className="section-container">
        <div className={styles.content}>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.welcome}
          >
            BUILDING RELIABLE DIGITAL SOLUTIONS
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.title}
          >
            Web Developer • <span className="text-gradient">Application Support •</span> CCNA Certified.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.description}
          >
            Passionate about building modern web applications, maintaining enterprise systems, and implementing reliable network infrastructure.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={styles.actions}
          >
            <a href="#projects" className={styles.primaryBtn}>View My Work</a>
            <a href="#contact" className={styles.secondaryBtn}>Let's Talk</a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
