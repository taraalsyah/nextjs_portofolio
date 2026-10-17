'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Square,
  Circle,
  Diamond,
  Database,
  FileText,
  Clock,
  Layers,
  MessageSquare,
  StickyNote,
  CheckSquare,
  Flag,
  UserCheck,
  Type,
  Cloud,
  Hexagon,
  Triangle,
} from 'lucide-react';
import { FlowShapeType } from '@/types/flow';
import { Tooltip } from '@/components/ui/Tooltip';
import styles from './flowComponents.module.css';

// Miniature SVG Shape Previews
const ParallelogramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 20 9 4 21 4 17 20 5 20" />
  </svg>
);

const RoundedRectIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="4" />
  </svg>
);

const RectIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" />
  </svg>
);

const StartEndIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6" width="18" height="12" rx="6" />
  </svg>
);

const SubprocessIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="1" />
    <line x1="7" y1="5" x2="7" y2="19" />
    <line x1="17" y1="5" x2="17" y2="19" />
  </svg>
);

const DocumentIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v13c-2.5-1.5-5.5 0-8 0s-5.5-1.5-8 0V4z" />
  </svg>
);

const DelayIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h8a6 6 0 0 1 0 12H4V6z" />
  </svg>
);

interface ShapeItemDef {
  type: string; // 'shapeNode' | 'taskNode' | 'stickyNoteNode' | 'groupNode' | 'milestoneNode' | 'roleNode' | 'textNode'
  shapeType: FlowShapeType;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultFill?: string;
  defaultStroke?: string;
  category: 'flowchart' | 'basic' | 'annotation' | 'project';
}

const SHAPE_DEFINITIONS: ShapeItemDef[] = [
  // Flowchart
  {
    type: 'shapeNode',
    shapeType: 'startEnd',
    label: 'Mulai / Selesai',
    icon: StartEndIcon,
    defaultWidth: 140,
    defaultHeight: 60,
    defaultFill: '#dbeafe',
    defaultStroke: '#2563eb',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'process',
    label: 'Proses',
    icon: RectIcon,
    defaultWidth: 160,
    defaultHeight: 70,
    defaultFill: '#ffffff',
    defaultStroke: '#2563eb',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'decision',
    label: 'Keputusan',
    icon: Diamond,
    defaultWidth: 140,
    defaultHeight: 90,
    defaultFill: '#fef3c7',
    defaultStroke: '#d97706',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'inputOutput',
    label: 'Input / Output',
    icon: ParallelogramIcon,
    defaultWidth: 160,
    defaultHeight: 70,
    defaultFill: '#f0fdf4',
    defaultStroke: '#16a34a',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'document',
    label: 'Dokumen',
    icon: DocumentIcon,
    defaultWidth: 150,
    defaultHeight: 75,
    defaultFill: '#faf5ff',
    defaultStroke: '#9333ea',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'database',
    label: 'Basis Data',
    icon: Database,
    defaultWidth: 130,
    defaultHeight: 80,
    defaultFill: '#e0e7ff',
    defaultStroke: '#4f46e5',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'predefinedProcess',
    label: 'Subproses',
    icon: SubprocessIcon,
    defaultWidth: 160,
    defaultHeight: 70,
    defaultFill: '#ffffff',
    defaultStroke: '#0284c7',
    category: 'flowchart',
  },
  {
    type: 'shapeNode',
    shapeType: 'delay',
    label: 'Penundaan (Delay)',
    icon: DelayIcon,
    defaultWidth: 140,
    defaultHeight: 60,
    defaultFill: '#f1f5f9',
    defaultStroke: '#64748b',
    category: 'flowchart',
  },

  // Basic Shapes
  {
    type: 'shapeNode',
    shapeType: 'rectangle',
    label: 'Persegi Panjang',
    icon: RectIcon,
    defaultWidth: 150,
    defaultHeight: 70,
    defaultFill: '#ffffff',
    defaultStroke: '#334155',
    category: 'basic',
  },
  {
    type: 'shapeNode',
    shapeType: 'roundedRectangle',
    label: 'Kotak Membulat',
    icon: RoundedRectIcon,
    defaultWidth: 150,
    defaultHeight: 70,
    defaultFill: '#ffffff',
    defaultStroke: '#334155',
    category: 'basic',
  },
  {
    type: 'shapeNode',
    shapeType: 'ellipse',
    label: 'Elips / Lingkaran',
    icon: Circle,
    defaultWidth: 120,
    defaultHeight: 70,
    defaultFill: '#ffffff',
    defaultStroke: '#334155',
    category: 'basic',
  },
  {
    type: 'shapeNode',
    shapeType: 'triangle',
    label: 'Segitiga',
    icon: Triangle,
    defaultWidth: 120,
    defaultHeight: 80,
    defaultFill: '#ffffff',
    defaultStroke: '#334155',
    category: 'basic',
  },
  {
    type: 'shapeNode',
    shapeType: 'hexagon',
    label: 'Heksagon',
    icon: Hexagon,
    defaultWidth: 140,
    defaultHeight: 80,
    defaultFill: '#ffffff',
    defaultStroke: '#334155',
    category: 'basic',
  },
  {
    type: 'shapeNode',
    shapeType: 'cloud',
    label: 'Awan',
    icon: Cloud,
    defaultWidth: 150,
    defaultHeight: 90,
    defaultFill: '#f8fafc',
    defaultStroke: '#64748b',
    category: 'basic',
  },

  // Annotations
  {
    type: 'textNode',
    shapeType: 'text',
    label: 'Teks Bebas',
    icon: Type,
    defaultWidth: 120,
    defaultHeight: 40,
    defaultFill: 'transparent',
    defaultStroke: 'transparent',
    category: 'annotation',
  },
  {
    type: 'stickyNoteNode',
    shapeType: 'stickyNote',
    label: 'Sticky Note',
    icon: StickyNote,
    defaultWidth: 150,
    defaultHeight: 110,
    defaultFill: '#fef08a',
    defaultStroke: '#eab308',
    category: 'annotation',
  },
  {
    type: 'groupNode',
    shapeType: 'swimlane',
    label: 'Swimlane / Grup',
    icon: Layers,
    defaultWidth: 400,
    defaultHeight: 250,
    defaultFill: 'rgba(241, 245, 249, 0.6)',
    defaultStroke: '#94a3b8',
    category: 'annotation',
  },
  {
    type: 'shapeNode',
    shapeType: 'callout',
    label: 'Callout Balon',
    icon: MessageSquare,
    defaultWidth: 160,
    defaultHeight: 80,
    defaultFill: '#ffffff',
    defaultStroke: '#2563eb',
    category: 'annotation',
  },

  // Project Integration
  {
    type: 'taskNode',
    shapeType: 'task',
    label: 'Node Task Proyek',
    icon: CheckSquare,
    defaultWidth: 240,
    defaultHeight: 125,
    category: 'project',
  },
  {
    type: 'milestoneNode',
    shapeType: 'milestone',
    label: 'Node Milestone',
    icon: Flag,
    defaultWidth: 180,
    defaultHeight: 52,
    defaultFill: '#ffffff',
    defaultStroke: '#8b5cf6',
    category: 'project',
  },
  {
    type: 'roleNode',
    shapeType: 'role',
    label: 'Peran / Orang',
    icon: UserCheck,
    defaultWidth: 170,
    defaultHeight: 46,
    defaultFill: '#ffffff',
    defaultStroke: '#e2e8f0',
    category: 'project',
  },
];

interface ShapePaletteProps {
  onAddNode: (item: ShapeItemDef) => void;
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ShapePalette({
  onAddNode,
  isDrawerOpen = false,
  onCloseDrawer,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}: ShapePaletteProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (isDrawerOpen && onCloseDrawer) {
      onCloseDrawer();
    } else if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  const isRail = isCollapsed && !isDrawerOpen;
  const [search, setSearch] = useState('');

  const filteredShapes = useMemo(() => {
    if (!search.trim()) return SHAPE_DEFINITIONS;
    const q = search.trim().toLowerCase();
    return SHAPE_DEFINITIONS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.shapeType.toLowerCase().includes(q)
    );
  }, [search]);

  const onDragStart = (e: React.DragEvent, item: ShapeItemDef) => {
    e.dataTransfer.setData('application/reactflow/type', item.type);
    e.dataTransfer.setData('application/reactflow/shape', item.shapeType);
    e.dataTransfer.setData('application/reactflow/label', item.label);
    e.dataTransfer.setData('application/reactflow/width', String(item.defaultWidth || 150));
    e.dataTransfer.setData('application/reactflow/height', String(item.defaultHeight || 70));
    if (item.defaultFill) e.dataTransfer.setData('application/reactflow/fill', item.defaultFill);
    if (item.defaultStroke) e.dataTransfer.setData('application/reactflow/stroke', item.defaultStroke);
    e.dataTransfer.effectAllowed = 'move';
  };

  const categories = [
    { key: 'flowchart', label: 'Flowchart' },
    { key: 'basic', label: 'Bentuk Dasar' },
    { key: 'annotation', label: 'Anotasi & Kontainer' },
    { key: 'project', label: 'Integrasi Proyek' },
  ] as const;

  return (
    <aside
      className={`${styles.paletteSidebar} ${
        isRail ? styles.paletteCollapsed : ''
      } ${isDrawerOpen ? styles.paletteSidebarOpen : ''}`}
    >
      {/* 1. RAIL VIEW (when collapsed into a 48px rail) */}
      {isRail && (
        <>
          <div className={styles.railHeader}>
            <Tooltip position="right" delay={200} content="Tampilkan panel">
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={handleToggle}
                title="Tampilkan panel"
                aria-label="Tampilkan panel bentuk"
                aria-expanded={false}
              >
                <ChevronRight size={18} />
              </button>
            </Tooltip>
          </div>

          <div className={styles.railCategories}>
            <Tooltip position="right" delay={200} content="Flowchart - Klik untuk buka">
              <button
                type="button"
                className={styles.railCategoryBtn}
                onClick={handleToggle}
                aria-label="Kategori Flowchart"
              >
                <Layers size={16} />
              </button>
            </Tooltip>
            <Tooltip position="right" delay={200} content="Bentuk Dasar - Klik untuk buka">
              <button
                type="button"
                className={styles.railCategoryBtn}
                onClick={handleToggle}
                aria-label="Kategori Bentuk Dasar"
              >
                <Square size={16} />
              </button>
            </Tooltip>
            <Tooltip position="right" delay={200} content="Anotasi & Kontainer - Klik untuk buka">
              <button
                type="button"
                className={styles.railCategoryBtn}
                onClick={handleToggle}
                aria-label="Kategori Anotasi & Kontainer"
              >
                <StickyNote size={16} />
              </button>
            </Tooltip>
            <Tooltip position="right" delay={200} content="Integrasi Proyek - Klik untuk buka">
              <button
                type="button"
                className={styles.railCategoryBtn}
                onClick={handleToggle}
                aria-label="Kategori Integrasi Proyek"
              >
                <UserCheck size={16} />
              </button>
            </Tooltip>
          </div>
        </>
      )}

      {/* 2. FULL VIEW (when expanded, kept in DOM to preserve search input & scroll position) */}
      <div
        style={{
          display: isRail ? 'none' : 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div className={styles.paletteHeader}>
          <span>Panel Bentuk</span>
          <Tooltip position="right" delay={200} content="Sembunyikan panel">
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={handleToggle}
              title="Sembunyikan panel"
              aria-label="Sembunyikan panel bentuk"
              aria-expanded={true}
            >
              <ChevronLeft size={16} />
            </button>
          </Tooltip>
        </div>

        <div className={styles.paletteSearch}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className={styles.paletteSearchInput}
              placeholder="Cari bentuk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              size={14}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

      <div className={styles.paletteContent}>
        {categories.map((cat) => {
          const shapes = filteredShapes.filter((s) => s.category === cat.key);
          if (shapes.length === 0) return null;

          return (
            <div key={cat.key} className={styles.shapeCategory}>
              <div className={styles.categoryTitle}>{cat.label}</div>
              <div className={styles.shapeGrid}>
                {shapes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Tooltip
                      key={item.shapeType}
                      position="right"
                      delay={400}
                      maxWidth={200}
                      content={
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                            {item.label}
                          </div>
                          <div style={{ color: 'var(--muted-foreground)', fontSize: '11px', marginTop: 1 }}>
                            Tarik ke kanvas atau klik untuk menambah
                          </div>
                        </div>
                      }
                    >
                      <div
                        className={styles.shapeItem}
                        draggable
                        tabIndex={0}
                        role="button"
                        aria-label={item.label}
                        onDragStart={(e) => onDragStart(e, item)}
                        onClick={() => onAddNode(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onAddNode(item);
                          }
                        }}
                      >
                        <Icon size={18} />
                        <span className={styles.shapeItemLabel}>{item.label}</span>
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </aside>
  );
}
