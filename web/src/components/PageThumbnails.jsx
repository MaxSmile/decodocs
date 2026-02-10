import React, { useEffect, useRef } from 'react';
import { HiTrash, HiRefresh, HiPlus } from 'react-icons/hi';

const PageThumbnail = ({ pdfDoc, pageNum, onClick, isActive }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderThumb = async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 0.2 }); // Small thumbnail
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };
                await page.render(renderContext).promise;
            } catch (err) {
                // ignore errors
            }
        };

        renderThumb();
    }, [pdfDoc, pageNum]);

    return (
        <div className="flex flex-col items-center gap-2 group relative">
            {/* Actions Overlay (Visible on Hover / Active) */}
            <div className={`absolute -top-3 right-0 flex gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} z-10`}>
                <button className="p-1 bg-white border border-slate-200 rounded shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300" title="Rotate">
                    <HiRefresh className="w-3 h-3" />
                </button>
                <button className="p-1 bg-white border border-slate-200 rounded shadow-sm text-slate-500 hover:text-red-600 hover:border-red-300" title="Delete">
                    <HiTrash className="w-3 h-3" />
                </button>
            </div>

            <div
                onClick={onClick}
                className={`cursor-pointer p-1 rounded-sm transition-all border-2 ${isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-blue-200'
                    }`}
            >
                <div className="shadow-sm bg-white">
                    <canvas ref={canvasRef} className="block w-28 h-auto" />
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
                {pageNum}
            </div>

            {/* Insert Plus Button (Sample) */}
            <div className="w-full h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-blue-500">
                <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                    <HiPlus className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
};

const PageThumbnails = ({ pdfDoc, numPages, currentPage, onPageClick }) => {
    if (!pdfDoc || !numPages) return null;

    return (
        <div className="w-64 bg-slate-50 border-r border-slate-200 h-full overflow-y-auto p-4 flex flex-col gap-4">
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
