import { useState } from 'react';
import { analyzeByTypeCall } from '../services/typeAnalysisService';
import { preflightCheckCall } from '../services/preflightService';
import { analyzeTextCall } from '../services/analyzeTextService';
import { explainSelectionCall, highlightRisksCall, translateToPlainEnglishCall } from '../services/analysisService';
import { buildDocStats } from '../utils/docStats';

export const useDocumentAnalysis = ({ functions, authState, isMockMode }) => {
    const [analysisResults, setAnalysisResults] = useState({});
    const [gate, setGate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const isFirebaseAvailable = () => {
        if (isMockMode && authState.status === 'authenticated') {
            return true;
        }
        return functions && authState.status === 'authenticated';
    };

    const runPreflightCheck = async ({ pdfTextContent, numPages, selectedDocument, docHash }) => {
        if (!pdfTextContent || !numPages) return { ok: true, classification: 'OK' };

        if (isMockMode) {
            return { ok: true, classification: 'OK' };
        }

        try {
            const stats = buildDocStats({
                pageCount: numPages,
                extractedText: pdfTextContent,
                pdfSizeBytes: selectedDocument?.size || 0,
            });

            const data = await preflightCheckCall({
                functions,
                docHash,
                stats,
            });

            return data;
        } catch (error) {
            console.error('Preflight check error:', error);
            return { ok: true, classification: 'OK' };
        }
    };

    const handleAnalyzeByType = async ({ selectedDocument, pdfTextContent, docHash }) => {
        if (!selectedDocument || !pdfTextContent || !docHash) return;

        if (!isFirebaseAvailable()) {
            console.warn('Type-specific analysis unavailable: Firebase services not accessible.');
            return;
        }

        setAnalysisResults((prev) => ({
            ...prev,
            [selectedDocument.id]: {
                ...(prev[selectedDocument.id]),
                _meta: { status: 'loading', message: 'Running type-specific analysis…' },
            },
        }));

        setIsLoading(true);

        try {
            if (isMockMode) {
                setGate({
                    title: 'Type-specific analysis (beta)',
                    message: 'Not available in mock mode yet.',
                    primaryLabel: 'OK',
                    primaryTo: null,
                    secondaryLabel: null,
                    secondaryTo: null,
                });
                setAnalysisResults((prev) => ({
                    ...prev,
                    [selectedDocument.id]: {
                        ...(prev[selectedDocument.id]),
                        _meta: { status: 'error', message: 'Not available in mock mode yet.' },
                    },
                }));
                return;
            }

            const data = (await analyzeByTypeCall({ functions, docHash, text: pdfTextContent })) || {};

            const typeSpecific = {
                ok: !!data.ok,
                effectiveTypeId: data.effectiveTypeId || null,
                validationSlug: data.validationSlug || null,
                validationTitle: data.validationSpec?.title || null,
                message: data.message || null,
                result: data.result || null,
                usage: data.usage || null,
                requiredTier: data.requiredTier || null,
                code: data.code || null,
            };

            setAnalysisResults((prev) => ({
                ...prev,
                [selectedDocument.id]: {
                    ...(prev[selectedDocument.id]),
                    _meta: { status: 'success' },
                    typeSpecific,
                },
            }));

            setGate({
                title: 'Type-specific analysis (beta)',
                message:
                    `effectiveTypeId: ${typeSpecific.effectiveTypeId || 'null'}\n` +
                    `validationSlug: ${typeSpecific.validationSlug || 'null'}\n\n` +
                    (typeSpecific.validationTitle ? `Spec: ${typeSpecific.validationTitle}\n\n` : '') +
                    (typeSpecific.message || ''),
                primaryLabel: 'OK',
                primaryTo: null,
                secondaryLabel: null,
                secondaryTo: null,
            });
        } catch (e) {
            console.error('analyzeByType error:', e);
            setAnalysisResults((prev) => ({
                ...prev,
                [selectedDocument.id]: {
                    ...(prev[selectedDocument.id]),
                    _meta: { status: 'error', message: e?.message || 'Request failed.' },
                },
            }));
            setGate({
                title: 'Type-specific analysis failed',
                message: e?.message || 'Request failed.',
                primaryLabel: 'OK',
                primaryTo: null,
                secondaryLabel: null,
                secondaryTo: null,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeDocument = async ({ selectedDocument, pdfTextContent, docHash, numPages, updateAnnotations }) => {
        if (!selectedDocument || !pdfTextContent || !docHash) return;

        if (!isFirebaseAvailable()) {
            console.warn('Document analysis unavailable: Firebase services not accessible.');
            return;
        }

        setAnalysisResults((prev) => ({
            ...prev,
            [selectedDocument.id]: {
                ...(prev[selectedDocument.id]),
                _meta: { status: 'loading', message: 'Running analysis…' },
            },
        }));

        setIsLoading(true);

        try {
            const preflightResult = await runPreflightCheck({ pdfTextContent, numPages, selectedDocument, docHash });

            if (!preflightResult.ok) {
                console.error('Preflight check failed:', preflightResult);
                throw new Error(preflightResult.message || 'Preflight check failed');
            }

            if (preflightResult.classification === 'PRO_REQUIRED') {
                const msg = preflightResult.reasons?.map((r) => r.message).join(' ') || 'This document requires Pro features (OCR / deeper processing).';
                setAnalysisResults((prev) => ({
                    ...prev,
                    [selectedDocument.id]: {
                        ...(prev[selectedDocument.id]),
                        _meta: { status: 'error', message: msg },
                    },
                }));
                setGate({
                    title: 'Pro required',
                    message: msg,
                    primaryLabel: 'Upgrade to Pro',
                    primaryTo: '/pricing',
                    secondaryLabel: 'Cancel',
                    secondaryTo: null,
                });
                return;
            }

            const stats = buildDocStats({
                pageCount: numPages,
                extractedText: pdfTextContent,
                pdfSizeBytes: selectedDocument?.size || 0,
            });

            const pages = pdfTextContent.split('\f');
            const { charsPerPage, totalChars } = stats;

            let result;
            if (isMockMode) {
                const response = await fetch('/analyzeText', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        docHash,
                        stats: { pageCount: numPages, charsPerPage, totalChars, languageHint: 'en' },
                        text: { format: 'paged', value: pdfTextContent },
                        options: { tasks: ['explain', 'caveats', 'inconsistencies'], targetLanguage: null },
                    }),
                });
                result = { data: await response.json() };
            } else {
                result = await analyzeTextCall({
                    functions,
                    payload: {
                        docHash,
                        stats: {
                            pageCount: numPages,
                            charsPerPage,
                            totalChars,
                            languageHint: 'en',
                        },
                        text: {
                            format: 'paged',
                            value: pdfTextContent,
                            pageTextIndex: pages.map((text, idx) => ({
                                page: idx + 1,
                                start: 0,
                                end: text.length,
                            })),
                        },
                        options: {
                            tasks: ['explain', 'caveats', 'inconsistencies'],
                            targetLanguage: null,
                        },
                    },
                });
            }

            if (result.data.ok) {
                setGate(null);
	                const mappedAnalysis = {
	                    _meta: { status: 'success' },
	                    summary: result.data.result.plainExplanation,
	                    keyPoints: [],
	                    risks: result.data.result.risks.map((risk) => {
	                        const checks = Array.isArray(risk.whatToCheck) ? risk.whatToCheck : [];
	                        return {
	                            id: risk.id,
	                            clause: risk.title,
	                            riskLevel: risk.severity, // Fixed mapping
	                            description: risk.whyItMatters,
	                            explanation: checks.join('; '),
	                        };
	                    }),
	                    recommendations: result.data.result.risks.flatMap((risk) =>
	                        Array.isArray(risk.whatToCheck) ? risk.whatToCheck : []
	                    ),
	                };

                setAnalysisResults((prev) => ({
                    ...prev,
                    [selectedDocument.id]: mappedAnalysis,
                }));

                if (updateAnnotations) {
                    updateAnnotations(mappedAnalysis);
                }

            } else {
                const code = result.data.code;
                if (code === 'SCAN_DETECTED_PRO_REQUIRED') {
                    const msg = result.data.message || 'This PDF appears to be scanned. OCR is available on Pro.';
                    setAnalysisResults((prev) => ({
                        ...prev,
                        [selectedDocument.id]: {
                            ...(prev[selectedDocument.id]),
                            _meta: { status: 'error', message: msg },
                        },
                    }));
                    setGate({
                        title: 'Scanned PDF (OCR requires Pro)',
                        message: msg,
                        primaryLabel: 'Upgrade to Pro',
                        primaryTo: '/pricing',
                        secondaryLabel: 'Cancel',
                        secondaryTo: null,
                        secondaryTo: null,
                    });
                    return;
                }

                if (code === 'ANON_TOKEN_LIMIT') {
                    const msg = result.data.message || 'Anonymous token limit reached. Create a free account to continue.';
                    setAnalysisResults((prev) => ({
                        ...prev,
                        [selectedDocument.id]: {
                            ...(prev[selectedDocument.id]),
                            _meta: { status: 'error', message: msg },
                        },
                    }));
                    setGate({
                        title: 'Limit reached',
                        message: msg,
                        primaryLabel: 'Create free account',
                        primaryTo: '/sign-in',
                        secondaryLabel: 'Cancel',
                        secondaryTo: null,
                    });
                    return;
                }

                if (code === 'FREE_TOKEN_LIMIT') {
                    const msg = result.data.message || 'Daily token limit reached. Upgrade to Pro to continue.';
                    setAnalysisResults((prev) => ({
                        ...prev,
                        [selectedDocument.id]: {
                            ...(prev[selectedDocument.id]),
                            _meta: { status: 'error', message: msg },
                        },
                    }));
                    setGate({
                        title: 'Daily limit reached',
                        message: msg,
                        primaryLabel: 'Upgrade to Pro',
                        primaryTo: '/pricing',
                        secondaryLabel: 'Cancel',
                        secondaryTo: null,
                    });
                    return;
                }

                console.error('Analysis failed:', result.data);
                throw new Error(result.data.message || 'Analysis failed');
            }
        } catch (error) {
            console.error('Error analyzing document:', error);
            setAnalysisResults((prev) => ({
                ...prev,
                [selectedDocument.id]: {
                    ...(prev[selectedDocument.id]),
                    _meta: { status: 'error', message: error?.message || 'Analysis failed.' },
                },
            }));
            setGate({
                title: 'Analysis failed',
                message: error?.message || 'Request failed.',
                primaryLabel: 'OK',
                primaryTo: null,
                secondaryLabel: null,
                secondaryTo: null,
            });
            return;
        } finally {
            setIsLoading(false);
        }
    };

    const handleExplainSelection = async (args) => {
        const { selectedDocument, docHash, pdfTextContent } = args;
        if (!selectedDocument || !docHash) return;

        if (!isFirebaseAvailable()) {
            console.warn('Explain selection unavailable: Firebase services not accessible.');
            return;
        }

        const selection = args.selection?.text;
        if (!selection) {
            setGate({
                title: 'No selection',
                message: 'Please select some text in the document first.',
                primaryLabel: 'OK',
            });
            return;
        }

        try {
            let data;
            if (isMockMode) {
                const response = await fetch('/explainSelection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ docHash, selection, documentContext: pdfTextContent }),
                });
                data = await response.json();
            } else {
                data = await explainSelectionCall({
                    functions,
                    docHash,
                    selection,
                    documentContext: pdfTextContent,
                });
            }

            if (data.ok) { // Fixed: check for ok instead of success
                alert(`Explanation: ${data.explanation.plainExplanation}`);
            } else {
                console.error('Explanation failed:', data);
                throw new Error(data.error || 'Explanation failed');
            }
        } catch (error) {
            console.error('Error explaining selection:', error);
            throw error;
        }
    };

    const handleHighlightRisks = async ({ selectedDocument, docHash, pdfTextContent, setRiskBadges }) => {
        if (!selectedDocument || !docHash) return;

        if (!isFirebaseAvailable()) {
            console.warn('Risk highlighting unavailable: Firebase services not accessible.');
            return;
        }

        setIsLoading(true);

        try {
            let data;
            if (isMockMode) {
                const response = await fetch('/highlightRisks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ docHash, documentText: pdfTextContent, documentType: 'contract' }),
                });
                data = await response.json();
            } else {
                data = await highlightRisksCall({
                    functions,
                    docHash,
                    documentText: pdfTextContent,
                    documentType: 'contract',
                });
            }

            if (data.ok) { // Fixed: check for ok
                alert(`Found ${data.risks.summary.totalRisks} risks in the document.`);

                const newRiskBadges =
                    data.risks.items?.map((risk, idx) => ({
                        id: idx,
                        pageNum: 1,
                        x: 150 + idx * 40,
                        y: 150 + idx * 35,
                        level: risk.severity, // Fixed: map severity to level
                        description: risk.description,
                        explanation: risk.explanation,
                    })) || [];

                setRiskBadges(newRiskBadges);
            } else {
                console.error('Risk highlighting failed:', data);
                throw new Error(data.error || 'Risk highlighting failed');
            }
        } catch (error) {
            console.error('Error highlighting risks:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranslateToPlainEnglish = async ({ selectedDocument, docHash, pdfTextContent }) => {
        if (!selectedDocument || !docHash) return;

        if (!isFirebaseAvailable()) {
            console.warn('Translation unavailable: Firebase services not accessible.');
            return;
        }

        try {
            const legalText = pdfTextContent.substring(0, 500);

            let data;
            if (isMockMode) {
                const response = await fetch('/translateToPlainEnglish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ docHash, legalText }),
                });
                data = await response.json();
            } else {
                data = await translateToPlainEnglishCall({
                    functions,
                    docHash,
                    legalText,
                });
            }

            if (data.ok) { // Fixed: check for ok
                alert(
                    `Original: ${data.translation.originalText}\n\nPlain English: ${data.translation.plainEnglishTranslation}`
                );
            } else {
                console.error('Translation failed:', data);
                throw new Error(data.error || 'Translation failed');
            }
        } catch (error) {
            console.error('Error translating to plain English:', error);
            throw error;
        }
    };

    const handleSummarizeKeyPoints = async ({ selectedDocument, docHash, pdfTextContent }) => {
        // Reuse analyzeText with specific options
        if (!selectedDocument || !docHash) return;
        return handleAnalyzeDocument({ selectedDocument, pdfTextContent, docHash, numPages: 1 }); // Simplification: reuse full analysis for now as it includes summary
    };

    const handleSuggestImprovements = async ({ selectedDocument, docHash, pdfTextContent }) => {
        // Reuse analyzeText
        if (!selectedDocument || !docHash) return;
        return handleAnalyzeDocument({ selectedDocument, pdfTextContent, docHash, numPages: 1 });
    };

    return {
        analysisResults,
        gate,
        setGate,
        isLoading,
        handleAnalyzeDocument,
        handleAnalyzeByType,
        handleExplainSelection,
        handleHighlightRisks,
        handleTranslateToPlainEnglish,
        handleSummarizeKeyPoints,
        handleSuggestImprovements,
    };
};
