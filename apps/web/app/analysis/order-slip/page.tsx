'use client';
import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { FileText } from 'lucide-react';

export default function OrderSlipAnalysisPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: slips, isLoading } = useQuery({
        queryKey: ['order-slips-analysis'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/order-slips/list`);
            if (!res.ok) throw new Error('Failed to fetch slips analysis');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Slip ID',
            accessorKey: 'id',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase">#{row.original.id.slice(0, 8)}</span>
        },
        {
            header: 'Generated Date',
            accessorKey: 'createdAt',
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-bold uppercase">{new Date(row.original.createdAt).toLocaleDateString()}</span>
        },
        {
            header: 'Value',
            cell: () => <span className="tabular-nums font-bold text-success-600">₹ 1,250.00</span>
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <FileText className="text-brand-600" />
                    Order Slip Analysis
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Billing and slip generation efficiency metrics.</p>
            </header>

            <div className="app-card">
                <DataGrid data={slips || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
