import React from 'react';

const GateDialog = ({ gate, onConfirm, onCancel }) => {
    if (!gate) return null;

    return (
        <div
            id="viewer-gate-dialog"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-[2000] p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-xl border border-slate-200 max-w-[520px] w-full p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="font-black text-base text-slate-900">{gate.title}</div>
                <div className="mt-2.5 text-slate-600 leading-relaxed whitespace-pre-wrap">{gate.message}</div>
                <div className="mt-3.5 flex gap-2.5 flex-wrap justify-end">
                    {gate.secondaryLabel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-black cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            {gate.secondaryLabel}
                        </button>
                    )}
                    {gate.primaryLabel && (
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="px-3 py-2.5 rounded-xl border border-slate-900 bg-slate-900 text-white font-black cursor-pointer hover:bg-slate-800 transition-colors"
                        >
                            {gate.primaryLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GateDialog;
