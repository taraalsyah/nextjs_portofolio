'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import styles from './ConfirmDeleteModal.module.css';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Hapus Data?',
  description = 'Data yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Hapus',
  cancelText = 'Batal',
  isLoading: externalIsLoading = false,
  onConfirm,
  onClose,
}) => {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  const isLoading = externalIsLoading || internalIsLoading;

  useEffect(() => {
    if (isOpen) {
      // Focus cancel button for accessibility & safety
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isLoading) return;

    try {
      setInternalIsLoading(true);
      await onConfirm();
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-desc"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={28} />
        </div>

        <div className={styles.contentGroup}>
          <h3 id="confirm-delete-title" className={styles.title}>
            {title}
          </h3>
          <p id="confirm-delete-desc" className={styles.description}>
            {description}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            ref={cancelBtnRef}
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
