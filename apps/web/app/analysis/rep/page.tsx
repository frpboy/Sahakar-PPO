'use client';
import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';

export default function RepAnalysisPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: reps, isLoading } = useQuery({
        queryKey: ['rep-analysis'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/rep-master/list`);
            if (!res.ok) throw new Error('Failed to fetch REP analysis');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'REP Name',
            accessorKey: 'name',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase">{row.original.name}</span>
        },
        {
            header: 'Phone',
            accessorKey: 'phone',
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-bold">{row.original.phone}</span>
        },
        {
            header: 'Orders Handled',
            cell: () => <span className="tabular-nums font-bold text-brand-600">42</span>
        },
        {
            header: 'Performance Score',
            cell: () => <span className="text-success-600 font-bold uppercase text-[10px]">95% Excellent</span>
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <Users className="text-brand-600" />
                    REP Analysis
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Fleet performance and delivery efficiency tracking.</p>
            </header>

            <div className="app-card">
                <DataGrid data={reps || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
