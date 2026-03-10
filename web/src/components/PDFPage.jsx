import React, { useEffect } from 'react';
import { usePDFRenderer } from '../hooks/usePDFRenderer';

const PDFPage = ({
    pdfDoc,
    pageNum,
    scale,
    highlights = [],
    clauseMarkers = [],
    riskBadges = [],
    id,
    children
}) => {
    const { canvasRef, textLayerRef, annotationsRef, renderPage } = usePDFRenderer(pdfDoc, scale);

    useEffect(() => {
        if (pdfDoc && pageNum) {
            renderPage(pageNum, highlights, clauseMarkers, riskBadges);
        }
    }, [pdfDoc, pageNum, scale, highlights, clauseMarkers, riskBadges, renderPage]);

    return (
        <div
            id={id}
            className="relative bg-white shadow-lg mb-8 transition-transform origin-top"
            style={{ width: 'fit-content', height: 'fit-content' }}
        >
            <canvas
                ref={canvasRef}
                className="block"
            />
            {/* Text layer for selection and searching */}
            <div
                ref={textLayerRef}
                className="absolute top-0 left-0 w-full h-full overflow-hidden leading-none selection:bg-blue-200/50" style={{ userSelect: "text", WebkitUserSelect: "text", cursor: "text" }}
            />
            {/* Annotations overlay */}
            <div
                ref={annotationsRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
            />
            {/* Custom Children/Overlays (e.g. Signatures) */}
            {children}
        </div>
    );
};

export default PDFPage;
