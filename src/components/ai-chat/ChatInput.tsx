'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Loader2, Mic, MicOff } from 'lucide-react';
import styles from './ChatInput.module.css';

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechErrorMessage, setSpeechErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');

  // Auto-resize textarea height as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [value]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Stop speech recognition if app enters loading state (sending message)
  useEffect(() => {
    if (isLoading && isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore cleanup error
        }
      }
      setIsListening(false);
    }
  }, [isLoading, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore stop error
        }
      }
      setIsListening(false);
      return;
    }

    setSpeechErrorMessage(null);

    if (typeof window === 'undefined') return;

    const SpeechRecognitionConstructor =
      (window as unknown as IWindow).SpeechRecognition ||
      (window as unknown as IWindow).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setSpeechErrorMessage('Browser Anda tidak mendukung fitur Speech-to-Text.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      // Preserve existing text in input box
      baseTextRef.current = value;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }

        const initial = baseTextRef.current;
        const spacePrefix = initial && !initial.endsWith(' ') ? ' ' : '';
        const newCombinedText = initial + (currentTranscript ? spacePrefix + currentTranscript : '');
        onChange(newCombinedText);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const errorType = event.error;
        if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
          setSpeechErrorMessage('Akses mikrofon ditolak atau tidak diizinkan.');
        } else if (errorType === 'no-speech') {
          setSpeechErrorMessage('Tidak ada suara terdeteksi.');
        } else if (errorType === 'network') {
          setSpeechErrorMessage('Terjadi gangguan jaringan pada Speech Recognition.');
        } else if (errorType !== 'aborted') {
          setSpeechErrorMessage('Tidak dapat mengenali suara saat ini.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setSpeechErrorMessage('Gagal memulai perekaman suara.');
    }
  }, [isListening, value, onChange]);

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
      {isListening && (
        <div className={styles.listeningBadge}>
          <span className={styles.pulseDot} />
          <span>Mendengarkan... (id-ID)</span>
        </div>
      )}

      {speechErrorMessage && (
        <div className={styles.errorNotice}>
          <span>{speechErrorMessage}</span>
          <button
            type="button"
            onClick={() => setSpeechErrorMessage(null)}
            className={styles.dismissErrBtn}
            aria-label="Tutup pesan error"
          >
            ×
          </button>
        </div>
      )}

      <div className={`${styles.composerWrapper} ${isListening ? styles.composerWrapperActive : ''}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Mendengarkan suara Anda...' : placeholder}
          disabled={isLoading}
          rows={1}
          className={styles.textarea}
          aria-label="Tanyakan sesuatu tentang Task Management"
        />

        <button
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ''}`}
          aria-label={isListening ? 'Hentikan perekaman suara' : 'Mulai perekaman suara'}
          title={isListening ? 'Hentikan mendengarkan' : 'Mulai Speech-to-Text (id-ID)'}
        >
          {isListening ? (
            <MicOff size={18} className={styles.micActiveIcon} />
          ) : (
            <Mic size={18} />
          )}
        </button>

        <button
          type="button"
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
