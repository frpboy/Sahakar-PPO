'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { FilterBar } from '../../components/FilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { ListChecks, Search, Info } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export default function MasterLedgerPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const { data: ledger, isLoading } = useQuery({
        queryKey: ['master-ledger', filters, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams({
                ...filters,
                search: searchTerm,
                limit: '100' // Show more on the full ledger page
            });
            const res = await fetch(`${apiUrl}/analysis/ledger?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch ledger');
            return res.json();
        }
    });

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Timestamp',
            size: 180,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="tabular-nums text-[10px] font-bold text-primary-900 uppercase">
                        {new Date(row.original.eventDatetime).toLocaleDateString()}
                    </span>
                    <span className="tabular-nums text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">
                        {new Date(row.original.eventDatetime).toLocaleTimeString()}
                    </span>
                </div>
            )
        },
        {
            header: 'Item Identifier',
            size: 250,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-primary-900 uppercase truncate">{row.original.itemNew}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest leading-none mt-0.5">Ref: {row.original.id.substring(0, 12)}</span>
                </div>
            )
        },
        {
            header: 'Supplier',
            accessorKey: 'supplier',
            size: 150,
            cell: (info) => <span className="text-[10px] font-bold text-primary-700 uppercase tracking-tight">{info.getValue() as string}</span>
        },
        {
            header: 'Current Status',
            size: 180,
            cell: ({ row }) => <StatusBadge status={row.original.status} />
        },
        {
            header: 'Processing Staff',
            size: 150,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-[8px] font-bold text-neutral-500 uppercase">
                        {row.original.staff?.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">{row.original.staff?.split('@')[0]}</span>
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
                            <ListChecks size={28} className="text-brand-600" />
                        </div>
                        Master Status Ledger
                    </h1>
                    <p className="text-sm text-neutral-500 font-medium mt-2">End-to-end transaction transparency and procurement audit trail.</p>
                </div>
                <div className="flex items-center gap-4">
                    <FilterBar
                        filters={[
                            {
                                key: 'status', label: 'Status', options: [
                                    { label: 'PENDING', value: 'PENDING' },
                                    { label: 'REP_ALLOCATION', value: 'REP_ALLOCATION' },
                                    { label: 'SLIP_GENERATED', value: 'SLIP_GENERATED' },
                                    { label: 'BILLED', value: 'BILLED' },
                                    { label: 'DAMAGED', value: 'DAMAGED' },
                                    { label: 'MISSING', value: 'MISSING' }
                                ]
                            }
                        ]}
                        onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
                        onSearch={setSearchTerm}
                        onReset={() => { setFilters({}); setSearchTerm(''); }}
                    />
                </div>
            </header>

            <main className="space-y-6">
                <div className="app-card bg-white p-2">
                    <DataGrid
                        data={ledger || []}
                        columns={columns}
                        isLoading={isLoading}
                    />
                </div>

                {!isLoading && ledger?.length === 0 && (
                    <div className="app-card bg-white p-20 text-center">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-neutral-100/50 rounded-none flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-neutral-300" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900">No Records Found</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Adjust your search or filters to locate specific entries in the ledger.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

