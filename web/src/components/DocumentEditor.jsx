import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  HiCursorClick,
  HiPencil,
  HiAnnotation,
  HiPhotograph,
  HiTemplate,
  HiCheck,
  HiX,
  HiDownload,
  HiArrowLeft,
  HiUser,
  HiSave,
  HiCalendar,
  HiLink,
  HiUpload,
  HiSparkles
} from 'react-icons/hi';
import logo from '../assets/DecoDocsLogo.svg';
import Layout from './Layout';
import PDFControls from './PDFControls';
import PDFDisplay from './PDFDisplay';
import PDFDropzone from './PDFDropzone';
import PageThumbnails from './PageThumbnails';
import { usePdfJs } from '../hooks/usePdfJs';
import { usePDFRenderer } from '../hooks/usePDFRenderer';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // -- PDF Hooks --
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

  // const { canvasRef, textLayerRef, annotationsRef, renderPage } = usePDFRenderer(pdfDoc, pageScale);

  // -- Local Editor State --
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTool, setActiveTool] = useState('select'); // select, signature, text, date, image, shape
  const [signatures, setSignatures] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [signatureDimensions] = useState({ width: 150, height: 50 });

  // -- Initialization --
  useEffect(() => {
    // If we have a document passed via state, load it
    if (location.state?.document && !pdfDoc && pdfLibLoaded) {
      const doc = location.state.document;
      setSelectedDocument(doc);
      if (doc.file) {
        loadPdfFromBlob(doc.file).catch(console.error);
      }
    }
    // Special handling for test docs in URL
    else if (location.pathname.includes('test-docs') && pdfLibLoaded && !pdfDoc) {
      const parts = location.pathname.split('/');
      // Handle both /edit/test-docs/offer.pdf and /edit/test-docs%2Foffer.pdf behavior if needed
      // But typically React Router gives us the params. 
      // If the route is /edit/:documentId, we might get 'test-docs' as ID or 'offer.pdf' depending on structure.
      // Let's rely on manual parsing if needed or the 'fileName' param if we use the specific route.

      // If we are at /edit/test-docs/offer.pdf
      // In App.jsx, there isn't a specific route for this yet, only /edit/:documentId
      // So documentId might be 'test-docs' if it stops there.
      // But wait, in the browser test we used /edit/test-docs/offer.pdf. 
      // If documentId captures the rest, great. If not, we might need a better route.
      // For now, let's just checking if the path ends in .pdf

      const potentialFileName = location.pathname.split('/').pop();
      if (potentialFileName.endsWith('.pdf')) {
        loadTestPdf(potentialFileName).then(res => {
          if (res) {
            setSelectedDocument({ name: potentialFileName, id: 'test-doc', type: 'application/pdf' });
          }
        });
      }
    }
    // Fallback for documentId param if it looks like a real ID (and not test)
    else if (documentId && pdfLibLoaded && !pdfDoc && !location.pathname.includes('test-docs')) {
      const mockDoc = {
        id: documentId,
        name: `Document_${documentId}.pdf`,
        type: 'application/pdf',
        file: null
      };
      setSelectedDocument(mockDoc);
    }
  }, [location, documentId, pdfLibLoaded, pdfDoc, loadPdfFromBlob, loadTestPdf]);





  // -- Handlers --
  const handlePageClick = (e, pageNum) => {
    // This handler will be attached to the Page wrapper or overlay
    // But since PDFPage stops propagation? No.
    // Let's attach to the wrapper in PDFDisplay? No, PDFDisplay is generic.
    // DocumentEditor wraps PDFDisplay.
    // We can rely on event bubbling if we attach onClick to the PDFDisplay container.
    // But we need the pageNum.
    // The easiest way is to let the user click anywhere, check the target page.
  };

  const handleCanvasClick = (e) => {
    // If select tool is active, do nothing (or handle selection later)
    if (activeTool === 'select') return;

    // Find which page was clicked
    const pageWrapper = e.target.closest('[data-page-num]');
    if (!pageWrapper) return;

    const pageNum = parseInt(pageWrapper.getAttribute('data-page-num'), 10);
    const rect = pageWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'signature') {
      const newSig = {
        id: Date.now(),
        pageNum,
        x, y,
        width: signatureDimensions.width,
        height: signatureDimensions.height,
        text: "John Doe",
        type: 'signature'
      };
      setSignatures([...signatures, newSig]);
      setActiveTool('select'); // Auto-switch to select after placing
    } else if (activeTool === 'text') {
      const newNote = {
        id: Date.now(),
        pageNum,
        x, y,
        text: "Type something...",
        type: 'text'
      };
      setAnnotations([...annotations, newNote]);
      setActiveTool('select'); // Auto-switch to select after placing
    } else if (activeTool === 'date') {
      const newDate = {
        id: Date.now(),
        pageNum,
        x, y,
        text: new Date().toLocaleDateString(),
        type: 'date'
      };
      setAnnotations([...annotations, newDate]);
      setActiveTool('select');
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');
    if (pdfFiles.length > 0) {
      const file = pdfFiles[0];
      const newDocument = {
        id: Date.now(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      };
      setSelectedDocument(newDocument);
      loadPdfFromBlob(file);
    }
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

    for (let pageNum = 1; pageNum <= (numPages || 0); pageNum++) {
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
      .map(
        (src) =>
          `<div class="page"><img src="${src}" alt="Edited page" /></div>`
      )
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
      alert(err?.message || 'Unable to export edited PDF.');
    }
  };

  const renderOverlay = (pageNum) => (
    <>
      {signatures.filter(s => s.pageNum === pageNum).map(sig => (
        <div
          key={sig.id}
          className="absolute border-2 border-blue-500 bg-blue-50/20 flex items-center justify-center cursor-move"
          style={{
            left: sig.x,
            top: sig.y,
            width: sig.width,
            height: sig.height,
            zIndex: 50
          }}
          onClick={(e) => e.stopPropagation()} // Prevent creating new on click?
        >
          <span className="text-blue-700 font-script text-xl font-bold">{sig.text}</span>
        </div>
      ))}
      {annotations.filter(a => a.pageNum === pageNum).map(ann => (
        <div
          key={ann.id}
          className="absolute bg-yellow-100 border border-yellow-300 px-2 py-1 text-sm shadow-sm cursor-move"
          style={{ left: ann.x, top: ann.y, zIndex: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {ann.text}
        </div>
      ))}
    </>
  );

  return (
    <div className="contents">
      <div className="flex flex-col h-full bg-slate-100">



        {/* Editor Actions & Tools Hierarchy */}
        <div className="flex flex-col bg-white border-b border-slate-200 z-20 relative font-sans">

          {/* Row 1: Filename + Actions */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100">
            {/* Left: Filename + Pro Actions */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-slate-800 text-base truncate max-w-[250px]">
                  {selectedDocument?.name || 'Untitled Document'}
                </span>

                {/* Pro Buttons */}
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => alert("Upgrade to Pro to share links!")}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                  >
                    <HiLink className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    onClick={() => alert("Upgrade to Pro to upload to cloud!")}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    <HiUpload className="w-3.5 h-3.5" /> Upload
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/view')}
                className="px-3 py-1.5 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleDownloadEditedPdf}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
              >
                Download <HiDownload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Centered Edit Tools */}
          <div className="h-12 flex items-center justify-center gap-1 bg-slate-50/50">
            <ToolButton
              active={activeTool === 'select'}
              icon={HiCursorClick}
              label="Select"
              onClick={() => setActiveTool('select')}
              tooltip="Select & Move"
            />
            <div className="w-px h-5 bg-slate-300 mx-1"></div>
            <ToolButton
              active={activeTool === 'text'}
              icon={HiAnnotation}
              label="Text"
              onClick={() => setActiveTool('text')}
              tooltip="Add Text"
            />
            <ToolButton
              active={activeTool === 'signature'}
              icon={HiPencil}
              label="Sign"
              onClick={() => setActiveTool('signature')}
              tooltip="Create Signature"
            />
            <ToolButton
              active={activeTool === 'image'}
              icon={HiPhotograph}
              label="Image"
              onClick={() => setActiveTool('image')}
              tooltip="Insert Image"
            />
            <ToolButton
              active={activeTool === 'shape'}
              icon={HiTemplate}
              label="Shapes"
              onClick={() => setActiveTool('shape')}
              tooltip="Add Shapes"
            />
          </div>
        </div>


        {/* Main Content Area (Sidebar + Canvas) */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Sidebar Thumbnails */}
          {pdfDoc && (
            <PageThumbnails
              pdfDoc={pdfDoc}
              numPages={numPages}
              currentPage={pageNumber}
              onPageClick={(pageNum) => {
                navigation.setPageNumber(pageNum);
                const pageElement = document.getElementById(`pdf-page-${pageNum}`);
                if (pageElement) {
                  pageElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          )}

          {/* Canvas Scroll Area */}
          <div className="flex-1 overflow-auto p-8 flex justify-center relative bg-slate-100/50">
            {pdfDoc ? (
              <div
                className="w-full flex justify-center"
                style={{ minHeight: '100%' }}
                onClick={handleCanvasClick}
              >
                <PDFDisplay
                  pdfDoc={pdfDoc}
                  numPages={numPages}
                  pageScale={pageScale}
                  isLoading={isPdfLoading}
                  loadingMessage={loadingMessage}
                  onPageVisible={(pn) => navigation.setPageNumber(pn)}
                  renderPageOverlay={renderOverlay}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center w-full">
                <PDFDropzone onFileSelect={handleFileUpload} />
              </div>
            )}
          </div>

          {/* Floating Controls (Now over the canvas area?) 
              Ideally, controls should be absolute to the main content area, or fixed at bottom center.
              Let's keep them here but ensure they are visible. 
              Actually, usually controls are `fixed` or `absolute` to screen bottom.
          */}
          <PDFControls
            onFileSelect={handleFileUpload}
            onEdit={() => { }}
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

const ToolButton = ({ active, icon: Icon, label, onClick, tooltip }) => (
  <button
    onClick={onClick}
    title={tooltip || label}
    className={`flex items-center justify-center p-2.5 rounded-lg transition-all relative ${active
      ? 'bg-slate-200/80 text-slate-800'
      : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
      }`}
  >
    <Icon className="w-5 h-5" />
  </button>
);

export default DocumentEditor;
