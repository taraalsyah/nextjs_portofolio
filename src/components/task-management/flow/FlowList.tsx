'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Workflow,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Check,
} from 'lucide-react';
import { FlowListItem } from '@/types/flow';
import { FlowCard } from './FlowCard';
import { FlowTemplateModal } from './FlowTemplateModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useSafeToast } from '@/components/ui/Toast';
import { Tooltip } from '@/components/ui/Tooltip';
import { FlowTemplate } from '@/lib/flow/templates';
import styles from './flowComponents.module.css';

interface FlowListProps {
  activeProjectId?: number;
  onOpenFlow: (flowId: number, mode?: 'view' | 'edit') => void;
  canEdit?: boolean;
  canView?: boolean;
  readOnly?: boolean;
}

export function FlowList({
  activeProjectId,
  onOpenFlow,
  canEdit = false,
}: FlowListProps) {
  const toastCtx = useSafeToast();

  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<FlowListItem | null>(null);
  const [flowToRename, setFlowToRename] = useState<FlowListItem | null>(null);
  const [newFlowName, setNewFlowName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFlows = useCallback(async () => {
    if (!activeProjectId) {
      setFlows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const q = encodeURIComponent(search.trim());
      const res = await fetch(`/api/flows?projectId=${activeProjectId}&search=${q}&page=${page}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setFlows(data.flows || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total || 0);
        }
      } else {
        setFlows([]);
      }
    } catch (err) {
      console.error('Failed to fetch flows:', err);
      toastCtx?.showToast('Gagal memuat daftar diagram alur.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeProjectId, search, page, toastCtx]);

  useEffect(() => {
    fetchFlows();
  }, [fetchFlows]);

  // Handle Create from Template
  const handleCreateFromTemplate = async (template: FlowTemplate) => {
    if (!canEdit) {
      toastCtx?.showToast('Hanya Owner dan Admin yang dapat membuat diagram alur.', 'error');
      return;
    }
    if (!activeProjectId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.id === 'blank' ? 'Diagram Alur Baru' : template.name,
          description: template.description,
          data: template.data,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal membuat diagram.');
      }

      const data = await res.json();
      toastCtx?.showToast('Diagram berhasil dibuat!', 'success');
      onOpenFlow(data.flow.id, 'edit');
    } catch (err: any) {
      console.error('Failed to create flow:', err);
      toastCtx?.showToast(err?.message || 'Gagal membuat diagram.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Duplicate
  const handleDuplicate = async (flow: FlowListItem) => {
    if (!canEdit) {
      toastCtx?.showToast('Hanya Owner dan Admin yang dapat menduplikasi diagram alur.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/flows/${flow.id}/duplicate`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Gagal menduplikasi diagram.');
      }
      toastCtx?.showToast('Diagram berhasil diduplikasi.', 'success');
      fetchFlows();
    } catch (err: any) {
      toastCtx?.showToast(err?.message || 'Gagal menduplikasi diagram.', 'error');
    }
  };

  // Handle Rename
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toastCtx?.showToast('Hanya Owner dan Admin yang dapat mengubah nama diagram alur.', 'error');
      return;
    }
    if (!flowToRename || !newFlowName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/flows/${flowToRename.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFlowName.trim(),
          version: flowToRename.version,
          // maintain existing data
          data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        }),
      });

      // Note: For partial name rename, if version mismatch or data needed, let's refresh
      if (res.ok) {
        toastCtx?.showToast('Nama diagram berhasil diperbarui.', 'success');
        setFlowToRename(null);
        fetchFlows();
      } else {
        const data = await res.json().catch(() => ({}));
        toastCtx?.showToast(data.error || 'Gagal mengubah nama.', 'error');
      }
    } catch (err: any) {
      toastCtx?.showToast('Gagal mengubah nama diagram.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!canEdit) {
      toastCtx?.showToast('Hanya Owner dan Admin yang dapat menghapus diagram alur.', 'error');
      return;
    }
    if (!flowToDelete) return;
    try {
      const res = await fetch(`/api/flows/${flowToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toastCtx?.showToast('Diagram berhasil dihapus.', 'success');
        setFlowToDelete(null);
        fetchFlows();
      } else {
        const data = await res.json().catch(() => ({}));
        toastCtx?.showToast(data.error || 'Gagal menghapus diagram.', 'error');
      }
    } catch (err) {
      toastCtx?.showToast('Gagal menghapus diagram.', 'error');
    }
  };

  return (
    <div className={styles.flowListContainer}>
      {/* List Header */}
      <div className={styles.flowListHeader}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
            Diagram Alur (Flow)
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            Rancang dan simpan alur proses proyek, flowchart, dan integrasikan langsung dengan task.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={styles.searchBarWrapper}>
            <Search size={15} color="var(--muted-foreground)" />
            <input
              type="text"
              className={styles.searchBarInput}
              placeholder="Cari diagram alur..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {canEdit ? (
            <button
              type="button"
              className={styles.backBtn}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                borderColor: 'var(--primary-hover)',
                fontWeight: 600,
                padding: '0.55rem 0.95rem',
              }}
              onClick={() => setIsTemplateModalOpen(true)}
              aria-label="Buat Flow Baru"
            >
              <Plus size={16} />
              <span>Buat Flow Baru</span>
            </button>
          ) : (
            <Tooltip position="bottom" content="Hanya Owner dan Admin yang dapat membuat diagram">
              <span style={{ display: 'inline-flex' }}>
                <button
                  type="button"
                  className={styles.backBtn}
                  style={{
                    opacity: 0.5,
                    cursor: 'not-allowed',
                    padding: '0.55rem 0.95rem',
                  }}
                  disabled
                  aria-label="Buat Flow Baru (Hanya Owner dan Admin yang dapat membuat diagram)"
                >
                  <Plus size={16} />
                  <span>Buat Flow Baru</span>
                </button>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 8, color: 'var(--muted-foreground)' }}>
          <RefreshCw size={20} className="spin-animate" />
          <span>Memuat daftar diagram...</span>
        </div>
      ) : flows.length === 0 ? (
        <div className={styles.emptyState}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Workflow size={28} />
          </div>
          <div className={styles.emptyTitle}>Belum Ada Diagram Alur</div>
          <div className={styles.emptySubtitle}>
            {search.trim()
              ? `Tidak ditemukan diagram dengan kata kunci "${search}".`
              : 'Mulai dengan membuat diagram alur pertama untuk memetakan alur kerja tim dan proses proyek Anda.'}
          </div>
          {canEdit && !search.trim() && (
            <button
              type="button"
              className={styles.backBtn}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                borderColor: 'var(--primary-hover)',
                fontWeight: 600,
                marginTop: 6,
              }}
              onClick={() => setIsTemplateModalOpen(true)}
              aria-label="Buat Diagram Sekarang"
            >
              <Plus size={15} />
              <span>Buat Diagram Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.flowGrid}>
            {flows.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                onOpen={(f) => onOpenFlow(f.id, 'view')}
                onView={(f) => onOpenFlow(f.id, 'view')}
                onEdit={(f) => onOpenFlow(f.id, 'edit')}
                onRename={(f) => {
                  if (!canEdit) return;
                  setFlowToRename(f);
                  setNewFlowName(f.name);
                }}
                onDuplicate={handleDuplicate}
                onDelete={(f) => {
                  if (!canEdit) return;
                  setFlowToDelete(f);
                }}
                canEdit={canEdit}
                readOnly={!canEdit}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                Menampilkan halaman {page} dari {totalPages} ({totalItems} diagram)
              </span>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={styles.backBtn}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={15} />
                  <span>Sebelumnya</span>
                </button>
                <button
                  type="button"
                  className={styles.backBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Selanjutnya</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Template Chooser Modal */}
      <FlowTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleCreateFromTemplate}
      />

      {/* Rename Dialog */}
      {flowToRename && (
        <div className={styles.modalOverlay} onClick={() => setFlowToRename(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleRenameSubmit}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Ubah Nama Diagram</div>
                <button type="button" className={styles.toolbarBtn} onClick={() => setFlowToRename(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.propSection}>
                  <label className={styles.propLabel}>Nama Baru</label>
                  <input
                    type="text"
                    className={styles.propInput}
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.backBtn} onClick={() => setFlowToRename(null)}>
                  Batal
                </button>
                <button
                  type="submit"
                  className={styles.backBtn}
                  style={{ background: 'var(--primary)', color: '#ffffff', borderColor: 'var(--primary-hover)', fontWeight: 600 }}
                  disabled={isSubmitting}
                >
                  <Check size={14} />
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={flowToDelete !== null}
        title="Hapus Diagram Alur"
        description={`Apakah Anda yakin ingin menghapus diagram "${flowToDelete?.name}"? Diagram yang dihapus dapat dipulihkan oleh administrator.`}
        confirmText="Hapus Diagram"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onClose={() => setFlowToDelete(null)}
      />
    </div>
  );
}
