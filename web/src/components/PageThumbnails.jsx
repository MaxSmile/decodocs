import React, { useEffect, useRef } from 'react';
import { HiTrash, HiRefresh, HiPlus, HiDuplicate } from 'react-icons/hi';

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
            <div
                onClick={onClick}
                className={`cursor-pointer p-1 rounded-sm transition-all border-2 ${isActive ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-blue-200'
                    }`}
            >
                <div className="shadow-sm bg-white">
                    <canvas ref={canvasRef} className="block w-28 h-auto" />
                </div>
            </div>

            {/* Actions Buttons - Bottom Center */}
            <div className={`flex items-center gap-2 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} mt-1`}>
                <button className="p-1 !bg-transparent hover:!bg-slate-200/70 !text-slate-600 hover:!text-slate-800 transition-colors !min-w-0 !h-auto" title="Duplicate">
                    <HiDuplicate className="w-4 h-4" />
                </button>
                <button className="p-1 !bg-transparent hover:!bg-slate-200/70 !text-slate-600 hover:!text-slate-800 transition-colors !min-w-0 !h-auto" title="Rotate">
                    <HiRefresh className="w-4 h-4" />
                </button>
                <button className="p-1 !bg-transparent hover:!bg-slate-200/70 !text-slate-600 hover:!text-slate-800 transition-colors !min-w-0 !h-auto" title="Delete">
                    <HiTrash className="w-4 h-4" />
                </button>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
                {pageNum}
            </div>

            {/* Insert Plus Button - Visible and fixed background */}
            <div className="w-full h-8 flex items-center justify-center cursor-pointer text-blue-500 mt-2 mb-2">
                <div className="w-8 h-8 rounded-full !bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center hover:!bg-blue-600 hover:border-blue-600 hover:text-white transition-all shadow-sm">
                    <HiPlus className="w-5 h-5" />
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
