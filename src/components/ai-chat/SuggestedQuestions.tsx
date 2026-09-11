'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import styles from './SuggestedQuestions.module.css';

const DEFAULT_QUESTIONS = [
  'Berapa task DONE di project saya?',
  'Cari task tentang login',
  'Tampilkan task IN_PROGRESS di project ini',
  'Berikan detail project 1',
  'Ada task yang berhubungan dengan database?',
  'Tampilkan daftar task BACKLOG',
];

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  disabled?: boolean;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <HelpCircle size={14} className={styles.icon} />
        <span>Rekomendasi Pertanyaan:</span>
      </div>
      <div className={styles.grid}>
        {DEFAULT_QUESTIONS.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question)}
            disabled={disabled}
            className={styles.chip}
            aria-label={`Ask suggested question: ${question}`}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};
