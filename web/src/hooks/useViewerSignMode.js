import { useState } from 'react';

export const useViewerSignMode = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingSignature, setPendingSignature] = useState(null);

  const handleCanvasClick = (event) => {
    if (activeTool === 'select') return;

    const pageWrapper = event.target.closest('[data-page-num]');
    if (!pageWrapper) return;

    const pageNum = parseInt(pageWrapper.getAttribute('data-page-num'), 10);
    if (Number.isNaN(pageNum)) return;

    const rect = pageWrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (activeTool === 'signature' && pendingSignature) {
      setSignatures((prev) => [
        ...prev,
        {
          id: Date.now(),
          pageNum,
          x,
          y,
          width: pendingSignature.width || 200,
          height: pendingSignature.height || 60,
          ...pendingSignature,
        },
      ]);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'text') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: 'Text', type: 'text' }]);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'date') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: new Date().toLocaleDateString(), type: 'date' }]);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'image') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: '🖼 Image', type: 'image' }]);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'checkmark') {
      setAnnotations((prev) => [...prev, { id: Date.now(), pageNum, x, y, text: '✓', type: 'checkmark' }]);
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

  return {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    signatureModalOpen,
    setSignatureModalOpen,
    pendingSignature,
    handleCanvasClick,
    handleSignClick,
    handleSignatureAdopt,
  };
};
