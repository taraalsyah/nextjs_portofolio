'use client';

import React, { useState } from 'react';
import { X, Upload, FileCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FlowData } from '@/types/flow';
import { flowDataSchema } from '@/lib/flow/validation';
import { parseDrawIoXml } from '@/lib/flow/drawio';
import styles from './flowComponents.module.css';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: FlowData) => void;
}

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [importedData, setImportedData] = useState<FlowData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setImportedData(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        if (file.name.endsWith('.drawio') || file.name.endsWith('.xml')) {
          const parsed = parseDrawIoXml(text);
          if (parsed.nodes.length === 0) {
            setErrorMsg('Tidak ditemukan elemen diagram dalam berkas draw.io ini.');
            return;
          }
          setImportedData(parsed);
          return;
        }

        // JSON file parsing
        const json = JSON.parse(text);
        const dataToValidate = json.data || json; // Supports wrapped export or raw FlowData

        const parsed = flowDataSchema.safeParse(dataToValidate);
        if (!parsed.success) {
          setErrorMsg(`Format berkas tidak valid: ${parsed.error.issues[0]?.message}`);
          return;
        }

        setImportedData(parsed.data as FlowData);
      } catch (err: any) {
        setErrorMsg('Gagal membaca berkas. Pastikan berkas berupa JSON atau XML yang valid.');
      }
    };

    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!importedData) return;
    onImport(importedData);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Impor Diagram</div>
          <button type="button" className={styles.toolbarBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
            Unggah berkas diagram hasil ekspor (format <strong>.json</strong> atau <strong>.drawio</strong>).
          </p>

          <label
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 8,
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'var(--surface-muted)',
              transition: 'var(--transition)',
            }}
          >
            <Upload size={24} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {fileName || 'Pilih atau seret berkas ke sini'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
              Mendukung file .flow.json dan .drawio
            </span>
            <input
              type="file"
              accept=".json,.drawio,.xml"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--error)',
                fontSize: 13,
                background: 'var(--error-subtle)',
                padding: '8px 12px',
                borderRadius: 6,
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {importedData && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                background: 'var(--primary-soft)',
                border: '1px solid var(--primary-border)',
                padding: '10px 14px',
                borderRadius: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
                <CheckCircle2 size={16} />
                <span>Berkas Siap Diimpor</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--foreground)' }}>
                Ditemukan <strong>{importedData.nodes.length}</strong> node dan <strong>{importedData.edges.length}</strong> garis penghubung.
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.backBtn} onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className={styles.backBtn}
            style={{
              background: 'var(--primary)',
              color: '#ffffff',
              borderColor: 'var(--primary-hover)',
              fontWeight: 600,
            }}
            onClick={handleApply}
            disabled={!importedData}
          >
            Terapkan ke Kanvas
          </button>
        </div>
      </div>
    </div>
  );
}
