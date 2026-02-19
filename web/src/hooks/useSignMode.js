import { useState } from 'react';

export const useSignMode = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const signatureDimensions = { width: 150, height: 50 };

  const handleCanvasClick = (event) => {
    if (activeTool === 'select') return;

    const pageWrapper = event.target.closest('[data-page-num]');
    if (!pageWrapper) return;

    const pageNum = parseInt(pageWrapper.getAttribute('data-page-num'), 10);
    if (Number.isNaN(pageNum)) return;

    const rect = pageWrapper.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (activeTool === 'signature') {
      setSignatures((prev) => [
        ...prev,
        {
          id: Date.now(),
          pageNum,
          x,
          y,
          width: signatureDimensions.width,
          height: signatureDimensions.height,
          text: 'John Doe',
          type: 'signature',
        },
      ]);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'text') {
      setAnnotations((prev) => [
        ...prev,
        {
          id: Date.now(),
          pageNum,
          x,
          y,
          text: 'Type something...',
          type: 'text',
        },
      ]);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'date') {
      setAnnotations((prev) => [
        ...prev,
        {
          id: Date.now(),
          pageNum,
          x,
          y,
          text: new Date().toLocaleDateString(),
          type: 'date',
        },
      ]);
      setActiveTool('select');
    }
  };

  return {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    signatureDimensions,
    handleCanvasClick,
  };
};
