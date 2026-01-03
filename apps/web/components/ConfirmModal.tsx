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
    variant?: 'danger' | 'primary';
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
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6 border-b border-gray-100/10">
                    <h3 className="text-lg font-bold text-gray-900 leading-6">
                        {title}
                    </h3>
                    <div className="mt-3">
                        <p className="text-sm text-gray-500 font-medium">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`
              inline-flex justify-center rounded-md px-4 py-2 text-sm font-bold text-white shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
              ${variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
                                : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600'
                            }
            `}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 transition-all"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
