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
    const queryClient = useQueryClient();
    const router = useRouter();
    const { showToast } = useToast();
    const { can } = useUserRole();

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    const { data: slips, isLoading } = useQuery({
        queryKey: ['order-slips'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/order-slips');
            if (!res.ok) throw new Error('Failed to fetch slips');
            return res.json();
        },
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('http://localhost:8080/order-slips/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: 'admin@sahakar.com' }),
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
                    <span className="font-mono text-[10px] text-indigo-600 font-bold tracking-tight">#{row.original.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-[9px] text-gray-400 font-medium">Sahakar Internal UID</span>
                </div>
            )
        },
        {
            header: 'Supplier Name',
            accessorKey: 'supplier',
            size: 250,
            cell: (info) => <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-[11px] tracking-tight">{info.getValue() as string}</span>
        },
        {
            header: 'Created On',
            size: 120,
            cell: ({ row }) => (
                <span className="tabular-nums text-xs font-medium text-gray-600">
                    {new Date(row.original.slipDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
            )
        },
        {
            header: 'Line Items',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="tabular-nums font-bold text-gray-900">{row.original._count?.items || 0}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">SKUs</span>
                </div>
            )
        },
        {
            header: 'Actions',
            size: 120,
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Link href={`/order-slips/${row.original.id}`} className="p-1 px-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5">
                        <FileSearch className="w-3.5 h-3.5" /> View Slip
                    </Link>
                </div>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            <header className="bg-white border-b border-[var(--border)] px-8 py-5 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                            <Printer className="w-6 h-6 text-indigo-600" />
                            Order Slips Ledger
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Billing & Dispatch Readiness</p>
                    </div>

                    {can('generate_slips') && (
                        <button
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-md hover:bg-indigo-700 disabled:opacity-50 text-[11px] font-bold shadow-sm transition-all flex items-center gap-2 uppercase tracking-wide"
                            disabled={generateMutation.isPending}
                        >
                            <Plus className="w-4 h-4" />
                            {generateMutation.isPending ? 'Generating...' : 'Batch Generate Slips'}
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 p-8 overflow-auto">
                <div className="bg-white rounded-lg border border-[var(--border)] shadow-sm overflow-hidden">
                    <DataGrid
                        data={slips || []}
                        columns={columns}
                        isLoading={isLoading}
                    />
                </div>

                {!isLoading && slips?.length === 0 && (
                    <div className="mt-8 bg-indigo-50/30 border border-dashed border-indigo-200 rounded-lg p-12 text-center">
                        <Info className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-indigo-900 uppercase">No Active Slips</h3>
                        <p className="text-xs text-indigo-500 mt-1">Generate slips from the REP Allocation ledger to see them here.</p>
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
