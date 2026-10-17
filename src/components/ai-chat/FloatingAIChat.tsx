'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X } from 'lucide-react';
import { AIChat } from './AIChat';
import styles from './FloatingAIChat.module.css';

/**
 * List of paths where the floating AI chat widget should NOT be rendered.
 * Matches exact route or any sub-routes.
 */
const HIDE_AI_ON_PATHS = ['/dashboard/task-management/flow'];

export const FloatingAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Check if current route matches any excluded path (pathname excludes query string e.g. ?flowId=1)
  const isHidden = Boolean(
    pathname &&
      HIDE_AI_ON_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  );

  // Reset open state if user navigates to an excluded path while panel is open
  useEffect(() => {
    if (isHidden && isOpen) {
      setIsOpen(false);
    }
  }, [isHidden, isOpen]);

  // Close floating window on Escape key press (only active when component is rendered)
  useEffect(() => {
    if (isHidden) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isHidden]);

  // Do not render anything on excluded routes: zero DOM elements, zero listeners, zero network activity
  if (isHidden) {
    return null;
  }

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
