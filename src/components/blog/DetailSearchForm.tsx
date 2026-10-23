'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './DetailSearchForm.module.css';

export const DetailSearchForm: React.FC = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/blog?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/blog');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} role="search">
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari artikel..."
          aria-label="Cari artikel blog"
          className={styles.input}
        />
        <button type="submit" className={styles.searchButton}>
          Cari
        </button>
      </div>
    </form>
  );
};

export default DetailSearchForm;
