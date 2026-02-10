import { useState } from 'react';
import { detectDocumentTypeCall, getDocumentTypeStateCall, saveDocTypeOverrideCall } from '../services/documentTypeService';

export const useDocumentTypeDetection = ({ functions, isMockMode }) => {
    const [detectedDocTypeId, setDetectedDocTypeId] = useState('legal_contract_generic');
    const [detectedMeta, setDetectedMeta] = useState(null); // { intakeCategory, confidence, model, updatedAt }
    const [overrideDocTypeId, setOverrideDocTypeId] = useState(null);
    const [pendingOverride, setPendingOverride] = useState(null);

    const loadServerTypeState = async (docHashValue) => {
        if (!functions || isMockMode) return;
        try {
            const data = (await getDocumentTypeStateCall({ functions, docHash: docHashValue })) || {};

            if (data?.overrideTypeId) setOverrideDocTypeId(data.overrideTypeId);
            if (data?.detected?.typeId) setDetectedDocTypeId(data.detected.typeId);
            if (data?.detected) {
                setDetectedMeta({
                    intakeCategory: data.detected.intakeCategory || null,
                    confidence: typeof data.detected.confidence === 'number' ? data.detected.confidence : null,
                    model: data.detected.model || null,
                    updatedAt: data.detected.updatedAt || null,
                });
            }
        } catch (e) {
            console.warn('Failed to load server document type state', e);
        }
    };

    const runServerDetection = async ({ docHashValue, stats, text }) => {
        if (!functions || isMockMode) return;
        try {
            const data = (await detectDocumentTypeCall({ functions, docHash: docHashValue, stats, text })) || {};
            if (data?.typeId) setDetectedDocTypeId(data.typeId);
            setDetectedMeta({
                intakeCategory: data.intakeCategory || null,
                confidence: typeof data.confidence === 'number' ? data.confidence : null,
                model: data.model || 'heuristic-v1',
                updatedAt: null,
            });
        } catch (e) {
            console.warn('Failed to detect document type', e);
        }
    };

    const persistOverride = async (docHashValue, typeId) => {
        try {
            localStorage.setItem(`decodocs:doctype:${docHashValue}`, String(typeId));
        } catch {
            // ignore
        }

        if (!functions || isMockMode) return;

        try {
            await saveDocTypeOverrideCall({ functions, docHash: docHashValue, typeId });
        } catch (e) {
            console.warn('Failed to persist doc type override', e);
        }
    };

    // Helper to load local override
    const loadLocalOverride = (docHashValue) => {
        try {
            const ov = localStorage.getItem(`decodocs:doctype:${docHashValue}`);
            if (ov) setOverrideDocTypeId(ov);
        } catch {
            // ignore
        }
    };

    return {
        detectedDocTypeId,
        detectedMeta,
        overrideDocTypeId,
        pendingOverride,
        setOverrideDocTypeId,
        setPendingOverride,
        loadServerTypeState,
        runServerDetection,
        persistOverride,
        loadLocalOverride,
        setDetectedDocTypeId // Exposed in case we need to reset/set manually
    };
};
