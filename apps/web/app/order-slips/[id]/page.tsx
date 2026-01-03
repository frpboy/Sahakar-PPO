'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import { StatusBadge } from '../../../components/StatusBadge';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useToast } from '../../../components/Toast';
import { ArrowLeft, Printer, CheckCircle2, ChevronDown, Package, Info, AlertCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export default function OrderSlipDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [statusModal, setStatusModal] = useState<{ isOpen: boolean, itemId: string | null }>({ isOpen: false, itemId: null });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const { data: slip, isLoading } = useQuery({
        queryKey: ['order-slip', id],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/order-slips/${id}`);
            if (!res.ok) throw new Error('Failed to fetch slip');
            return res.json();
        },
        enabled: !!id
    });

    const statusMutation = useMutation({
        mutationFn: async ({ itemId, status }: { itemId: string, status: string }) => {
            const res = await fetch(`${apiUrl}/order-slips/${id}/items/${itemId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Status update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-slip', id] });
            setStatusModal({ isOpen: false, itemId: null });
            showToast('Item status updated', 'success');
        },
        onError: () => showToast('Failed to update status', 'error')
    });

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Item Description',
            size: 300,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-primary-900 text-[11px] uppercase tracking-tight">{row.original.itemName}</span>
                    <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase">ID: {row.original.orderId}</span>
                </div>
            )
        },
        {
            header: 'Customer',
            accessorKey: 'customerId',
            size: 150,
            cell: (info) => <span className="text-[10px] font-bold text-primary-700 uppercase">{info.getValue() as string}</span>
        },
        {
            header: 'Qty',
            accessorKey: 'qty',
            size: 80,
            cell: (info) => <span className="tabular-nums font-bold text-primary-900">{info.getValue() as number}</span>
        },
        {
            header: 'Status',
            size: 150,
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            header: 'Actions',
            size: 150,
            cell: ({ row }) => (
                <button
                    onClick={() => setStatusModal({ isOpen: true, itemId: row.original.id })}
                    className="flex items-center gap-2 px-3 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                    Update
                    <ChevronDown size={14} />
                </button>
            )
        }
    ], []);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary-700 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-neutral-500 font-medium text-sm">Loading Slip Details...</p>
            </div>
        </div>
    );

    if (!slip) return (
        <div className="p-20 text-center">
            <AlertCircle size={48} className="text-error-600 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-primary-900 uppercase">Slip Data Not Found</h1>
            <button onClick={() => router.back()} className="mt-4 text-primary-700 font-bold uppercase tracking-widest text-xs underline">Return to Ledger</button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-neutral-50 font-sans antialiased">
            <header className="bg-white border-b border-neutral-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} className="text-neutral-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-primary-900 tracking-tight uppercase flex items-center gap-2">
                                <Package size={24} className="text-primary-700" />
                                Slip: {slip.supplier}
                            </h1>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-none mt-1">
                                {new Date(slip.slipDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • REF: {slip.id.substring(0, 8).toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all flex items-center gap-2">
                            <Printer size={16} /> Print Slip
                        </button>
                        <button className="px-5 py-2.5 bg-primary-700 text-white rounded text-[11px] font-bold uppercase tracking-widest hover:bg-primary-900 shadow-sm transition-all flex items-center gap-2">
                            <CheckCircle2 size={16} /> Mark All Billed
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 space-y-8 overflow-auto">
                <div className="max-w-[1400px] mx-auto">
                    <div className="bg-white erp-card shadow-sm border-neutral-200 overflow-hidden">
                        <DataGrid
                            data={slip.items}
                            columns={columns}
                        />
                    </div>
                </div>
            </main>

            {/* Status Selection Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onConfirm={() => { }} // Not used here as we have multiple options
                onCancel={() => setStatusModal({ isOpen: false, itemId: null })}
                title="Update Item Status"
                message="Select the current processing status for this line item:"
                showFooter={false}
            >
                <div className="grid grid-cols-2 gap-3 p-6 pt-2">
                    {['BILLED', 'PARTIALLY_BILLED', 'NOT_BILLED', 'PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].map(status => (
                        <button
                            key={status}
                            onClick={() => statusModal.itemId && statusMutation.mutate({ itemId: statusModal.itemId, status })}
                            className="px-4 py-3 border border-neutral-200 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 hover:border-primary-500 transition-all text-left flex items-center justify-between group"
                        >
                            {status.replace('_', ' ')}
                            <ChevronDown size={14} className="text-neutral-300 group-hover:text-primary-500" />
                        </button>
                    ))}
                </div>
            </ConfirmModal>
        </div>
    );
}

