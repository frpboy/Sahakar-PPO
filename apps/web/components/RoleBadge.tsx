'use client';

import React from 'react';

export type UserRole =
    | 'MASTER_ADMIN'
    | 'BILLING_HEAD'
    | 'BILLING_STAFF'
    | 'PURCHASE_HEAD'
    | 'PURCHASE_STAFF'
    | 'WAREHOUSE_STAFF'
    | 'REP';

interface RoleBadgeProps {
    role: UserRole | string;
    className?: string;
}

const roleStyles: Record<string, { bg: string, text: string, border: string, label: string }> = {
    'MASTER_ADMIN': { bg: 'bg-brand-900', text: 'text-white', border: 'border-brand-700/50', label: 'MASTER ADMIN' },
    'BILLING_HEAD': { bg: 'bg-brand-700/10', text: 'text-brand-700', border: 'border-brand-300/30', label: 'BILLING HEAD' },
    'BILLING_STAFF': { bg: 'bg-brand-50/50', text: 'text-brand-600', border: 'border-brand-200/50', label: 'BILLING STAFF' },
    'PURCHASE_HEAD': { bg: 'bg-brand-800', text: 'text-white', border: 'border-brand-600/50', label: 'PURCHASE HEAD' },
    'PURCHASE_STAFF': { bg: 'bg-indigo-50/50', text: 'text-indigo-600', border: 'border-indigo-200/50', label: 'PURCHASE' },
    'WAREHOUSE_STAFF': { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200/50', label: 'WAREHOUSE' },
    'REP': { bg: 'bg-warning-50/50', text: 'text-warning-600', border: 'border-warning-200/50', label: 'REP' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className = '' }) => {
    const style = roleStyles[role] || { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-200/50', label: role.replace('_', ' ') };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase border border-transparent shadow-sm ${style.bg} ${style.text} ${style.border} ${className}`}
        >
            {style.label}
        </span>
    );
};
