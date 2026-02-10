import React, { useEffect, useRef } from 'react';

const PageThumbnail = ({ pdfDoc, pageNum, onClick, isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderThumb = async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.15 });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;
            } catch (err) {
                // ignore errors
            }
        };

        renderThumb();
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
