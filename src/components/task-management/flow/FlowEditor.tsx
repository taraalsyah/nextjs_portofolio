'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlowProvider,
  useReactFlow,
  useOnViewportChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit2,
} from 'lucide-react';
import { AppNode, AppEdge, FlowData, FlowDetail, ArrowMarkerType } from '@/types/flow';
import { useFlowHistory } from '@/hooks/flow/useFlowHistory';
import { useFlowClipboard } from '@/hooks/flow/useFlowClipboard';
import { useFlowShortcuts } from '@/hooks/flow/useFlowShortcuts';
import { useFlowAutosave } from '@/hooks/flow/useFlowAutosave';
import { getAutoLayout, alignNodes, distributeNodes, AlignmentType, DistributionType, LayoutDirection } from '@/lib/flow/layout';
import { generateThumbnail } from '@/lib/flow/export';
import {
  normalizeEdges,
  buildEdgeMarker,
  getArrowMarkerType,
} from '@/lib/flow/edgeMarkers';
import { FlowToolbar } from './FlowToolbar';
import { ShapePalette } from './ShapePalette';
import { PropertiesPanel } from './PropertiesPanel';
import { FlowCanvas } from './FlowCanvas';
import { FlowContextMenu, ContextMenuPosition } from './FlowContextMenu';
import { ExportDialog } from './ExportDialog';
import { ImportDialog } from './ImportDialog';
import { FlowTemplateModal } from './FlowTemplateModal';
import { CreateTaskFromNodeModal } from './CreateTaskFromNodeModal';
import { TaskDetailModal } from '@/components/task-management/TaskDetailModal';
import { useSafeToast } from '@/components/ui/Toast';
import styles from './flowComponents.module.css';

interface FlowEditorProps {
  initialFlow: FlowDetail;
  onBack: () => void;
  readOnly?: boolean;
  canEdit?: boolean;
  mode?: 'view' | 'edit';
  onToggleMode?: (targetMode: 'view' | 'edit') => void;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
  activeProjectId?: number;
  currentUserId: number;
}

function FlowEditorInner({
  initialFlow,
  onBack,
  readOnly = false,
  canEdit = false,
  mode = 'edit',
  onToggleMode,
  categories,
  users,
  activeProjectId,
  currentUserId,
}: FlowEditorProps) {
  const { screenToFlowPosition, zoomIn, zoomOut, zoomTo, fitView, getViewport } = useReactFlow();
  const toastCtx = useSafeToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const [flowName, setFlowName] = useState(initialFlow.name);
  const [version, setVersion] = useState(initialFlow.version);
  const [nodes, setNodes] = useState<AppNode[]>(initialFlow.data?.nodes || []);
  const [edges, setEdges] = useState<AppEdge[]>(() =>
    normalizeEdges(initialFlow.data?.edges || [])
  );

  // Track initialized flowId to prevent canvas reset when parent re-renders
  const initializedFlowIdRef = useRef<number | null>(initialFlow.id);

  useEffect(() => {
    if (initializedFlowIdRef.current !== initialFlow.id) {
      initializedFlowIdRef.current = initialFlow.id;
      setFlowName(initialFlow.name);
      setVersion(initialFlow.version);
      setNodes(initialFlow.data?.nodes || []);
      setEdges(normalizeEdges(initialFlow.data?.edges || []));
      if (initialFlow.data?.gridSize) setGridSize(initialFlow.data.gridSize);
      if (initialFlow.data?.snapToGrid !== undefined) setSnapToGrid(initialFlow.data.snapToGrid);
      if (initialFlow.data?.showGrid !== undefined) setShowGrid(initialFlow.data.showGrid);
      if (initialFlow.data?.backgroundColor) setCanvasBg(initialFlow.data.backgroundColor);
    }
  }, [initialFlow.id, initialFlow.name, initialFlow.version, initialFlow.data]);

  // Canvas settings
  const [gridSize, setGridSize] = useState<number>(initialFlow.data?.gridSize || 15);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(initialFlow.data?.snapToGrid ?? true);
  const [showGrid, setShowGrid] = useState<boolean>(initialFlow.data?.showGrid ?? true);
  const [canvasBg, setCanvasBg] = useState<string>(initialFlow.data?.backgroundColor || '#f8fafc');
  const [showMinimap, setShowMinimap] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return true;
  });
  const [currentZoom, setCurrentZoom] = useState<number>(initialFlow.data?.viewport?.zoom || 1);

  useOnViewportChange({
    onChange: useCallback((vp: { zoom: number }) => {
      setCurrentZoom(vp.zoom);
    }, []),
  });

  // Responsive & Drawer State
  const [containerWidth, setContainerWidth] = useState<number>(1400);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState<boolean>(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState<boolean>(false);
  const isDrawerMode = containerWidth < 1024;

  // Shape Palette Collapse State (persisted in localStorage)
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flow-shape-panel-collapsed');
      if (saved !== null) {
        setIsPaletteCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const togglePaletteCollapse = useCallback(() => {
    setIsPaletteCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('flow-shape-panel-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Track container width for responsive drawer mode without resetting canvas viewport/zoom
  useEffect(() => {
    if (!editorRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(editorRef.current);
    return () => {
      ro.disconnect();
    };
  }, []);

  // Selection
  const [selectedNodes, setSelectedNodes] = useState<AppNode[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<AppEdge[]>([]);

  // Project tasks for taskNode linking
  const [projectTasks, setProjectTasks] = useState<any[]>([]);

  // Modals & Context Menu
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [nodeToTaskConvert, setNodeToTaskConvert] = useState<AppNode | null>(null);
  const [taskDetailId, setTaskDetailId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  // History & Clipboard
  const { canUndo, canRedo, undo, redo, takeSnapshot } = useFlowHistory(
    initialFlow.data?.nodes || [],
    initialFlow.data?.edges || []
  );
  const { hasClipboardData, copy, paste, duplicate } = useFlowClipboard();

  // Fetch project tasks for Task selector dropdown
  const fetchTasks = useCallback(async () => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/tasks?mode=all&limit=100&projectId=${activeProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setProjectTasks(
          (data.tasks || []).map((t: any) => ({
            id: t.id,
            taskNumber: t.taskNumber,
            title: t.title,
            status: t.status,
            priority: t.priority,
            assigneeName: t.assignee?.name || null,
            dueDate: t.dueDate,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch project tasks for flow:', err);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Listen to open-task-modal events from TaskNode
  useEffect(() => {
    const handleOpenTask = (e: Event) => {
      const customEvent = e as CustomEvent<{ taskId: number }>;
      if (customEvent.detail?.taskId) {
        setTaskDetailId(customEvent.detail.taskId);
      }
    };

    window.addEventListener('flow:open-task-modal', handleOpenTask);
    return () => window.removeEventListener('flow:open-task-modal', handleOpenTask);
  }, []);

  // Save flow payload
  const currentFlowData = useCallback((): FlowData => {
    return {
      nodes,
      edges,
      viewport: getViewport(),
      gridSize,
      snapToGrid,
      showGrid,
      backgroundColor: canvasBg,
    };
  }, [nodes, edges, getViewport, gridSize, snapToGrid, showGrid, canvasBg]);

  const saveFlow = useCallback(
    async (dataToSave: FlowData, nameToSave: string): Promise<boolean> => {
      if (readOnly) return true;

      try {
        const wrapperEl = document.querySelector(`.${styles.canvasArea}`) as HTMLElement;
        let thumbnail: string | null = null;
        if (wrapperEl) {
          thumbnail = await generateThumbnail(wrapperEl);
        }

        const res = await fetch(`/api/flows/${initialFlow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: nameToSave.trim() || 'Diagram Alur',
            data: dataToSave,
            version,
            thumbnail,
          }),
        });

        if (res.status === 403) {
          toastCtx?.showToast(
            'Anda tidak memiliki izin mengedit flow ini.',
            'error'
          );
          onToggleMode?.('view');
          return false;
        }

        if (res.status === 409) {
          toastCtx?.showToast(
            'Konflik Versi: Diagram telah diperbarui oleh sesi lain. Harap muat ulang halaman.',
            'error'
          );
          return false;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          toastCtx?.showToast(errData.error || 'Gagal menyimpan diagram.', 'error');
          return false;
        }

        const responseData = await res.json();
        if (responseData.flow) {
          setVersion(responseData.flow.version);
        }
        return true;
      } catch (err) {
        console.error('Failed to save flow:', err);
        return false;
      }
    },
    [initialFlow.id, version, readOnly, toastCtx, onToggleMode]
  );

  // Autosave
  const { status: autosaveStatus, isDirty, triggerManualSave } = useFlowAutosave({
    flowId: initialFlow.id,
    flowData: currentFlowData(),
    flowName,
    version,
    onSave: saveFlow,
    enabled: !readOnly,
  });

  // Node & Edge Changes
  const onNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds) as AppNode[];
        // Check if any change was drag end or dimension change to take snapshot
        const hasMajorChange = changes.some(
          (c) =>
            (c.type === 'position' && !c.dragging) ||
            c.type === 'dimensions' ||
            c.type === 'remove'
        );
        if (hasMajorChange) {
          takeSnapshot(nextNodes, edges);
        }
        return nextNodes;
      });
    },
    [edges, takeSnapshot]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<AppEdge>[]) => {
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds) as AppEdge[];
        const hasMajorChange = changes.some((c) => c.type === 'remove');
        if (hasMajorChange) {
          takeSnapshot(nodes, nextEdges);
        }
        return nextEdges;
      });
    },
    [nodes, takeSnapshot]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const defaultStroke = '#64748b';
      const defaultStrokeWidth = 2;
      const defaultMarkerEnd: ArrowMarkerType = 'arrowclosed';

      const newEdge: AppEdge = {
        ...connection,
        id: `e_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'customEdge',
        data: {
          lineType: 'smoothstep',
          stroke: defaultStroke,
          strokeWidth: defaultStrokeWidth,
          markerEnd: defaultMarkerEnd,
          markerStart: 'none',
          animationMode: 'oneway',
        },
        markerEnd: buildEdgeMarker(defaultMarkerEnd, defaultStroke, defaultStrokeWidth),
        markerStart: undefined,
        style: {
          stroke: defaultStroke,
          strokeWidth: defaultStrokeWidth,
        },
      } as AppEdge;

      setEdges((eds) => {
        const nextEdges = addEdge(newEdge, eds) as AppEdge[];
        takeSnapshot(nodes, nextEdges, true);
        return nextEdges;
      });
    },
    [nodes, takeSnapshot]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: AppNode[]; edges: AppEdge[] }) => {
      setSelectedNodes(selNodes);
      setSelectedEdges(selEdges);
    },
    []
  );

  // Undo / Redo Execution
  const handleUndo = useCallback(() => {
    const snap = undo();
    if (snap) {
      setNodes(snap.nodes);
      setEdges(snap.edges);
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const snap = redo();
    if (snap) {
      setNodes(snap.nodes);
      setEdges(snap.edges);
    }
  }, [redo]);

  // Copy / Cut / Paste / Duplicate
  const handleCopy = useCallback(() => {
    copy(selectedNodes, edges);
    toastCtx?.showToast('Bentuk disalin ke papan klip', 'info');
  }, [copy, selectedNodes, edges, toastCtx]);

  const handleCut = useCallback(() => {
    copy(selectedNodes, edges);
    const selIds = new Set(selectedNodes.map((n) => n.id));
    const nextNodes = nodes.filter((n) => !selIds.has(n.id));
    const nextEdges = edges.filter((e) => !selIds.has(e.source) && !selIds.has(e.target));
    setNodes(nextNodes);
    setEdges(nextEdges);
    takeSnapshot(nextNodes, nextEdges, true);
    toastCtx?.showToast('Bentuk dipotong', 'info');
  }, [copy, selectedNodes, edges, nodes, takeSnapshot, toastCtx]);

  const handlePaste = useCallback(() => {
    const result = paste();
    if (result) {
      const nextNodes = [...nodes, ...result.newNodes];
      const nextEdges = [...edges, ...result.newEdges];
      setNodes(nextNodes);
      setEdges(nextEdges);
      takeSnapshot(nextNodes, nextEdges, true);
    }
  }, [paste, nodes, edges, takeSnapshot]);

  const handleDuplicate = useCallback(() => {
    const result = duplicate(selectedNodes, edges);
    if (result) {
      const nextNodes = [...nodes, ...result.newNodes];
      const nextEdges = [...edges, ...result.newEdges];
      setNodes(nextNodes);
      setEdges(nextEdges);
      takeSnapshot(nextNodes, nextEdges, true);
    }
  }, [duplicate, selectedNodes, edges, nodes, takeSnapshot]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    const nodeIds = new Set(selectedNodes.map((n) => n.id));
    const edgeIds = new Set(selectedEdges.map((e) => e.id));

    const nextNodes = nodes.filter((n) => !nodeIds.has(n.id));
    const nextEdges = edges.filter(
      (e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)
    );

    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodes([]);
    setSelectedEdges([]);
    takeSnapshot(nextNodes, nextEdges, true);
  }, [selectedNodes, selectedEdges, nodes, edges, takeSnapshot]);

  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleNudge = useCallback((dx: number, dy: number) => {
    if (selectedNodes.length === 0) return;
    const selIds = new Set(selectedNodes.map((n) => n.id));
    setNodes((nds) =>
      nds.map((n) =>
        selIds.has(n.id)
          ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
          : n
      )
    );
  }, [selectedNodes]);

  // Keyboard Shortcuts Hook
  useFlowShortcuts({
    onUndo: readOnly ? undefined : handleUndo,
    onRedo: readOnly ? undefined : handleRedo,
    onCopy: handleCopy,
    onCut: readOnly ? undefined : handleCut,
    onPaste: readOnly ? undefined : handlePaste,
    onDuplicate: readOnly ? undefined : handleDuplicate,
    onDelete: readOnly ? undefined : handleDeleteSelected,
    onSelectAll: handleSelectAll,
    onSave: readOnly ? undefined : triggerManualSave,
    onFitView: handleFitView,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onNudge: readOnly ? undefined : handleNudge,
    enabled: true,
  });

  // Adding node from Palette drag or click
  const handleAddNodeFromDef = useCallback(
    (item: any, positionOverride?: { x: number; y: number }) => {
      let position = positionOverride;
      if (!position) {
        const vp = getViewport();
        position = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }

      const newNodeId = `node_${Date.now()}`;
      const newNode: AppNode = {
        id: newNodeId,
        type: item.type,
        position,
        width: item.defaultWidth || 150,
        height: item.defaultHeight || 70,
        data: {
          label: item.label,
          shapeType: item.shapeType,
          fill: item.defaultFill || '#ffffff',
          stroke: item.defaultStroke || '#2563eb',
          strokeWidth: 2,
        },
      };

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        takeSnapshot(nextNodes, edges, true);
        return nextNodes;
      });
    },
    [getViewport, screenToFlowPosition, edges, takeSnapshot]
  );

  const onDropFromPalette = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/reactflow/type');
      const shape = e.dataTransfer.getData('application/reactflow/shape');
      const label = e.dataTransfer.getData('application/reactflow/label');
      const width = parseInt(e.dataTransfer.getData('application/reactflow/width'), 10) || 150;
      const height = parseInt(e.dataTransfer.getData('application/reactflow/height'), 10) || 70;
      const fill = e.dataTransfer.getData('application/reactflow/fill') || '#ffffff';
      const stroke = e.dataTransfer.getData('application/reactflow/stroke') || '#2563eb';

      if (!type) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: AppNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        width,
        height,
        data: {
          label,
          shapeType: shape as any,
          fill,
          stroke,
          strokeWidth: 2,
        },
      };

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        takeSnapshot(nextNodes, edges, true);
        return nextNodes;
      });
    },
    [screenToFlowPosition, edges, takeSnapshot]
  );

  const onDoubleClickPane = useCallback(
    (e: React.MouseEvent) => {
      if (readOnly) return;
      // Add a standard Process node on double click in empty space
      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const newNode: AppNode = {
        id: `node_${Date.now()}`,
        type: 'shapeNode',
        position,
        width: 160,
        height: 70,
        data: {
          label: 'Proses Baru',
          shapeType: 'process',
          fill: '#ffffff',
          stroke: '#2563eb',
          strokeWidth: 2,
        },
      };

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        takeSnapshot(nextNodes, edges, true);
        return nextNodes;
      });
    },
    [screenToFlowPosition, edges, takeSnapshot, readOnly]
  );

  // Auto Layout
  const handleAutoLayout = useCallback(
    (direction: LayoutDirection) => {
      const result = getAutoLayout(nodes, edges, direction);
      setNodes(result.nodes);
      setEdges(result.edges);
      takeSnapshot(result.nodes, result.edges, true);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
      toastCtx?.showToast(`Tata letak otomatis (${direction}) diterapkan`, 'success');
    },
    [nodes, edges, takeSnapshot, fitView, toastCtx]
  );

  // Align & Distribute
  const handleAlign = useCallback(
    (type: AlignmentType) => {
      if (selectedNodes.length < 2) return;
      const aligned = alignNodes(selectedNodes, type);
      const alignedMap = new Map(aligned.map((n) => [n.id, n]));
      const nextNodes = nodes.map((n) => alignedMap.get(n.id) || n);
      setNodes(nextNodes);
      takeSnapshot(nextNodes, edges, true);
    },
    [selectedNodes, nodes, edges, takeSnapshot]
  );

  const handleDistribute = useCallback(
    (type: DistributionType) => {
      if (selectedNodes.length < 3) return;
      const distributed = distributeNodes(selectedNodes, type);
      const distMap = new Map(distributed.map((n) => [n.id, n]));
      const nextNodes = nodes.map((n) => distMap.get(n.id) || n);
      setNodes(nextNodes);
      takeSnapshot(nextNodes, edges, true);
    },
    [selectedNodes, nodes, edges, takeSnapshot]
  );

  // Z-Order
  const handleZOrderChange = useCallback(
    (nodeId: string, action: 'front' | 'back' | 'forward' | 'backward') => {
      setNodes((nds) => {
        const idx = nds.findIndex((n) => n.id === nodeId);
        if (idx === -1) return nds;

        const copyNds = [...nds];
        const [target] = copyNds.splice(idx, 1);

        if (action === 'front') {
          copyNds.push(target);
        } else if (action === 'back') {
          copyNds.unshift(target);
        }

        takeSnapshot(copyNds, edges, true);
        return copyNds;
      });
    },
    [edges, takeSnapshot]
  );

  // Grouping
  const handleGroup = useCallback(() => {
    if (selectedNodes.length < 2) return;
    // Calculate bounding box of selected nodes
    const minX = Math.min(...selectedNodes.map((n) => n.position.x));
    const minY = Math.min(...selectedNodes.map((n) => n.position.y));
    const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 160)));
    const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 70)));

    const padding = 30;
    const groupNodeId = `group_${Date.now()}`;
    const groupNode: AppNode = {
      id: groupNodeId,
      type: 'groupNode',
      position: { x: minX - padding, y: minY - padding - 40 },
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2 + 40,
      data: {
        label: 'Grup / Swimlane',
        shapeType: 'swimlane',
        fill: 'rgba(241, 245, 249, 0.6)',
        stroke: '#94a3b8',
        strokeWidth: 2,
      },
    };

    const nextNodes = [groupNode, ...nodes];
    setNodes(nextNodes);
    takeSnapshot(nextNodes, edges, true);
    toastCtx?.showToast('Node berhasil dikelompokkan ke dalam swimlane', 'success');
  }, [selectedNodes, nodes, edges, takeSnapshot, toastCtx]);

  // Context Menu Handlers
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: AppNode) => {
      e.preventDefault();
      setSelectedNodes([node]);
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
    },
    []
  );

  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: AppEdge) => {
      e.preventDefault();
      setSelectedEdges([edge]);
      setContextMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id });
    },
    []
  );

  const onPaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Convert Node to Task
  const handleTaskCreatedFromNode = useCallback(
    (nodeId: string, createdTask: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              type: 'taskNode',
              data: {
                ...n.data,
                shapeType: 'task',
                taskId: createdTask.id,
                taskNumber: createdTask.taskNumber,
                taskTitle: createdTask.title,
                taskStatus: createdTask.status,
                taskPriority: createdTask.priority,
                assigneeName: createdTask.assignee?.name || null,
                dueDate: createdTask.dueDate,
                isNotFound: false,
              },
            };
          }
          return n;
        })
      );
      fetchTasks();
      toastCtx?.showToast(`Task ${createdTask.taskNumber} berhasil dibuat dan ditautkan!`, 'success');
    },
    [fetchTasks, toastCtx]
  );

  // Edge property updates with marker synchronization & history snapshot
  const handleUpdateEdgeData = useCallback(
    (id: string, partial: Record<string, unknown>) => {
      setEdges((eds) => {
        const nextEdges = eds.map((e) => {
          if (e.id !== id) return e;

          const nextData = { ...e.data, ...partial };
          const stroke =
            (nextData.stroke as string) ||
            (e.style?.stroke as string) ||
            '#64748b';
          const strokeWidth =
            Number(nextData.strokeWidth) ||
            Number(e.style?.strokeWidth) ||
            2;

          const markerEndType =
            (nextData.markerEnd as ArrowMarkerType | undefined) ??
            getArrowMarkerType(e.markerEnd, 'none');

          const markerStartType =
            (nextData.markerStart as ArrowMarkerType | undefined) ??
            getArrowMarkerType(e.markerStart, 'none');

          const markerEnd = buildEdgeMarker(markerEndType, stroke, strokeWidth);
          const markerStart = buildEdgeMarker(markerStartType, stroke, strokeWidth);

          return {
            ...e,
            label: typeof nextData.label === 'string' ? nextData.label : e.label,
            data: nextData,
            markerEnd,
            markerStart,
            animated: Boolean(nextData.animated),
            style: {
              ...e.style,
              stroke,
              strokeWidth,
            },
          };
        });

        takeSnapshot(nodes, nextEdges, true);
        return nextEdges;
      });
    },
    [nodes, takeSnapshot]
  );

  // Template chosen
  const handleApplyTemplate = useCallback(
    (template: any) => {
      setNodes(template.data.nodes || []);
      setEdges(normalizeEdges(template.data.edges || []));
      takeSnapshot(template.data.nodes || [], template.data.edges || [], true);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
      toastCtx?.showToast(`Template "${template.name}" berhasil dimuat`, 'success');
    },
    [takeSnapshot, fitView, toastCtx]
  );

  // Import JSON applied
  const handleApplyImport = useCallback(
    (importedData: FlowData) => {
      setNodes(importedData.nodes || []);
      setEdges(normalizeEdges(importedData.edges || []));
      if (importedData.gridSize) setGridSize(importedData.gridSize);
      if (importedData.snapToGrid !== undefined) setSnapToGrid(importedData.snapToGrid);
      if (importedData.showGrid !== undefined) setShowGrid(importedData.showGrid);
      if (importedData.backgroundColor) setCanvasBg(importedData.backgroundColor);

      takeSnapshot(importedData.nodes || [], importedData.edges || [], true);
      setTimeout(() => fitView({ padding: 0.2 }), 50);
      toastCtx?.showToast('Diagram berhasil diimpor', 'success');
    },
    [takeSnapshot, fitView, toastCtx]
  );

  const selectedNode = React.useMemo(() => {
    if (selectedNodes.length !== 1) return null;
    const currentId = selectedNodes[0].id;
    return nodes.find((n) => n.id === currentId) || selectedNodes[0];
  }, [selectedNodes, nodes]);

  const selectedEdge = React.useMemo(() => {
    if (selectedEdges.length !== 1) return null;
    const currentId = selectedEdges[0].id;
    return edges.find((e) => e.id === currentId) || selectedEdges[0];
  }, [selectedEdges, edges]);

  return (
    <div className={styles.editorContainer} ref={editorRef}>
      {/* Top Header */}
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <button type="button" className={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={14} />
            <span>Daftar Flow</span>
          </button>

          <input
            type="text"
            className={styles.flowTitleInput}
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            disabled={readOnly}
            title="Klik untuk mengubah nama diagram"
          />

          {readOnly ? (
            <span
              className={styles.autosaveIndicator}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--primary)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Eye size={12} />
              <span>Mode Lihat</span>
            </span>
          ) : (
            <div className={styles.autosaveIndicator}>
              {autosaveStatus === 'saving' && (
                <span className={styles.autosaveSaving} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={11} className="spin-animate" />
                  <span className={styles.autosaveTextLong}>Menyimpan…</span>
                  <span className={styles.autosaveTextShort}>Simpan…</span>
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className={styles.autosaveSaved} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={11} />
                  <span>Tersimpan</span>
                </span>
              )}
              {autosaveStatus === 'error' && (
                <span
                  className={styles.autosaveError}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={triggerManualSave}
                >
                  <AlertCircle size={11} />
                  <span className={styles.autosaveTextLong}>Gagal menyimpan (coba lagi)</span>
                  <span className={styles.autosaveTextShort}>Gagal</span>
                </span>
              )}
              {autosaveStatus === 'idle' && isDirty && (
                <span>
                  <span className={styles.autosaveTextLong}>Ada perubahan…</span>
                  <span className={styles.autosaveTextShort}>Diubah</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          {canEdit && (
            readOnly ? (
              <button
                type="button"
                className={styles.backBtn}
                style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  borderColor: 'var(--primary-hover)',
                  fontWeight: 600,
                  gap: 6,
                }}
                onClick={() => onToggleMode?.('edit')}
                title="Beralih ke Mode Edit"
                aria-label="Beralih ke Mode Edit"
              >
                <Edit2 size={13} />
                <span>Edit Diagram</span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.backBtn}
                style={{
                  gap: 6,
                }}
                onClick={async () => {
                  if (isDirty) {
                    const confirmLeave = window.confirm(
                      'Ada perubahan yang belum tersimpan. Simpan sebelum beralih ke Mode Lihat?'
                    );
                    if (confirmLeave) {
                      const saved = await triggerManualSave();
                      if (!saved) return;
                    }
                  }
                  onToggleMode?.('view');
                }}
                title="Beralih ke Mode Lihat"
                aria-label="Beralih ke Mode Lihat"
              >
                <Eye size={13} />
                <span>Mode Lihat</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* Top Toolbar */}
      <FlowToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onDuplicate={handleDuplicate}
        onDelete={handleDeleteSelected}
        hasSelection={selectedNodes.length > 0 || selectedEdges.length > 0}
        hasClipboardData={hasClipboardData}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        onAutoLayout={handleAutoLayout}
        onLockToggle={() => {
          if (selectedNode) {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === selectedNode.id
                  ? { ...n, data: { ...n.data, locked: !n.data.locked } }
                  : n
              )
            );
          }
        }}
        isLocked={Boolean(selectedNode?.data?.locked)}
        onGroup={handleGroup}
        onUngroup={() => {}}
        zoom={currentZoom}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onZoomReset={() => zoomTo(1)}
        onFitView={() => fitView({ padding: 0.2 })}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((s) => !s)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid((s) => !s)}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap((s) => !s)}
        onSave={triggerManualSave}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        readOnly={readOnly}
        isDrawerMode={isDrawerMode}
        onToggleLeftDrawer={() => setIsLeftDrawerOpen((p) => !p)}
        onToggleRightDrawer={() => setIsRightDrawerOpen((p) => !p)}
      />

      {/* Main Workspace: Left Palette + Canvas + Right Properties */}
      <div className={styles.workspace}>
        {/* Drawer Backdrop on mobile/tablet */}
        {isDrawerMode && (isLeftDrawerOpen || isRightDrawerOpen) && (
          <div
            className={styles.drawerBackdrop}
            onClick={() => {
              setIsLeftDrawerOpen(false);
              setIsRightDrawerOpen(false);
            }}
          />
        )}

        {!readOnly && (
          <ShapePalette
            onAddNode={(item) => handleAddNodeFromDef(item)}
            isDrawerOpen={isLeftDrawerOpen}
            onCloseDrawer={() => setIsLeftDrawerOpen(false)}
            isCollapsed={isPaletteCollapsed}
            onToggleCollapse={togglePaletteCollapse}
          />
        )}

        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={onPaneClick}
          onDropFromPalette={onDropFromPalette}
          onDoubleClickPane={onDoubleClickPane}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          canvasBg={canvasBg}
          showMinimap={showMinimap}
          readOnly={readOnly}
          defaultViewport={initialFlow.data?.viewport}
        />

        <PropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNodeData={(id, partial) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, ...partial } } : n
              )
            );
          }}
          onUpdateNodePosition={(id, x, y) => {
            setNodes((nds) =>
              nds.map((n) => (n.id === id ? { ...n, position: { x, y } } : n))
            );
          }}
          onUpdateNodeDimension={(id, w, h) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id ? { ...n, width: w, height: h } : n
              )
            );
          }}
          onUpdateEdgeData={handleUpdateEdgeData}
          onDeleteSelected={handleDeleteSelected}
          onZOrderChange={handleZOrderChange}
          onConvertNodeToTask={(node) => setNodeToTaskConvert(node)}
          projectTasks={projectTasks}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          snapToGrid={snapToGrid}
          onSnapToGridChange={setSnapToGrid}
          showGrid={showGrid}
          onShowGridChange={setShowGrid}
          canvasBg={canvasBg}
          onCanvasBgChange={setCanvasBg}
          isDrawerOpen={isRightDrawerOpen}
          onCloseDrawer={() => setIsRightDrawerOpen(false)}
          readOnly={readOnly}
        />
      </div>

      {/* Context Menu */}
      {contextMenu && !readOnly && (
        <FlowContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteSelected}
          onLockToggle={() => {
            if (contextMenu.nodeId) {
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === contextMenu.nodeId
                    ? { ...n, data: { ...n.data, locked: !n.data.locked } }
                    : n
                )
              );
            }
          }}
          isLocked={Boolean(selectedNode?.data?.locked)}
          onZOrder={(act) => {
            if (contextMenu.nodeId) handleZOrderChange(contextMenu.nodeId, act);
          }}
          onAutoLayout={handleAutoLayout}
          hasClipboardData={hasClipboardData}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        flowData={currentFlowData()}
        flowName={flowName}
        viewportElement={
          typeof document !== 'undefined'
            ? (document.querySelector(`.${styles.canvasArea}`) as HTMLElement)
            : null
        }
      />

      {/* Import Dialog */}
      {!readOnly && (
        <ImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={handleApplyImport}
        />
      )}

      {/* Template Modal */}
      {!readOnly && (
        <FlowTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={handleApplyTemplate}
        />
      )}

      {/* Create Task From Node Modal */}
      {!readOnly && (
        <CreateTaskFromNodeModal
          isOpen={nodeToTaskConvert !== null}
          node={nodeToTaskConvert}
          onClose={() => setNodeToTaskConvert(null)}
          onSuccess={handleTaskCreatedFromNode}
          categories={categories}
          users={users}
          activeProjectId={activeProjectId}
        />
      )}

      {/* Task Detail Modal (opens when user clicks "Buka" in TaskNode) */}
      <TaskDetailModal
        taskId={taskDetailId}
        isOpen={taskDetailId !== null}
        onClose={() => setTaskDetailId(null)}
        currentUserId={currentUserId}
        onEditRequest={() => {}}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
}

export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
