'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FolderKanban, Plus, Edit3, Trash2, X, Check } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';

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

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard/task-management/my-tasks');
    }
  }, [status, isAdmin, router]);

  const fetchCategories = async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/task-categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [status]);

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

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${cat.name}"?`)) return;

    const res = await fetch(`/api/task-categories/${cat.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchCategories();
    } else {
      const json = await res.json();
      alert(json.error || 'Gagal menghapus kategori.');
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
              Manajemen Kategori Task (Admin Only)
              <p>Tambah, edit, dan kelola kategori untuk pengelompokan task.</p>
            </div>
          </div>

          <button onClick={() => handleOpenModal()} className={styles.createBtn}>
            <Plus size={16} />
            Tambah Kategori
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Kategori</th>
                <th>Deskripsi</th>
                <th>Tanggal Dibuat</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Memuat kategori...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Belum ada kategori yang ditambahkan.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{c.name}</span>
                    </td>
                    <td>
                      <span style={{ color: 'hsla(0,0%,100%,0.7)' }}>{c.description || '-'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'hsla(0,0%,100%,0.4)' }}>
                        {new Date(c.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button onClick={() => handleOpenModal(c)} className={styles.actionBtn}>
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isOpenModal && (
        <div className={styles.modalOverlay} onClick={() => setIsOpenModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCategory ? 'Edit Kategori Task' : 'Tambah Kategori Task Baru'}
              </h3>
              <button onClick={() => setIsOpenModal(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
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

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nama Kategori *</label>
                <input
                  type="text"
                  placeholder="Contoh: Frontend, Backend, UI/UX"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Deskripsi</label>
                <textarea
                  placeholder="Penjelasan singkat mengenai kategori ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.textarea}
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
    </div>
  );
}
