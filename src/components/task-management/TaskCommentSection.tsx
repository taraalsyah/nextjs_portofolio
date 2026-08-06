'use client';

import React, { useState } from 'react';
import { Send, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { InlineSpinner } from '@/components/ui/loading';
import { useSafeToast } from '@/components/ui/Toast';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string; username?: string; image?: string };
}

interface TaskCommentSectionProps {
  taskId: number;
  comments: CommentItem[];
  currentUserId: number;
  onRefresh: () => void;
  canUpdateProgress: boolean;
}

export function TaskCommentSection({
  taskId,
  comments,
  currentUserId,
  onRefresh,
  canUpdateProgress,
}: TaskCommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toastCtx = useSafeToast();

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        setNewComment('');
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menambahkan komentar.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menambahkan komentar. Silakan coba lagi.';
      setError(errMsg);
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, content: editContent.trim() }),
    });
    setEditingId(null);
    onRefresh();
  };

  const handleConfirmDeleteComment = async () => {
    if (commentToDelete === null) return;
    const commentId = commentToDelete;
    if (deletingIds.includes(commentId)) return;

    setError(null);
    setDeletingIds((prev) => [...prev, commentId]);

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (toastCtx?.showToast) toastCtx.showToast('Komentar berhasil dihapus.', 'success');
        setCommentToDelete(null);
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus komentar.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus komentar. Silakan coba lagi.';
      setError(errMsg);
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== commentId));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
        Diskusi & Komentar ({comments.length})
      </h4>

      {error && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            background: 'hsla(350, 90%, 55%, 0.15)',
            border: '1px solid hsla(350, 90%, 55%, 0.3)',
            color: 'hsl(350, 95%, 85%)',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Comment List (Chronological: Newest last) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'hsla(0,0%,100%,0.4)', margin: 0 }}>
            Belum ada komentar pada task ini.
          </p>
        ) : (
          comments.map((c) => {
            const isOwner = c.user.id === currentUserId;
            const isEditing = editingId === c.id;
            const isDeleting = deletingIds.includes(c.id);

            return (
              <div
                key={c.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    {c.user.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'hsla(0,0%,100%,0.4)' }}>
                      {formatDate(c.createdAt)}
                    </span>
                    {isDeleting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--secondary)' }}>
                        <InlineSpinner size={12} color="var(--secondary)" />
                        <span>Menghapus...</span>
                      </div>
                    ) : canUpdateProgress && isOwner && !isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setEditContent(c.content);
                          }}
                          disabled={isDeleting}
                          className={styles.actionBtn}
                          style={{ width: '22px', height: '22px' }}
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => setCommentToDelete(c.id)}
                          disabled={isDeleting}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          style={{ width: '22px', height: '22px' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={styles.input}
                      style={{ flex: 1 }}
                    />
                    <button onClick={() => handleUpdateComment(c.id)} className={styles.createBtn}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className={styles.clearFilterBtn}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--fg-color)', whiteSpace: 'pre-wrap' }}>
                    {c.content}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form - only show if user has update progress permission */}
      {canUpdateProgress && (
        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
          <input
            type="text"
            placeholder="Tulis komentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className={styles.createBtn}
            disabled={isSubmitting}
            style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer', minWidth: '110px' }}
          >
            {isSubmitting ? (
              <>
                <InlineSpinner size={14} />
                Menambahkan...
              </>
            ) : (
              <>
                <Send size={14} />
                Kirim
              </>
            )}
          </button>
        </form>
      )}

      {/* Custom Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={commentToDelete !== null}
        title="Hapus Komentar?"
        description="Apakah Anda yakin ingin menghapus komentar ini? Data yang dihapus tidak dapat dikembalikan."
        onConfirm={handleConfirmDeleteComment}
        onClose={() => setCommentToDelete(null)}
      />
    </div>
  );
}
