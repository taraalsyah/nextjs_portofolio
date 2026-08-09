'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import styles from './TypingIndicator.module.css';

export const TypingIndicator: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.avatar}>
        <Bot size={16} />
      </div>
      <div className={styles.bubble}>
        <span className={styles.label}>AI sedang berpikir</span>
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
};
