'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';

export default function FraudAlertsPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: alerts, isLoading } = useQuery({
        queryKey: ['fraud-alerts'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/fraud-alerts`);
            if (!res.ok) throw new Error('Failed to fetch alerts');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Timestamp',
            accessorKey: 'timestamp',
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400">{new Date().toLocaleString()}</span>
        },
        {
            header: 'Alert Type',
            accessorKey: 'type',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-danger-600 font-bold text-[10px] uppercase">
                    <AlertTriangle size={14} />
                    Potential Discrepancy
                </div>
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: () => <span className="text-sm font-medium">Quantity mismatch after verification</span>
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <ShieldAlert className="text-danger-600" />
                    Fraud & Exception Alerts
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Real-time monitoring of suspicious activities.</p>
            </header>

            <div className="app-card border-danger-100">
                <DataGrid data={alerts || []} columns={columns} isLoading={isLoading} />
                {(!alerts || alerts.length === 0) && !isLoading && (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert className="text-success-600" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900">No active alerts</h3>
                        <p className="text-sm text-neutral-400">System is clear of flagged discrepancies.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
