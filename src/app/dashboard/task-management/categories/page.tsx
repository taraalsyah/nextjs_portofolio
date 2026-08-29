'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Plus, Edit3, Trash2, X, Check } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useSafeToast } from '@/components/ui/Toast';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';
import { InlineSpinner } from '@/components/ui/loading';

interface CategoryItem {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeProject } = useProjectContext();
  const toastCtx = useSafeToast();
  const activeProjectId = activeProject?.projectId;

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';

  // Ref to track latest active project ID for race condition prevention
  const activeProjectRef = useRef<number | undefined>(activeProjectId);

  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);

  // Clear state when active project changes
  useEffect(() => {
    setCategories([]);
    setIsLoading(true);
  }, [activeProjectId]);

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard/task-management/my-tasks');
    }
  }, [status, isAdmin, router]);

  const fetchCategories = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    setIsLoading(true);
    try {
      const res = await fetch('/api/task-categories');
      if (activeProjectRef.current !== targetProjectId) return;

      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        setCategories([]);
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        setCategories([]);
      }
    } finally {
      if (activeProjectRef.current === targetProjectId) {
        setIsLoading(false);
      }
    }
  }, [status, activeProjectId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const handleProjectChanged = () => {
      setCategories([]);
      fetchCategories();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      return () => {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      };
    }
  }, [fetchCategories]);

  const handleOpenModal = (category?: CategoryItem) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || '');
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
    }
    setError(null);
    setIsOpenModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const url = editingCategory ? `/api/task-categories/${editingCategory.id}` : '/api/task-categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal menyimpan kategori.');
      }

      setIsOpenModal(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kategori.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    setCategoryToDelete(cat);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/task-categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (toastCtx?.showToast) toastCtx.showToast(`Kategori "${categoryToDelete.name}" berhasil dihapus.`, 'success');
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus kategori.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus kategori. Silakan coba lagi.';
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    }
  };

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <FolderKanban size={20} />
            </div>
            <div className={styles.headerTitle}>
              Task Categories
              <p>Kelola kategori tugas untuk pengelompokan pekerjaan yang rapi.</p>
            </div>
          </div>

          <button onClick={() => handleOpenModal()} className={styles.createBtn}>
            <Plus size={16} />
            Tambah Kategori
          </button>
        </div>

        {isLoading ? (
          <div className={styles.loadingBox}>
            <InlineSpinner size={18} color="var(--primary)" />
            <span>Memuat kategori task...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyBoxTitle}>Belum ada kategori task yang dibuat</p>
            <p className={styles.emptyBoxSubtitle}>Klik tombol "Tambah Kategori" di atas untuk membuat kategori baru.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Kategori</th>
                  <th>Deskripsi</th>
                  <th>Dibuat Pada</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td className={styles.categoryName}>{c.name}</td>
                    <td>{c.description || '-'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div className={styles.actionGroup} style={{ justifyContent: 'flex-end' }}>
                        <button
                          title="Edit Kategori"
                          onClick={() => handleOpenModal(c)}
                          className={styles.actionBtn}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          title="Hapus Kategori"
                          onClick={() => handleDeleteCategory(c)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Create / Edit */}
      {isOpenModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setIsOpenModal(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              {error && (
                <div
                  style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '0.8rem',
                    marginBottom: '1rem',
                  }}
                >
                  {error}
                </div>
              )}

              <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Backend, Design, QA..."
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>Deskripsi (Opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat mengenai kategori..."
                  className={styles.textarea}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className={styles.clearFilterBtn}
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button type="submit" className={styles.createBtn} disabled={isSubmitting}>
                  <Check size={16} />
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!categoryToDelete}
        title="Hapus Kategori?"
        description={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name || ''}"? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
}
