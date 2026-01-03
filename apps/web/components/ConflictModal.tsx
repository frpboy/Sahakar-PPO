'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConflictData {
    field: string;
    yourValue: any;
    systemValue: any;
}

interface ConflictModalProps {
    isOpen: boolean;
    entity: string;
    conflicts: ConflictData[];
    onKeepMine: () => void;
    onUseSystem: () => void;
    onCancel: () => void;
}

export function ConflictModal({
    isOpen,
    entity,
    conflicts,
    onKeepMine,
    onUseSystem,
    onCancel,
}: ConflictModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
            >
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Conflict Detected
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                This {entity} was modified by another user. Choose which version to keep.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {conflicts.map((conflict, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                {conflict.field}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-semibold text-blue-700 mb-1">Your Change</div>
                                    <div className="text-sm font-mono bg-blue-50 border border-blue-200 rounded px-3 py-2">
                                        {String(conflict.yourValue)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-gray-700 mb-1">Current System Value</div>
                                    <div className="text-sm font-mono bg-white border border-gray-300 rounded px-3 py-2">
                                        {String(conflict.systemValue)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onUseSystem}
                        className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all"
                    >
                        Use System
                    </button>
                    <button
                        type="button"
                        onClick={onKeepMine}
                        className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-all"
                    >
                        Keep Mine
                    </button>
                </div>
            </div>
        </div>
    );
}
