'use client';

import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2, AlertCircle } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { InlineSpinner } from '@/components/ui/loading';
import { useToast } from '@/components/ui/Toast';

interface ChecklistItem {
  id: number;
  title: string;
  isCompleted: boolean;
}

interface TaskChecklistSectionProps {
  taskId: number;
  checklists: ChecklistItem[];
  onRefresh: () => void;
}

export function TaskChecklistSection({ taskId, checklists, onRefresh }: TaskChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  let toastCtx: any = null;
  try {
    toastCtx = useToast();
  } catch {}

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
    } catch (err: any) {
      const errMsg = err.message || 'Gagal menambahkan item checklist. Silakan coba lagi.';
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

  const handleDeleteItem = async (itemId: number) => {
    if (deletingIds.includes(itemId)) return;

    setError(null);
    setDeletingIds((prev) => [...prev, itemId]);

    try {
      const res = await fetch(`/api/tasks/${taskId}/checklists?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus item checklist.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal menghapus item checklist. Silakan coba lagi.';
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

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div
          style={{
            height: '6px',
            width: '100%',
            background: 'hsla(0,0%,100%,0.08)',
            borderRadius: '100px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}

      {/* Item List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {checklists.map((item) => {
          const isDeleting = deletingIds.includes(item.id);

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'var(--glass)',
                border: '1px solid var(--glass-border)',
                opacity: isDeleting ? 0.7 : 1,
              }}
            >
              <div
                onClick={() => !isDeleting && handleToggleItem(item.id, item.isCompleted)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  flex: 1,
                }}
              >
                {item.isCompleted ? (
                  <CheckSquare size={16} style={{ color: 'var(--secondary)' }} />
                ) : (
                  <Square size={16} style={{ color: 'hsla(0,0%,100%,0.4)' }} />
                )}
                <span
                  style={{
                    fontSize: '0.82rem',
                    textDecoration: item.isCompleted ? 'line-through' : 'none',
                    color: item.isCompleted ? 'hsla(0,0%,100%,0.4)' : 'var(--fg-color)',
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
              ) : (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  disabled={isDeleting}
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  style={{ width: '24px', height: '24px' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Form */}
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
    </div>
  );
}
