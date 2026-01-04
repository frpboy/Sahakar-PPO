'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { FileText } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface AuditEvent {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    beforeState: string;
    afterState: string;
    actor: string;
    createdAt: string;
}

export default function LogsPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const [filters, setFilters] = useState({ entityType: '', action: '', actor: '' });

    const { data: logs, isLoading } = useQuery({
        queryKey: ['audit-events', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.entityType) params.append('entityType', filters.entityType);
            if (filters.action) params.append('action', filters.action);
            if (filters.actor) params.append('actor', filters.actor);
            const res = await fetch(`${apiUrl}/audit-events?${params}`);
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            return res.json();
        }
    });

    const columns = useMemo<ColumnDef<AuditEvent>[]>(() => [
        {
            header: 'Timestamp',
            accessorKey: 'createdAt',
            size: 160,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-900">
                    {new Date(row.original.createdAt).toLocaleString()}
                </span>
            )
        },
        {
            header: 'Entity',
            accessorKey: 'entityType',
            size: 140,
            cell: ({ row }) => (
                <span className="text-xs font-bold text-brand-600">{row.original.entityType}</span>
            )
        },
        {
            header: 'Action',
            accessorKey: 'action',
            size: 120,
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-neutral-900">{row.original.action}</span>
            )
        },
        {
            header: 'Actor',
            accessorKey: 'actor',
            size: 200,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.actor}</span>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                        <FileText size={22} className="text-brand-600" />
                    </div>
                    Audit Logs
                </h1>
                <p className="text-sm text-neutral-500 mt-1">System activity and audit trail</p>
            </header>

            <div className="mb-4 grid grid-cols-3 gap-3">
                <input
                    type="text"
                    placeholder="Entity Type (e.g. ORDER_SLIP)"
                    value={filters.entityType}
                    onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                    className="px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <input
                    type="text"
                    placeholder="Action (e.g. CREATE)"
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500 text-sm"
                />
                <input
                    type="text"
                    placeholder="Actor (email)"
                    value={filters.actor}
                    onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                    className="px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500 text-sm"
                />
            </div>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid data={logs || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
