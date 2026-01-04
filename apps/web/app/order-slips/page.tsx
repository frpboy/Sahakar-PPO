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
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-none shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <Printer size={28} className="text-brand-600" />
                        </div>
                        Order Slips Ledger
                    </h1>
                    <p className="text-sm text-neutral-500 font-medium mt-2">Billing consolidation and dispatch readiness for supplier orders.</p>
                </div>

                {can('generate_slips') && (
                    <button
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="btn-brand shadow-lg shadow-brand-500/20"
                        disabled={generateMutation.isPending}
                    >
                        <Plus size={18} />
                        {generateMutation.isPending ? 'Processing...' : 'Batch Generate Slips'}
                    </button>
                )}
            </header>

            <main className="space-y-6">
                <div className="app-card bg-white p-2">
                    <DataGrid
                        data={slips || []}
                        columns={columns}
                        isLoading={isLoading}
                        onRowClick={(row) => router.push(`/order-slips/${row.id}`)}
                    />
                </div>

                {!isLoading && slips?.length === 0 && (
                    <div className="app-card bg-white p-20 text-center">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-neutral-100/50 rounded-none flex items-center justify-center mx-auto mb-6">
                                <Info size={32} className="text-neutral-300" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900">No Active Slips Found</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Generate slips from the REP Allocation ledger to begin processing.</p>
                        </div>
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


