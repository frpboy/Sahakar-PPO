'use client';
import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';

export default function ExceptionAnalysisPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: conflicts, isLoading } = useQuery({
        queryKey: ['conflicts'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/conflict/list`);
            if (!res.ok) throw new Error('Failed to fetch conflicts');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Conflict Type',
            accessorKey: 'type',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase text-danger-600">{row.original.type || 'QTY_MISMATCH'}</span>
        },
        {
            header: 'Item',
            accessorKey: 'itemId',
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-bold uppercase">{row.original.itemId}</span>
        },
        {
            header: 'Resolution Status',
            cell: () => <span className="text-warning-600 font-bold uppercase text-[10px]">Pending Review</span>
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <AlertTriangle className="text-danger-600" />
                    Exception Analysis
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Monitoring and resolving system discrepancies.</p>
            </header>

            <div className="app-card">
                <DataGrid data={conflicts || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
