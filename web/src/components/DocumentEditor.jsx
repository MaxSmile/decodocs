import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import PDFControls from './PDFControls';
import PDFDisplay from './PDFDisplay';
import PDFDropzone from './PDFDropzone';
import PageThumbnails from './PageThumbnails';
import EditorToolbar from './editor/EditorToolbar.jsx';
import EditorOverlay from './editor/EditorOverlay.jsx';
import { usePdfJs } from '../hooks/usePdfJs';
import { useSignMode } from '../hooks/useSignMode.js';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const {
    pdfLibLoaded,
    pdfDoc,
    numPages,
    pageNumber,
    pageScale,
    isLoading: isPdfLoading,
    loadingMessage,
    loadPdfFromBlob,
    loadTestPdf,
    navigation,
  } = usePdfJs();

  const [selectedDocument, setSelectedDocument] = useState(null);
  const {
    activeTool,
    setActiveTool,
    signatures,
    annotations,
    signatureDimensions,
    handleCanvasClick,
  } = useSignMode();

  useEffect(() => {
    if (location.state?.document && !pdfDoc && pdfLibLoaded) {
      const doc = location.state.document;
      setSelectedDocument(doc);
      if (doc.file) {
        loadPdfFromBlob(doc.file).catch(console.error);
      }
      return;
    }

    if (location.pathname.includes('test-docs') && pdfLibLoaded && !pdfDoc) {
      const fileName = location.pathname.split('/').pop();
      if (fileName?.endsWith('.pdf')) {
        loadTestPdf(fileName).then((result) => {
          if (result) {
            setSelectedDocument({ name: fileName, id: 'test-doc', type: 'application/pdf' });
          }
        });
      }
      return;
    }

    if (documentId && pdfLibLoaded && !pdfDoc && !location.pathname.includes('test-docs')) {
      setSelectedDocument({
        id: documentId,
        name: `Document_${documentId}.pdf`,
        type: 'application/pdf',
        file: null,
      });
    }
  }, [location, documentId, pdfLibLoaded, pdfDoc, loadPdfFromBlob, loadTestPdf]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length === 0) return;

    const file = pdfFiles[0];
    const newDocument = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      file,
    };

    setSelectedDocument(newDocument);
    loadPdfFromBlob(file);
  };

  const loadImageFromDataUrl = (dataUrl) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });

  const buildFlattenedPageImageData = async () => {
    const pageImages = [];

    for (let pageNum = 1; pageNum <= (numPages || 0); pageNum += 1) {
      const pageElement = document.getElementById(`pdf-page-${pageNum}`);
      const baseCanvas = pageElement?.querySelector('canvas');
      if (!baseCanvas) continue;

      const displayRect = pageElement.getBoundingClientRect();
      const scaleX = displayRect.width ? baseCanvas.width / displayRect.width : 1;
      const scaleY = displayRect.height ? baseCanvas.height / displayRect.height : 1;

      const outCanvas = document.createElement('canvas');
      outCanvas.width = baseCanvas.width;
      outCanvas.height = baseCanvas.height;
      const ctx = outCanvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(baseCanvas, 0, 0);

      const pageSignatures = signatures.filter((sig) => sig.pageNum === pageNum);
      for (const sig of pageSignatures) {
        const x = (sig.x || 0) * scaleX;
        const y = (sig.y || 0) * scaleY;
        const width = (sig.width || signatureDimensions.width) * scaleX;
        const height = (sig.height || signatureDimensions.height) * scaleY;

        if (sig.dataUrl) {
          try {
            const sigImage = await loadImageFromDataUrl(sig.dataUrl);
            ctx.drawImage(sigImage, x, y, width, height);
          } catch {
            ctx.font = `${Math.max(16, Math.floor(height * 0.5))}px serif`;
            ctx.fillStyle = '#1d4ed8';
            ctx.fillText('Signature', x + 4, y + height * 0.65);
          }
        } else {
          ctx.font = `${Math.max(16, Math.floor(height * 0.5))}px serif`;
          ctx.fillStyle = '#1d4ed8';
          ctx.fillText(sig.text || 'Signature', x + 4, y + height * 0.65);
        }
      }

      const pageAnnotations = annotations.filter((ann) => ann.pageNum === pageNum);
      for (const ann of pageAnnotations) {
        const x = (ann.x || 0) * scaleX;
        const y = (ann.y || 0) * scaleY;
        const label = ann.text || '';

        if (ann.type === 'checkmark') {
          ctx.font = `${Math.max(18, Math.floor(28 * scaleY))}px sans-serif`;
          ctx.fillStyle = '#15803d';
          ctx.fillText(label || '✓', x, y + 22 * scaleY);
        } else {
          ctx.fillStyle = ann.type === 'date' ? '#fef3c7' : '#fef9c3';
          ctx.fillRect(x - 2, y - 2, Math.max(110 * scaleX, label.length * 7 * scaleX), 24 * scaleY);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(x - 2, y - 2, Math.max(110 * scaleX, label.length * 7 * scaleX), 24 * scaleY);
          ctx.font = `${Math.max(12, Math.floor(13 * scaleY))}px sans-serif`;
          ctx.fillStyle = '#0f172a';
          ctx.fillText(label, x + 2, y + 14 * scaleY);
        }
      }

      pageImages.push(outCanvas.toDataURL('image/png'));
    }

    return pageImages;
  };

  const openPrintWindowForPdfSave = (pageImages) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Pop-up blocked. Please allow pop-ups to export the edited PDF.');
    }

    const pagesMarkup = pageImages
      .map((src) => `<div class="page"><img src="${src}" alt="Edited page" /></div>`)
      .join('');

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${(selectedDocument?.name || 'document').replace(/</g, '&lt;')}</title>
          <style>
            body { margin: 0; font-family: sans-serif; background: #fff; }
            .page { page-break-after: always; break-after: page; display: block; }
            .page img { width: 100%; display: block; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${pagesMarkup}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadEditedPdf = async () => {
    if (!pdfDoc) {
      // eslint-disable-next-line no-alert
      alert('Open a PDF first.');
      return;
    }

    try {
      const pageImages = await buildFlattenedPageImageData();
      if (pageImages.length === 0) {
        throw new Error('No rendered pages found.');
      }
      openPrintWindowForPdfSave(pageImages);
    } catch (err) {
      console.error('Failed to export edited PDF:', err);
      // eslint-disable-next-line no-alert
      alert(err?.message || 'Unable to export edited PDF.');
    }
  };

  const handleThumbnailClick = (targetPageNum) => {
    navigation.setPageNumber(targetPageNum);
    const pageElement = document.getElementById(`pdf-page-${targetPageNum}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderOverlay = (pageNum) => (
    <EditorOverlay pageNum={pageNum} signatures={signatures} annotations={annotations} />
  );

  return (
    <div className="contents">
      <div className="flex flex-col h-full bg-slate-100">
        <EditorToolbar
          fileName={selectedDocument?.name}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          onShare={() => {
            // eslint-disable-next-line no-alert
            alert('Upgrade to Pro to share links!');
          }}
          onUpload={() => {
            // eslint-disable-next-line no-alert
            alert('Upgrade to Pro to upload to cloud!');
          }}
          onCancel={() => navigate('/view')}
          onDownload={handleDownloadEditedPdf}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {pdfDoc && (
            <PageThumbnails
              pdfDoc={pdfDoc}
              numPages={numPages}
              currentPage={pageNumber}
              onPageClick={handleThumbnailClick}
            />
          )}

          <div className="flex-1 overflow-auto p-8 flex justify-center relative bg-slate-100/50">
            {pdfDoc ? (
              <div
                className={`w-full flex justify-center ${activeTool !== 'select' ? 'cursor-crosshair' : ''}`}
                style={{ minHeight: '100%' }}
                onClick={handleCanvasClick}
              >
                <PDFDisplay
                  pdfDoc={pdfDoc}
                  numPages={numPages}
                  pageScale={pageScale}
                  isLoading={isPdfLoading}
                  loadingMessage={loadingMessage}
                  onPageVisible={(visiblePageNum) => navigation.setPageNumber(visiblePageNum)}
                  renderPageOverlay={renderOverlay}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full">
                <PDFDropzone onFileSelect={handleFileUpload} />
              </div>
            )}
          </div>

          <PDFControls
            onFileSelect={handleFileUpload}
            onEdit={() => {}}
            pageNumber={pageNumber}
            numPages={numPages}
            pageScale={pageScale}
            onPreviousPage={navigation.goToPreviousPage}
            onNextPage={navigation.goToNextPage}
            onZoomIn={navigation.zoomIn}
            onZoomOut={navigation.zoomOut}
            fileInputRef={fileInputRef}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
