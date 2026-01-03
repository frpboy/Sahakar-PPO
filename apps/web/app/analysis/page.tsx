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
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <BarChart3 size={28} className="text-brand-600" />
                        </div>
                        System Performance Analysis
                    </h1>
                    <p className="text-sm text-neutral-500 font-medium mt-2">Statistical deep-dive and supply chain reconciliation intelligence.</p>
                </div>
            </header>

            <main className="space-y-10">
                {/* Executive Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <AnalysisCard
                        title="Average Processing Time"
                        value="1.4h"
                        desc="Ingestion to Dispatch"
                        icon={<Clock size={20} />}
                        color="brand"
                    />
                    <AnalysisCard
                        title="Reconciliation Rate"
                        value="98.2%"
                        desc="Inventory accuracy"
                        icon={<CheckCircle2 size={20} />}
                        color="success"
                    />
                    <AnalysisCard
                        title="Critical Stock Outs"
                        value={gap?.filter((i: any) => i.qtyReceived === 0).length || 0}
                        desc="Action required"
                        icon={<AlertTriangle size={20} />}
                        color="danger"
                    />
                    <AnalysisCard
                        title="Daily Throughput"
                        value={stats?.executed || 0}
                        desc="Executed orders today"
                        icon={<TrendingUp size={20} />}
                        color="brand"
                    />
                </div>

                <div className="grid grid-cols-1">
                    {/* Gap Analysis Table */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center text-danger-600">
                                    <DatabaseZap size={20} />
                                </div>
                                <h2 className="text-base font-bold text-neutral-900 tracking-tight">Comprehensive Gap Analysis</h2>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Discrepancy audit for all SKU requests</span>
                        </div>
                        <div className="saas-card bg-white p-2">
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

function AnalysisCard({ title, value, desc, icon, color }: { title: string, value: string | number, desc: string, icon: React.ReactNode, color: 'brand' | 'success' | 'danger' }) {
    const colorClasses = {
        brand: 'text-brand-600 bg-brand-50/50 border-brand-100/50',
        success: 'text-success-600 bg-success-50/50 border-success-100/50',
        danger: 'text-danger-600 bg-danger-50/50 border-danger-100/50',
    }[color];

    return (
        <div className="saas-card bg-white p-6 smooth-transition hover:shadow-hover hover:-translate-y-1">
            <div className="flex items-start justify-between mb-6">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${colorClasses}`}>
                    {icon}
                </div>
                <div className="px-2.5 py-1 bg-neutral-50 text-neutral-400 rounded-lg text-[9px] font-bold uppercase tracking-widest">Live Audit</div>
            </div>

            <div className="flex flex-col gap-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400">{title}</div>
                <div className="text-3xl font-extrabold tabular-nums tracking-tight text-neutral-900 mb-4">{value}</div>
            </div>

            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-t border-neutral-100 pt-4 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${color === 'danger' ? 'bg-danger-500' : color === 'success' ? 'bg-success-500' : 'bg-brand-500'}`} />
                {desc}
            </div>
        </div>
    );
}

