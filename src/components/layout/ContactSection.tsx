'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Mail, Copy, Check, ExternalLink } from 'lucide-react';
import styles from './ContactSection.module.css';

// Custom inline SVG icons because Lucide React v1.0.0+ does not export brand icons.
const InstagramIcon = ({ className, size = 28 }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const TwitterIcon = ({ className, size = 28 }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Clean X / Twitter SVG outline matching Lucide's stroke style */}
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const LinkedinIcon = ({ className, size = 28 }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

interface ContactMethod {
  name: string;
  value: string;
  icon: React.ReactNode;
  url: string;
  colorClass: string;
  actionText: string;
  isEmail?: boolean;
}

const ContactSection = () => {
  const [copied, setCopied] = useState(false);
  const emailAddress = 'taraalsyah45@gmail.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contactMethods: ContactMethod[] = [
    {
      name: 'Email Address',
      value: emailAddress,
      icon: <Mail className={styles.icon} size={28} />,
      url: `mailto:${emailAddress}`,
      colorClass: styles.emailCard,
      actionText: 'Send Email',
      isEmail: true,
    },
    {
      name: 'LinkedIn',
      value: 'tara-alsyah',
      icon: <LinkedinIcon className={styles.icon} size={28} />,
      url: 'https://www.linkedin.com/in/taraalsyah/',
      colorClass: styles.linkedinCard,
      actionText: 'Let\'s Connect',
    },
    {
      name: 'Instagram',
      value: '@taraalsyah',
      icon: <InstagramIcon className={styles.icon} size={28} />,
      url: 'https://www.instagram.com/talsyah/',
      colorClass: styles.instagramCard,
      actionText: 'Follow Me',
    },
    {
      name: 'Twitter / X',
      value: '@taraalsyah',
      icon: <TwitterIcon className={styles.icon} size={28} />,
      url: 'https://x.com/TaraAlsyah_',
      colorClass: styles.twitterCard,
      actionText: 'View Profile',
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
  };

  return (
    <section id="contact" className={styles.contactSection}>
      <div className="section-container">
        <div className={styles.headerContainer}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={styles.badge}
          >
            Get In Touch
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={styles.title}
          >
            Let's Start a <span className="text-gradient">Project Together</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={styles.subtitle}
          >
            Currently seeking new opportunities or collaborations. Reach out on any of my channels, and I'll get back to you as soon as possible!
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
          className={styles.grid}
        >
          {contactMethods.map((method) => (
            <motion.a
              key={method.name}
              href={method.url}
              target={method.isEmail ? undefined : "_blank"}
              rel={method.isEmail ? undefined : "noopener noreferrer"}
              aria-label={`${method.name}: ${method.actionText}`}
              variants={itemVariants}
              className={`${styles.card} ${method.colorClass} glass`}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.2, ease: 'easeOut' }
              }}
            >
              {/* Glow background effect */}
              <div className={styles.glow} />
              
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  {method.icon}
                </div>
                {method.isEmail && (
                  <span 
                    role="button"
                    tabIndex={0}
                    onClick={handleCopyEmail}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCopyEmail(e as any);
                      }
                    }}
                    className={`${styles.copyButton} ${copied ? styles.copySuccess : ''}`}
                    aria-label="Copy email address"
                    title="Copy to clipboard"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 45 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <Check size={16} />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <Copy size={16} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <span className={styles.methodName}>{method.name}</span>
                <span className={styles.methodValue}>{method.value}</span>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.actionText}>{method.actionText}</span>
                <ExternalLink size={14} className={styles.arrowIcon} />
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
