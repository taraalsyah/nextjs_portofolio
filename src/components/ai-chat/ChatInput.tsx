'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = 'Tanyakan sesuatu tentang Task Management...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  };

  const isSendDisabled = isLoading || !value.trim();

  return (
    <div className={styles.container}>
      <div className={styles.composerWrapper}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={styles.textarea}
          aria-label="Tanyakan sesuatu tentang Task Management"
        />

        <button
          onClick={onSubmit}
          disabled={isSendDisabled}
          className={styles.sendBtn}
          aria-label="Send message"
          title="Send message (Enter)"
        >
          {isLoading ? (
            <Loader2 size={18} className={styles.spinner} />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      <div className={styles.inputFooterNotice}>
        <span>Tekan <strong>Enter</strong> untuk mengirim, <strong>Shift + Enter</strong> untuk baris baru</span>
      </div>
    </div>
  );
};
