import { useEffect, useRef } from 'react';

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

export function useFlowShortcuts(handlers: ShortcutHandlers) {
  const { enabled = true } = handlers;
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

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
      const h = handlersRef.current;

      // Save: Ctrl/Cmd + S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        h.onSave?.();
        return;
      }

      // Undo / Redo
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          h.onRedo?.();
        } else {
          h.onUndo?.();
        }
        return;
      }

      // Redo alternative: Ctrl + Y (Windows)
      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        h.onRedo?.();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        h.onCopy?.();
        return;
      }

      // Cut: Ctrl/Cmd + X
      if (isCmdOrCtrl && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        h.onCut?.();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        h.onPaste?.();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        h.onDuplicate?.();
        return;
      }

      // Select All: Ctrl/Cmd + A
      if (isCmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        h.onSelectAll?.();
        return;
      }

      // Group: Ctrl/Cmd + G
      if (isCmdOrCtrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          h.onUngroup?.();
        } else {
          h.onGroup?.();
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        h.onDelete?.();
        return;
      }

      // Fit View: Ctrl/Cmd + 0
      if (isCmdOrCtrl && e.key === '0') {
        e.preventDefault();
        h.onFitView?.();
        return;
      }

      // Zoom In: Ctrl/Cmd + '=' or '+'
      if (isCmdOrCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        h.onZoomIn?.();
        return;
      }

      // Zoom Out: Ctrl/Cmd + '-'
      if (isCmdOrCtrl && e.key === '-') {
        e.preventDefault();
        h.onZoomOut?.();
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
        h.onNudge?.(dx, dy);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
