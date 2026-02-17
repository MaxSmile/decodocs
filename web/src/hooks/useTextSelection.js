import { useState, useEffect, useCallback } from 'react';

export const useTextSelection = () => {
    const [selection, setSelection] = useState(null);

    const handleSelectionChange = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
            setSelection(null);
            return;
        }

        const text = sel.toString().trim();
        if (!text) {
            setSelection(null);
            return;
        }

        // Get range rects for positioning (optional, for floating menus)
        const range = sel.getRangeAt(0);
        const rects = range.getClientRects();
        const boundingBox = range.getBoundingClientRect();

        setSelection({
            text,
            boundingBox,
            rects
        });
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [handleSelectionChange]);

    return selection;
};
