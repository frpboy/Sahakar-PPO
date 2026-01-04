'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { Timer } from 'lucide-react';
import { StatusBadge } from '../../../../components/StatusBadge';

export default function PendingAnalysisPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: pending, isLoading } = useQuery({
        queryKey: ['pending-analysis'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/pending-po/list`);
            if (!res.ok) throw new Error('Failed to fetch pending analysis');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Item',
            accessorKey: 'itemNew',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase">{row.original.itemNew}</span>
        },
        {
            header: 'Supplier',
            accessorKey: 'supplier',
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-bold uppercase">{row.original.supplier}</span>
        },
        {
            header: 'Days in Queue',
            cell: () => <span className="tabular-nums font-bold text-warning-600">2 Days</span>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <Timer className="text-brand-600" />
                    Pending Analysis
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Deep-dive into orders awaiting validation.</p>
            </header>

            <div className="app-card">
                <DataGrid data={pending || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
