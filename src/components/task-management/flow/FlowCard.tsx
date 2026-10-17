'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Copy, Edit2, Edit3, Trash2, Workflow, Clock, User, Eye } from 'lucide-react';
import { FlowListItem } from '@/types/flow';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './flowComponents.module.css';

interface FlowCardProps {
  flow: FlowListItem;
  onOpen: (flow: FlowListItem) => void;
  onView: (flow: FlowListItem) => void;
  onEdit: (flow: FlowListItem) => void;
  onRename: (flow: FlowListItem) => void;
  onDuplicate: (flow: FlowListItem) => void;
  onDelete: (flow: FlowListItem) => void;
  canEdit?: boolean;
  readOnly?: boolean;
}

export function FlowCard({
  flow,
  onOpen,
  onView,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
  canEdit = false,
  readOnly = false,
}: FlowCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const formattedDate = new Date(flow.updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleCardClick = () => {
    if (canEdit) {
      onEdit(flow);
    } else {
      onView(flow);
    }
  };

  return (
    <div className={styles.flowCard} onClick={handleCardClick}>
      {/* Thumbnail area */}
      <div className={styles.cardThumbnail}>
        {flow.thumbnail ? (
          <img src={flow.thumbnail} alt={flow.name} className={styles.thumbnailImg} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
            <Workflow size={36} opacity={0.4} />
            <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.6 }}>Pratinjau Diagram</span>
          </div>
        )}

        {/* Menu 3-dots: Only for Owner & Admin */}
        {canEdit && !readOnly && (
          <div ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.cardMenuBtn}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              title="Opsi Diagram"
              aria-label={`Opsi diagram ${flow.name}`}
            >
              <MoreVertical size={15} />
            </button>

            {isMenuOpen && (
              <div
                className={styles.contextMenu}
                style={{ position: 'absolute', top: 38, right: 8, zIndex: 50 }}
              >
                <button
                  type="button"
                  className={styles.contextMenuItem}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRename(flow);
                  }}
                  aria-label={`Ubah nama flow ${flow.name}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Edit2 size={13} />
                    <span>Ubah Nama</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={styles.contextMenuItem}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDuplicate(flow);
                  }}
                  aria-label={`Duplikat flow ${flow.name}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Copy size={13} />
                    <span>Duplikat</span>
                  </span>
                </button>

                <div className={styles.contextMenuDivider} />

                <button
                  type="button"
                  className={styles.contextMenuItem}
                  style={{ color: 'var(--error)' }}
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDelete(flow);
                  }}
                  aria-label={`Hapus flow ${flow.name}`}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trash2 size={13} />
                    <span>Hapus Diagram</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className={styles.cardBody}>
        <div className={styles.cardTitle}>{flow.name}</div>
        {flow.description ? (
          <div className={styles.cardDesc}>{flow.description}</div>
        ) : (
          <div className={styles.cardDesc} style={{ fontStyle: 'italic', opacity: 0.6 }}>
            Tidak ada deskripsi
          </div>
        )}
      </div>

      {/* Action Buttons: Lihat (all members) & Edit (Owner/Admin only) */}
      <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.cardActionBtn}
          onClick={() => onView(flow)}
          aria-label={`Lihat flow ${flow.name}`}
          title="Lihat Diagram"
        >
          <Eye size={13} />
          <span>Lihat</span>
        </button>

        {canEdit ? (
          <button
            type="button"
            className={`${styles.cardActionBtn} ${styles.cardActionBtnEdit}`}
            onClick={() => onEdit(flow)}
            aria-label={`Edit flow ${flow.name}`}
            title="Edit Diagram"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
        ) : (
          <Tooltip position="top" content="Hanya Owner dan Admin yang dapat mengedit">
            <span style={{ display: 'inline-flex' }}>
              <button
                type="button"
                className={`${styles.cardActionBtn} ${styles.cardActionBtnDisabled}`}
                disabled
                aria-label={`Edit flow ${flow.name} (Hanya Owner dan Admin yang dapat mengedit)`}
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            </span>
          </Tooltip>
        )}
      </div>

      {/* Card Footer */}
      <div className={styles.cardFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} />
          <span>{formattedDate}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <User size={12} />
          <span>{flow.createdBy?.name || 'Anonim'}</span>
        </div>
      </div>
    </div>
  );
}
