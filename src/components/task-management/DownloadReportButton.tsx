'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import styles from './DownloadReportButton.module.css';
import { useProjectContext } from '@/context/ProjectContext';
import { useSafeToast } from '@/components/ui/Toast';
import { InlineSpinner } from '@/components/ui/loading';

interface DownloadReportButtonProps {
  buttonText?: string;
  filterParams?: Record<string, string>;
}

export function DownloadReportButton({
  buttonText = 'Download Report',
  filterParams = {},
}: DownloadReportButtonProps) {
  const { activeProject } = useProjectContext();
  const toastCtx = useSafeToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'pdf' | 'excel' | 'csv') => {
    const projectId = activeProject?.projectId;
    if (!projectId) {
      if (toastCtx?.showToast) {
        toastCtx.showToast('Proyek tidak ditemukan. Silakan pilih proyek terlebih dahulu.', 'error');
      }
      return;
    }

    setIsOpen(false);
    setIsDownloading(true);
    setDownloadingFormat(format);

    try {
      // Build dynamic URL search parameters from current filter state
      const queryParams = new URLSearchParams({ format });
      if (filterParams) {
        Object.entries(filterParams).forEach(([key, val]) => {
          if (val && typeof val === 'string' && val.trim() !== '') {
            queryParams.set(key, val.trim());
          }
        });
      }

      const response = await fetch(`/api/projects/${projectId}/report?${queryParams.toString()}`);

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Gagal mengunduh laporan format ${format.toUpperCase()}.`);
      }

      // Extract binary blob
      const blob = await response.blob();

      // Extract filename from response header or construct fallback
      const contentDisposition = response.headers.get('content-disposition');
      const ext = format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'pdf';
      let filename = `Project_Report_${projectId}_${new Date().toISOString().split('T')[0]}.${ext}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Trigger browser file download
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      if (toastCtx?.showToast) {
        toastCtx.showToast(`Laporan ${format.toUpperCase()} berhasil diunduh.`, 'success');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunduh laporan.';
      if (toastCtx?.showToast) {
        toastCtx.showToast(errMsg, 'error');
      }
    } finally {
      setIsDownloading(false);
      setDownloadingFormat(null);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        onClick={() => !isDownloading && setIsOpen((prev) => !prev)}
        disabled={isDownloading || !activeProject}
        className={styles.downloadBtn}
        aria-label="Download Project Report"
        type="button"
      >
        {isDownloading ? (
          <>
            <InlineSpinner size={14} color="var(--primary)" />
            <span>Mengunduh {downloadingFormat?.toUpperCase()}...</span>
          </>
        ) : (
          <>
            <Download size={15} />
            <span>{buttonText}</span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </>
        )}
      </button>

      {isOpen && !isDownloading && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownTitle}>Format Laporan Proyek</div>

          <button
            onClick={() => handleDownload('pdf')}
            className={styles.menuItem}
            type="button"
          >
            <FileText size={16} style={{ color: '#EF4444' }} />
            <span>Download PDF</span>
            <span className={`${styles.itemBadge} ${styles.badgePdf}`}>PDF</span>
          </button>

          <button
            onClick={() => handleDownload('excel')}
            className={styles.menuItem}
            type="button"
          >
            <FileSpreadsheet size={16} style={{ color: '#10B981' }} />
            <span>Download Excel</span>
            <span className={`${styles.itemBadge} ${styles.badgeExcel}`}>.XLSX</span>
          </button>

          <button
            onClick={() => handleDownload('csv')}
            className={styles.menuItem}
            type="button"
          >
            <FileSpreadsheet size={16} style={{ color: '#3B82F6' }} />
            <span>Download CSV</span>
            <span className={`${styles.itemBadge} ${styles.badgeExcel}`}>.CSV</span>
          </button>
        </div>
      )}
    </div>
  );
}
