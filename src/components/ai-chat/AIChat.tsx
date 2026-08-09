'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { EmptyState } from './EmptyState';
import { TypingIndicator } from './TypingIndicator';
import { sendChatMessage, MessageItem } from '@/services/chat/chat.service';
import { useSafeToast } from '@/components/ui/Toast';
import styles from './AIChat.module.css';

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState<boolean>(false);

  const toast = useSafeToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Format current timestamp (e.g. "14:55")
  const getFormattedTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Handle scroll events to show/hide "Jump to latest" floating button
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 120) {
      setShowJumpToLatest(true);
    } else {
      setShowJumpToLatest(false);
    }
  };

  // Auto-scroll on new messages or loading state
  useEffect(() => {
    if (!showJumpToLatest) {
      scrollToBottom(true);
    }
  }, [messages, isLoading, showJumpToLatest, scrollToBottom]);

  // Submit question to RAG API
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: MessageItem = {
      id: userMessageId,
      role: 'user',
      content: text,
      createdAt: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const response = await sendChatMessage(text);
    setIsLoading(false);

    if (response.success && response.answer) {
      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        source: response.source,
        sources: response.sources,
        createdAt: getFormattedTime(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      const errorMessageText =
        response.error || 'Terjadi kesalahan saat memuat jawaban dari AI service.';
      const errorAssistantMessage: MessageItem = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessageText,
        isError: true,
        createdAt: getFormattedTime(),
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
      toast?.showToast(errorMessageText, 'error');
    }
  };

  // Handle suggested question click
  const handleSelectSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  // Handle copy answer to clipboard
  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast?.showToast('Jawaban berhasil disalin ke clipboard', 'success');
    }
  };

  // Handle retry sending question
  const handleRetry = (failedMessageText: string) => {
    handleSendMessage(failedMessageText);
  };

  // Clear conversation history
  const handleClearHistory = () => {
    setMessages([]);
    setShowJumpToLatest(false);
    toast?.showToast('Riwayat percakapan berhasil dibersihkan', 'info');
  };

  return (
    <div className={styles.chatWrapper}>
      <ChatHeader
        onClearHistory={handleClearHistory}
        messageCount={messages.length}
        disabled={isLoading}
      />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={styles.scrollArea}
      >
        {messages.length === 0 ? (
          <EmptyState
            onSelectQuestion={handleSelectSuggestedQuestion}
            disabled={isLoading}
          />
        ) : (
          <div className={styles.messagesList}>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onCopy={handleCopy}
                onRetry={handleRetry}
              />
            ))}

            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      {showJumpToLatest && (
        <button
          onClick={() => {
            scrollToBottom(true);
            setShowJumpToLatest(false);
          }}
          className={styles.jumpBtn}
          aria-label="Jump to latest messages"
        >
          <ArrowDown size={14} />
          <span>Terbaru</span>
        </button>
      )}

      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={() => handleSendMessage()}
        isLoading={isLoading}
      />
    </div>
  );
};
