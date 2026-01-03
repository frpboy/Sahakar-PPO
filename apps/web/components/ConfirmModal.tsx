'use client';

import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'primary' | 'accent';
    children?: React.ReactNode;
    showFooter?: boolean;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'primary',
    children,
    showFooter = true,
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/40 backdrop-blur-[2px] p-4 transition-all duration-300">
            <div
                className="bg-white rounded border border-neutral-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-8 pb-6">
                    <h3 className="text-lg font-bold text-primary-900 uppercase tracking-tight">
                        {title}
                    </h3>
                    <div className="mt-2">
                        <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {children && (
                    <div className="px-8 pb-8">
                        {children}
                    </div>
                )}

                {showFooter && (
                    <div className="bg-neutral-50 px-8 py-5 flex flex-row-reverse gap-4 border-t border-neutral-200">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`
                px-6 py-2.5 text-[11px] font-bold text-white rounded uppercase tracking-widest shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2
                ${variant === 'danger'
                                    ? 'bg-error-600 hover:bg-error-700 focus:ring-error-500/20'
                                    : variant === 'accent'
                                        ? 'bg-accent-600 hover:bg-accent-700 focus:ring-accent-500/20'
                                        : 'bg-primary-700 hover:bg-primary-900 focus:ring-primary-500/20'
                                }
              `}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 text-[11px] font-bold text-neutral-600 border border-neutral-200 rounded uppercase tracking-widest hover:bg-white hover:border-neutral-300 transition-all focus:outline-none"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
