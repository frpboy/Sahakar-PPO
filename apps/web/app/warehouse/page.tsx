'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { BoxIso, InfoCircle, PageSearch } from 'iconoir-react';
import { ColumnDef } from '@tanstack/react-table';

export default function WarehouseSlipsPage() {
    const { data: slips, isLoading } = useQuery({
        queryKey: ['order-slips'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/order-slips');
            if (!res.ok) throw new Error('Failed to fetch warehouse slips');
            return res.json();
        },
    });

    const columns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Dispatch Ref',
            size: 150,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-indigo-600 font-bold tracking-tight">#{row.original.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">Inbound Slip</span>
                </div>
            )
        },
        {
            header: 'Courier/Supplier',
            accessorKey: 'supplier',
            size: 250,
            cell: (info) => <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-[11px] tracking-tight">{info.getValue() as string}</span>
        },
        {
            header: 'Timestamp',
            size: 120,
            cell: ({ row }) => (
                <span className="tabular-nums text-xs font-medium text-gray-600">
                    {new Date(row.original.slipDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </span>
            )
        },
        {
            header: 'SKU Count',
            size: 100,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="tabular-nums font-bold text-gray-900">{row.original._count?.items || 0}</span>
                </div>
            )
        },
        {
            header: 'Actions',
            size: 150,
            cell: ({ row }) => (
                <Link
                    href={`/warehouse/${row.original.id}`}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm"
                >
                    <BoxIso className="w-3.5 h-3.5" /> Start Receiving
                </Link>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            <header className="bg-white border-b border-[var(--border)] px-8 py-5 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                            <BoxIso className="w-6 h-6 text-indigo-600" />
                            Warehouse Receiving Deck
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Inbound Logistics & Goods Reconciliation</p>
                    </div>
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
                    <div className="mt-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-16 text-center">
                        <InfoCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Incoming Consignments</h3>
                        <p className="text-xs text-gray-400 mt-1 italic font-medium">Generate order slips to initialize warehouse inbound data.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
