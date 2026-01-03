'use client';

import { Power } from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface DutyEndButtonProps {
    onDutyEnd: () => Promise<void>;
    disabled?: boolean;
}

export function DutyEndButton({ onDutyEnd, disabled = false }: DutyEndButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEnding, setIsEnding] = useState(false);

    const handleConfirm = async () => {
        setIsEnding(true);
        try {
            await onDutyEnd();
            setShowConfirm(false);
        } catch (error) {
            console.error('Duty end failed:', error);
        } finally {
            setIsEnding(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={disabled || isEnding}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-md hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Power className="w-4 h-4" />
                End Duty
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                title="End Duty?"
                message="All your changes will be locked. This action cannot be undone."
                confirmLabel="End Duty"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={handleConfirm}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
