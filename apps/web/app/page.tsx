'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataGrid } from '../components/DataGrid';
import { StatusBadge } from '../components/StatusBadge';
import { RoleBadge } from '../components/RoleBadge';
import { useUserRole } from '../context/UserRoleContext';
import {
    TrendingUp,
    Archive,
    CheckCircle,
    DatabaseZap,
    BarChart3,
    Timer,
    Activity
} from 'lucide-react';
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

    const { role } = useUserRole();

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
                <span className="tabular-nums text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
                    {new Date(row.original.eventDatetime).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            )
        },
        {
            header: 'Item Detail',
            size: 200,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-900 uppercase truncate max-w-[180px]">{row.original.itemNew}</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">{row.original.supplier}</span>
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
            cell: ({ row }) => <span className="text-[10px] font-bold text-brand-600 uppercase tracking-tighter">{row.original.staff?.split('@')[0]}</span>
        }
    ], []);

    const gapColumns = useMemo<ColumnDef<any>[]>(() => [
        {
            header: 'Critical Item',
            size: 200,
            cell: ({ row }) => (
                <span className="font-bold text-[10px] text-neutral-900 uppercase truncate block">{row.original.itemName}</span>
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
                        <span className="text-[10px] font-bold text-neutral-400">{item.qty}</span>
                        <TrendingUp className="w-3 h-3 text-neutral-300" />
                        <span className={`text-[11px] font-bold ${isUnder ? 'text-danger-500' : 'text-success-600'}`}>
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
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <Activity size={28} className="text-brand-600" />
                        </div>
                        Operations Command Center
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium mt-2">Real-time supply chain intelligence and inventory reconciliation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-success-50/50 backdrop-blur-sm rounded-xl border border-success-200/50 flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse shadow-glow shadow-success-500" />
                        <span className="text-[10px] font-bold text-success-700 uppercase tracking-widest">System Operational</span>
                    </div>
                </div>
            </header>

            <div className="space-y-10">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <StatCard
                        label="PO Ingestion"
                        value={stats?.raw}
                        icon={<Archive size={20} />}
                        trend="+12%"
                        variant="brand"
                    />
                    <StatCard
                        label="Review Queue"
                        value={stats?.pending}
                        icon={<Timer size={20} />}
                        trend="Critical"
                        variant="warning"
                    />
                    <StatCard
                        label="Rep Capacity"
                        value={stats?.rep_allocation}
                        icon={<BarChart3 size={20} />}
                        trend="Optimal"
                        variant="brand"
                    />
                    <StatCard
                        label="Billing Load"
                        value={stats?.slip_generated}
                        icon={<DatabaseZap size={20} />}
                        trend="Active"
                        variant="brand"
                    />
                    <StatCard
                        label="Duty Complete"
                        value={stats?.executed}
                        icon={<CheckCircle size={20} />}
                        trend="Success"
                        variant="success"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Live Ledger */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                                    <Activity size={20} />
                                </div>
                                <h2 className="text-base font-bold text-neutral-900 tracking-tight">Recent Activity</h2>
                            </div>
                            <button className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <DataGrid
                            data={ledger || []}
                            columns={ledgerColumns}
                            isLoading={ledgerLoading}
                        />
                    </section>

                    {/* Gap Analysis */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center text-danger-600">
                                    <DatabaseZap size={20} />
                                </div>
                                <h2 className="text-base font-bold text-neutral-900 tracking-tight">Inventory Discrepancies</h2>
                            </div>
                            <div className="px-3 py-1 bg-danger-50 text-danger-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-danger-100">Action Required</div>
                        </div>
                        <DataGrid
                            data={gap || []}
                            columns={gapColumns}
                            isLoading={gapLoading}
                        />
                    </section>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, trend, variant }: { label: string, value: number, icon: React.ReactNode, trend: string, variant: 'brand' | 'warning' | 'success' }) {
    const variantStyles = {
        brand: {
            bg: 'bg-gradient-to-br from-brand-600 to-brand-700',
            iconBg: 'bg-white/20',
            text: 'text-white',
            label: 'text-brand-100',
            trendBg: 'bg-white/10 text-white',
        },
        success: {
            bg: 'bg-white',
            iconBg: 'bg-success-50',
            text: 'text-neutral-900',
            label: 'text-neutral-400',
            trendBg: 'bg-success-50 text-success-600',
            iconColor: 'text-success-600'
        },
        warning: {
            bg: 'bg-white',
            iconBg: 'bg-warning-50',
            text: 'text-neutral-900',
            label: 'text-neutral-400',
            trendBg: 'bg-warning-50 text-warning-600',
            iconColor: 'text-warning-600'
        },
    }[variant];

    return (
        <div className={`p-6 rounded-2xl border border-neutral-200/60 shadow-soft smooth-transition hover:shadow-hover hover:-translate-y-1 ${variant === 'brand' ? variantStyles.bg : 'bg-white'}`}>
            <div className="flex items-start justify-between mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variantStyles.iconBg} ${variantStyles.iconColor || 'text-white'}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${variantStyles.trendBg}`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${variantStyles.label}`}>{label}</div>
                <div className={`text-3xl font-extrabold tabular-nums tracking-tight ${variantStyles.text}`}>{value || 0}</div>
            </div>
        </div>
    )
}
