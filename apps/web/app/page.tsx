'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataGrid } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import {
    LongArrowRightUp,
    Archive,
    CheckCircle,
    DatabaseWarning,
    GraphUp,
    Timer,
    Activity
} from 'iconoir-react';
import { ColumnDef } from '@tanstack/react-table';

export default function DashboardPage() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/analysis/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    const { data: ledger, isLoading: ledgerLoading } = useQuery({
        queryKey: ['dashboard-ledger'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/analysis/ledger?limit=10');
            if (!res.ok) throw new Error('Failed to fetch ledger');
            return res.json();
        }
    });

    const { data: gap, isLoading: gapLoading } = useQuery({
        queryKey: ['dashboard-gap'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/analysis/gap');
            if (!res.ok) throw new Error('Failed to fetch gap analysis');
            return res.json();
        }
    });

    const ledgerColumns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Timestamp',
            size: 140,
            cell: ({ row }) => (
                <span className="tabular-nums text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    {new Date(row.original.eventDatetime).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            )
        },
        {
            header: 'Item Detail',
            size: 200,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-900 uppercase truncate max-w-[180px]">{row.original.itemNew}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{row.original.supplier}</span>
                </div>
            )
        },
        {
            header: 'Status Evolution',
            size: 150,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <StatusBadge status={row.original.status} className="scale-90 origin-left" />
                </div>
            )
        },
        {
            header: 'Owner',
            size: 100,
            cell: ({ row }) => <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">{row.original.staff?.split('@')[0]}</span>
        }
    ], []);

    const gapColumns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Critical Item',
            size: 200,
            cell: ({ row }) => (
                <span className="font-bold text-[10px] text-gray-900 uppercase truncate block">{row.original.itemName}</span>
            )
        },
        {
            header: 'Variance',
            size: 120,
            cell: ({ row }) => {
                const item = row.original;
                const isUnder = item.qtyReceived < item.qty;
                return (
                    <div className="flex items-center gap-1.5 tabular-nums">
                        <span className="text-[10px] font-bold text-gray-400">{item.qty}</span>
                        <LongArrowRightUp className="w-3 h-3 text-gray-300" />
                        <span className={`text-[11px] font-bold ${isUnder ? 'text-red-500' : 'text-green-600'}`}>
                            {item.qtyReceived || 0}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'State',
            size: 120,
            cell: ({ row }) => <StatusBadge status={row.original.status} className="scale-90 origin-left" />
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            <header className="bg-white border-b border-[var(--border)] px-8 py-5 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                            <Activity className="w-6 h-6 text-indigo-600" />
                            Operations Command Center
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest leading-none">Real-time Supply Chain Analytics & Reconciliation</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">System Live</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <StatCard
                        label="PO Ingestion"
                        value={stats?.raw}
                        icon={<Archive className="w-5 h-5" />}
                        trend="+12%"
                        variant="neutral"
                    />
                    <StatCard
                        label="Review Queue"
                        value={stats?.pending}
                        icon={<Timer className="w-5 h-5 text-amber-500" />}
                        trend="Critical"
                        variant="warning"
                    />
                    <StatCard
                        label="Rep Capacity"
                        value={stats?.rep_allocation}
                        icon={<GraphUp className="w-5 h-5 text-indigo-500" />}
                        trend="Optimal"
                        variant="info"
                    />
                    <StatCard
                        label="Billing Load"
                        value={stats?.slip_generated}
                        icon={<DatabaseWarning className="w-5 h-5 text-cyan-500" />}
                        trend="Active"
                        variant="success"
                    />
                    <StatCard
                        label="Duty Complete"
                        value={stats?.executed}
                        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                        trend="Success"
                        variant="success"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Live Ledger */}
                    <section className="bg-white rounded-lg border border-[var(--border)] shadow-sm flex flex-col h-[500px]">
                        <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                Real-time Transaction Ledger
                            </h2>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Latest 10 Events</span>
                        </div>
                        <div className="flex-1">
                            <DataGrid
                                data={ledger || []}
                                columns={ledgerColumns}
                                isLoading={ledgerLoading}
                            />
                        </div>
                    </section>

                    {/* Gap Analysis */}
                    <section className="bg-white rounded-lg border border-[var(--border)] shadow-sm flex flex-col h-[500px]">
                        <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <DatabaseWarning className="w-4 h-4 text-red-500" />
                                Inventory Variance (Gap Analysis)
                            </h2>
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Action Required</span>
                        </div>
                        <div className="flex-1">
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

function StatCard({ label, value, icon, trend, variant }: { label: string, value: number, icon: React.ReactNode, trend: string, variant: 'neutral' | 'warning' | 'info' | 'success' }) {
    const bgColor = {
        neutral: 'bg-white border-gray-200',
        warning: 'bg-amber-50/50 border-amber-100',
        info: 'bg-indigo-50/50 border-indigo-100',
        success: 'bg-green-50/50 border-green-100',
    }[variant];

    const trendColor = {
        neutral: 'text-gray-400',
        warning: 'text-amber-600',
        info: 'text-indigo-600',
        success: 'text-green-600',
    }[variant];

    return (
        <div className={`${bgColor} p-6 rounded-xl border shadow-sm transition-all hover:shadow-md group relative overflow-hidden`}>
            {/* Visual accent */}
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
                {icon}
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100`}>
                    {icon}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest text-gray-500`}>{label}</div>
            </div>

            <div className="flex items-end justify-between">
                <div className="text-3xl font-bold tabular-nums text-gray-900 tracking-tighter">{value || 0}</div>
                <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-white ${trendColor}`}>
                    {trend}
                </div>
            </div>
        </div>
    )
}
