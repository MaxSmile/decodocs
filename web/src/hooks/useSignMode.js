import { useState, useCallback, useRef } from 'react';

export const useSignMode = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const dragRef = useRef(null);
  const signatureDimensions = { width: 150, height: 50 };

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
    dragRef.current = { id: item.id, kind, offsetX, offsetY, pageEl };

    const onMove = (e) => {
      if (!dragRef.current) return;
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
  }, [moveAnnotation, moveSignature]);

  const handleCanvasClick = (event) => {
    if (event?.target?.closest?.('[data-testid^="overlay-"]')) return;
    if (activeTool === 'select') return;

    const target = event.target;
    const pageWrapper = target?.closest?.('[data-page-num]') || null;
    const pageElFromId = target?.closest?.('[id^="pdf-page-"]') || null;
    let pageNum =
      (pageWrapper ? parseInt(pageWrapper.getAttribute('data-page-num'), 10) : NaN)
      || (pageElFromId?.id ? parseInt(String(pageElFromId.id).replace('pdf-page-', ''), 10) : NaN);
    let pageEl = resolvePdfPageElement(pageWrapper || pageElFromId, pageNum) || pageElFromId || pageWrapper;

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

    if (activeTool === 'signature') {
      const newSig = {
        id: Date.now(),
        pageNum,
        x,
        y,
        width: signatureDimensions.width,
        height: signatureDimensions.height,
        text: 'John Doe',
        type: 'signature',
      };
      setSignatures((prev) => [...prev, newSig]);
      setSelectedItemId(newSig.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'text') {
      const newAnn = { id: Date.now(), pageNum, x, y, text: 'Type something...', type: 'text' };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedItemId(newAnn.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'date') {
      const newAnn = { id: Date.now(), pageNum, x, y, text: new Date().toLocaleDateString(), type: 'date' };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedItemId(newAnn.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'image') {
      const newAnn = { id: Date.now(), pageNum, x, y, text: '🖼 Image', type: 'image' };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedItemId(newAnn.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'checkmark') {
      const newAnn = { id: Date.now(), pageNum, x, y, text: '✓', type: 'checkmark' };
      setAnnotations((prev) => [...prev, newAnn]);
      setSelectedItemId(newAnn.id);
      setActiveTool('select');
    }
  };

  return {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    signatureDimensions,
    selectedItemId,
    setSelectedItemId,
    handleCanvasClick,
    startDrag,
  };
};
