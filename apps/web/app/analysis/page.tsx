'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { StatusBadge } from '../../components/StatusBadge';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Package, DatabaseZap, Clock } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

export default function AnalysisPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['full-stats'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    const { data: gap, isLoading: gapLoading } = useQuery({
        queryKey: ['full-gap'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/gap`);
            if (!res.ok) throw new Error('Failed to fetch gap analysis');
            return res.json();
        }
    });

    const gapColumns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Product / SKU',
            size: 300,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-[11px] text-primary-900 uppercase truncate">{row.original.itemName}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest leading-none mt-0.5">OrderID: {row.original.orderId}</span>
                </div>
            )
        },
        {
            header: 'Target Qty',
            accessorKey: 'qty',
            size: 100,
            cell: (info) => <span className="tabular-nums font-bold text-neutral-400">{info.getValue() as number}</span>
        },
        {
            header: 'Actual Received',
            accessorKey: 'qtyReceived',
            size: 150,
            cell: ({ row }) => {
                const item = row.original;
                const isUnder = item.qtyReceived < item.qty;
                return (
                    <div className="flex items-center gap-2">
                        <span className={`tabular-nums font-bold ${isUnder ? 'text-error-600' : 'text-accent-600'}`}>
                            {item.qtyReceived || 0}
                        </span>
                        {isUnder && <AlertTriangle size={14} className="text-error-600" />}
                    </div>
                );
            }
        },
        {
            header: 'Variance',
            size: 120,
            cell: ({ row }) => {
                const item = row.original;
                const diff = (item.qtyReceived || 0) - item.qty;
                return (
                    <span className={`tabular-nums font-bold text-[11px] ${diff < 0 ? 'text-error-600' : diff > 0 ? 'text-accent-600' : 'text-neutral-400'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                    </span>
                );
            }
        },
        {
            header: 'Stage',
            size: 150,
            cell: ({ row }) => <StatusBadge status={row.original.status} className="scale-90 origin-left" />
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <header className="bg-white border-b border-neutral-200 px-8 py-5 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-primary-900 tracking-tight flex items-center gap-3 uppercase">
                            <BarChart3 size={24} className="text-primary-700" />
                            System Performance Analysis
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold mt-1 uppercase tracking-widest leading-none">Statistical Deep-Dive & Supply Chain reconciliation</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 space-y-8 overflow-auto">
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AnalysisCard
                        title="Average Processing Time"
                        value="1.4h"
                        desc="Ingestion to Dispatch"
                        icon={<Clock size={20} />}
                        color="primary"
                    />
                    <AnalysisCard
                        title="Reconciliation Rate"
                        value="98.2%"
                        desc="Inventory accuracy"
                        icon={<CheckCircle2 size={20} />}
                        color="accent"
                    />
                    <AnalysisCard
                        title="Critical Stock Outs"
                        value={gap?.filter((i: any) => i.qtyReceived === 0).length || 0}
                        desc="Action required"
                        icon={<AlertTriangle size={20} />}
                        color="error"
                    />
                    <AnalysisCard
                        title="Daily Throughput"
                        value={stats?.executed || 0}
                        desc="Executed orders today"
                        icon={<TrendingUp size={20} />}
                        color="primary"
                    />
                </div>

                <div className="grid grid-cols-1 space-y-8">
                    {/* Gap Analysis Table */}
                    <section className="bg-white erp-card flex flex-col shadow-sm border-neutral-200">
                        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <DatabaseZap size={18} className="text-error-600" />
                                <h2 className="text-[11px] font-bold text-primary-900 uppercase tracking-widest">Comprehensive Gap Analysis</h2>
                            </div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Discrepancy audit for all SKU requests</span>
                        </div>
                        <div className="p-0">
                            <DataGrid
                                data={gap || []}
                                columns={gapColumns}
                                isLoading={gapLoading}
                            />
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

function AnalysisCard({ title, value, desc, icon, color }: { title: string, value: string | number, desc: string, icon: React.ReactNode, color: 'primary' | 'accent' | 'error' }) {
    const colorClasses = {
        primary: 'text-primary-700 bg-neutral-100',
        accent: 'text-accent-600 bg-accent-50',
        error: 'text-error-600 bg-error-50',
    }[color];

    return (
        <div className="bg-white p-6 rounded border border-neutral-200 shadow-sm transition-all hover:bg-neutral-50">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded ${colorClasses}`}>
                    {icon}
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{title}</div>
                    <div className="text-2xl font-bold tabular-nums text-primary-900 tracking-tight mt-1">{value}</div>
                </div>
            </div>
            <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest border-t border-neutral-100 pt-3">
                {desc}
            </div>
        </div>
    );
}
