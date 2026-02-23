import { useEffect } from 'react';

const isEditableTarget = (target) => {
  if (!target) return false;
  const el = target;
  if (el.isContentEditable) return true;
  const tag = String(el.tagName || '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

export const useOverlayHotkeys = ({
  enabled = true,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  onUndo,
  onRedo,
  onDelete,
} = {}) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const handler = (event) => {
      if (!event) return;
      if (isEditableTarget(event.target)) return;

      const key = String(event.key || '');
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const mod = isMac ? event.metaKey : event.ctrlKey;

      // Delete selection
      if ((key === 'Delete' || key === 'Backspace') && hasSelection) {
        if (typeof onDelete === 'function') {
          event.preventDefault();
          onDelete();
        }
        return;
      }

      // Undo / Redo
      if (mod && key.toLowerCase() === 'z') {
        if (event.shiftKey) {
          if (canRedo && typeof onRedo === 'function') {
            event.preventDefault();
            onRedo();
          }
          return;
        }

        if (canUndo && typeof onUndo === 'function') {
          event.preventDefault();
          onUndo();
        }
        return;
      }

      if (mod && key.toLowerCase() === 'y') {
        if (canRedo && typeof onRedo === 'function') {
          event.preventDefault();
          onRedo();
        }
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [enabled, canUndo, canRedo, hasSelection, onUndo, onRedo, onDelete]);
};

