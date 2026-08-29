'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Send, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { InlineSpinner } from '@/components/ui/loading';
import { useSafeToast } from '@/components/ui/Toast';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useProjectMembers, ProjectUser } from '@/hooks/useProjectMembers';

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

interface DropdownStyle {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
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
  const [isMounted, setIsMounted] = useState(false);

  // Mention Autocomplete States for New Comment Input
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(0);
  const [mentionPos, setMentionPos] = useState<{ start: number; end: number } | null>(null);
  const [newDropdownStyle, setNewDropdownStyle] = useState<DropdownStyle | null>(null);
  const newCommentInputRef = useRef<HTMLInputElement>(null);
  const newDropdownListRef = useRef<HTMLDivElement>(null);

  // Mention Autocomplete States for Edit Comment Input
  const [editMentionQuery, setEditMentionQuery] = useState<string | null>(null);
  const [editMentionIndex, setEditMentionIndex] = useState<number>(0);
  const [editMentionPos, setEditMentionPos] = useState<{ start: number; end: number } | null>(null);
  const [editDropdownStyle, setEditDropdownStyle] = useState<DropdownStyle | null>(null);
  const editCommentInputRef = useRef<HTMLInputElement>(null);
  const editDropdownListRef = useRef<HTMLDivElement>(null);

  const toastCtx = useSafeToast();
  const { users: projectUsers } = useProjectMembers();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper to format user handle for mention tag
  const getUserHandle = (user: ProjectUser) => {
    if (user.username && user.username.trim()) {
      return user.username.trim();
    }
    return user.name.toLowerCase().replace(/\s+/g, '');
  };

  // Filter eligible members for mention autocomplete based on query
  const filterSuggestions = (query: string | null) => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return projectUsers.filter((u) => {
      const handle = getUserHandle(u).toLowerCase();
      const name = u.name.toLowerCase();
      const email = u.email ? u.email.toLowerCase() : '';
      return handle.includes(q) || name.includes(q) || email.includes(q);
    });
  };

  const newCommentSuggestions = filterSuggestions(mentionQuery);
  const editCommentSuggestions = filterSuggestions(editMentionQuery);

  // Calculate Smart Position for Floating Dropdown
  const calculateSmartPosition = (inputEl: HTMLInputElement | null): DropdownStyle | null => {
    if (!inputEl || typeof window === 'undefined') return null;

    const rect = inputEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if input is out of visible viewport
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      return null;
    }

    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    // Prefer opening downwards if spaceBelow >= 160px or spaceBelow >= spaceAbove
    const placement = spaceBelow >= 160 || spaceBelow >= spaceAbove ? 'below' : 'above';

    const maxHeight = placement === 'below'
      ? Math.min(240, Math.max(100, spaceBelow))
      : Math.min(240, Math.max(100, spaceAbove));

    const width = Math.min(rect.width, viewportWidth - 24);
    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));

    if (placement === 'below') {
      return {
        top: rect.bottom + 4,
        left,
        width,
        maxHeight,
      };
    } else {
      return {
        bottom: viewportHeight - rect.top + 4,
        left,
        width,
        maxHeight,
      };
    }
  };

  // Update dropdown positioning on scroll/resize for New Comment Input
  useEffect(() => {
    if (mentionQuery !== null && newCommentSuggestions.length > 0 && newCommentInputRef.current) {
      const update = () => {
        const style = calculateSmartPosition(newCommentInputRef.current);
        setNewDropdownStyle(style);
      };
      update();

      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
      };
    } else {
      setNewDropdownStyle(null);
    }
  }, [mentionQuery, newCommentSuggestions.length]);

  // Update dropdown positioning on scroll/resize for Edit Comment Input
  useEffect(() => {
    if (editMentionQuery !== null && editCommentSuggestions.length > 0 && editCommentInputRef.current) {
      const update = () => {
        const style = calculateSmartPosition(editCommentInputRef.current);
        setEditDropdownStyle(style);
      };
      update();

      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
      };
    } else {
      setEditDropdownStyle(null);
    }
  }, [editMentionQuery, editCommentSuggestions.length]);

  // Auto scroll active item into view during arrow key navigation
  useEffect(() => {
    if (newDropdownListRef.current && mentionIndex >= 0) {
      const activeEl = newDropdownListRef.current.children[mentionIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [mentionIndex]);

  useEffect(() => {
    if (editDropdownListRef.current && editMentionIndex >= 0) {
      const activeEl = editDropdownListRef.current.children[editMentionIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [editMentionIndex]);

  // Check mention query on input change or cursor move
  const handleInputChange = (
    value: string,
    inputEl: HTMLInputElement | null,
    setQuery: (q: string | null) => void,
    setPos: (pos: { start: number; end: number } | null) => void,
    setIdx: (i: number) => void
  ) => {
    if (!inputEl) {
      setQuery(null);
      return;
    }

    const cursor = inputEl.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);

    if (match) {
      const query = match[1];
      const matchStart = textBeforeCursor.lastIndexOf('@');
      setQuery(query);
      setPos({ start: matchStart, end: cursor });
      setIdx(0);
    } else {
      setQuery(null);
      setPos(null);
    }
  };

  // Insert mention token into input
  const insertMention = (
    user: ProjectUser,
    value: string,
    setValue: (val: string) => void,
    pos: { start: number; end: number } | null,
    setQuery: (q: string | null) => void,
    inputEl: HTMLInputElement | null
  ) => {
    if (!pos) return;
    const handle = getUserHandle(user);
    const before = value.slice(0, pos.start);
    const after = value.slice(pos.end);
    const newValue = `${before}@${handle} ${after}`;
    setValue(newValue);
    setQuery(null);

    if (inputEl) {
      setTimeout(() => {
        const newCursor = pos.start + handle.length + 2;
        inputEl.focus();
        inputEl.setSelectionRange(newCursor, newCursor);
      }, 10);
    }
  };

  // Handle keyboard navigation for mention suggestions
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    suggestions: ProjectUser[],
    selectedIndex: number,
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>,
    onSelect: (user: ProjectUser) => void,
    setQuery: (q: string | null) => void
  ) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (suggestions[selectedIndex]) {
        e.preventDefault();
        onSelect(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setQuery(null);
    }
  };

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
        setMentionQuery(null);
        onRefresh();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('notifications_updated'));
        }
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
    setEditMentionQuery(null);
    onRefresh();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notifications_updated'));
    }
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

  // Render comment text highlighting @mention tokens
  const renderCommentContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className={styles.mentionBadge}>
            {part}
          </span>
        );
      }
      return part;
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
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertCircle size={14} style={{ color: '#DC2626' }} />
          {error}
        </div>
      )}

      {/* Comment List (Chronological: Newest last) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {comments.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
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
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  opacity: isDeleting ? 0.7 : 1,
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    👤 {c.user.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted-foreground)' }}>
                      {formatDate(c.createdAt)}
                    </span>
                    {isDeleting ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        <InlineSpinner size={12} color="var(--primary)" />
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
                          title="Edit Komentar"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => setCommentToDelete(c.id)}
                          disabled={isDeleting}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          style={{ width: '22px', height: '22px' }}
                          title="Hapus Komentar"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem' }}>
                    <div className={styles.mentionContainer}>
                      <input
                        ref={editCommentInputRef}
                        type="text"
                        value={editContent}
                        onChange={(e) => {
                          setEditContent(e.target.value);
                          handleInputChange(
                            e.target.value,
                            e.target,
                            setEditMentionQuery,
                            setEditMentionPos,
                            setEditMentionIndex
                          );
                        }}
                        onKeyDown={(e) =>
                          handleInputKeyDown(
                            e,
                            editCommentSuggestions,
                            editMentionIndex,
                            setEditMentionIndex,
                            (u) =>
                              insertMention(
                                u,
                                editContent,
                                setEditContent,
                                editMentionPos,
                                setEditMentionQuery,
                                editCommentInputRef.current
                              ),
                            setEditMentionQuery
                          )
                        }
                        className={styles.input}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleUpdateComment(c.id)} className={styles.createBtn}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className={styles.clearFilterBtn}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                    {renderCommentContent(c.content)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      {canUpdateProgress && (
        <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
          <div className={styles.mentionContainer}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                ref={newCommentInputRef}
                type="text"
                placeholder="Tulis komentar... Gunakan @nama untuk tag anggota tim"
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  handleInputChange(
                    e.target.value,
                    e.target,
                    setMentionQuery,
                    setMentionPos,
                    setMentionIndex
                  );
                }}
                onKeyDown={(e) =>
                  handleInputKeyDown(
                    e,
                    newCommentSuggestions,
                    mentionIndex,
                    setMentionIndex,
                    (u) =>
                      insertMention(
                        u,
                        newComment,
                        setNewComment,
                        mentionPos,
                        setMentionQuery,
                        newCommentInputRef.current
                      ),
                    setMentionQuery
                  )
                }
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
            </div>
          </div>
        </form>
      )}

      {/* Floating Smart Positioned Dropdown for New Comment via React Portal */}
      {isMounted &&
        newDropdownStyle &&
        newCommentSuggestions.length > 0 &&
        createPortal(
          <div
            ref={newDropdownListRef}
            className={styles.mentionDropdown}
            style={{
              left: `${newDropdownStyle.left}px`,
              width: `${newDropdownStyle.width}px`,
              maxHeight: `${newDropdownStyle.maxHeight}px`,
              ...(newDropdownStyle.top !== undefined ? { top: `${newDropdownStyle.top}px` } : {}),
              ...(newDropdownStyle.bottom !== undefined ? { bottom: `${newDropdownStyle.bottom}px` } : {}),
            }}
          >
            {newCommentSuggestions.map((u, idx) => (
              <div
                key={u.id}
                className={`${styles.mentionItem} ${
                  idx === mentionIndex ? styles.mentionItemActive : ''
                }`}
                onClick={() =>
                  insertMention(
                    u,
                    newComment,
                    setNewComment,
                    mentionPos,
                    setMentionQuery,
                    newCommentInputRef.current
                  )
                }
              >
                <div className={styles.mentionAvatar}>
                  {u.name ? u.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                    @{getUserHandle(u)}
                  </div>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Floating Smart Positioned Dropdown for Edit Comment via React Portal */}
      {isMounted &&
        editDropdownStyle &&
        editCommentSuggestions.length > 0 &&
        createPortal(
          <div
            ref={editDropdownListRef}
            className={styles.mentionDropdown}
            style={{
              left: `${editDropdownStyle.left}px`,
              width: `${editDropdownStyle.width}px`,
              maxHeight: `${editDropdownStyle.maxHeight}px`,
              ...(editDropdownStyle.top !== undefined ? { top: `${editDropdownStyle.top}px` } : {}),
              ...(editDropdownStyle.bottom !== undefined ? { bottom: `${editDropdownStyle.bottom}px` } : {}),
            }}
          >
            {editCommentSuggestions.map((u, idx) => (
              <div
                key={u.id}
                className={`${styles.mentionItem} ${
                  idx === editMentionIndex ? styles.mentionItemActive : ''
                }`}
                onClick={() =>
                  insertMention(
                    u,
                    editContent,
                    setEditContent,
                    editMentionPos,
                    setEditMentionQuery,
                    editCommentInputRef.current
                  )
                }
              >
                <div className={styles.mentionAvatar}>
                  {u.name ? u.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                    @{getUserHandle(u)}
                  </div>
                </div>
              </div>
            ))}
          </div>,
          document.body
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
