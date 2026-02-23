import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

const clampHistory = (stack, limit = 50) => {
  if (!Array.isArray(stack)) return [];
  if (stack.length <= limit) return stack;
  return stack.slice(stack.length - limit);
};

const snapshotState = ({ signatures, annotations, selectedItemId }) => ({
  signatures: Array.isArray(signatures) ? signatures.map((s) => ({ ...s })) : [],
  annotations: Array.isArray(annotations) ? annotations.map((a) => ({ ...a })) : [],
  selectedItemId: selectedItemId || null,
});

export const useViewerSignMode = ({
  initialSignatures = [],
  initialAnnotations = [],
} = {}) => {
  const [activeTool, setActiveTool] = useState('select');
  const [signatures, setSignatures] = useState(() => (Array.isArray(initialSignatures) ? initialSignatures : []));
  const [annotations, setAnnotations] = useState(() => (Array.isArray(initialAnnotations) ? initialAnnotations : []));
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const dragRef = useRef(null);

  const signaturesRef = useRef(signatures);
  const annotationsRef = useRef(annotations);
  const selectedItemIdRef = useRef(selectedItemId);
  useEffect(() => { signaturesRef.current = signatures; }, [signatures]);
  useEffect(() => { annotationsRef.current = annotations; }, [annotations]);
  useEffect(() => { selectedItemIdRef.current = selectedItemId; }, [selectedItemId]);

  const historyRef = useRef(null);
  const [historyIndex, setHistoryIndex] = useState(0);

  if (!historyRef.current) {
    const initial = snapshotState({
      signatures: Array.isArray(initialSignatures) ? initialSignatures : [],
      annotations: Array.isArray(initialAnnotations) ? initialAnnotations : [],
      selectedItemId: null,
    });
    historyRef.current = { stack: [initial], index: 0 };
  }

  const canUndo = historyIndex > 0;
  const canRedo = useMemo(() => {
    const stackLen = historyRef.current?.stack?.length || 0;
    return historyIndex < stackLen - 1;
  }, [historyIndex]);

  const commitSnapshot = useCallback((next) => {
    const h = historyRef.current;
    if (!h) return;
    const nextSnap = snapshotState(next);
    const truncated = h.stack.slice(0, h.index + 1);
    const nextStack = clampHistory([...truncated, nextSnap], 60);
    h.stack = nextStack;
    h.index = nextStack.length - 1;
    setHistoryIndex(h.index);
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h || h.index <= 0) return;
    const nextIndex = h.index - 1;
    const snap = h.stack[nextIndex];
    if (!snap) return;
    h.index = nextIndex;
    setHistoryIndex(nextIndex);
    setSignatures(snap.signatures);
    setAnnotations(snap.annotations);
    setSelectedItemId(snap.selectedItemId);
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (!h || h.index >= (h.stack.length - 1)) return;
    const nextIndex = h.index + 1;
    const snap = h.stack[nextIndex];
    if (!snap) return;
    h.index = nextIndex;
    setHistoryIndex(nextIndex);
    setSignatures(snap.signatures);
    setAnnotations(snap.annotations);
    setSelectedItemId(snap.selectedItemId);
  }, []);

  const resolvePdfPageElement = (pageWrapper, pageNum) => {
    if (!pageWrapper || !pageNum) return null;
    const byId = pageWrapper.querySelector?.(`#pdf-page-${pageNum}`) || null;
    if (byId) return byId;
    const global = typeof document !== 'undefined' ? document.getElementById(`pdf-page-${pageNum}`) : null;
    return global || null;
  };

  const moveAnnotation = useCallback((id, x, y) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, x, y } : a)));
  }, []);

  const moveSignature = useCallback((id, x, y) => {
    setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  }, []);

  const startDrag = useCallback((event, item, kind) => {
    if (dragRef.current) return;
    event.stopPropagation();

    const dragTarget = event.currentTarget || event.target;
    const pointerId = Number.isFinite(Number(event.pointerId)) ? Number(event.pointerId) : null;

    const pageNum = item?.pageNum || null;
    const pageEl =
      (pageNum && typeof document !== 'undefined' ? document.getElementById(`pdf-page-${pageNum}`) : null)
      || event.target.closest?.('#pdf-page-1')
      || event.target.closest?.('[id^="pdf-page-"]')
      || event.target.closest?.('[data-page-num]')
      || null;
    if (!pageEl || !pageNum) return;

    const rect = pageEl.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - item.x;
    const offsetY = event.clientY - rect.top - item.y;

    setSelectedItemId(item.id);
    dragRef.current = { id: item.id, kind, offsetX, offsetY, pageEl, hasMoved: false };

    const onMove = (e) => {
      if (!dragRef.current) return;
      dragRef.current.hasMoved = true;
      const r = dragRef.current.pageEl.getBoundingClientRect();
      const newX = e.clientX - r.left - dragRef.current.offsetX;
      const newY = e.clientY - r.top - dragRef.current.offsetY;
      if (dragRef.current.kind === 'annotation') {
        moveAnnotation(dragRef.current.id, newX, newY);
      } else {
        moveSignature(dragRef.current.id, newX, newY);
      }
    };

    const onEnd = () => {
      const didMove = !!dragRef.current?.hasMoved;
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('mouseup', onEnd, true);
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', onEnd, true);
      if (dragTarget?.removeEventListener) {
        dragTarget.removeEventListener('pointermove', onMove, true);
        dragTarget.removeEventListener('pointerup', onEnd, true);
        dragTarget.removeEventListener('pointercancel', onEnd, true);
      }
      if (didMove) {
        commitSnapshot({
          signatures: signaturesRef.current,
          annotations: annotationsRef.current,
          selectedItemId: selectedItemIdRef.current,
        });
      }
    };

    if (pointerId !== null && dragTarget?.setPointerCapture) {
      try { dragTarget.setPointerCapture(pointerId); } catch { /* ignore */ }
    }

    // Use capture in case underlying PDF/text layers stop propagation.
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('mouseup', onEnd, true);
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', onEnd, true);
    if (dragTarget?.addEventListener) {
      dragTarget.addEventListener('pointermove', onMove, true);
      dragTarget.addEventListener('pointerup', onEnd, true);
      dragTarget.addEventListener('pointercancel', onEnd, true);
    }
  }, [commitSnapshot, moveAnnotation, moveSignature]);

  const isPickingImageRef = useRef(false);

  const chooseImageFile = useCallback(async () => {
    if (typeof document === 'undefined') return null;

    return await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = false;

      const cleanup = () => {
        input.onchange = null;
        try { input.remove(); } catch { /* ignore */ }
      };

      input.onchange = async () => {
        try {
          const file = input.files?.[0] || null;
          if (!file) {
            cleanup();
            resolve(null);
            return;
          }

          const dataUrl = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(String(reader.result || ''));
            reader.onerror = () => rej(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
          });

          const img = new Image();
          img.onload = () => {
            const info = {
              dataUrl,
              width: img.naturalWidth || img.width || 0,
              height: img.naturalHeight || img.height || 0,
              mimeType: file.type || '',
              name: file.name || '',
            };
            cleanup();
            resolve(info);
          };
          img.onerror = () => {
            cleanup();
            resolve({ dataUrl, width: 0, height: 0, mimeType: file.type || '', name: file.name || '' });
          };
          img.src = dataUrl;
        } catch {
          cleanup();
          resolve(null);
        }
      };

      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.click();
    });
  }, []);

  const handleCanvasClick = (event) => {
    if (event?.target?.closest?.('[data-testid^="overlay-"]')) return;
    if (activeTool === 'select') {
      setSelectedItemId(null);
      return;
    }

    const target = event.target;
    const pageWrapper = target?.closest?.('[data-page-num]') || null;
    const pageElFromId = target?.closest?.('[id^="pdf-page-"]') || null;
    let pageNum =
      (pageWrapper ? parseInt(pageWrapper.getAttribute('data-page-num'), 10) : NaN)
      || (pageElFromId?.id ? parseInt(String(pageElFromId.id).replace('pdf-page-', ''), 10) : NaN);
    let pageEl = resolvePdfPageElement(pageWrapper || pageElFromId, pageNum) || pageElFromId || pageWrapper;

    // Fallback: resolve page by point-in-rect (covers cases where the click target isn't inside the wrapper).
    if ((!pageEl || !pageNum || Number.isNaN(pageNum)) && typeof document !== 'undefined') {
      const pages = Array.from(document.querySelectorAll('[id^="pdf-page-"]'));
      const hit = pages.find((el) => {
        const r = el.getBoundingClientRect();
        return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      }) || null;
      if (hit?.id) {
        const parsed = parseInt(String(hit.id).replace('pdf-page-', ''), 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
          pageNum = parsed;
          pageEl = hit;
        }
      }
    }

    if (!pageEl || !pageNum || Number.isNaN(pageNum)) return;
    const rect = pageEl.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const nextBase = {
      signatures: signaturesRef.current,
      annotations: annotationsRef.current,
      selectedItemId: null,
    };

    if (activeTool === 'signature' && pendingSignature) {
      const newSig = {
        id: Date.now(),
        pageNum, x, y,
        width: pendingSignature.width || 200,
        height: pendingSignature.height || 60,
        ...pendingSignature,
      };
      const nextSignatures = [...nextBase.signatures, newSig];
      setSignatures(nextSignatures);
      setSelectedItemId(newSig.id);
      commitSnapshot({ ...nextBase, signatures: nextSignatures, selectedItemId: newSig.id });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'text') {
      const newItem = { id: Date.now(), pageNum, x, y, text: 'Text', type: 'text' };
      const nextAnnotations = [...nextBase.annotations, newItem];
      setAnnotations(nextAnnotations);
      setSelectedItemId(newItem.id);
      commitSnapshot({ ...nextBase, annotations: nextAnnotations, selectedItemId: newItem.id });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'date') {
      const newItem = { id: Date.now(), pageNum, x, y, text: new Date().toLocaleDateString(), type: 'date' };
      const nextAnnotations = [...nextBase.annotations, newItem];
      setAnnotations(nextAnnotations);
      setSelectedItemId(newItem.id);
      commitSnapshot({ ...nextBase, annotations: nextAnnotations, selectedItemId: newItem.id });
      setActiveTool('select');
      return;
    }

    if (activeTool === 'image') {
      if (isPickingImageRef.current) return;
      isPickingImageRef.current = true;

      (async () => {
        try {
          const picked = await chooseImageFile();
          if (!picked?.dataUrl) return;

          const maxW = 240;
          const maxH = 240;
          const srcW = Number(picked.width) || 0;
          const srcH = Number(picked.height) || 0;
          const shrink = srcW > 0 && srcH > 0
            ? Math.min(1, maxW / srcW, maxH / srcH)
            : 1;
          const drawW = Math.max(48, Math.round((srcW || 220) * shrink));
          const drawH = Math.max(48, Math.round((srcH || 120) * shrink));

          const clampedX = Math.max(0, Math.min(x - drawW / 2, rect.width - drawW));
          const clampedY = Math.max(0, Math.min(y - drawH / 2, rect.height - drawH));

          const newItem = {
            id: Date.now(),
            pageNum,
            x: clampedX,
            y: clampedY,
            type: 'image',
            text: picked.name || 'Image',
            dataUrl: picked.dataUrl,
            width: drawW,
            height: drawH,
          };
          const nextAnnotations = [...annotationsRef.current, newItem];
          setAnnotations(nextAnnotations);
          setSelectedItemId(newItem.id);
          commitSnapshot({ ...nextBase, annotations: nextAnnotations, selectedItemId: newItem.id });
          setActiveTool('select');
        } finally {
          isPickingImageRef.current = false;
        }
      })();
      return;
    }

    if (activeTool === 'checkmark') {
      const newItem = { id: Date.now(), pageNum, x, y, text: '✓', type: 'checkmark' };
      const nextAnnotations = [...nextBase.annotations, newItem];
      setAnnotations(nextAnnotations);
      setSelectedItemId(newItem.id);
      commitSnapshot({ ...nextBase, annotations: nextAnnotations, selectedItemId: newItem.id });
      setActiveTool('select');
    }
  };

  const handleSignClick = () => {
    if (pendingSignature) {
      setActiveTool('signature');
      return;
    }
    setSignatureModalOpen(true);
  };

  const handleSignatureAdopt = (sigData) => {
    setPendingSignature(sigData);
    setActiveTool('signature');
  };

  const deleteSelectedItem = useCallback(() => {
    if (!selectedItemId) return;
    const nextAnnotations = annotationsRef.current.filter((a) => a.id !== selectedItemId);
    const nextSignatures = signaturesRef.current.filter((s) => s.id !== selectedItemId);
    setAnnotations(nextAnnotations);
    setSignatures(nextSignatures);
    setSelectedItemId(null);
    commitSnapshot({ signatures: nextSignatures, annotations: nextAnnotations, selectedItemId: null });
  }, [selectedItemId]);

  return {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    signatureModalOpen,
    setSignatureModalOpen,
    pendingSignature,
    selectedItemId,
    setSelectedItemId,
    handleCanvasClick,
    handleSignClick,
    handleSignatureAdopt,
    startDrag,
    deleteSelectedItem,
    canUndo,
    canRedo,
    undo,
    redo,
  };
};
