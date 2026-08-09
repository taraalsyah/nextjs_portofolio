'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, ExternalLink } from 'lucide-react';
import { RagSource } from '@/services/chat/chat.service';
import styles from './SourceList.module.css';

interface SourceListProps {
  source?: RagSource | null;
  sources?: RagSource[];
}

export const SourceList: React.FC<SourceListProps> = ({ source, sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Derive primary source item
  const primarySource = source || (sources && sources.length > 0 ? sources[0] : null);

  if (!primarySource) {
    return null;
  }

  const docTitle = primarySource.fileName || primarySource.title || `Document #${primarySource.documentId}`;
  const similarityPct = Math.round((primarySource.similarity ?? 0) * 100);

  return (
    <div className={styles.container}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={styles.toggleBtn}
        aria-expanded={isOpen}
        aria-label="Toggle RAG Source"
      >
        <div className={styles.toggleLeft}>
          <FileText size={14} className={styles.icon} />
          <span className={styles.title}>Source: {docTitle}</span>
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isOpen && (
        <div className={styles.list}>
          <div className={styles.sourceCard}>
            <div className={styles.cardHeader}>
              <span className={styles.docTitle}>📄 {docTitle}</span>
              <span className={styles.similarityBadge}>{similarityPct}% match</span>
            </div>

            <div className={styles.cardDetails}>
              {primarySource.section && (
                <span className={styles.detailItem}>
                  <strong>Section:</strong> {primarySource.section}
                </span>
              )}
              {primarySource.retrievalReason && (
                <span className={styles.reasonBadge}>{primarySource.retrievalReason}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
