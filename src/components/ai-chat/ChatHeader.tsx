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
          <Bot size={18} className={styles.botIcon} />
          <span className={styles.onlineStatusDot} title="System operational" />
        </div>
        <div className={styles.titleInfo}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>AI Assistant</h1>
            <span className={styles.onlineTag}>Active</span>
          </div>
          <div className={styles.subTitleRow}>
            <div className={styles.projectBadge} title={`Project Aktif: ${activeProjectName}`}>
              <FolderKanban size={11} className={styles.projectIcon} />
              <span className={styles.projectName}>{activeProjectName}</span>
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
            title="Bersihkan riwayat percakapan"
            aria-label="Bersihkan riwayat percakapan"
          >
            <RotateCcw size={13} />
            <span className={styles.clearBtnText}>Reset</span>
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
            className={`${styles.iconHeaderBtn} ${styles.closeBtn}`}
            title="Tutup AI Chat"
            aria-label="Tutup AI Chat"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

