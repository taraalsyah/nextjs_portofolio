'use client';

import React from 'react';
import { Bot, Sparkles, CheckCircle2 } from 'lucide-react';
import { SuggestedQuestions } from './SuggestedQuestions';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectQuestion, disabled }) => {
  return (
    <div className={styles.container}>
      <div className={styles.heroCard}>
        <div className={styles.botIconWrapper}>
          <Bot size={36} className={styles.botIcon} />
          <Sparkles size={18} className={styles.sparkleIcon} />
        </div>

        <h2 className={styles.title}>AI Task Management Assistant</h2>
        <p className={styles.subtitle}>
          Tanyakan sesuatu tentang Task Management, workflow, status, permission, atau arsitektur sistem.
        </p>

        <div className={styles.capabilities}>
          <div className={styles.capabilityItem}>
            <CheckCircle2 size={15} className={styles.checkIcon} />
            <span>Task Lifecycle & Statuses</span>
          </div>
          <div className={styles.capabilityItem}>
            <CheckCircle2 size={15} className={styles.checkIcon} />
            <span>Dual-Approval Workflow</span>
          </div>
          <div className={styles.capabilityItem}>
            <CheckCircle2 size={15} className={styles.checkIcon} />
            <span>Project Roles & Permissions</span>
          </div>
          <div className={styles.capabilityItem}>
            <CheckCircle2 size={15} className={styles.checkIcon} />
            <span>Tech Stack & System Architecture</span>
          </div>
        </div>
      </div>

      <SuggestedQuestions onSelectQuestion={onSelectQuestion} disabled={disabled} />
    </div>
  );
};
