'use client';

import React, { useState, useEffect } from 'react';
import { Bot, X } from 'lucide-react';
import { AIChat } from './AIChat';
import styles from './FloatingAIChat.module.css';

export const FloatingAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Close floating window on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Panel Window */}
      {isOpen && (
        <div className={styles.floatingWindow}>
          <AIChat
            onClose={() => setIsOpen(false)}
            onMinimize={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.floatingTrigger}
        aria-label={isOpen ? 'Tutup AI Assistant' : 'Buka AI Assistant'}
        title={isOpen ? 'Tutup AI Assistant' : 'Tanya AI Assistant'}
      >
        <div className={styles.triggerIconWrapper}>
          {isOpen ? <X size={20} /> : <Bot size={20} />}
          {!isOpen && <span className={styles.onlineBadge} />}
        </div>
        <span className={styles.triggerText}>
          {isOpen ? 'Tutup AI' : 'Tanya AI'}
        </span>
      </button>
    </>
  );
};
