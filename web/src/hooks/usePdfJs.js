import { useState, useEffect } from 'react';
import { computeSHA256, extractPdfTextAllPages } from '../utils/pdfUtils';
import { buildDocStats } from '../utils/docStats';

export const usePdfJs = () => {
    const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageScale, setPageScale] = useState(1.5);
    const [pdfTextContent, setPdfTextContent] = useState('');
    const [docStats, setDocStats] = useState(null);
    const [docHash, setDocHash] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [loadError, setLoadError] = useState(null);

    // Initialize PDF.js
    useEffect(() => {
        const initPdfJs = async () => {
            if (window.pdfjsLib) {
                setPdfLibLoaded(true);
                return;
            }

            try {
                const pdfjsLib = await import('pdfjs-dist');
                window.pdfjsLib = pdfjsLib;
                setPdfLibLoaded(true);
            } catch (err) {
                console.error('Failed to load PDF.js:', err);
                setLoadError(err);
            }
        };

        initPdfJs();
    }, []);

    const loadPdfFromBlob = async (fileBlob) => {
        if (!window.pdfjsLib || !fileBlob) return;

        try {
            setIsLoading(true);
            setLoadError(null);
            const fileNameForDisplay = fileBlob.name || 'document';
            setLoadingMessage(`Loading ${fileNameForDisplay}...`);

            const arrayBuffer = await fileBlob.arrayBuffer();
            const docHashValue = await computeSHA256(arrayBuffer);
            setDocHash(docHashValue);

            const lib = window.pdfjsLib;
            const pdf = await lib.getDocument({
                data: arrayBuffer,
                onProgress: (progress) => {
                    if (progress.total > 0) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        setLoadingMessage(`Loading ${fileNameForDisplay}: ${percent}%`);
                    }
                },
            }).promise;

            setPdfDoc(pdf);
            setNumPages(pdf.numPages);

            setLoadingMessage(`Extracting text from ${fileNameForDisplay}...`);
            const extractedText = await extractPdfTextAllPages(pdf);
            setPdfTextContent(extractedText);

            const stats = buildDocStats({ pageCount: pdf.numPages, extractedText, pdfSizeBytes: arrayBuffer.byteLength });
            setDocStats(stats);

            setPageNumber(1);
            setLoadingMessage('');

            return { docHash: docHashValue, stats, text: extractedText };
        } catch (error) {
            console.error('Error loading PDF from blob:', error);
            setLoadError(error);
            setLoadingMessage('');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const loadTestPdf = async (fileName) => {
        if (!window.pdfjsLib) return;

        try {
            setIsLoading(true);
            setLoadError(null);
            setLoadingMessage(`Loading ${fileName}...`);

            const pdfUrl = `/test-docs/${fileName}`;
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const docHashValue = await computeSHA256(arrayBuffer);
            setDocHash(docHashValue);

            const pdfjsLib = window.pdfjsLib;
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                onProgress: (progress) => {
                    if (progress.total > 0) {
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        setLoadingMessage(`Loading ${fileName}: ${percent}%`);
                    }
                },
            }).promise;

            setPdfDoc(pdf);
            setNumPages(pdf.numPages);

            setLoadingMessage(`Extracting text from ${fileName}...`);
            const extractedText = await extractPdfTextAllPages(pdf);
            setPdfTextContent(extractedText);

            const stats = buildDocStats({ pageCount: pdf.numPages, extractedText, pdfSizeBytes: arrayBuffer.byteLength });
            setDocStats(stats);

            setPageNumber(1);
            setLoadingMessage('');

            return {
                docHash: docHashValue,
                stats,
                text: extractedText,
                fileInfo: {
                    name: fileName,
                    size: arrayBuffer.byteLength,
                    type: 'application/pdf'
                }
            };
        } catch (error) {
            console.error('Error loading test PDF:', error);
            setLoadError(error);
            setLoadingMessage('');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const navigation = {
        goToPreviousPage: () => setPageNumber((prev) => Math.max(prev - 1, 1)),
        goToNextPage: () => setPageNumber((prev) => Math.min(prev + 1, numPages || 1)),
        zoomIn: () => setPageScale((prev) => Math.min(prev + 0.2, 3.0)),
        zoomOut: () => setPageScale((prev) => Math.max(prev - 0.2, 0.5)),
        setPageNumber,
        setPageScale,
    };

    const resetPdf = () => {
        try { pdfDoc?.destroy?.(); } catch (e) { /* ignore */ }
        setPdfDoc(null);
        setNumPages(null);
        setPageNumber(1);
        setPageScale(1.5);
        setPdfTextContent('');
        setDocStats(null);
        setDocHash(null);
        setIsLoading(false);
        setLoadingMessage('');
        setLoadError(null);
    };

    return {
        pdfLibLoaded,
        pdfDoc,
        numPages,
        pageNumber,
        pageScale,
        pdfTextContent,
        docStats,
        docHash,
        isLoading,
        loadingMessage,
        loadError,
        loadPdfFromBlob,
        loadTestPdf,
        navigation,
        resetPdf,
    };
};
