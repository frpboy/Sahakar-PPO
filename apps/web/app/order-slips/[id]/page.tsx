'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import { StatusBadge } from '../../../components/StatusBadge';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useToast } from '../../../components/Toast';
import { ArrowLeft, Printer, CheckCircle2, ChevronDown, Package, Info, AlertCircle, FileText, Wallet, Layers, Hash, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export default function OrderSlipDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // UI States
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean,
        itemId: string | null,
        selectedStatus: string | null,
        invoiceId: string,
        notes: string
    }>({
        isOpen: false,
        itemId: null,
        selectedStatus: null,
        invoiceId: '',
        notes: ''
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

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
        mutationFn: async ({ itemId, status, invoiceId, notes }: { itemId: string, status: string, invoiceId?: string, notes?: string }) => {
            const res = await fetch(`${apiUrl}/order-slips/${id}/items/${itemId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, invoiceId, notes }),
            });
            if (!res.ok) throw new Error('Status update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-slip', id] });
            setStatusModal({ isOpen: false, itemId: null, selectedStatus: null, invoiceId: '', notes: '' });
            showToast('Item status updated successfully', 'success');
        },
        onError: (err: any) => showToast(err.message || 'Failed to update status', 'error')
    });

    // Totals Calculation
    const summary = useMemo(() => {
        if (!slip?.items) return { items: 0, qty: 0, value: 0 };
        return slip.items.reduce((acc: any, item: any) => ({
            items: acc.items + 1,
            qty: acc.qty + (item.qty || 0),
            value: acc.value + (parseFloat(item.rate || '0') * (item.qty || 0))
        }), { items: 0, qty: 0, value: 0 });
    }, [slip]);

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'PROD ID',
            size: 100,
            cell: ({ row }) => (
                <span className="font-mono text-[9px] font-black text-neutral-400 uppercase tracking-tighter tabular-nums">
                    {row.original.product_code || row.original.product_id?.toString().substring(0, 6)}
                </span>
            )
        },
        {
            header: 'ITEM DESCRIPTION',
            size: 300,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-neutral-900 text-[11px] uppercase tracking-tight leading-tight">{row.original.product_name}</span>
                    <span className="text-[9px] text-neutral-400 font-black tracking-[0.1em] uppercase mt-0.5">PACKING: {row.original.packing || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'RATE',
            size: 100,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-black text-neutral-500 text-[11px]">₹{parseFloat(row.original.rate || '0').toFixed(2)}</span>
        },
        {
            header: 'QTY',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-black text-neutral-900 text-xs">{row.original.qty || 0}</span>
        },
        {
            header: 'VALUE',
            size: 120,
            meta: { align: 'right' },
            cell: ({ row }) => (
                <span className="tabular-nums font-black text-brand-600 text-xs">
                    ₹{(parseFloat(row.original.rate || '0') * (row.original.qty || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'STATUS',
            size: 120,
            meta: { align: 'center' },
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            header: 'ACTIONS',
            size: 100,
            meta: { align: 'center' },
            cell: ({ row }) => (
                <button
                    onClick={() => setStatusModal({ ...statusModal, isOpen: true, itemId: row.original.id })}
                    className="p-2 hover:bg-neutral-50 text-neutral-400 hover:text-brand-600 transition-all border border-transparent hover:border-neutral-100"
                >
                    <CheckCircle2 size={16} />
                </button>
            )
        }
    ], [statusModal]);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-transparent">
            <div className="flex flex-col items-center gap-6">
                <Loader2 size={40} className="text-brand-600 animate-spin" />
                <p className="text-neutral-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Operational State...</p>
            </div>
        </div>
    );

    if (!slip) return (
        <div className="p-20 text-center">
            <div className="w-20 h-20 bg-error-50 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-error-600" />
            </div>
            <h1 className="text-xl font-black text-neutral-900 tracking-tight uppercase">Data Link Broken</h1>
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-2">The requested slip is not found or inaccessible.</p>
            <button onClick={() => router.back()} className="mt-8 bg-neutral-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-600 transition-all">
                Return to Registry
            </button>
        </div>
    );

    // Validation for status selection
    const isStatusValid = () => {
        if (!statusModal.selectedStatus) return false;
        const needsInvoice = ['BILLED', 'PARTIALLY_BILLED', 'PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].includes(statusModal.selectedStatus);
        if (needsInvoice && !statusModal.invoiceId.trim()) return false;
        if (['PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].includes(statusModal.selectedStatus) && !statusModal.notes.trim()) return false;
        return true;
    };

    return (
        <div className="flex flex-col h-full bg-transparent font-sans pb-20">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white flex items-center justify-center border border-neutral-200 hover:border-brand-300 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={24} className="text-neutral-500 hover:text-brand-600 transition-colors" />
                    </button>
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
                                {slip.supplier}
                            </h1>
                            <div className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-widest border border-brand-100">
                                {slip.displayId || slip.id.substring(0, 8).toUpperCase()}
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                            <FileText size={12} />
                            Fulfillment Slip • {new Date(slip.slipDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 bg-white border border-neutral-200 text-neutral-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all flex items-center gap-3">
                        <Printer size={16} /> Print Document
                    </button>
                    <button className="px-6 py-3 bg-success-600 text-white text-[10px] font-black uppercase tracking-[0.2em] opacity-50 cursor-not-allowed flex items-center gap-3 shadow-xl shadow-success-600/20" title="Bulk billing not enabled for safety">
                        <CheckCircle2 size={16} /> Mark All Billed
                    </button>
                </div>
            </header>

            <main className="space-y-8">
                {/* Summary Strip */}
                <div className="grid grid-cols-4 gap-6">
                    <SummaryItem label="Line Items" value={summary.items} icon={<Layers size={18} />} color="neutral" />
                    <SummaryItem label="Total Quantity" value={summary.qty} icon={<Package size={18} />} color="brand" />
                    <SummaryItem label="Batch Value" value={summary.value} icon={<Wallet size={18} />} isCurrency color="success" />
                    <SummaryItem label="Slip Status" value={<StatusBadge status={slip.status} />} icon={<Info size={18} />} color="neutral" />
                </div>

                <div className="app-card overflow-hidden bg-white shadow-xl shadow-neutral-200/40 border border-neutral-200/50">
                    <DataGrid
                        data={slip.items}
                        columns={columns}
                    />
                </div>
            </main>

            {/* Status Selection Modal */}
            <ConfirmModal
                isOpen={statusModal.isOpen}
                onConfirm={() => statusMutation.mutate({
                    itemId: statusModal.itemId!,
                    status: statusModal.selectedStatus!,
                    invoiceId: statusModal.invoiceId,
                    notes: statusModal.notes
                })}
                onCancel={() => setStatusModal({ ...statusModal, isOpen: false, itemId: null, selectedStatus: null, invoiceId: '', notes: '' })}
                title="Operational Reconciliation"
                message="Select the final processing state for this inventory line item."
                confirmLabel="Apply Reconciliation"
                showFooter={statusModal.selectedStatus !== null}
                confirmDisabled={!isStatusValid() || statusMutation.isPending}
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                        {['BILLED', 'PARTIALLY_BILLED', 'NOT_BILLED', 'PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusModal({ ...statusModal, selectedStatus: status })}
                                className={`px-4 py-3 border text-[10px] font-black uppercase tracking-widest text-left transition-all flex items-center justify-between ${statusModal.selectedStatus === status
                                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-inner'
                                        : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-200 hover:bg-neutral-50'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                                {statusModal.selectedStatus === status && <CheckCircle2 size={14} />}
                            </button>
                        ))}
                    </div>

                    {statusModal.selectedStatus && ['BILLED', 'PARTIALLY_BILLED', 'PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].includes(statusModal.selectedStatus) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                    <Hash size={12} /> Invoice ID (Required)
                                </label>
                                <input
                                    type="text"
                                    value={statusModal.invoiceId}
                                    onChange={(e) => setStatusModal({ ...statusModal, invoiceId: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none"
                                    placeholder="Enter Supplier Invoice Number..."
                                />
                            </div>

                            {['PRODUCT_CHANGED', 'DAMAGED', 'MISSING'].includes(statusModal.selectedStatus) && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                        RECONCILIATION NOTES (REQUIRED)
                                    </label>
                                    <textarea
                                        value={statusModal.notes}
                                        onChange={(e) => setStatusModal({ ...statusModal, notes: e.target.value })}
                                        className="w-full px-4 py-3 border border-neutral-200 bg-neutral-50 text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none resize-none"
                                        rows={3}
                                        placeholder="Describe the discrepancy..."
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ConfirmModal>
        </div>
    );
}

function SummaryItem({ label, value, icon, isCurrency, color }: { label: string, value: any, icon: React.ReactNode, isCurrency?: boolean, color: 'brand' | 'success' | 'neutral' }) {
    const colors = {
        brand: 'text-brand-600 bg-white border-brand-100',
        success: 'text-success-600 bg-white border-success-100',
        neutral: 'text-neutral-500 bg-white border-neutral-200'
    };
    const iconWrapper = {
        brand: 'bg-brand-50',
        success: 'bg-success-50',
        neutral: 'bg-neutral-50'
    };

    return (
        <div className="bg-white border border-neutral-200/80 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 flex items-center justify-center rounded-none border border-neutral-100 ${iconWrapper[color]}`}>
                <div className={colors[color]}>{icon}</div>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
                <div className="text-lg font-black text-neutral-900 tabular-nums leading-none mt-1 truncate">
                    {isCurrency && typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : value}
                </div>
            </div>
        </div>
    );
}


