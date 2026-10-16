'use client';

import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Scissors,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Edit2,
  Layers,
  ArrowDownToLine,
  ArrowRightToLine,
} from 'lucide-react';
import styles from './flowComponents.module.css';

export interface ContextMenuPosition {
  x: number;
  y: number;
  nodeId?: string;
  edgeId?: string;
}

interface FlowContextMenuProps {
  position: ContextMenuPosition;
  onClose: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLockToggle?: () => void;
  isLocked?: boolean;
  onZOrder?: (action: 'front' | 'back') => void;
  onAutoLayout?: (dir: 'TB' | 'LR') => void;
  hasClipboardData: boolean;
}

export function FlowContextMenu({
  position,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onLockToggle,
  isLocked,
  onZOrder,
  onAutoLayout,
  hasClipboardData,
}: FlowContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const hasTarget = Boolean(position.nodeId || position.edgeId);

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        left: Math.min(position.x, window.innerWidth - 200),
        top: Math.min(position.y, window.innerHeight - 260),
      }}
    >
      {hasTarget ? (
        <>
          <button
            type="button"
            className={styles.contextMenuItem}
            onClick={() => {
              onCopy();
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Copy size={13} />
              <span>Salin</span>
            </span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+C</span>
          </button>

          <button
            type="button"
            className={styles.contextMenuItem}
            onClick={() => {
              onCut();
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scissors size={13} />
              <span>Potong</span>
            </span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+X</span>
          </button>

          <button
            type="button"
            className={styles.contextMenuItem}
            onClick={() => {
              onDuplicate();
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CopyPlus size={13} />
              <span>Duplikat</span>
            </span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+D</span>
          </button>

          <div className={styles.contextMenuDivider} />

          {position.nodeId && onZOrder && (
            <>
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onZOrder('front');
                  onClose();
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowUp size={13} />
                  <span>Ke Paling Depan</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onZOrder('back');
                  onClose();
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowDown size={13} />
                  <span>Ke Paling Belakang</span>
                </span>
              </button>
            </>
          )}

          {position.nodeId && onLockToggle && (
            <button
              type="button"
              className={styles.contextMenuItem}
              onClick={() => {
                onLockToggle();
                onClose();
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {isLocked ? <Unlock size={13} /> : <Lock size={13} />}
                <span>{isLocked ? 'Buka Kunci' : 'Kunci'}</span>
              </span>
            </button>
          )}

          <div className={styles.contextMenuDivider} />

          <button
            type="button"
            className={styles.contextMenuItem}
            style={{ color: 'var(--error)' }}
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={13} />
              <span>Hapus</span>
            </span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>Del</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.contextMenuItem}
            disabled={!hasClipboardData}
            onClick={() => {
              onPaste();
              onClose();
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardPaste size={13} />
              <span>Tempel (Paste)</span>
            </span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+V</span>
          </button>

          <div className={styles.contextMenuDivider} />

          {onAutoLayout && (
            <>
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onAutoLayout('TB');
                  onClose();
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowDownToLine size={13} />
                  <span>Ratakan Otomatis (TB)</span>
                </span>
              </button>
              <button
                type="button"
                className={styles.contextMenuItem}
                onClick={() => {
                  onAutoLayout('LR');
                  onClose();
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ArrowRightToLine size={13} />
                  <span>Ratakan Otomatis (LR)</span>
                </span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
