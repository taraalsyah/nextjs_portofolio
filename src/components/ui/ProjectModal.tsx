'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ProjectModal.module.css';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    title: string;
    description: string;
    tags: string[];
    images: string[];
    link?: string;
    github?: string;
  } | null;
}

const ProjectModal = ({ isOpen, onClose, project }: ProjectModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when modal opens with a new project
  useEffect(() => {
    setCurrentIndex(0);
  }, [project]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  const { title, description, tags, images, link, github } = project;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalOverlay} onClick={onClose}>
          {/* Backdrop Blur overlay */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Container */}
          <motion.div 
            className={`${styles.modalContainer} glass`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >


            <div className={styles.modalContent}>
              {/* Carousel Section */}
              <div className={styles.carouselSection}>
                <div className={styles.carouselViewport}>
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.img
                      key={currentIndex}
                      src={images[currentIndex]}
                      alt={`${title} slide ${currentIndex + 1}`}
                      className={styles.carouselImage}
                      initial={{ opacity: 0, x: 150 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -150 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.7}
                      onDragEnd={handleDragEnd}
                    />
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button className={`${styles.navArrow} ${styles.left}`} onClick={handlePrev} aria-label="Previous image">
                        <ChevronLeft size={24} />
                      </button>
                      <button className={`${styles.navArrow} ${styles.right}`} onClick={handleNext} aria-label="Next image">
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                {/* Navigation Dots */}
                {images.length > 1 && (
                  <div className={styles.dotsContainer}>
                    {images.map((_, index) => (
                      <button
                        key={index}
                        className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Swipe Helper Text */}
                <div className={styles.swipeHint}>
                  Tip: You can swipe left or right to change images
                </div>
              </div>

              {/* Detail Info Section */}
              <div className={styles.infoSection}>
                <h3 className={styles.title}>{title}</h3>
                
                <div className={styles.scrollableDetails}>
                  <h4 className={styles.sectionHeading}>About the Project</h4>
                  <p className={styles.description}>{description}</p>
                  
                  <h4 className={styles.sectionHeading}>Key Technologies</h4>
                  <div className={styles.tags}>
                    {tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cancel button below modal container */}
          <motion.button
            className={`${styles.bottomCancelButton} glass`}
            onClick={onClose}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350, delay: 0.1 }}
          >
            Cancel
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
