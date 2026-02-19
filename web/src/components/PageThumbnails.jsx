import React, { useEffect, useRef } from 'react';

const PageThumbnail = ({ pdfDoc, pageNum, onClick, isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let currentRender = null;
        let cancelled = false;

        const renderThumb = async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.15 });

                const canvas = canvasRef.current;
                if (!canvas) {
                    console.error(`PageThumbnail: canvasRef missing for page ${pageNum}`);
                    return;
                }

                const context = (canvas.getContext && canvas.getContext('2d')) || null;
                if (!context) {
                    console.error(`PageThumbnail: canvas.getContext() returned null for page ${pageNum}`);
                    return;
                }

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Start render and keep a handle so we can cancel if needed
                currentRender = page.render({ canvasContext: context, viewport });
                await currentRender.promise;
                if (cancelled) {
                    currentRender?.cancel?.();
                }
            } catch (err) {
                // Log concise message to client console
                console.error('Error rendering thumbnail:', err?.message || err);
            } finally {
                currentRender = null;
            }
        };

        renderThumb();

        return () => {
            cancelled = true;
            try {
                currentRender?.cancel?.();
            } catch (e) {
                /* ignore */
            }
            currentRender = null;
        };
    }, [pdfDoc, pageNum]);

    return (
        <button
            id={`thumb-${pageNum}`}
            onClick={onClick}
            className={`flex flex-col items-center gap-1 w-full rounded-md p-1 transition-all ${
                isActive
                    ? 'bg-blue-50 ring-1 ring-blue-400'
                    : 'hover:bg-slate-100'
            }`}
        >
            <div className="shadow-sm bg-white rounded-sm overflow-hidden">
                <canvas ref={canvasRef} className="block w-16 h-auto" />
            </div>
            <span className={`text-[10px] tabular-nums ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                {pageNum}
            </span>
        </button>
    );
};

const PageThumbnails = ({ pdfDoc, numPages, currentPage, onPageClick }) => {
    if (!pdfDoc || !numPages) return null;

    return (
        <div
            id="viewer-thumbnails"
            className="w-24 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 h-full overflow-y-auto py-2 px-1.5 flex flex-col gap-1"
        >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PageThumbnail
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNum={pageNum}
                    isActive={currentPage === pageNum}
                    onClick={() => onPageClick(pageNum)}
                />
            ))}
        </div>
    );
};

export default PageThumbnails;
