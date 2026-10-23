'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import styles from './Comments.module.css';
import CommentForm from './CommentForm';
import CommentList, { type CommentItem } from './CommentList';

interface CommentSectionProps {
  slug: string;
  postTitle?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ slug }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const fetchComments = useCallback(
    async (cursor?: number | null, isAppend: boolean = false) => {
      try {
        if (isAppend) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const queryParams = new URLSearchParams({
          slug,
          limit: '10',
        });

        if (cursor) {
          queryParams.set('cursor', String(cursor));
        }

        const res = await fetch(`/api/blog/comments?${queryParams.toString()}`);
        const data = await res.json();

        if (res.ok && data.ok) {
          if (isAppend) {
            setComments((prev) => [...prev, ...data.comments]);
          } else {
            setComments(data.comments);
          }
          setNextCursor(data.nextCursor ?? null);
          setTotalCount(data.totalCount ?? 0);
        }
      } catch (err) {
        console.error('[CommentSection] Failed to fetch comments:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentSubmitted = () => {
    // Refresh the comments list after submission
    fetchComments(null, false);
  };

  const handleLoadMore = () => {
    if (nextCursor && !isLoadingMore) {
      fetchComments(nextCursor, true);
    }
  };

  return (
    <section id="komentar" className={styles.sectionWrapper} aria-label="Bagian Komentar Artikel">
      <div className={styles.sectionHeader}>
        <h3 className={styles.title}>
          <MessageSquare size={20} className="text-primary" aria-hidden="true" />
          <span>Komentar</span>
          <span className={styles.commentCountBadge}>
            {totalCount}
          </span>
        </h3>
      </div>

      {/* Form Tambah Komentar */}
      <CommentForm slug={slug} onCommentSubmitted={handleCommentSubmitted} />

      {/* Daftar Komentar */}
      <CommentList
        comments={comments}
        isLoading={isLoading}
        hasMore={Boolean(nextCursor)}
        isLoadingMore={isLoadingMore}
        onLoadMore={handleLoadMore}
      />
    </section>
  );
};

export default CommentSection;
