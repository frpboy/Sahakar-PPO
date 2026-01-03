'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { useUserRole } from '../../context/UserRoleContext';
import { FileSearch, Plus, Printer, Info } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export default function OrderSlipsPage() {
    const { currentUser, can } = useUserRole();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { showToast } = useToast();

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const { data: slips, isLoading } = useQuery({
        queryKey: ['order-slips'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/order-slips`);
            if (!res.ok) throw new Error('Failed to fetch slips');
            return res.json();
        },
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${apiUrl}/order-slips/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser?.email || 'unknown@sahakar.com' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Generation failed');
            return data;
        },
        onSuccess: (data) => {
            showToast(data.message || 'Slips generated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['order-slips'] });
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
            setIsGenerateModalOpen(false);
        },
        onError: (err: any) => {
            showToast(err.message, 'error');
        }
    });

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Slip Reference',
            size: 150,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-primary-700 font-bold tracking-tight uppercase">#{row.original.id.substring(0, 8)}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Sahakar Internal</span>
                </div>
            )
        },
        {
            header: 'Supplier Name',
            accessorKey: 'supplier',
            size: 250,
            cell: (info) => <span className="font-bold text-primary-900 group-hover:text-primary-700 transition-colors uppercase text-[11px] tracking-tight">{info.getValue() as string}</span>
        },
        {
            header: 'Created On',
            size: 150,
            cell: ({ row }) => (
                <span className="tabular-nums text-[11px] font-bold text-neutral-500 uppercase">
                    {new Date(row.original.slipDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        },
        {
            header: 'Items',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="tabular-nums font-bold text-primary-900">{row.original._count?.items || 0}</span>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">SKUs</span>
                </div>
            )
        },
        {
            header: 'Actions',
            size: 150,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Link href={`/order-slips/${row.original.id}`} className="px-3 py-1 text-primary-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                        <FileSearch size={14} /> View Slip
                    </Link>
                </div>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <header className="bg-white border-b border-neutral-200 px-8 py-5 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-primary-900 tracking-tight flex items-center gap-3 uppercase">
                            <Printer size={24} className="text-primary-700" />
                            Order Slips Ledger
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold mt-1 uppercase tracking-widest leading-none">Billing consolidation & Dispatch readiness</p>
                    </div>

                    {can('generate_slips') && (
                        <button
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="bg-primary-700 text-white px-6 py-2.5 rounded hover:bg-primary-900 disabled:opacity-50 text-[11px] font-bold shadow-sm transition-all flex items-center gap-2 uppercase tracking-widest"
                            disabled={generateMutation.isPending}
                        >
                            <Plus size={16} />
                            {generateMutation.isPending ? 'Generating...' : 'Batch Generate Slips'}
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 p-8 overflow-auto">
                <div className="bg-white erp-card shadow-sm border-neutral-200 overflow-hidden">
                    <DataGrid
                        data={slips || []}
                        columns={columns}
                        isLoading={isLoading}
                    />
                </div>

                {!isLoading && slips?.length === 0 && (
                    <div className="mt-8 bg-white erp-card border-dashed p-20 text-center shadow-sm">
                        <Info size={48} className="text-neutral-200 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider">No Active Slips</h3>
                        <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-widest leading-relaxed">Generate slips from the REP Allocation ledger to see them here.</p>
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={isGenerateModalOpen}
                onConfirm={() => generateMutation.mutate()}
                onCancel={() => setIsGenerateModalOpen(false)}
                title="Batch Slips Generation"
                message="This will automatically group all current allocations by supplier and create printable order slips. This action is final and will move items out of the allocation stage. Proceed?"
                confirmLabel="Begin Generation"
                variant="primary"
            />
        </div>
    );
}

