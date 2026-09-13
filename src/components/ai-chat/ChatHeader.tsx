'use client';

import React from 'react';
import { Bot, RotateCcw, FolderKanban, Minus, X } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  onClearHistory: () => void;
  messageCount: number;
  disabled?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearHistory,
  messageCount,
  disabled = false,
  onMinimize,
  onClose,
}) => {
  const projectContext = useProjectContext();
  const activeProjectName =
    projectContext?.activeProject?.projectName || projectContext?.optimisticProject?.projectName || 'Task Management';

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <div className={styles.botIconWrapper}>
          <Bot size={20} className={styles.botIcon} />
          <span className={styles.onlineStatusDot} title="System operational" />
        </div>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>AI Assistant</h1>
          <div className={styles.subTitleRow}>
            <span className={styles.onlineBadge}>● Online</span>
            <span className={styles.divider}>•</span>
            <div className={styles.projectBadge} title="Active Project Context">
              <FolderKanban size={11} />
              <span>{activeProjectName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        {messageCount > 0 && (
          <button
            onClick={onClearHistory}
            disabled={disabled}
            className={styles.clearBtn}
            title="Clear conversation history"
            aria-label="Clear conversation history"
          >
            <RotateCcw size={14} />
            <span className={styles.clearBtnText}>Reset Chat</span>
          </button>
        )}
        {onMinimize && (
          <button
            onClick={onMinimize}
            className={styles.iconHeaderBtn}
            title="Minimize AI Chat"
            aria-label="Minimize AI Chat"
          >
            <Minus size={14} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className={styles.iconHeaderBtn}
            title="Close AI Chat"
            aria-label="Close AI Chat"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
