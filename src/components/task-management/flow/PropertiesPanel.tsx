'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { AppNode, AppEdge, LineType, StrokeStyle, ArrowMarkerType, EdgeAnimationMode } from '@/types/flow';
import { getArrowMarkerType } from '@/lib/flow/edgeMarkers';
import styles from './flowComponents.module.css';

interface ProjectTaskOption {
  id: number;
  taskNumber: string;
  title: string;
  status: string;
  priority: string;
  assigneeName?: string | null;
  dueDate?: string | null;
}

interface PropertiesPanelProps {
  selectedNode: AppNode | null;
  selectedEdge: AppEdge | null;
  onUpdateNodeData: (nodeId: string, partialData: Record<string, unknown>) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onUpdateNodeDimension: (nodeId: string, width: number, height: number) => void;
  onUpdateEdgeData: (edgeId: string, partialData: Record<string, unknown>) => void;
  onDeleteSelected: () => void;
  onZOrderChange: (nodeId: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  onConvertNodeToTask: (node: AppNode) => void;
  projectTasks: ProjectTaskOption[];
  // Canvas settings
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  snapToGrid: boolean;
  onSnapToGridChange: (snap: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (show: boolean) => void;
  canvasBg: string;
  onCanvasBgChange: (bg: string) => void;
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
  readOnly?: boolean;
}

export function PropertiesPanel({
  selectedNode,
  selectedEdge,
  onUpdateNodeData,
  onUpdateNodePosition,
  onUpdateNodeDimension,
  onUpdateEdgeData,
  onDeleteSelected,
  onZOrderChange,
  onConvertNodeToTask,
  projectTasks,
  gridSize,
  onGridSizeChange,
  snapToGrid,
  onSnapToGridChange,
  showGrid,
  onShowGridChange,
  canvasBg,
  onCanvasBgChange,
  isDrawerOpen = false,
  onCloseDrawer,
  readOnly = false,
}: PropertiesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [taskSearch, setTaskSearch] = useState('');

  const nodeData = selectedNode?.data;
  const edgeData = selectedEdge?.data;

  const activeMarkerEnd: ArrowMarkerType =
    (edgeData?.markerEnd as ArrowMarkerType | undefined) ||
    getArrowMarkerType(selectedEdge?.markerEnd, 'arrowclosed');
  const activeMarkerStart: ArrowMarkerType =
    (edgeData?.markerStart as ArrowMarkerType | undefined) ||
    getArrowMarkerType(selectedEdge?.markerStart, 'none');

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return projectTasks;
    const q = taskSearch.trim().toLowerCase();
    return projectTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.taskNumber.toLowerCase().includes(q)
    );
  }, [projectTasks, taskSearch]);

  if (isCollapsed && !isDrawerOpen) {
    return (
      <aside className={`${styles.propertiesPanel} ${styles.propertiesCollapsed}`}>
        <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => setIsCollapsed(false)}
            title="Buka Panel Properti & Pengaturan"
            aria-label="Buka Panel Properti & Pengaturan"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`${styles.propertiesPanel} ${
        isDrawerOpen ? styles.propertiesPanelOpen : ''
      }`}
    >
      <div className={styles.propertiesHeader}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedNode
            ? 'Properti Node'
            : selectedEdge
            ? 'Properti Garis'
            : 'Pengaturan Kanvas'}
        </span>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={() => {
            if (isDrawerOpen && onCloseDrawer) {
              onCloseDrawer();
            } else {
              setIsCollapsed(true);
            }
          }}
          title="Tutup Panel Properti"
          aria-label="Tutup Panel Properti"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.propertiesContent}>
        {readOnly && (
          <div
            style={{
              padding: '6px 12px',
              margin: '0 0 10px 0',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: 'var(--surface-muted)',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Lock size={12} />
            <span>Mode Lihat — Properti hanya untuk dibaca</span>
          </div>
        )}

        {/* 1. NODE PROPERTIES */}
        {selectedNode && nodeData && (
          <>
            {/* Task specific section if node is taskNode */}
            {selectedNode.type === 'taskNode' && (
              <div className={styles.propSection}>
                <div className={styles.propSectionTitle}>Tautan Task Proyek</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="text"
                    className={styles.propInput}
                    placeholder="Cari task proyek..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    disabled={readOnly}
                  />
                  <select
                    className={styles.propInput}
                    value={nodeData.taskId || ''}
                    disabled={readOnly}
                    onChange={(e) => {
                      const tId = parseInt(e.target.value, 10);
                      const t = projectTasks.find((item) => item.id === tId);
                      if (t) {
                        onUpdateNodeData(selectedNode.id, {
                          taskId: t.id,
                          taskNumber: t.taskNumber,
                          taskTitle: t.title,
                          taskStatus: t.status,
                          taskPriority: t.priority,
                          assigneeName: t.assigneeName || null,
                          dueDate: t.dueDate || null,
                          isNotFound: false,
                        });
                      }
                    }}
                  >
                    <option value="">-- Pilih Task --</option>
                    {filteredTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.taskNumber}] {t.title}
                      </option>
                    ))}
                  </select>

                  {nodeData.taskId && (
                    <button
                      type="button"
                      className={styles.backBtn}
                      style={{ justifyContent: 'center', marginTop: 4 }}
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent('flow:open-task-modal', {
                            detail: { taskId: nodeData.taskId },
                          })
                        );
                      }}
                    >
                      <span>Buka Detail Task</span>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* If regular node, allow converting to task */}
            {selectedNode.type !== 'taskNode' && !readOnly && (
              <div className={styles.propSection}>
                <button
                  type="button"
                  className={styles.backBtn}
                  style={{
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    borderColor: 'var(--primary-border)',
                    justifyContent: 'center',
                    fontWeight: 600,
                  }}
                  onClick={() => onConvertNodeToTask(selectedNode)}
                >
                  <PlusCircle size={14} />
                  <span>Jadikan Task Proyek</span>
                </button>
              </div>
            )}

            <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'inherit' }}>
            {/* Label input */}
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Label / Teks</div>
              <textarea
                className={styles.propInput}
                rows={2}
                value={nodeData.label || ''}
                onChange={(e) =>
                  onUpdateNodeData(selectedNode.id, { label: e.target.value })
                }
                placeholder="Teks label node..."
              />
            </div>

            {/* Typography */}
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Tipografi</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Ukuran Font</span>
                <input
                  type="number"
                  className={styles.propInput}
                  style={{ width: 65 }}
                  value={nodeData.fontSize || 13}
                  min={8}
                  max={48}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      fontSize: parseInt(e.target.value, 10) || 13,
                    })
                  }
                />
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Gaya Teks</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className={`${styles.toolbarBtn} ${
                      nodeData.fontWeight === 'bold' ? styles.toolbarBtnActive : ''
                    }`}
                    onClick={() =>
                      onUpdateNodeData(selectedNode.id, {
                        fontWeight:
                          nodeData.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.toolbarBtn} ${
                      nodeData.fontStyle === 'italic' ? styles.toolbarBtnActive : ''
                    }`}
                    onClick={() =>
                      onUpdateNodeData(selectedNode.id, {
                        fontStyle:
                          nodeData.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.toolbarBtn} ${
                      nodeData.textDecoration === 'underline'
                        ? styles.toolbarBtnActive
                        : ''
                    }`}
                    onClick={() =>
                      onUpdateNodeData(selectedNode.id, {
                        textDecoration:
                          nodeData.textDecoration === 'underline'
                            ? 'none'
                            : 'underline',
                      })
                    }
                  >
                    <Underline size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Perataan</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    className={`${styles.toolbarBtn} ${
                      nodeData.textAlign === 'left' ? styles.toolbarBtnActive : ''
                    }`}
                    onClick={() =>
                      onUpdateNodeData(selectedNode.id, { textAlign: 'left' })
                    }
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.toolbarBtn} ${
                      (!nodeData.textAlign || nodeData.textAlign === 'center')
                        ? styles.toolbarBtnActive
                        : ''
                    }`}
                    onClick={() =>
                      onUpdateNodeData(selectedNode.id, { textAlign: 'center' })
                    }
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.toolbarBtn} ${
                      nodeData.textAlign === 'right' ? styles.toolbarBtnActive : ''
                    }`}
                    onClick={() =>
                      onUpdateNodeData(selectedNode.id, { textAlign: 'right' })
                    }
                  >
                    <AlignRight size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Warna Teks</span>
                <div className={styles.colorPickerGroup}>
                  <input
                    type="color"
                    className={styles.colorBox}
                    value={nodeData.textColor || '#0f172a'}
                    onChange={(e) =>
                      onUpdateNodeData(selectedNode.id, {
                        textColor: e.target.value,
                      })
                    }
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {nodeData.textColor || '#0f172a'}
                  </span>
                </div>
              </div>
            </div>

            {/* Shape Style */}
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Warna & Batas</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Warna Isi (Fill)</span>
                <div className={styles.colorPickerGroup}>
                  <input
                    type="color"
                    className={styles.colorBox}
                    value={nodeData.fill || '#ffffff'}
                    onChange={(e) =>
                      onUpdateNodeData(selectedNode.id, { fill: e.target.value })
                    }
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {nodeData.fill || '#ffffff'}
                  </span>
                </div>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Warna Border</span>
                <div className={styles.colorPickerGroup}>
                  <input
                    type="color"
                    className={styles.colorBox}
                    value={nodeData.stroke || '#2563eb'}
                    onChange={(e) =>
                      onUpdateNodeData(selectedNode.id, { stroke: e.target.value })
                    }
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {nodeData.stroke || '#2563eb'}
                  </span>
                </div>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Tebal Garis</span>
                <input
                  type="number"
                  className={styles.propInput}
                  style={{ width: 65 }}
                  value={nodeData.strokeWidth ?? 2}
                  min={1}
                  max={12}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      strokeWidth: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Gaya Border</span>
                <select
                  className={styles.propInput}
                  value={nodeData.strokeStyle || 'solid'}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      strokeStyle: e.target.value as StrokeStyle,
                    })
                  }
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Opasitas</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={nodeData.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateNodeData(selectedNode.id, {
                      opacity: parseFloat(e.target.value),
                    })
                  }
                  style={{ width: 100 }}
                />
                <span style={{ fontSize: 11 }}>
                  {Math.round((nodeData.opacity ?? 1) * 100)}%
                </span>
              </div>
            </div>

            {/* Position & Size */}
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Posisi & Ukuran</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>X / Y</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="number"
                    className={styles.propInput}
                    style={{ width: 65 }}
                    value={Math.round(selectedNode.position.x)}
                    onChange={(e) =>
                      onUpdateNodePosition(
                        selectedNode.id,
                        parseInt(e.target.value, 10) || 0,
                        selectedNode.position.y
                      )
                    }
                  />
                  <input
                    type="number"
                    className={styles.propInput}
                    style={{ width: 65 }}
                    value={Math.round(selectedNode.position.y)}
                    onChange={(e) =>
                      onUpdateNodePosition(
                        selectedNode.id,
                        selectedNode.position.x,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                  />
                </div>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Lebar / Tinggi</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="number"
                    className={styles.propInput}
                    style={{ width: 65 }}
                    value={Math.round(selectedNode.width || 160)}
                    onChange={(e) =>
                      onUpdateNodeDimension(
                        selectedNode.id,
                        parseInt(e.target.value, 10) || 60,
                        selectedNode.height || 70
                      )
                    }
                  />
                  <input
                    type="number"
                    className={styles.propInput}
                    style={{ width: 65 }}
                    value={Math.round(selectedNode.height || 70)}
                    onChange={(e) =>
                      onUpdateNodeDimension(
                        selectedNode.id,
                        selectedNode.width || 160,
                        parseInt(e.target.value, 10) || 40
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Layering & Actions */}
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Urutan Layer & Aksi</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => onZOrderChange(selectedNode.id, 'front')}
                >
                  <ArrowUp size={13} />
                  <span>Ke Paling Atas</span>
                </button>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => onZOrderChange(selectedNode.id, 'back')}
                >
                  <ArrowDown size={13} />
                  <span>Ke Paling Bawah</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  type="button"
                  className={styles.backBtn}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() =>
                    onUpdateNodeData(selectedNode.id, {
                      locked: !nodeData.locked,
                    })
                  }
                >
                  {nodeData.locked ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>{nodeData.locked ? 'Buka Kunci' : 'Kunci Node'}</span>
                </button>
                <button
                  type="button"
                  className={styles.backBtn}
                  style={{
                    color: 'var(--error)',
                    borderColor: 'var(--error-subtle)',
                    background: 'var(--error-subtle)',
                  }}
                  onClick={onDeleteSelected}
                  title="Hapus node terpilih"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            </fieldset>
          </>
        )}

        {/* 2. EDGE PROPERTIES */}
        {selectedEdge && (
          <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'inherit' }}>
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Label Garis</div>
              <input
                type="text"
                className={styles.propInput}
                value={
                  typeof edgeData?.label === 'string'
                    ? edgeData.label
                    : typeof selectedEdge.label === 'string'
                    ? selectedEdge.label
                    : ''
                }
                onChange={(e) =>
                  onUpdateEdgeData(selectedEdge.id, { label: e.target.value })
                }
                placeholder="Contoh: Ya / Tidak"
              />
            </div>

            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Tipe Garis</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Bentuk</span>
                <select
                  className={styles.propInput}
                  value={edgeData?.lineType || 'smoothstep'}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      lineType: e.target.value as LineType,
                    })
                  }
                >
                  <option value="smoothstep">Smooth Step</option>
                  <option value="step">Step (Siku-siku)</option>
                  <option value="bezier">Kurva Bezier</option>
                  <option value="straight">Lurus</option>
                </select>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Gaya Garis</span>
                <select
                  className={styles.propInput}
                  value={edgeData?.strokeStyle || 'solid'}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      strokeStyle: e.target.value as StrokeStyle,
                    })
                  }
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Putus-putus (Dashed)</option>
                  <option value="dotted">Titik-titik (Dotted)</option>
                </select>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Tebal Garis</span>
                <input
                  type="number"
                  className={styles.propInput}
                  style={{ width: 65 }}
                  value={edgeData?.strokeWidth || 2}
                  min={1}
                  max={8}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      strokeWidth: parseInt(e.target.value, 10) || 1,
                    })
                  }
                />
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Warna</span>
                <div className={styles.colorPickerGroup}>
                  <input
                    type="color"
                    className={styles.colorBox}
                    value={edgeData?.stroke || '#64748b'}
                    onChange={(e) =>
                      onUpdateEdgeData(selectedEdge.id, { stroke: e.target.value })
                    }
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {edgeData?.stroke || '#64748b'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Panah & Efek</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Panah Akhir</span>
                <select
                  className={styles.propInput}
                  value={activeMarkerEnd}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      markerEnd: e.target.value as ArrowMarkerType,
                    })
                  }
                >
                  <option value="arrowclosed">Panah Tertutup</option>
                  <option value="arrow">Panah Terbuka</option>
                  <option value="circle">Lingkaran</option>
                  <option value="none">Tanpa Panah</option>
                </select>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Panah Awal</span>
                <select
                  className={styles.propInput}
                  value={activeMarkerStart}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      markerStart: e.target.value as ArrowMarkerType,
                    })
                  }
                >
                  <option value="none">Tanpa Panah</option>
                  <option value="arrowclosed">Panah Tertutup</option>
                  <option value="arrow">Panah Terbuka</option>
                  <option value="circle">Lingkaran</option>
                </select>
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Animasi Alur</span>
                <input
                  type="checkbox"
                  checked={Boolean(edgeData?.animated)}
                  onChange={(e) =>
                    onUpdateEdgeData(selectedEdge.id, {
                      animated: e.target.checked,
                    })
                  }
                />
              </div>

              {Boolean(edgeData?.animated) && (
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Arah Animasi</span>
                  <select
                    className={styles.propInput}
                    value={edgeData?.animationMode || 'oneway'}
                    onChange={(e) =>
                      onUpdateEdgeData(selectedEdge.id, {
                        animationMode: e.target.value as EdgeAnimationMode,
                      })
                    }
                  >
                    <option value="oneway">Satu arah</option>
                    <option value="reverse">Terbalik</option>
                    <option value="pingpong">Bolak-balik</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                className={styles.backBtn}
                style={{
                  color: 'var(--error)',
                  borderColor: 'var(--error-subtle)',
                  background: 'var(--error-subtle)',
                  justifyContent: 'center',
                  marginTop: 8,
                }}
                onClick={onDeleteSelected}
              >
                <Trash2 size={14} />
                <span>Hapus Garis</span>
              </button>
            </div>
          </fieldset>
        )}

        {/* 3. CANVAS SETTINGS (when nothing is selected) */}
        {!selectedNode && !selectedEdge && (
          <>
            <fieldset disabled={readOnly} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'inherit' }}>
            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Kisi-kisi (Grid)</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Tampilkan Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => onShowGridChange(e.target.checked)}
                />
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Snap ke Grid</span>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => onSnapToGridChange(e.target.checked)}
                />
              </div>

              <div className={styles.propRow}>
                <span className={styles.propLabel}>Ukuran Grid</span>
                <select
                  className={styles.propInput}
                  value={gridSize}
                  onChange={(e) =>
                    onGridSizeChange(parseInt(e.target.value, 10) || 15)
                  }
                >
                  <option value="10">10 px</option>
                  <option value="15">15 px (Default)</option>
                  <option value="20">20 px</option>
                  <option value="25">25 px</option>
                </select>
              </div>
            </div>

            <div className={styles.propSection}>
              <div className={styles.propSectionTitle}>Latar Belakang Kanvas</div>
              <div className={styles.propRow}>
                <span className={styles.propLabel}>Warna Latar</span>
                <div className={styles.colorPickerGroup}>
                  <input
                    type="color"
                    className={styles.colorBox}
                    value={canvasBg || '#f8fafc'}
                    onChange={(e) => onCanvasBgChange(e.target.value)}
                  />
                  <span style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    {canvasBg || '#f8fafc'}
                  </span>
                </div>
              </div>
            </div>
            </fieldset>

            <div className={styles.propSection}>
              <button
                type="button"
                onClick={() => setIsTipsOpen((prev) => !prev)}
                className={styles.tipsToggleBtn}
                aria-expanded={isTipsOpen}
                title="Buka / Tutup Petunjuk Cepat"
              >
                <span>Petunjuk Cepat</span>
                {isTipsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {isTipsOpen && (
                <div className={styles.tipsContent}>
                  • <strong>Klik dua kali</strong> pada kanvas kosong untuk menambahkan node proses.<br />
                  • <strong>Tarik & lepas</strong> bentuk dari panel kiri ke kanvas.<br />
                  • Gunakan <strong>Shift + Klik</strong> atau seret area untuk memilih banyak node.<br />
                  • Sambungkan handle di tepi node untuk membuat garis penghubung.<br />
                  • Tekan <strong>Delete</strong> atau <strong>Backspace</strong> untuk menghapus elemen.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
