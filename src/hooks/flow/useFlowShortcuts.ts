import { useEffect } from 'react';

interface ShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onSave?: () => void;
  onFitView?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onNudge?: (dx: number, dy: number) => void;
  enabled?: boolean;
}

export function useFlowShortcuts({
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAll,
  onSave,
  onFitView,
  onZoomIn,
  onZoomOut,
  onGroup,
  onUngroup,
  onNudge,
  enabled = true,
}: ShortcutHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 🔒 Never hijack typing inside input fields, textareas, selects, or contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Save: Ctrl/Cmd + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Undo / Redo
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo?.();
        } else {
          onUndo?.();
        }
        return;
      }

      // Redo alternative: Ctrl + Y (Windows)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        onCopy?.();
        return;
      }

      // Cut: Ctrl/Cmd + X
      if (isCmdOrCtrl && e.key.toLowerCase() === 'x') {
        onCut?.();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        onPaste?.();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onDuplicate?.();
        return;
      }

      // Select All: Ctrl/Cmd + A
      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onSelectAll?.();
        return;
      }

      // Group: Ctrl/Cmd + G
      if (isCmdOrCtrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          onUngroup?.();
        } else {
          onGroup?.();
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Fit View: Ctrl/Cmd + 0
      if (isCmdOrCtrl && e.key === '0') {
        e.preventDefault();
        onFitView?.();
        return;
      }

      // Zoom In: Ctrl/Cmd + '=' or '+'
      if (isCmdOrCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        onZoomIn?.();
        return;
      }

      // Zoom Out: Ctrl/Cmd + '-'
      if (isCmdOrCtrl && e.key === '-') {
        e.preventDefault();
        onZoomOut?.();
        return;
      }

      // Arrow keys nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 5;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        onNudge?.(dx, dy);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onUndo,
    onRedo,
    onCopy,
    onCut,
    onPaste,
    onDuplicate,
    onDelete,
    onSelectAll,
    onSave,
    onFitView,
    onZoomIn,
    onZoomOut,
    onGroup,
    onUngroup,
    onNudge,
  ]);
}
