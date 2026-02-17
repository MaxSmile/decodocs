import { httpsCallable } from 'firebase/functions';

export const explainSelectionCall = async ({ functions, docHash, selection, documentContext }) => {
    const explainSelection = httpsCallable(functions, 'explainSelection');
    const result = await explainSelection({
        docHash,
        selection,
        documentContext,
    });
    return result.data;
};

export const highlightRisksCall = async ({ functions, docHash, documentText, documentType }) => {
    const highlightRisks = httpsCallable(functions, 'highlightRisks');
    const result = await highlightRisks({
        docHash,
        documentText,
        documentType,
    });
    return result.data;
};

export const translateToPlainEnglishCall = async ({ functions, docHash, legalText }) => {
    const translateToPlainEnglish = httpsCallable(functions, 'translateToPlainEnglish');
    const result = await translateToPlainEnglish({
        docHash,
        legalText,
    });
    return result.data;
};
