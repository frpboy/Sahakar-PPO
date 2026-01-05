'use client';
import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../components/DataGrid';
import { useState, useMemo } from 'react';
import { FileText, Search } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { FilterPanel, FilterState } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';
import { StatusBadge } from '../../components/StatusBadge';

interface PpoInputRow {
    id: string;
    acceptedDate: string;
    acceptedTime: string;
    orderId: string;
    productId: string;
    productName: string;
    packing: number;
    subcategory: string;
    primarySupplier: string;
    secondarySupplier: string;
    rep: string;
    mobile: string;
    mrp: string;
    orderQty: number;
    confirmedQty: number;
    requestedQty: number;
    offer?: string;
    stock?: number;
    rate?: string;
    value?: string;
    status?: string;
    notes?: string;
    decidedSupplier?: string;
    modification: string;
    stage: string;
    createdAt: string;
}

export default function PpoInputPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
        savedFilters, activeFilterCount
    } = useTableState({
        storageKey: 'ppo_input',
        defaultSort: { id: 'date_desc', label: 'Newest First', field: 'acceptedDate', direction: 'desc' }
    });

    const sortOptions: SortOption[] = [
        { id: 'name_asc', label: 'Product Name (A-Z)', field: 'productName', direction: 'asc' },
        { id: 'name_desc', label: 'Product Name (Z-A)', field: 'productName', direction: 'desc' },
        { id: 'qty_desc', label: 'Req Qty (High → Low)', field: 'requestedQty', direction: 'desc' },
        { id: 'qty_asc', label: 'Req Qty (Low → High)', field: 'requestedQty', direction: 'asc' },
        { id: 'date_desc', label: 'Date (Newest)', field: 'acceptedDate', direction: 'desc' },
        { id: 'date_asc', label: 'Date (Oldest)', field: 'acceptedDate', direction: 'asc' },
    ];

    const { data: items, isLoading } = useQuery<PpoInputRow[]>({
        queryKey: ['ppo-input', filters, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.productName) params.append('productName', filters.productName);
            if (filters.orderId) params.append('orderId', filters.orderId);
            if (filters.customerId) params.append('customerId', filters.customerId);
            if (filters.rep?.length) filters.rep.forEach(r => params.append('rep[]', r));
            if (filters.stage?.length) filters.stage.forEach(s => params.append('stage[]', s));
            if (filters.supplier) params.append('supplier', filters.supplier);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);

            if (sort) {
                params.append('sortField', sort.field);
                params.append('sortDir', sort.direction);
            }

            const res = await fetch(`${apiUrl}/ppo/import?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch PPO input data');
            return res.json();
        }
    });

    const formatCurrency = (val: string | number | undefined) => {
        if (val === undefined || val === null || val === '') return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? '-' : num.toFixed(2);
    };

    const columns = useMemo<ColumnDef<PpoInputRow>[]>(() => [
        {
            header: 'PPO ID',
            size: 80,
            meta: { align: 'center' },
            cell: ({ row }) => <span className="font-mono text-[10px] text-brand-600 font-bold uppercase">#{row.original.id?.toString().padStart(4, '0')}</span>
        },
        {
            header: 'PROD ID',
            size: 80,
            meta: { align: 'center' },
            cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-400">{row.original.productId?.toString().substring(0, 8) || '-'}</span>
        },
        {
            header: 'ITEM NAME',
            size: 220,
            cell: ({ row }) => <span className="font-bold text-neutral-900 uppercase truncate" title={row.original.productName}>{row.original.productName}</span>
        },
        {
            header: 'PACKING',
            size: 80,
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400 uppercase">{row.original.packing || 'N/A'}</span>
        },
        {
            header: 'SUBCATEGORY',
            size: 120,
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400 uppercase">{row.original.subcategory || '-'}</span>
        },
        {
            header: 'REQ QTY',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold text-neutral-400">{row.original.requestedQty}</span>
        },
        {
            header: 'ORD QTY',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold text-brand-600">{row.original.orderQty || 0}</span>
        },
        {
            header: 'OFFER',
            size: 100,
            cell: ({ row }) => <span className="text-[11px] text-success-600 font-bold">{row.original.offer || '-'}</span>
        },
        {
            header: 'STK',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-medium text-neutral-500">{row.original.stock || 0}</span>
        },
        {
            header: 'RATE',
            size: 90,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold text-neutral-700">₹{formatCurrency(row.original.rate)}</span>
        },
        {
            header: 'VAL',
            size: 100,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-black text-brand-600">₹{formatCurrency(row.original.value)}</span>
        },
        {
            header: 'DECIDED SUP',
            size: 180,
            cell: ({ row }) => <span className="text-[11px] font-bold text-neutral-900 uppercase truncate">{row.original.decidedSupplier || '-'}</span>
        },
        {
            header: 'PRIMARY SUP',
            size: 180,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 uppercase truncate">{row.original.primarySupplier || '-'}</span>
        },
        {
            header: 'SECONDARY SUP',
            size: 180,
            cell: ({ row }) => <span className="text-[11px] text-neutral-400 uppercase truncate">{row.original.secondarySupplier || '-'}</span>
        },
        {
            header: 'REP',
            size: 120,
            cell: ({ row }) => <span className="text-[11px] font-bold text-brand-600 uppercase">{row.original.rep || '-'}</span>
        },
        {
            header: 'MOBILE',
            size: 120,
            cell: ({ row }) => <span className="tabular-nums text-[11px] text-neutral-500">{row.original.mobile || '-'}</span>
        },
        {
            header: 'STATUS',
            size: 100,
            meta: { align: 'center' },
            cell: ({ row }) => <StatusBadge status={row.original.status?.toUpperCase() as any || 'DONE'} />
        },
        {
            header: 'STAGE',
            size: 100,
            meta: { align: 'center' },
            cell: ({ row }) => (
                <StatusBadge
                    status={row.original.stage?.toUpperCase() as any || 'PENDING'}
                />
            )
        },
        {
            header: 'NOTES',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 italic truncate" title={row.original.notes}>{row.original.notes || '-'}</span>
        },
        {
            header: 'ACCEPT DATE',
            size: 110,
            cell: ({ row }) => <span className="tabular-nums text-[11px] font-bold text-neutral-500">{row.original.acceptedDate ? new Date(row.original.acceptedDate).toLocaleDateString() : '-'}</span>
        },
        {
            header: 'ACCEPTED TIME',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[11px] text-neutral-400">{row.original.acceptedTime || '-'}</span>
        },
        {
            header: 'ACTIONS',
            size: 80,
            meta: { align: 'center' },
            cell: () => (
                <div className="flex gap-1 justify-center">
                    <button className="p-1 px-2 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200 transition-colors uppercase">View</button>
                </div>
            )
        }
    ], []);

    const filteredItems = items || [];

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            <header className="px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                            <FileText className="text-brand-600" />
                            PPO INPUT LEDGER
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            Primary Ledger of Global Intake Stream
                        </p>
                    </div>
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
                />
            </main>

            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters}
                onApply={applyFilters}
                onClear={clearAllFilters}
            />
        </div>
    );
}
