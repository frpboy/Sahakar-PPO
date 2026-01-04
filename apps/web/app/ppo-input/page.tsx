'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { FileText, Search } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';

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
    const [search, setSearch] = useState('');

    const { data: items, isLoading } = useQuery<PpoInputRow[]>({
        queryKey: ['ppo-input'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/ppo/import`);
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
            cell: ({ row }) => <span className="font-mono text-[10px] text-brand-600 font-bold uppercase">#{row.original.id?.toString().padStart(4, '0')}</span>
        },
        {
            header: 'PROD ID',
            size: 80,
            cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-400">{row.original.productId?.toString().substring(0, 8) || '-'}</span>
        },
        {
            header: 'MRP',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold">₹{formatCurrency(row.original.mrp)}</span>
        },
        {
            header: 'PACKING',
            size: 80,
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400 uppercase">{row.original.packing || 'N/A'}</span>
        },
        {
            header: 'ITEM NAME',
            size: 220,
            cell: ({ row }) => <span className="font-bold text-neutral-900 uppercase truncate" title={row.original.productName}>{row.original.productName}</span>
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
            header: 'STATUS',
            size: 100,
            cell: ({ row }) => (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${row.original.status?.toLowerCase().includes('error') ? 'bg-danger-100 text-danger-600' :
                        row.original.status?.toLowerCase().includes('success') ? 'bg-success-100 text-success-600' :
                            'bg-neutral-100 text-neutral-600'
                    }`}>
                    {row.original.status || 'NEW'}
                </span>
            )
        },
        {
            header: 'NOTES',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 italic truncate" title={row.original.notes}>{row.original.notes || '-'}</span>
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
            header: 'STAGE',
            size: 100,
            cell: ({ row }) => (
                <span className="text-[10px] font-bold text-neutral-400 uppercase bg-neutral-50 px-2 py-0.5 border border-neutral-100 rounded">
                    {row.original.stage || 'PENDING'}
                </span>
            )
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
            cell: () => (
                <div className="flex gap-1 justify-center">
                    <button className="p-1 px-2 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded hover:bg-neutral-200 transition-colors uppercase">View</button>
                </div>
            )
        }
    ], []);

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter(item =>
            item.productName?.toLowerCase().includes(search.toLowerCase()) ||
            item.orderId?.toString().includes(search) ||
            item.rep?.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <FileText size={22} className="text-brand-600" />
                        </div>
                        PPO Input Ledger
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Master registry of all ingested purchase orders</p>
                </div>
            </header>

            <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by product name, order ID, or REP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>
            </div>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
