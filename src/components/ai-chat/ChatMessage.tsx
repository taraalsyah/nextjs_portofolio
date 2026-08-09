'use client';

import React, { useState } from 'react';
import { Bot, User, Copy, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { MessageItem } from '@/services/chat/chat.service';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SourceList } from './SourceList';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: MessageItem;
  onCopy: (text: string) => void;
  onRetry?: (text: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCopy, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant} ${
        message.isError ? styles.rowError : ''
      }`}
    >
      <div className={styles.avatar}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.bubble}>
          {message.isError && (
            <div className={styles.errorHeader}>
              <AlertTriangle size={14} />
              <span>Gagal memuat balasan AI</span>
            </div>
          )}

          {isUser ? (
            <div className={styles.userText}>{message.content}</div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}

          {!isUser && !message.isError && (message.source || (message.sources && message.sources.length > 0)) && (
            <SourceList source={message.source} sources={message.sources} />
          )}
        </div>

        <div className={styles.actionsBar}>
          <span className={styles.timestamp}>{message.createdAt}</span>

          {!isUser && !message.isError && (
            <button
              onClick={handleCopy}
              className={styles.actionBtn}
              title="Copy answer"
              aria-label="Copy answer to clipboard"
            >
              {copied ? (
                <>
                  <Check size={12} className={styles.copiedIcon} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          {message.isError && onRetry && (
            <button
              onClick={() => onRetry(message.content)}
              className={styles.retryBtn}
              aria-label="Retry sending question"
            >
              <RotateCcw size={12} />
              <span>Coba lagi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
