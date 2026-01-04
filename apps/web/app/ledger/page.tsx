'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { ListChecks } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export default function StatusLedgerPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: ledger, isLoading } = useQuery({
        queryKey: ['status-ledger'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/ledger`);
            if (!res.ok) throw new Error('Failed to fetch ledger');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Timestamp',
            accessorKey: 'eventDatetime',
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400">{new Date(row.original.eventDatetime).toLocaleString()}</span>
        },
        {
            header: 'User',
            accessorKey: 'userId',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase text-brand-600">{row.original.userId?.split('@')[0]}</span>
        },
        {
            header: 'Action',
            accessorKey: 'action',
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.action}</span>
        },
        {
            header: 'Resource',
            accessorKey: 'resource',
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-500">{row.original.resource}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <ListChecks className="text-brand-600" />
                    Status Ledger
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Immutable audit trail of all status transitions.</p>
            </header>

            <div className="app-card">
                <DataGrid data={ledger || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
