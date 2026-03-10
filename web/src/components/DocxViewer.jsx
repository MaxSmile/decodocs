import React, { useEffect, useRef } from 'react';
import * as docx from 'docx-preview';
import './DocxViewer.css';

const DocxViewer = ({ blob, scale = 1 }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!blob || !containerRef.current) return;

        // Clean up previous renders
        containerRef.current.innerHTML = '';

        // Render the DOCX blob
        docx.renderAsync(blob, containerRef.current, null, {
            className: "docx-document",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            useBase64URL: true,
        }).catch(err => console.error("DOCX render error:", err));

    }, [blob]);

    return (
        <div 
            className="docx-viewer-container" 
            style={{ 
                transform: `scale(${scale})`, 
                transformOrigin: 'top center',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                transition: 'transform 0.2s ease-in-out',
                backgroundColor: '#ffffff'
            }}
        >
            <div ref={containerRef} className="docx-render-target" style={{ width: '100%', maxWidth: '850px' }} />
        </div>
    );
};

export default DocxViewer;
