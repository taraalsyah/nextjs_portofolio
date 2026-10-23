'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './NewsletterBlock.module.css';

interface NewsletterBlockProps {
  title?: string;
  description?: string;
  className?: string;
}

export const NewsletterBlock: React.FC<NewsletterBlockProps> = ({
  title = 'Kurasi Newsletter',
  description = 'Dapatkan kurasi newsletter terkait produktivitas, manajemen proyek, dan engineering terbaik langsung ke inbox Anda.',
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.description}>{description}</p>

      {isSubscribed ? (
        <div className={styles.successMessage} role="alert">
          <CheckCircle2 size={16} className={styles.successIcon} />
          <span>Terima kasih! Anda telah terdaftar dalam kurasi newsletter.</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda..."
              required
              aria-label="Alamat email untuk berlangganan newsletter"
              className={styles.emailInput}
            />
          </div>
          <button type="submit" className={styles.subscribeBtn}>
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
};

export default NewsletterBlock;
