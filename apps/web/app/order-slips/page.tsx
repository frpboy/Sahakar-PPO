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
import { FilterPanel, FilterState } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';
import { StatusBadge } from '../../components/StatusBadge';

export default function OrderSlipsPage() {
    const { currentUser, can } = useUserRole();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { showToast } = useToast();

    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
        savedFilters, activeFilterCount
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
            header: 'SLIP ID',
            size: 100,
            cell: ({ row }) => <span className="font-mono text-[10px] text-brand-600 font-bold uppercase">#{row.original.id?.toString().substring(0, 8) || '-'}</span>
        },
        {
            header: 'DATE',
            size: 110,
            cell: ({ row }) => (
                <span className="tabular-nums text-[11px] font-bold text-neutral-500">
                    {row.original.slipDate ? new Date(row.original.slipDate).toLocaleDateString() : '-'}
                </span>
            )
        },
        {
            header: 'SUPPLIER',
            accessorKey: 'supplier',
            size: 220,
            cell: (info) => <span className="font-bold text-neutral-900 uppercase text-[11px] tracking-tight">{info.getValue() as string}</span>
        },
        {
            header: 'SUMMARY',
            size: 180,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-neutral-900 leading-none">
                        ITEMS: <span className="tabular-nums">{row.original.totalItems || 0}</span> SKUs
                    </span>
                    <span className="text-[11px] font-black text-brand-600 mt-1">
                        VALUE: ₹<span className="tabular-nums">{parseFloat(row.original.totalValue || '0').toFixed(2)}</span>
                    </span>
                </div>
            )
        },
        {
            header: 'REMARKS',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 italic truncate">{row.original.remarks || '-'}</span>
        },
        {
            header: 'BILL ID',
            size: 120,
            cell: ({ row }) => <span className="font-mono text-[11px] font-bold text-neutral-700">{row.original.billId || '-'}</span>
        },
        {
            header: 'BILL DATE',
            size: 110,
            cell: ({ row }) => <span className="tabular-nums text-[11px] font-bold text-neutral-500">{row.original.billDate ? new Date(row.original.billDate).toLocaleDateString() : '-'}</span>
        },
        {
            header: 'ACTIONS',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link href={`/order-slips/${row.original.id}`} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded transition-all" title="View Details">
                        <FileSearch size={16} />
                    </Link>
                </div>
            )
        }
    ], []);

    const filteredItems = useMemo(() => {
        if (!slips) return [];
        let result = [...slips];

        // Apply Search/Filters
        if (filters.productName) { // Using productName filter as a generic search for supplier in this context
            result = result.filter(item =>
                item.supplier?.toLowerCase().includes(filters.productName!.toLowerCase())
            );
        }
        if (filters.supplier) {
            result = result.filter(item =>
                item.supplier?.toLowerCase().includes(filters.supplier!.toLowerCase())
            );
        }
        if (filters.dateFrom) {
            result = result.filter(item =>
                item.slipDate && item.slipDate >= filters.dateFrom!
            );
        }
        if (filters.dateTo) {
            result = result.filter(item =>
                item.slipDate && item.slipDate <= filters.dateTo!
            );
        }

        // Apply Sorting
        if (sort) {
            result.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                if (sort.field === 'supplier') {
                    valA = a.supplier || '';
                    valB = b.supplier || '';
                } else if (sort.field === 'totalItems') {
                    valA = a.totalItems || 0;
                    valB = b.totalItems || 0;
                } else if (sort.field === 'totalValue') {
                    valA = parseFloat(a.totalValue || '0');
                    valB = parseFloat(b.totalValue || '0');
                } else if (sort.field === 'slipDate') {
                    valA = a.slipDate || '';
                    valB = b.slipDate || '';
                }

                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [slips, filters, sort]);

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            <header className="px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                            <Printer className="text-brand-600" />
                            ORDER SLIPS REPOSITORY
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            Document Management & Fulfillment Registry
                        </p>
                    </div>
                    {can('generate_slips') && (
                        <button
                            onClick={() => setIsGenerateModalOpen(true)}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                            disabled={generateMutation.isPending}
                        >
                            <Plus size={16} />
                            {generateMutation.isPending ? 'Generating...' : 'New Batch'}
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <TableToolbar
                    onOpenFilter={() => setIsFilterOpen(true)}
                    filters={filters}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    sortOptions={sortOptions}
                    activeSort={sort}
                    onSort={applySort}
                />

                <DataGrid
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                    onRowClick={(row: any) => router.push(`/order-slips/${row.id}`)}
                />

                {!isLoading && filteredItems.length === 0 && (
                    <div className="app-card bg-white p-20 text-center mt-6">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-neutral-50 rounded-none flex items-center justify-center mx-auto mb-6">
                                <Printer size={32} className="text-neutral-200" />
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900 uppercase">No Data found</h3>
                            <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-widest">Adjust filters or generate new slips</p>
                        </div>
                    </div>
                )}
            </main>

            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onApply={applyFilters}
                onClear={clearAllFilters}
            />

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


