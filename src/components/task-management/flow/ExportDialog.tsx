'use client';

import React, { useState } from 'react';
import { X, Download, FileImage, FileCode, Check } from 'lucide-react';
import { FlowData } from '@/types/flow';
import { exportFlowImage, exportFlowJson, downloadFile } from '@/lib/flow/export';
import { exportToDrawIoXml } from '@/lib/flow/drawio';
import styles from './flowComponents.module.css';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flowData: FlowData;
  flowName: string;
  viewportElement: HTMLElement | null;
}

export function ExportDialog({
  isOpen,
  onClose,
  flowData,
  flowName,
  viewportElement,
}: ExportDialogProps) {
  const [fileName, setFileName] = useState(flowName || 'diagram-alur');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg' | 'json' | 'drawio'>('png');
  const [scale, setScale] = useState<number>(2);
  const [transparent, setTransparent] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    const cleanName = fileName.trim() || 'diagram-alur';

    try {
      if (format === 'json') {
        exportFlowJson(flowData, cleanName);
        onClose();
        return;
      }

      if (format === 'drawio') {
        const xml = exportToDrawIoXml(flowData, cleanName);
        downloadFile(xml, `${cleanName}.drawio`, 'application/xml');
        onClose();
        return;
      }

      if (!viewportElement) {
        throw new Error('Elemen kanvas tidak ditemukan untuk diekspor.');
      }

      await exportFlowImage(viewportElement, cleanName, {
        format,
        scale,
        transparent,
        backgroundColor: '#ffffff',
      });

      onClose();
    } catch (err: any) {
      console.error('Export error:', err);
      setErrorMsg(err?.message || 'Gagal mengekspor diagram. Silakan coba format lain.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Ekspor Diagram</div>
          <button type="button" className={styles.toolbarBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {errorMsg && (
            <div style={{ color: 'var(--error)', fontSize: 13, background: 'var(--error-subtle)', padding: '8px 12px', borderRadius: 6 }}>
              {errorMsg}
            </div>
          )}

          <div className={styles.propSection}>
            <label className={styles.propLabel}>Nama File</label>
            <input
              type="text"
              className={styles.propInput}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="diagram-alur"
            />
          </div>

          <div className={styles.propSection}>
            <label className={styles.propLabel}>Format Berkas</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { key: 'png', label: 'PNG Gambar', icon: FileImage },
                { key: 'jpeg', label: 'JPEG Gambar', icon: FileImage },
                { key: 'svg', label: 'SVG Vektor', icon: FileCode },
                { key: 'json', label: 'JSON Data', icon: FileCode },
                { key: 'drawio', label: 'draw.io XML', icon: FileCode },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`${styles.backBtn} ${format === f.key ? styles.toolbarBtnActive : ''}`}
                  style={{ justifyContent: 'center', padding: '10px 8px', flexDirection: 'column', gap: 4 }}
                  onClick={() => setFormat(f.key as any)}
                >
                  <f.icon size={16} />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image-only options */}
          {(format === 'png' || format === 'jpeg' || format === 'svg') && (
            <>
              <div className={styles.propSection}>
                <label className={styles.propLabel}>Kualitas / Skala Resolusi</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`${styles.backBtn} ${scale === s ? styles.toolbarBtnActive : ''}`}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => setScale(s)}
                    >
                      <span>{s}x {s === 1 ? '(Standar)' : s === 2 ? '(HD)' : '(Ultra)'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {format === 'png' && (
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Latar Belakang Transparan</span>
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e) => setTransparent(e.target.checked)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.backBtn} onClick={onClose} disabled={isExporting}>
            Batal
          </button>
          <button
            type="button"
            className={styles.backBtn}
            style={{ background: 'var(--primary)', color: '#ffffff', borderColor: 'var(--primary-hover)', fontWeight: 600 }}
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download size={14} />
            <span>{isExporting ? 'Mengekspor...' : 'Unduh Sekarang'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
