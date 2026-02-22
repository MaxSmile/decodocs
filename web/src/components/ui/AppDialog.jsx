import React from 'react';
import Button from './Button.jsx';
import Card from './Card.jsx';

/**
 * Simple modal used to “gate” access to certain features (Pro required,
 * anonymous-limit hit, etc.).  The caller passes a `dialog` object with
 * text/button labels; components such as the viewer, editor and homepage
 * render it when something needs to be explained to the user.
 *
 * Rather than a custom DOM structure we reuse shared UI building blocks so
 * styling/spacing is consistent and the component stays small.
 */
const AppDialog = ({ dialog, onConfirm, onCancel }) => {
    if (!dialog) return null;

    return (
        <div
            id="viewer-gate-dialog"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-[2000] p-4"
            onClick={onCancel}
        >
            <Card className="max-w-[520px] w-full p-4 sm:p-5 max-h-[85vh] overflow-y-auto">
                <div className="font-black text-base text-slate-900">{dialog.title}</div>
                <div className="mt-2.5 text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {dialog.message}
                </div>
                <div className="mt-3.5 flex gap-2.5 flex-wrap justify-end">
                    {dialog.secondaryLabel && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onCancel}
                        >
                            {dialog.secondaryLabel}
                        </Button>
                    )}
                    {dialog.primaryLabel && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onConfirm}
                        >
                            {dialog.primaryLabel}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AppDialog;
