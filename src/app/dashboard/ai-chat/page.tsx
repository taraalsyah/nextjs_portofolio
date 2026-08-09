'use client';

import React from 'react';
import { AIChat } from '@/components/ai-chat/AIChat';
import styles from './page.module.css';

export default function AIChatPage() {
  return (
    <div className={styles.pageContainer}>
      <AIChat />
    </div>
  );
}
