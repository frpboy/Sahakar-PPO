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
    'BILLED': { bg: 'var(--status-billed-bg)', text: 'var(--status-billed-text)', label: 'BILLED' },
    'NOT BILLED': { bg: 'var(--status-not-billed-bg)', text: 'var(--status-not-billed-text)', label: 'NOT BILLED' },
    'PARTIALLY BILLED': { bg: 'var(--status-partial-bg)', text: 'var(--status-partial-text)', label: 'PARTIAL' },
    'PRODUCT CHANGED': { bg: 'var(--status-changed-bg)', text: 'var(--status-changed-text)', label: 'CHANGED' },
    'DAMAGED': { bg: 'var(--status-damaged-bg)', text: 'var(--status-damaged-text)', label: 'DAMAGED' },
    'MISSING': { bg: 'var(--status-missing-bg)', text: 'var(--status-missing-text)', label: 'MISSING' },
    'DONE': { bg: 'var(--status-billed-bg)', text: 'var(--status-billed-text)', label: 'DONE' },
    'LOCKED': { bg: '#F3F4F6', text: '#374151', label: 'LOCKED' },
    'PENDING': { bg: '#E5E7EB', text: '#374151', label: 'PENDING' },
    'REP_ALLOCATION': { bg: '#FEF3C7', text: '#92400E', label: 'REP ALLOC' },
    'SLIP_GENERATED': { bg: '#DBEAFE', text: '#1E40AF', label: 'SLIP GEN' },
    'EXECUTED': { bg: '#DCFCE7', text: '#166534', label: 'EXECUTED' },
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
