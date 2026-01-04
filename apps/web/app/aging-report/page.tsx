'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { Clock, History } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export default function AgingReportPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: report, isLoading } = useQuery({
        queryKey: ['aging-report'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/aging-report`);
            if (!res.ok) throw new Error('Failed to fetch aging report');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'PO Reference',
            accessorKey: 'poRef',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase">#PO-REF-123</span>
        },
        {
            header: 'Days Pending',
            accessorKey: 'days',
            cell: ({ row }) => <span className="text-danger-600 font-extrabold tabular-nums">5 Days</span>
        },
        {
            header: 'Current Stage',
            accessorKey: 'status',
            cell: ({ row }) => <StatusBadge status="PENDING" />
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <Clock className="text-brand-600" />
                    Aging Report
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Tracking overdue orders and process bottlenecks.</p>
            </header>

            <div className="app-card">
                <DataGrid data={report || []} columns={columns} isLoading={isLoading} />
                {(!report || report.length === 0) && !isLoading && (
                    <div className="p-20 text-center">
                         <h3 className="text-lg font-bold text-neutral-900">No aging orders</h3>
                         <p className="text-sm text-neutral-400">All orders are being processed within expected timeframes.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
