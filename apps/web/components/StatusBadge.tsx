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

const statusMap: Record<StatusType, { bg: string, text: string, border: string, label: string }> = {
    'BILLED': { bg: 'bg-success-100/40', text: 'text-success-600', border: 'border-success-200/50', label: 'BILLED' },
    'NOT BILLED': { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-200/50', label: 'NOT BILLED' },
    'PARTIALLY BILLED': { bg: 'bg-warning-100/40', text: 'text-warning-600', border: 'border-warning-200/50', label: 'PARTIAL' },
    'PRODUCT CHANGED': { bg: 'bg-warning-100/40', text: 'text-warning-600', border: 'border-warning-200/50', label: 'CHANGED' },
    'DAMAGED': { bg: 'bg-danger-100/40', text: 'text-danger-600', border: 'border-danger-200/50', label: 'DAMAGED' },
    'MISSING': { bg: 'bg-danger-100/40', text: 'text-danger-600', border: 'border-danger-200/50', label: 'MISSING' },
    'DONE': { bg: 'bg-brand-100/40', text: 'text-brand-600', border: 'border-brand-200/50', label: 'DONE' },
    'LOCKED': { bg: 'bg-neutral-100', text: 'text-neutral-400', border: 'border-neutral-200/50', label: 'LOCKED' },
    'PENDING': { bg: 'bg-warning-100/40', text: 'text-warning-600', border: 'border-warning-200/50', label: 'PENDING' },
    'REP_ALLOCATION': { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-200/50', label: 'REP ALLOC' },
    'SLIP_GENERATED': { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200/50', label: 'SLIP GEN' },
    'EXECUTED': { bg: 'bg-success-100/40', text: 'text-success-600', border: 'border-success-200/50', label: 'EXECUTED' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const config = statusMap[status] || { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200', label: status };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border smooth-transition ${config.bg} ${config.text} ${config.border} ${className}`}
        >
            {status === 'DONE' && <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />}
            {config.label}
        </span>
    );
};
