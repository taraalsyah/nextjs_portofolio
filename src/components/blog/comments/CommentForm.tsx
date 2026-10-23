'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import styles from './Comments.module.css';

interface CommentFormProps {
  slug: string;
  onCommentSubmitted?: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  slug,
  onCommentSubmitted,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Anti-bot trap

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    content?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { name?: string; email?: string; content?: string } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Nama wajib diisi.';
    } else if (trimmedName.length > 80) {
      errors.name = 'Nama maksimal 80 karakter.';
    }

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Email wajib diisi.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Format alamat email tidak valid.';
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      errors.content = 'Komentar tidak boleh kosong.';
    } else if (trimmedContent.length < 3) {
      errors.content = 'Komentar minimal 3 karakter.';
    } else if (trimmedContent.length > 1000) {
      errors.content = 'Komentar maksimal 1000 karakter.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          email: email.trim(),
          content: content.trim(),
          website: honeypot, // Honeypot field
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Gagal mengirim komentar.');
      }

      setSuccessMsg(data.message || 'Komentar berhasil dikirim.');
      setName('');
      setEmail('');
      setContent('');
      setHoneypot('');
      setFieldErrors({});

      if (onCommentSubmitted) {
        onCommentSubmitted();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const remainingChars = 1000 - content.length;

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer} noValidate>
      {/* Success Notification */}
      {successMsg && (
        <div className={styles.alertSuccess} role="status" aria-live="polite">
          <CheckCircle2 size={18} flex-shrink={0} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* General Error Notification */}
      {errorMsg && (
        <div className={styles.alertError} role="alert" aria-live="polite">
          <AlertCircle size={18} flex-shrink={0} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Name & Email */}
      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="comment-name" className={styles.label}>
            Nama
            <span className={styles.requiredAsterisk} aria-hidden="true">*</span>
          </label>
          <input
            id="comment-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Contoh: Rian Pratama"
            maxLength={80}
            required
            disabled={isLoading}
            className={styles.input}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          />
          {fieldErrors.name && (
            <span id="name-error" className={styles.fieldError}>
              {fieldErrors.name}
            </span>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="comment-email" className={styles.label}>
            Email
            <span className={styles.requiredAsterisk} aria-hidden="true">*</span>
            <span className={styles.labelHint}>(tidak akan dipublikasikan)</span>
          </label>
          <input
            id="comment-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="nama@email.com"
            maxLength={100}
            required
            disabled={isLoading}
            className={styles.input}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <span id="email-error" className={styles.fieldError}>
              {fieldErrors.email}
            </span>
          )}
        </div>
      </div>

      {/* Textarea: Content */}
      <div className={styles.fieldGroup}>
        <label htmlFor="comment-content" className={styles.label}>
          Komentar
          <span className={styles.requiredAsterisk} aria-hidden="true">*</span>
        </label>
        <div className={styles.textareaWrapper}>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (fieldErrors.content) setFieldErrors((prev) => ({ ...prev, content: undefined }));
            }}
            placeholder="Tulis tanggapan atau komentar Anda terkait artikel ini..."
            maxLength={1000}
            rows={4}
            required
            disabled={isLoading}
            className={styles.textarea}
            aria-invalid={!!fieldErrors.content}
            aria-describedby={fieldErrors.content ? 'content-error' : undefined}
          />
          <div
            className={`${styles.charCounter} ${remainingChars < 50 ? styles.charCounterWarn : ''}`}
            aria-live="polite"
          >
            {content.length} / 1000
          </div>
        </div>
        {fieldErrors.content && (
          <span id="content-error" className={styles.fieldError}>
            {fieldErrors.content}
          </span>
        )}
      </div>

      {/* Honeypot field for anti-bot protection */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className={styles.honeypotField}
        aria-hidden="true"
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={styles.submitBtn}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="spin" aria-hidden="true" />
            <span>Mengirim...</span>
          </>
        ) : (
          <>
            <span>Kirim Komentar</span>
            <Send size={15} aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
};

export default CommentForm;
