import React, { useEffect, useRef, useState, useCallback } from 'react';

const isRenderCancellation = (err) => {
    if (!err) return false;
    const message = String(err?.message || err);
    return err?.name === 'RenderingCancelledException' || message.includes('Rendering cancelled');
};

// Icons for page actions
const Icons = {
    Duplicate: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
            <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
        </svg>
    ),
    Rotate: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
        </svg>
    ),
    Delete: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
    ),
    Add: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
    ),
};

/**
 * Page action button component
 */
const PageActionButton = ({ onClick, icon: Icon, title, variant = 'default', disabled = false }) => {
    const baseClasses = 'p-1 rounded transition-colors flex items-center justify-center';
    const variantClasses = {
        default: 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
        danger: 'text-red-500 hover:text-red-700 hover:bg-red-50',
        primary: 'text-blue-500 hover:text-blue-700 hover:bg-blue-50',
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick();
            }}
            disabled={disabled}
            title={title}
            className={`${baseClasses} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Icon />
        </button>
    );
};

/**
 * Individual page thumbnail with action controls
 */
const PageThumbnail = ({ 
    pdfDoc, 
    pageNum, 
    onClick, 
    isActive,
    onDuplicate,
    onRotate,
    onDelete,
    canDelete = true,
    isProcessing = false,
    pageRotation = 0,
}) => {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        let cancelled = false;

        const renderThumb = async () => {
            try {
                const page = await pdfDoc.getPage(pageNum);
                if (cancelled) return;
                
                // Get the page rotation and apply it
                const pageRotationValue = page.rotate || 0;
                const totalRotation = (pageRotationValue + pageRotation) % 360;
                
                const viewport = page.getViewport({ scale: 0.15, rotation: totalRotation });

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
    }, [pdfDoc, pageNum, pageRotation]);

    return (
        <div
            className={`relative group flex flex-col items-center gap-1 w-full rounded-md p-1 transition-all ${
                isActive
                    ? 'bg-blue-50 ring-1 ring-blue-400'
                    : 'hover:bg-slate-100'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button
                id={`thumb-${pageNum}`}
                onClick={onClick}
                className="flex flex-col items-center gap-1 w-full"
                disabled={isProcessing}
            >
                <div className="shadow-sm bg-white rounded-sm overflow-hidden relative">
                    <canvas ref={canvasRef} className="block w-16 h-auto" />
                    {/* Page number badge */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] py-0.5 text-center">
                        {pageNum}
                    </div>
                </div>
            </button>
            
            {/* Action buttons - shown on hover */}
            {isHovered && !isProcessing && (
                <div className="absolute top-full left-0 right-0 flex justify-center gap-0.5 py-1 bg-white border border-slate-200 rounded-md shadow-sm z-10">
                    <PageActionButton
                        onClick={() => onDuplicate(pageNum - 1)}
                        icon={Icons.Duplicate}
                        title="Duplicate page"
                        variant="default"
                    />
                    <PageActionButton
                        onClick={() => onRotate(pageNum - 1)}
                        icon={Icons.Rotate}
                        title="Rotate 90° clockwise"
                        variant="default"
                    />
                    <PageActionButton
                        onClick={() => onDelete(pageNum - 1)}
                        icon={Icons.Delete}
                        title="Delete page"
                        variant="danger"
                        disabled={!canDelete}
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Collapsed thumbnail sidebar - shows minimal UI when folded
 */
const CollapsedSidebar = ({ onExpand, numPages, currentPage }) => (
    <div className="w-10 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 h-full flex flex-col items-center py-2">
        <button
            onClick={onExpand}
            title="Expand thumbnails"
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors mb-2"
        >
            <Icons.ChevronRight />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-[10px] text-slate-400 writing-mode-vertical rotate-180" style={{ writingMode: 'vertical-rl' }}>
                {currentPage} / {numPages}
            </div>
        </div>
    </div>
);

/**
 * Add page button component
 */
const AddPageButton = ({ onClick, isProcessing }) => (
    <button
        onClick={onClick}
        disabled={isProcessing}
        title="Add blank page"
        className={`w-full flex items-center justify-center gap-1 py-2 px-3 rounded-md border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-colors ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : ''
        }`}
    >
        <Icons.Add />
        <span className="text-xs">Add Page</span>
    </button>
);

/**
 * Main PageThumbnails component with fold/unfold and page management
 */
const PageThumbnails = ({ 
    pdfDoc, 
    numPages, 
    currentPage, 
    onPageClick,
    onDuplicatePage,
    onRotatePage,
    onDeletePage,
    onAddPage,
    isProcessing = false,
    pageRotations = {},
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleDeleteClick = useCallback((pageIndex) => {
        if (deleteConfirm === pageIndex) {
            // Second click - confirm delete
            onDeletePage(pageIndex);
            setDeleteConfirm(null);
        } else {
            // First click - require confirmation
            setDeleteConfirm(pageIndex);
            // Auto-clear confirmation after 3 seconds
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    }, [deleteConfirm, onDeletePage]);

    const canDelete = numPages > 1;

    if (!pdfDoc || !numPages) return null;

    // Collapsed view
    if (isCollapsed) {
        return (
            <CollapsedSidebar 
                onExpand={() => setIsCollapsed(false)}
                numPages={numPages}
                currentPage={currentPage}
            />
        );
    }

    // Expanded view
    return (
        <div
            id="viewer-thumbnails"
            className="w-24 bg-white/80 backdrop-blur-sm border-r border-slate-200/60 h-full overflow-y-auto py-2 px-1.5 flex flex-col gap-1"
        >
            {/* Collapse button */}
            <div className="flex justify-end mb-1">
                <button
                    onClick={() => setIsCollapsed(true)}
                    title="Collapse thumbnails"
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <Icons.ChevronLeft />
                </button>
            </div>

            {/* Page thumbnails */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <PageThumbnail
                        key={pageNum}
                        pdfDoc={pdfDoc}
                        pageNum={pageNum}
                        isActive={currentPage === pageNum}
                        onClick={() => onPageClick(pageNum)}
                        onDuplicate={onDuplicatePage}
                        onRotate={onRotatePage}
                        onDelete={handleDeleteClick}
                        canDelete={canDelete}
                        isProcessing={isProcessing}
                        pageRotation={pageRotations[pageNum] || 0}
                    />
                ))}
            </div>

            {/* Add page button */}
            <div className="mt-2 pt-2 border-t border-slate-200">
                <AddPageButton 
                    onClick={() => onAddPage(numPages)}
                    isProcessing={isProcessing}
                />
            </div>

            {/* Delete confirmation tooltip */}
            {deleteConfirm !== null && (
                <div className="fixed bottom-4 left-28 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-2 rounded-md shadow-lg text-sm z-50">
                    Click delete again to confirm
                </div>
            )}
        </div>
    );
};

export default PageThumbnails;
