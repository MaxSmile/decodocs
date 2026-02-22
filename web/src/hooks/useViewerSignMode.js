import { useState, useCallback, useRef } from 'react';

export const useViewerSignMode = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const dragRef = useRef(null);

  const moveAnnotation = useCallback((id, x, y) => {
    setAnnotations((prev) => prev.map((a) => (a.id === id ? { ...a, x, y } : a)));
  }, []);

  const moveSignature = useCallback((id, x, y) => {
    setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  }, []);

  const startDrag = useCallback((event, item, kind) => {
    event.stopPropagation();
    event.preventDefault();

    const pageWrapper = event.target.closest('[data-page-num]');
    if (!pageWrapper) return;

    const rect = pageWrapper.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - item.x;
    const offsetY = event.clientY - rect.top - item.y;

    setSelectedItemId(item.id);
    dragRef.current = { id: item.id, kind, offsetX, offsetY, pageWrapper };

    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const r = dragRef.current.pageWrapper.getBoundingClientRect();
      const newX = e.clientX - r.left - dragRef.current.offsetX;
      const newY = e.clientY - r.top - dragRef.current.offsetY;
      if (dragRef.current.kind === 'annotation') {
        moveAnnotation(dragRef.current.id, newX, newY);
      } else {
        moveSignature(dragRef.current.id, newX, newY);
      }
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [moveAnnotation, moveSignature]);

  const handleCanvasClick = (event) => {
    if (activeTool === 'select') {
      setSelectedItemId(null);
      return;
    }

    const pageWrapper = event.target.closest('[data-page-num]');
    if (!pageWrapper) return;

    const pageNum = parseInt(pageWrapper.getAttribute('data-page-num'), 10);
    if (Number.isNaN(pageNum)) return;

    const rect = pageWrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (activeTool === 'signature' && pendingSignature) {
      const newSig = {
        id: Date.now(),
        pageNum, x, y,
        width: pendingSignature.width || 200,
        height: pendingSignature.height || 60,
        ...pendingSignature,
      };
      setSignatures((prev) => [...prev, newSig]);
      setSelectedItemId(newSig.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'text') {
      const newItem = { id: Date.now(), pageNum, x, y, text: 'Text', type: 'text' };
      setAnnotations((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'date') {
      const newItem = { id: Date.now(), pageNum, x, y, text: new Date().toLocaleDateString(), type: 'date' };
      setAnnotations((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'image') {
      const newItem = { id: Date.now(), pageNum, x, y, text: '🖼 Image', type: 'image' };
      setAnnotations((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'checkmark') {
      const newItem = { id: Date.now(), pageNum, x, y, text: '✓', type: 'checkmark' };
      setAnnotations((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
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
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedItemId));
    setSignatures((prev) => prev.filter((s) => s.id !== selectedItemId));
    setSelectedItemId(null);
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
  };
};
