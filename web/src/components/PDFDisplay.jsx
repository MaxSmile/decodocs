import React, { useRef, useEffect } from 'react';
import PDFPage from './PDFPage';

/**
 * PDF display component for continuous scrolling
 */
const PDFDisplay = ({
  pdfDoc,
  numPages,
  pageScale,
  isLoading,
  loadingMessage,
  onPageVisible, // Callback when a page becomes visible
  highlights = [],
  clauseMarkers = [],
  riskBadges = [],
  renderPageOverlay, // Function (pageNum) => ReactNode
}) => {
  const containerRef = useRef(null);

  // Intersection Observer to detect current page
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !onPageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-num'), 10);
            onPageVisible(pageNum);
          }
        });
      },
      {
        root: containerRef.current,
        threshold: 0.5, // 50% visibility triggers change
      }
    );

    const pages = containerRef.current.querySelectorAll('.page-wrapper');
    pages.forEach((page) => observer.observe(page));

    return () => observer.disconnect();
  }, [pdfDoc, numPages, onPageVisible]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center border border-dashed border-gray-300 rounded bg-gray-50 text-gray-600 h-full">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>{loadingMessage || 'Loading PDF...'}</p>
        </div>
      </div>
    );
  }

  if (!pdfDoc) return null;

  return (
    <div className="flex flex-col items-center gap-8 py-8 w-full">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
        <div
          key={pageNum}
          className="page-wrapper"
          data-page-num={pageNum}
        >
          <PDFPage
            id={`pdf-page-${pageNum}`}
            pdfDoc={pdfDoc}
            pageNum={pageNum}
            scale={pageScale}
            highlights={highlights}
            clauseMarkers={clauseMarkers}
            riskBadges={riskBadges}
          >
            {renderPageOverlay ? renderPageOverlay(pageNum) : null}
          </PDFPage>
        </div>
      ))}
    </div>
  );
};

export default PDFDisplay;
