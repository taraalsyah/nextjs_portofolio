'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './SkillsGrid.module.css';

const skills = [
  { name: 'React / Next.js', level: '95%' },
  { name: 'TypeScript', level: '90%' },
  { name: 'Node.js', level: '85%' },
  { name: 'Tailwind / CSS', level: '95%' },
  { name: 'PostgreSQL', level: '80%' },
  { name: 'Docker', level: '75%' },
];

const SkillsGrid = () => {
  return (
    <div className={styles.grid}>
      {skills.map((skill, index) => (
        <motion.div 
          key={skill.name}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={styles.skillItem}
        >
          <div className={styles.info}>
            <span>{skill.name}</span>
            <span>{skill.level}</span>
          </div>
          <div className={styles.barContainer}>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: skill.level }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
              className={styles.bar}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SkillsGrid;
