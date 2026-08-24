'use client';

import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2, AlertCircle } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { InlineSpinner } from '@/components/ui/loading';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export interface ChecklistItem {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface TaskChecklistSectionProps {
  taskId: number;
  checklists: ChecklistItem[];
  onRefresh: () => void;
  canUpdateProgress: boolean;
}

export function TaskChecklistSection({ taskId, checklists, onRefresh, canUpdateProgress }: TaskChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toastCtx = useToast();

  const completedCount = checklists.filter((c) => c.isCompleted).length;
  const totalCount = checklists.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || isAdding) return;

    setError(null);
    setIsAdding(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newItemTitle.trim() }),
      });

      if (res.ok) {
        setNewItemTitle('');
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menambahkan item checklist.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menambahkan item checklist. Silakan coba lagi.';
      setError(errMsg);
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleItem = async (itemId: number, currentStatus: boolean) => {
    await fetch(`/api/tasks/${taskId}/checklists`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, isCompleted: !currentStatus }),
    });
    onRefresh();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const itemId = itemToDelete.id;
    if (deletingIds.includes(itemId)) return;

    setError(null);
    setDeletingIds((prev) => [...prev, itemId]);

    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (toastCtx?.showToast) toastCtx.showToast('Item checklist berhasil dihapus.', 'success');
        setItemToDelete(null);
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus item checklist.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus item checklist. Silakan coba lagi.';
      setError(errMsg);
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
          Checklist ({completedCount} / {totalCount} Completed - {percentage}%)
        </h4>
      </div>

      {error && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            background: 'hsla(350, 90%, 55%, 0.15)',
            border: '1px solid hsla(350, 90%, 55%, 0.3)',
            color: 'hsl(350, 95%, 85%)',
            fontSize: '0.8rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: 'var(--glass-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: percentage === 100 ? 'hsl(140, 75%, 45%)' : 'var(--secondary)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Item List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {checklists.length === 0 && (
          <div style={{ fontSize: '0.82rem', color: 'hsla(0, 0%, 100%, 0.4)', fontStyle: 'italic' }}>
            Belum ada item checklist.
          </div>
        )}

        {checklists.map((item) => {
          const isDeleting = deletingIds.includes(item.id);
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => handleToggleItem(item.id, item.isCompleted)}
                  disabled={!canUpdateProgress || isDeleting}
                  style={{ cursor: canUpdateProgress && !isDeleting ? 'pointer' : 'not-allowed', width: '16px', height: '16px' }}
                />
                <span
                  style={{
                    fontSize: '0.84rem',
                    textDecoration: item.isCompleted ? 'line-through' : 'none',
                    color: item.isCompleted ? 'var(--foreground)' : 'var(--fg-color)',
                    opacity: item.isCompleted ? 1 : 0.75,
                    fontWeight: item.isCompleted ? 600 : 400,
                    transition: 'opacity 0.2s ease, color 0.2s ease, font-weight 0.2s ease',
                  }}
                >
                  {item.title}
                </span>
              </div>
              {isDeleting ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--secondary)' }}>
                  <InlineSpinner size={12} color="var(--secondary)" />
                  <span>Menghapus...</span>
                </div>
              ) : canUpdateProgress ? (
                <button
                  onClick={() => setItemToDelete({ id: item.id, title: item.title })}
                  disabled={isDeleting}
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  style={{ width: '24px', height: '24px' }}
                >
                  <Trash2 size={12} />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Add Form - only show if user has update progress permission */}
      {canUpdateProgress && (
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
          <input
            type="text"
            placeholder="Tambah item checklist..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className={styles.input}
            style={{ flex: 1 }}
            disabled={isAdding}
          />
          <button
            type="submit"
            className={styles.createBtn}
            disabled={isAdding}
            style={{ cursor: isAdding ? 'not-allowed' : 'pointer', minWidth: '110px' }}
          >
            {isAdding ? (
              <>
                <InlineSpinner size={14} />
                Menambahkan...
              </>
            ) : (
              <>
                <Plus size={14} />
                Tambah
              </>
            )}
          </button>
        </form>
      )}

      {/* Custom Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!itemToDelete}
        title="Hapus Item Checklist?"
        description={`Apakah Anda yakin ingin menghapus checklist "${itemToDelete?.title || ''}"? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setItemToDelete(null)}
      />
    </div>
  );
}
