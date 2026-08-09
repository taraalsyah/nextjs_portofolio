'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import styles from './SuggestedQuestions.module.css';

const DEFAULT_QUESTIONS = [
  'Apa saja status task?',
  'Apakah task Done bisa diedit?',
  'Siapa yang bisa approve Request to Done?',
  'Bagaimana workflow task dari Backlog sampai Done?',
  'Apa perbedaan Owner, Admin, Member, dan Viewer?',
  'Bagaimana cara Request to Done?',
  'Bagaimana Task Management menangani tampilan mobile?',
  'Database apa yang dipakai di task management?',
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
