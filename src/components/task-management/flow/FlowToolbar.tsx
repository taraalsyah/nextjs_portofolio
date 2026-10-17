'use client';

import React from 'react';
import {
  Undo2,
  Redo2,
  Copy,
  Scissors,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Map,
  Save,
  Download,
  Upload,
  ArrowDownToLine,
  ArrowRightToLine,
  Layers,
  FolderOpen,
  PanelLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { AlignmentType, DistributionType, LayoutDirection } from '@/lib/flow/layout';
import styles from './flowComponents.module.css';

interface FlowToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  hasSelection: boolean;
  hasClipboardData: boolean;
  onAlign: (type: AlignmentType) => void;
  onDistribute: (type: DistributionType) => void;
  onAutoLayout: (direction: LayoutDirection) => void;
  onLockToggle: () => void;
  isLocked: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitView: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onSave: () => void | Promise<boolean>;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onOpenTemplates: () => void;
  readOnly?: boolean;
  isDrawerMode?: boolean;
  onToggleLeftDrawer?: () => void;
  onToggleRightDrawer?: () => void;
}

export function FlowToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  hasSelection,
  hasClipboardData,
  onAlign,
  onDistribute,
  onAutoLayout,
  onLockToggle,
  isLocked,
  onGroup,
  onUngroup,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitView,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  showMinimap,
  onToggleMinimap,
  onSave,
  onOpenExport,
  onOpenImport,
  onOpenTemplates,
  readOnly = false,
  isDrawerMode = false,
  onToggleLeftDrawer,
  onToggleRightDrawer,
}: FlowToolbarProps) {
  return (
    <div className={styles.toolbar}>
      {/* Scrollable primary actions */}
      <div className={styles.toolbarScrollable}>
        {/* Drawer triggers when in tablet/mobile mode */}
        {isDrawerMode && (
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={onToggleLeftDrawer}
              title="Panel Bentuk"
              aria-label="Buka Panel Bentuk"
            >
              <PanelLeft size={16} />
            </button>
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={onToggleRightDrawer}
              title="Panel Pengaturan"
              aria-label="Buka Panel Pengaturan"
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        )}

        {/* Templates & Import / Export */}
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={onOpenTemplates}
            title="Pilih Template Diagram"
            aria-label="Pilih Template Diagram"
            disabled={readOnly}
          >
            <FolderOpen size={16} />
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={onOpenExport}
            title="Ekspor Diagram (PNG, JPEG, SVG, JSON)"
            aria-label="Ekspor Diagram"
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={onOpenImport}
            title="Impor Diagram (JSON)"
            aria-label="Impor Diagram"
            disabled={readOnly}
          >
            <Upload size={16} />
          </button>
        </div>

      {/* History */}
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onUndo}
          disabled={!canUndo || readOnly}
          title="Undo (Ctrl+Z)"
          aria-label="Undo Perubahan"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onRedo}
          disabled={!canRedo || readOnly}
          title="Redo (Ctrl+Shift+Z atau Ctrl+Y)"
          aria-label="Redo Perubahan"
        >
          <Redo2 size={16} />
        </button>
      </div>

      {/* Clipboard & Selection */}
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onCut}
          disabled={!hasSelection || readOnly}
          title="Cut (Ctrl+X)"
          aria-label="Potong Elemen Terpilih"
        >
          <Scissors size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onCopy}
          disabled={!hasSelection}
          title="Copy (Ctrl+C)"
          aria-label="Salin Elemen Terpilih"
        >
          <Copy size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onPaste}
          disabled={!hasClipboardData || readOnly}
          title="Paste (Ctrl+V)"
          aria-label="Tempel Elemen"
        >
          <ClipboardPaste size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onDuplicate}
          disabled={!hasSelection || readOnly}
          title="Duplikat (Ctrl+D)"
          aria-label="Duplikat Elemen Terpilih"
        >
          <CopyPlus size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onDelete}
          disabled={!hasSelection || readOnly}
          title="Hapus (Delete / Backspace)"
          aria-label="Hapus Elemen Terpilih"
        >
          <Trash2 size={15} color="var(--error)" />
        </button>
      </div>

      {/* Alignment & Distribution */}
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAlign('left')}
          disabled={!hasSelection || readOnly}
          title="Rata Kiri"
          aria-label="Ratakan Elemen ke Kiri"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAlign('center')}
          disabled={!hasSelection || readOnly}
          title="Rata Tengah Horizontal"
          aria-label="Ratakan Elemen Tengah Horizontal"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAlign('right')}
          disabled={!hasSelection || readOnly}
          title="Rata Kanan"
          aria-label="Ratakan Elemen ke Kanan"
        >
          <AlignRight size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAlign('top')}
          disabled={!hasSelection || readOnly}
          title="Rata Atas"
          aria-label="Ratakan Elemen ke Atas"
        >
          <AlignStartVertical size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAlign('middle')}
          disabled={!hasSelection || readOnly}
          title="Rata Tengah Vertikal"
          aria-label="Ratakan Elemen Tengah Vertikal"
        >
          <AlignCenterVertical size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAlign('bottom')}
          disabled={!hasSelection || readOnly}
          title="Rata Bawah"
          aria-label="Ratakan Elemen ke Bawah"
        >
          <AlignEndVertical size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onDistribute('horizontal')}
          disabled={!hasSelection || readOnly}
          title="Distribusikan Horizontal"
          aria-label="Distribusikan Elemen Horizontal"
        >
          <AlignHorizontalDistributeCenter size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onDistribute('vertical')}
          disabled={!hasSelection || readOnly}
          title="Distribusikan Vertikal"
          aria-label="Distribusikan Elemen Vertikal"
        >
          <AlignVerticalDistributeCenter size={15} />
        </button>
      </div>

      {/* Auto Layout (Dagre) */}
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAutoLayout('TB')}
          disabled={readOnly}
          title="Tata Letak Otomatis: Atas ke Bawah (TB)"
          aria-label="Tata Letak Otomatis: Atas ke Bawah"
        >
          <ArrowDownToLine size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => onAutoLayout('LR')}
          disabled={readOnly}
          title="Tata Letak Otomatis: Kiri ke Kanan (LR)"
          aria-label="Tata Letak Otomatis: Kiri ke Kanan"
        >
          <ArrowRightToLine size={15} />
        </button>
      </div>

      {/* Grouping & Locking */}
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onGroup}
          disabled={!hasSelection || readOnly}
          title="Grup Node (Ctrl+G)"
          aria-label="Grup Node Terpilih"
        >
          <Layers size={15} />
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${isLocked ? styles.toolbarBtnActive : ''}`}
          onClick={onLockToggle}
          disabled={!hasSelection || readOnly}
          title={isLocked ? 'Buka Kunci Node' : 'Kunci Node Terpilih'}
          aria-label={isLocked ? 'Buka Kunci Node' : 'Kunci Node Terpilih'}
        >
          {isLocked ? <Lock size={15} /> : <Unlock size={15} />}
        </button>
      </div>

      {/* Canvas View Toggles */}
      <div className={styles.toolbarGroup}>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${showGrid ? styles.toolbarBtnActive : ''}`}
          onClick={onToggleGrid}
          title="Tampilkan / Sembunyikan Kisi-kisi"
          aria-label="Tampilkan atau Sembunyikan Kisi-kisi"
        >
          <Grid size={15} />
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${snapToGrid ? styles.toolbarBtnActive : ''}`}
          onClick={onToggleSnap}
          title="Snap ke Kisi-kisi"
          aria-label="Nyalakan atau Matikan Snap ke Kisi-kisi"
        >
          <Magnet size={15} />
        </button>
        <button
          type="button"
          className={`${styles.toolbarBtn} ${showMinimap ? styles.toolbarBtnActive : ''}`}
          onClick={onToggleMinimap}
          title="Tampilkan / Sembunyikan Peta Mini"
          aria-label="Tampilkan / Sembunyikan Peta Mini"
        >
          <Map size={15} />
        </button>
      </div>
    </div>

    {/* Pinned Right: Zoom Controls & Save Button */}
    <div className={styles.toolbarPinnedRight}>
      <div className={styles.toolbarGroup} style={{ borderRight: 'none' }}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onZoomOut}
          title="Perkecil (Ctrl+-)"
          aria-label="Perkecil Kanvas"
        >
          <ZoomOut size={15} />
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '0 4px',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            userSelect: 'none',
            minWidth: 36,
            textAlign: 'center',
          }}
          onClick={onZoomReset}
          title="Reset ke 100%"
          aria-label="Reset Zoom ke 100%"
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onZoomIn}
          title="Perbesar (Ctrl+=)"
          aria-label="Perbesar Kanvas"
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={onFitView}
          title="Paskan ke Layar (Ctrl+0)"
          aria-label="Paskan Tampilan ke Layar"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Manual Save Button */}
      <button
        type="button"
        className={styles.backBtn}
        style={{
          background: 'var(--primary)',
          color: '#ffffff',
          borderColor: 'var(--primary-hover)',
          fontWeight: 600,
          flexShrink: 0,
        }}
        onClick={onSave}
        disabled={readOnly}
        title="Simpan Diagram Sekarang (Ctrl+S)"
        aria-label="Simpan Diagram Sekarang"
      >
        <Save size={14} />
        <span>Simpan</span>
      </button>
    </div>
  </div>
  );
}
