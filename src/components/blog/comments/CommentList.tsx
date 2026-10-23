'use client';

import React from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import styles from './Comments.module.css';

export interface CommentItem {
  id: number;
  postSlug: string;
  name: string;
  content: string;
  createdAt: string;
}

interface CommentListProps {
  comments: CommentItem[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCommentDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export const CommentList: React.FC<CommentListProps> = ({
  comments,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
}) => {
  if (isLoading && comments.length === 0) {
    return (
      <div className={styles.loadingBox}>
        <Loader2 size={20} className="spin" aria-hidden="true" />
        <span>Memuat komentar...</span>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={styles.emptyState}>
        <MessageSquare size={36} className={styles.emptyIcon} aria-hidden="true" />
        <h4 className={styles.emptyTitle}>Belum ada komentar</h4>
        <p className={styles.emptyDesc}>
          Jadilah yang pertama untuk meninggalkan tanggapan pada artikel ini.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.commentListContainer}>
      {comments.map((item) => (
        <article key={item.id} className={styles.commentCard}>
          {/* Avatar bulat inisial */}
          <div className={styles.commentAvatar} aria-hidden="true">
            {getInitials(item.name)}
          </div>

          <div className={styles.commentBody}>
            <div className={styles.commentHeaderRow}>
              <span className={styles.commentAuthorName}>{item.name}</span>
              <time
                dateTime={item.createdAt}
                className={styles.commentDate}
                title={new Date(item.createdAt).toLocaleString('id-ID')}
              >
                {formatCommentDate(item.createdAt)}
              </time>
            </div>

            {/* Isi komentar: teks biasa, menjaga baris baru, tanpa render HTML */}
            <p className={styles.commentContent}>{item.content}</p>
          </div>
        </article>
      ))}

      {/* Tombol Muat Lebih Banyak */}
      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className={styles.loadMoreBtn}
          >
            {isLoadingMore ? (
              <>
                <Loader2 size={15} className="spin" aria-hidden="true" />
                <span>Memuat...</span>
              </>
            ) : (
              <span>Muat Lebih Banyak Komentar</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
