'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { ListChecks, PieChart } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export default function StatusSummaryPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Metric',
            accessorKey: 'label',
            size: 250,
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase">{row.original.label}</span>
        },
        {
            header: 'Count',
            accessorKey: 'value',
            size: 100,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="font-extrabold tabular-nums text-brand-600">{row.original.value}</span>
        }
    ];

    const data = stats ? [
        { label: 'Total Ingested', value: stats.raw },
        { label: 'Awaiting Validation', value: stats.pending },
        { label: 'REP Allocated', value: stats.rep_allocation },
        { label: 'Slips Generated', value: stats.slip_generated },
        { label: 'Completed Shifts', value: stats.executed }
    ] : [];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <ListChecks className="text-brand-600" />
                    Status Summary
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Consolidated view of all operational statuses.</p>
            </header>

            <div className="app-card max-w-2xl">
                <DataGrid data={data} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
