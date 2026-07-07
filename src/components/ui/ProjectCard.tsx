'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './ProjectCard.module.css';
import { ExternalLink, Code } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  tags: string[];
  image: string;
  images?: string[];
  link?: string;
  github?: string;
  onClick?: () => void;
}

const ProjectCard = ({ title, description, tags, image, link, github, onClick }: ProjectCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -10 }}
      onClick={onClick}
      className={`${styles.card} glass`}
    >
      <div className={styles.imageContainer}>
        <img src={image} alt={title} className={styles.image} />
        <div className={styles.overlay} onClick={(e) => e.stopPropagation()}>
          {link && <a href={link} target="_blank" rel="noopener noreferrer"><ExternalLink size={20} /></a>}
          {github && <a href={github} target="_blank" rel="noopener noreferrer"><Code size={20} /></a>}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.tags}>
          {tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
