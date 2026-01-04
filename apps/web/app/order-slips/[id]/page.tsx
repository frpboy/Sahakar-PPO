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
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin"></div>
                <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
            </div>
        </div>
    );

    if (!slip) return (
        <div className="p-20 text-center">
            <div className="w-20 h-20 bg-danger-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-danger-600" />
            </div>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Slip Data Not Found</h1>
            <button onClick={() => router.back()} className="mt-6 text-brand-600 font-bold uppercase tracking-widest text-xs hover:underline flex items-center gap-2 mx-auto justify-center">
                <ArrowLeft size={14} /> Return to Ledger
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center border border-neutral-200/60 hover:border-brand-300 transition-colors group"
                    >
                        <ArrowLeft size={24} className="text-neutral-500 group-hover:text-brand-600 transition-colors" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
                                {slip.supplier}
                            </h1>
                            <div className="px-3 py-1 bg-brand-50 text-brand-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-brand-100">
                                Slip ID: {slip.id.substring(0, 8).toUpperCase()}
                            </div>
                        </div>
                        <p className="text-sm text-neutral-500 font-medium mt-1">
                            Issued: {new Date(slip.slipDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })} • Procurement Reconciliation
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 shadow-soft transition-all flex items-center gap-2">
                        <Printer size={18} /> Print Slip
                    </button>
                    <button className="px-6 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-700 shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2">
                        <CheckCircle2 size={18} /> Mark All Billed
                    </button>
                </div>
            </header>

            <main className="space-y-6">
                <div className="app-card bg-white p-2">
                    <DataGrid
                        data={slip.items}
                        columns={columns}
                    />
                </div>
            </main>

            {/* Status Selection Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onConfirm={() => { }}
                onCancel={() => setStatusModal({ isOpen: false, itemId: null })}
                title="Update Item Status"
                message="Select the current processing status for this line item:"
                showFooter={false}
            >
                <div className="grid grid-cols-2 gap-4 p-8 pt-2">
                    {['BILLED', 'PARTIALLY_BILLED', 'NOT_BILLED', 'PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].map(status => (
                        <button
                            key={status}
                            onClick={() => statusModal.itemId && statusMutation.mutate({ itemId: statusModal.itemId, status })}
                            className="px-5 py-4 border border-neutral-100 bg-neutral-50/50 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest hover:bg-white hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/5 transition-all text-left flex items-center justify-between group"
                        >
                            <span className="text-neutral-600 group-hover:text-brand-700 transition-colors">{status.replace('_', ' ')}</span>
                            <div className="w-6 h-6 rounded-lg bg-white border border-neutral-200 flex items-center justify-center group-hover:bg-brand-50 group-hover:border-brand-200 transition-all">
                                <ChevronDown size={14} className="text-neutral-300 group-hover:text-brand-600" />
                            </div>
                        </button>
                    ))}
                </div>
            </ConfirmModal>
        </div>
    );
}


