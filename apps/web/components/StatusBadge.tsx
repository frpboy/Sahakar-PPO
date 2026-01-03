'use client';

import React from 'react';

export type StatusType =
    | 'BILLED'
    | 'NOT BILLED'
    | 'PARTIALLY BILLED'
    | 'PRODUCT CHANGED'
    | 'DAMAGED'
    | 'MISSING'
    | 'DONE'
    | 'LOCKED'
    | 'PENDING'
    | 'REP_ALLOCATION'
    | 'SLIP_GENERATED'
    | 'EXECUTED';

interface StatusBadgeProps {
    status: StatusType;
    className?: string;
}

const statusMap: Record<StatusType, { bg: string, text: string, label: string }> = {
    'BILLED': { bg: '#dcfce7', text: 'var(--color-status-billed)', label: 'BILLED' },
    'NOT BILLED': { bg: '#fee2e2', text: 'var(--color-status-not-billed)', label: 'NOT BILLED' },
    'PARTIALLY BILLED': { bg: '#fef3c7', text: 'var(--color-status-partial)', label: 'PARTIAL' },
    'PRODUCT CHANGED': { bg: '#dbeafe', text: 'var(--color-status-changed)', label: 'CHANGED' },
    'DAMAGED': { bg: '#ffedd5', text: 'var(--color-status-damaged)', label: 'DAMAGED' },
    'MISSING': { bg: '#f3e8ff', text: 'var(--color-status-missing)', label: 'MISSING' },
    'DONE': { bg: '#dcfce7', text: 'var(--color-status-done)', label: 'DONE' },
    'LOCKED': { bg: '#f3f4f6', text: 'var(--color-status-locked)', label: 'LOCKED' },
    'PENDING': { bg: '#e5e7eb', text: '#374151', label: 'PENDING' },
    'REP_ALLOCATION': { bg: '#fef3c7', text: '#92400E', label: 'REP ALLOC' },
    'SLIP_GENERATED': { bg: '#dbeafe', text: '#1E40AF', label: 'SLIP GEN' },
    'EXECUTED': { bg: '#dcfce7', text: '#166534', label: 'EXECUTED' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const config = statusMap[status] || { bg: '#E5E7EB', text: '#374151', label: status };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${className}`}
            style={{ backgroundColor: config.bg, color: config.text }}
        >
            {status === 'DONE' && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
            {config.label}
        </span>
    );
};
