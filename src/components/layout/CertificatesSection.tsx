'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Calendar, ExternalLink, X, Search, ShieldCheck } from 'lucide-react';
import styles from './CertificatesSection.module.css';

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  expirationDate?: string;
  credentialId: string;
  verificationUrl: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
  accentColor: string;
  glowColor: string;
}

const CERTIFICATES: Certificate[] = [
  {
    id: 'ccna',
    title: 'Cisco Certified Network Associate (CCNA)',
    issuer: 'Cisco',
    issueDate: 'October 2023',
    expirationDate: 'October 2026',
    credentialId: 'CN543210-9876',
    verificationUrl: 'https://cisco.com/go/verify',
    category: 'Networking',
    image: '/CCNA.jpg',
    description: 'Validates foundational knowledge of networking technologies including routing protocols, switching, IPv4 and IPv6 subnetting, access control lists (ACLs), network address translation (NAT), wireless infrastructure, and automation/programmability concepts.',
    tags: ['Cisco IOS', 'Routing & Switching', 'Subnetting', 'Network Security'],
    accentColor: 'hsl(198, 100%, 45%)',
    glowColor: 'hsla(198, 100%, 45%, 0.4)'
  },
  {
    id: 'meta-fe',
    title: 'Meta Front-End Developer Professional Certificate',
    issuer: 'Meta',
    issueDate: 'October 2023',
    expirationDate: 'No Expiration',
    credentialId: 'METAFE-2023-AJK-7741',
    verificationUrl: 'https://verify.meta.com/certificates/METAFE-2023-AJK-7741',
    category: 'Web Development',
    image: '/meta_fe_cert.jpg',
    description: 'A comprehensive, 8-course professional program by Meta. Focuses on core front-end engineering skills: HTML5, CSS3, JavaScript (ES6+), React.js, Version Control with Git/GitHub, UI/UX design theory, and responsive layout architectures.',
    tags: ['React.js', 'JavaScript', 'Git & GitHub', 'Responsive Design'],
    accentColor: 'hsl(195, 100%, 45%)',
    glowColor: 'hsla(195, 100%, 45%, 0.4)'
  },
  {
    id: 'google-it',
    title: 'Google IT Support Professional Certificate',
    issuer: 'Google',
    issueDate: 'September 2023',
    expirationDate: 'No Expiration',
    credentialId: 'GITSCP-9876543210',
    verificationUrl: 'http://www.google.com/verify/credentials/GITSCP-9876543210',
    category: 'IT Support',
    image: '/google_it_cert.jpg',
    description: 'A rigorous professional credential by Google covering crucial IT support fields. Includes network protocols (TCP/IP, DNS, DHCP), hardware troubleshooting, Linux and Windows system administration, operating systems, and computer security best practices.',
    tags: ['System Administration', 'Network Protocols', 'Troubleshooting', 'IT Security'],
    accentColor: 'hsl(15, 90%, 55%)',
    glowColor: 'hsla(15, 90%, 55%, 0.4)'
  }
];

const CATEGORIES = ['All', 'Networking', 'Web Development', 'IT Support'];

const CertificatesSection = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const filteredCertificates = activeCategory === 'All' 
    ? CERTIFICATES 
    : CERTIFICATES.filter(cert => cert.category === activeCategory);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (selectedCert) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedCert]);

  return (
    <section id="certificates" className={styles.certificatesSection}>
      <div className="section-container">
        
        {/* Section Header */}
        <div className={styles.headerContainer}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={styles.badge}
          >
            Credentials & Achievements
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={styles.title}
          >
            My <span className="text-gradient">Certificates</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={styles.subtitle}
          >
            A collection of professional certifications and courses demonstrating my dedication to continuous technical learning and mastery.
          </motion.p>
        </div>

        {/* Filter Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={styles.filterContainer}
        >
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`${styles.filterBtn} glass ${activeCategory === category ? styles.activeFilterBtn : ''}`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Certificates Grid */}
        <motion.div 
          layout
          className={styles.grid}
        >
          <AnimatePresence mode="popLayout">
            {filteredCertificates.map((cert) => (
              <motion.div
                key={cert.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedCert(cert)}
                className={`${styles.card} glass`}
                style={{ 
                  '--glow-color': cert.glowColor,
                  '--border-color': cert.accentColor
                } as React.CSSProperties}
              >
                <div className={styles.imageContainer}>
                  <img src={cert.image} alt={cert.title} className={styles.image} />
                  <div className={styles.overlay}>
                    <div className={styles.zoomIconWrapper}>
                      <Search size={22} />
                    </div>
                  </div>
                </div>
                <div className={styles.content}>
                  <span 
                    className={styles.issuer}
                    style={{ '--accent-color': cert.accentColor } as React.CSSProperties}
                  >
                    {cert.issuer}
                  </span>
                  <h3 className={styles.cardTitle}>{cert.title}</h3>
                  <span className={styles.date}>Issued {cert.issueDate}</span>
                  
                  <div className={styles.tags}>
                    {cert.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Certificate Detailed Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCert(null)}
            className={styles.modalOverlay}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`${styles.modalContent} glass`}
              style={{ '--border-color': selectedCert.accentColor } as React.CSSProperties}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCert(null)}
                className={styles.modalCloseBtn}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              {/* Left Side: Certificate Image */}
              <div className={styles.modalImageWrapper}>
                <img src={selectedCert.image} alt={selectedCert.title} className={styles.modalImage} />
              </div>

              {/* Right Side: Certificate Info */}
              <div className={styles.modalInfo}>
                <div className={styles.modalHeader}>
                  <span 
                    className={styles.modalIssuer}
                    style={{ '--accent-color': selectedCert.accentColor } as React.CSSProperties}
                  >
                    {selectedCert.issuer}
                  </span>
                  <h3 className={styles.modalTitle}>{selectedCert.title}</h3>
                  
                  <div className={styles.modalMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Credential ID</span>
                      <span className={styles.metaValue}>{selectedCert.credentialId}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Issue Date</span>
                      <span className={styles.metaValue}>{selectedCert.issueDate}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Expires</span>
                      <span className={styles.metaValue}>{selectedCert.expirationDate || 'No Expiration'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Category</span>
                      <span className={styles.metaValue}>{selectedCert.category}</span>
                    </div>
                  </div>

                  <p className={styles.modalDescription}>
                    {selectedCert.description}
                  </p>

                  <div className={styles.modalTagsSection}>
                    <span className={styles.modalTagsLabel}>Skills Verified</span>
                    <div className={styles.tags}>
                      {selectedCert.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <a 
                  href={selectedCert.verificationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.verifyBtn}
                >
                  <ShieldCheck size={20} />
                  Verify Credential
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CertificatesSection;
