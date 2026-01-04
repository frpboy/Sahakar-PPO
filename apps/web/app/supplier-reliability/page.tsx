'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { Factory, TrendingUp, AlertTriangle } from 'lucide-react';

export default function SupplierReliabilityPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: reliability, isLoading } = useQuery({
        queryKey: ['supplier-reliability'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/supplier-reliability`);
            if (!res.ok) throw new Error('Failed to fetch reliability');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Supplier Name',
            accessorKey: 'supplier',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase">{row.original.supplier}</span>
        },
        {
            header: 'Total Orders',
            accessorKey: 'totalOrders',
            cell: ({ row }) => <span className="tabular-nums font-medium">{row.original.totalOrders}</span>
        },
        {
            header: 'Avg. Fill Rate',
            accessorKey: 'avgFillRate',
            cell: ({ row }) => {
                const val = row.original.avgFillRate;
                const num = val !== undefined && val !== null && val !== '' ? parseFloat(val) : NaN;
                const rate = isNaN(num) ? '-' : num.toFixed(1) + '%';
                const isLow = !isNaN(num) && num < 80;
                return (
                    <span className={`font-bold tabular-nums ${isLow ? 'text-danger-500' : 'text-success-600'}`}>
                        {rate}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <Factory className="text-brand-600" />
                    Supplier Reliability
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Performance tracking and fulfillment metrics.</p>
            </header>

            <div className="app-card">
                <DataGrid data={reliability || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
