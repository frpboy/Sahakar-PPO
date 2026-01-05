'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { useUserRole } from '../../context/UserRoleContext';
import { FileSearch, Plus, Printer, Info, Wallet, Layers, CheckCircle2, FileText, Download, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { FilterPanel } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';
import { StatusBadge } from '../../components/StatusBadge';

export default function OrderSlipsPage() {
    const { currentUser, can, role } = useUserRole();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { showToast } = useToast();

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
    } = useTableState({
        storageKey: 'order_slips',
        defaultSort: { id: 'date_desc', label: 'Newest First', field: 'slipDate', direction: 'desc' }
    });

    const sortOptions: SortOption[] = [
        { id: 'name_asc', label: 'Supplier Name (A-Z)', field: 'supplier', direction: 'asc' },
        { id: 'name_desc', label: 'Supplier Name (Z-A)', field: 'supplier', direction: 'desc' },
        { id: 'qty_desc', label: 'Items (High → Low)', field: 'totalItems', direction: 'desc' },
        { id: 'qty_asc', label: 'Items (Low → High)', field: 'totalItems', direction: 'asc' },
        { id: 'val_desc', label: 'Value (High → Low)', field: 'totalValue', direction: 'desc' },
        { id: 'val_asc', label: 'Value (Low → High)', field: 'totalValue', direction: 'asc' },
        { id: 'date_desc', label: 'Date (Newest)', field: 'slipDate', direction: 'desc' },
        { id: 'date_asc', label: 'Date (Oldest)', field: 'slipDate', direction: 'asc' },
    ];

    const { data: slips, isLoading, isFetching } = useQuery({
        queryKey: ['order-slips', filters, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.supplier) params.append('supplier', filters.supplier);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
            if (filters.status?.length) params.append('status', filters.status[0]); // Backend handles single status for now

            const res = await fetch(`${apiUrl}/order-slips?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch slips');
            return res.json();
        },
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${apiUrl}/order-slips/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplierNames: [], // Empty means "All eligible" based on current implementation or logic
                    slipDate: new Date().toISOString().split('T')[0],
                    userEmail: currentUser?.email || 'unknown@sahakar.com'
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Generation failed');
            return data;
        },
        onSuccess: (data) => {
            if (data.generated === 0) {
                showToast('No eligible allocations found to slip.', 'info');
            } else {
                showToast(data.message || 'Slips generated successfully', 'success');
            }
            queryClient.invalidateQueries({ queryKey: ['order-slips'] });
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
            setIsGenerateModalOpen(false);
        },
        onError: (err: any) => {
            showToast(err.message, 'error');
        }
    });

    // Summary Statistics
    const summary = useMemo(() => {
        if (!slips) return { count: 0, items: 0, value: 0 };
        return slips.reduce((acc: any, slip: any) => ({
            count: acc.count + 1,
            items: acc.items + (slip.totalItems || 0),
            value: acc.value + parseFloat(slip.totalValue || '0')
        }), { count: 0, items: 0, value: 0 });
    }, [slips]);

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'SLIP ID',
            size: 140,
            cell: ({ row }) => (
                <span className="font-mono text-[10px] text-brand-600 font-black uppercase tracking-widest bg-brand-50 px-2 py-0.5 border border-brand-100">
                    {row.original.displayId || row.original.id?.toString().substring(0, 8)}
                </span>
            )
        },
        {
            header: 'STATUS',
            size: 110,
            cell: ({ row }) => <StatusBadge status={row.original.status || 'GENERATED'} />
        },
        {
            header: 'DATE',
            size: 100,
            cell: ({ row }) => (
                <span className="tabular-nums text-[10px] font-black text-neutral-400 uppercase">
                    {row.original.slipDate ? new Date(row.original.slipDate).toLocaleDateString() : '-'}
                </span>
            )
        },
        {
            header: 'SUPPLIER',
            accessorKey: 'supplier',
            size: 240,
            cell: (info) => <span className="font-black text-neutral-900 uppercase text-[11px] tracking-tight">{info.getValue() as string}</span>
        },
        {
            header: 'ITEMS',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-black text-neutral-600 text-xs">{row.original.totalItems || 0}</span>
        },
        {
            header: 'TOTAL VALUE',
            size: 120,
            meta: { align: 'right' },
            cell: ({ row }) => (
                <span className="tabular-nums font-black text-brand-600 text-xs">
                    ₹{parseFloat(row.original.totalValue || '0').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'BILL ID',
            size: 120,
            cell: ({ row }) => <span className="font-mono text-[10px] font-black text-neutral-400 uppercase italic tracking-tighter">{row.original.billId || 'NO BILL'}</span>
        },
        {
            header: 'ACTIONS',
            size: 80,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link href={`/order-slips/${row.original.id}`} className="p-1.5 text-brand-600 hover:bg-brand-50 border border-transparent hover:border-brand-100 transition-all">
                        <FileSearch size={16} />
                    </Link>
                </div>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent font-sans pb-20">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-none shadow-[0_1px_3px_rgba(16_24_40/0.1)] flex items-center justify-center border border-neutral-200/80">
                            <Printer size={28} className="text-brand-600" />
                        </div>
                        Order Slips Registry
                    </h1>
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest mt-2">Document Management & Fulfillment Registry</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-neutral-400 text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all opacity-50 cursor-not-allowed">
                        <Download size={14} /> Export CSV
                    </button>
                    {can('generate_slips') || role === 'SUPER_ADMIN' || role === 'PROCUREMENT_HEAD' ? (
                        <button
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-brand-600/20 active:scale-95 disabled:opacity-50"
                            disabled={generateMutation.isPending}
                        >
                            {generateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {generateMutation.isPending ? 'GENERATING...' : 'GENERATE BATCH'}
                        </button>
                    ) : null}
                </div>
            </header>

            <main className="space-y-8">
                {/* Summary View */}
                <div className="grid grid-cols-3 gap-6">
                    <SummaryCard label="Slip Documents" value={summary.count} icon={<FileText size={20} />} color="neutral" />
                    <SummaryCard label="Consolidated Items" value={summary.items} icon={<Layers size={20} />} color="brand" />
                    <SummaryCard label="Total Inventory Value" value={summary.value} icon={<Wallet size={20} />} isCurrency color="success" />
                </div>

                <TableToolbar
                    onOpenFilter={() => setIsFilterOpen(true)}
                    filters={filters}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    sortOptions={sortOptions}
                    activeSort={sort}
                    onSort={applySort}
                />

                <FilterPanel
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onApply={applyFilters}
                    onClear={clearAllFilters}
                    stageOptions={[
                        { label: 'GENERATED', value: 'GENERATED' },
                        { label: 'SENT', value: 'SENT' },
                        { label: 'BILLED', value: 'BILLED' },
                        { label: 'CLOSED', value: 'CLOSED' }
                    ]}
                />

                <div className="app-card overflow-hidden bg-white shadow-xl shadow-neutral-200/40 border border-neutral-200/50">
                    <DataGrid
                        data={slips || []}
                        columns={columns}
                        isLoading={isLoading}
                        onRowClick={(row: any) => router.push(`/order-slips/${row.id}`)}
                    />
                </div>

                {!isLoading && (!slips || slips.length === 0) && (
                    <div className="app-card bg-white p-24 text-center border-2 border-dashed border-neutral-200">
                        <div className="max-w-xs mx-auto">
                            <Info size={40} className="text-neutral-200 mx-auto mb-6" />
                            <h3 className="text-lg font-bold text-neutral-900 uppercase">Registry Empty</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Refine your search parameters or check PPO Pipeline.</p>
                        </div>
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={isGenerateModalOpen}
                onConfirm={() => generateMutation.mutate()}
                onCancel={() => setIsGenerateModalOpen(false)}
                title="Execute Batch Distribution?"
                message={
                    <div className="space-y-4 text-left">
                        <p>This action will initiate the following operational transition:</p>
                        <ul className="text-xs space-y-2 list-disc pl-5 opacity-80">
                            <li>Lock current <span className="font-bold">REP Allocations</span> into permanent records</li>
                            <li>Create supplier-wise <span className="font-bold">Order Slips</span> for procurement</li>
                            <li>Prevent further edits to allocated quantities</li>
                        </ul>
                        <p className="text-danger-600 font-extrabold uppercase text-[10px] tracking-widest mt-4">Critical: This operation cannot be reversed.</p>
                    </div>
                }
                confirmLabel="Confirm & Generate"
                variant="primary"
            />
        </div>
    );
}

function SummaryCard({ label, value, icon, isCurrency, color }: { label: string, value: number, icon: React.ReactNode, isCurrency?: boolean, color: 'brand' | 'success' | 'neutral' }) {
    const colors = {
        brand: 'text-brand-600 bg-brand-50 border-brand-100',
        success: 'text-success-600 bg-success-50 border-success-100',
        neutral: 'text-neutral-500 bg-neutral-50 border-neutral-200'
    };
    const iconColors = {
        brand: 'text-brand-400',
        success: 'text-success-400',
        neutral: 'text-neutral-300'
    };

    return (
        <div className={`p-6 bg-white border border-neutral-200/80 shadow-sm flex items-center gap-5`}>
            <div className={`w-12 h-12 flex items-center justify-center ${colors[color]} border rounded-none`}>
                <div className={iconColors[color]}>{icon}</div>
            </div>
            <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                <h4 className="text-2xl font-black text-neutral-900 tabular-nums leading-none">
                    {isCurrency && '₹'}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0'}
                </h4>
            </div>
        </div>
    );
}


