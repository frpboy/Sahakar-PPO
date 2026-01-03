'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { DataGrid } from '../../../components/DataGrid';
import { StatusBadge } from '../../../components/StatusBadge';
import { ArrowLeft } from 'lucide-react';

export default function OrderSlipDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: slip, isLoading } = useQuery({
        queryKey: ['order-slip', id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/order-slips/${id}`);
            return res.json();
        },
        enabled: !!id
    });

    const columns = [
        { header: 'Item Name', accessorKey: 'itemName' as any, className: 'font-medium text-gray-900' },
        { header: 'Order ID', accessorKey: 'orderId' as any, className: 'text-gray-500 text-xs' },
        { header: 'Customer', accessorKey: 'customerId' as any, className: 'text-gray-500 text-xs' },
        { header: 'Qty', accessorKey: 'qty' as any, className: 'font-bold' },
        { header: 'Remarks', accessorKey: 'remarks' as any, className: 'text-gray-500 italic' },
        {
            header: 'Status',
            cell: (item: any) => <StatusBadge status={item.status} />
        }
    ];

    if (isLoading) return <div className="p-8">Loading slip details...</div>;
    if (!slip) return <div className="p-8">Slip not found</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </div>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Order Slip: {slip.supplier}</h1>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Date: <span className="font-medium text-gray-700">{new Date(slip.slipDate).toLocaleDateString()}</span></span>
                        <span>ID: <span className="font-mono text-gray-700">{slip.id}</span></span>
                    </div>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700">
                    Print / Download
                </button>
            </div>

            <DataGrid
                data={slip.items}
                columns={columns}
            />
        </div>
    );
}
