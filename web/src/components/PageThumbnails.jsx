import React, { useEffect, useRef } from 'react';

const isRenderCancellation = (err) => {
    if (!err) return false;
    const message = String(err?.message || err);
    return err?.name === 'RenderingCancelledException' || message.includes('Rendering cancelled');
};

const PageThumbnail = ({ pdfDoc, pageNum, onClick, isActive }) => {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let cancelled = false;

        const renderThumb = async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                if (cancelled) return;
                const viewport = page.getViewport({ scale: 0.15 });

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = (canvas.getContext && canvas.getContext('2d')) || null;
                if (!context) return;

                const prevTask = renderTaskRef.current;
                if (prevTask) {
                    try {
                        prevTask.cancel?.();
                        await prevTask.promise;
                    } catch (e) {
                        // expected during cancellation
                    } finally {
                        if (renderTaskRef.current === prevTask) {
                            renderTaskRef.current = null;
                        }
                    }
                }
                if (cancelled) return;

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Start render and keep a handle so we can cancel if needed
                const renderTask = page.render({ canvasContext: context, viewport });
                renderTaskRef.current = renderTask;
                await renderTask.promise;
            } catch (err) {
                if (isRenderCancellation(err)) return;
                console.error('Error rendering thumbnail:', err?.message || err);
            } finally {
                renderTaskRef.current = null;
            }
        };

        renderThumb();

        return () => {
            cancelled = true;
            try {
                renderTaskRef.current?.cancel?.();
            } catch (e) {
                /* ignore */
            }
            renderTaskRef.current = null;
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
