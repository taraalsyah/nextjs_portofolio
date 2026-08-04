'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Download, Trash2, Eye, AlertCircle } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { InlineSpinner } from '@/components/ui/loading';
import { useToast } from '@/components/ui/Toast';

interface AttachmentItem {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  uploadedBy: { id: number; name: string };
}

interface TaskAttachmentSectionProps {
  taskId: number;
  attachments: AttachmentItem[];
  onRefresh: () => void;
  canUpdateProgress: boolean;
  currentUserId: number;
}

export function TaskAttachmentSection({
  taskId,
  attachments,
  onRefresh,
  canUpdateProgress,
  currentUserId,
}: TaskAttachmentSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toastCtx = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || isUploading) return;

    setError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileNameLower = file.name.toLowerCase();

        // Validate image format
        if (
          !fileNameLower.endsWith('.jpg') &&
          !fileNameLower.endsWith('.jpeg') &&
          !fileNameLower.endsWith('.png') &&
          !fileNameLower.endsWith('.webp')
        ) {
          throw new Error(`File ${file.name} bukan format gambar yang didukung (JPG, JPEG, PNG, WEBP).`);
        }

        // Read file as Base64 Data URL
        const base64Url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch(`/api/tasks/${taskId}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: base64Url,
            fileSize: file.size,
            fileType: file.type || 'image/png',
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Gagal mengunggah lampiran.');
        }
      }

      onRefresh();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Gagal mengunggah gambar. Silakan coba lagi.';
      setError(errMsg);
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (deletingIds.includes(attachmentId)) return;

    setError(null);
    setDeletingIds((prev) => [...prev, attachmentId]);

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onRefresh();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus lampiran.');
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : 'Gagal menghapus lampiran. Silakan coba lagi.';
      setError(errMsg);
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== attachmentId));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
          Lampiran Gambar ({attachments.length})
        </h4>
        {canUpdateProgress && (
          <button
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={styles.createBtn}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              minWidth: '120px',
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <InlineSpinner size={13} />
                Menambahkan...
              </>
            ) : (
              <>
                <Upload size={13} />
                Tambah Gambar
              </>
            )}
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          disabled={isUploading || !canUpdateProgress}
          style={{ display: 'none' }}
        />
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

      {/* Attachment Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {attachments.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'hsla(0,0%,100%,0.4)', margin: 0, gridColumn: 'span 2' }}>
            Belum ada lampiran gambar pada task ini.
          </p>
        ) : (
          attachments.map((att) => {
            const isDeleting = deletingIds.includes(att.id);
            const canDelete = canUpdateProgress && att.uploadedBy.id === currentUserId;

            return (
              <div
                key={att.id}
                style={{
                  borderRadius: '8px',
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    height: '110px',
                    background: '#000',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={att.fileUrl}
                    alt={att.fileName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isDeleting ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.65)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        color: 'var(--secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      <InlineSpinner size={20} color="var(--secondary)" />
                      <span>Menghapus...</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                    >
                      <button
                        onClick={() => setPreviewUrl(att.fileUrl)}
                        className={styles.actionBtn}
                        title="Pratinjau Gambar"
                      >
                        <Eye size={13} />
                      </button>
                      <a
                        href={att.fileUrl}
                        download={att.fileName}
                        className={styles.actionBtn}
                        title="Unduh Gambar"
                      >
                        <Download size={13} />
                      </a>
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Hapus Lampiran"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              <div style={{ padding: '0.45rem 0.6rem' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {att.fileName}
                </p>
                <span style={{ fontSize: '0.7rem', color: 'hsla(0,0%,100%,0.4)' }}>
                  {formatFileSize(att.fileSize)}
                </span>
              </div>
            </div>
          );
        })
      )}
      </div>

      {/* Full Preview Modal */}
      {previewUrl && (
        <div
          className={styles.modalOverlay}
          onClick={() => setPreviewUrl(null)}
          style={{ zIndex: 1100 }}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={previewUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}