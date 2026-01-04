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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    const { role } = useUserRole();

    const { data: ledger, isLoading: ledgerLoading } = useQuery({
        queryKey: ['dashboard-ledger'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/ledger?limit=10`);
            if (!res.ok) throw new Error('Failed to fetch ledger');
            return res.json();
        }
    });

    const { data: gap, isLoading: gapLoading } = useQuery({
        queryKey: ['dashboard-gap'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/analysis/gap`);
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
                        <div className="w-12 h-12 bg-white rounded-none shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <Activity size={28} className="text-brand-600" />
                        </div>
                        Operations Command Center
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium mt-2">Real-time supply chain intelligence and inventory reconciliation.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="
                        text-[10px] 
                        font-bold 
                        uppercase 
                        tracking-widest
                        px-3 py-1
                        rounded-full
                        bg-success-50
                        text-success-700
                        border border-success-100
                        flex items-center gap-2
                    ">
                        <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse shadow-glow shadow-success-500" />
                        System Operational
                    </span>
                </div>
            </header>

            <div className="space-y-10">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <StatCard
                        label="PO Ingestion"
                        value={stats?.raw}
                        icon={<Archive size={18} />}
                        trend="+12%"
                        variant="brand"
                        subtitle="Queue → Processing"
                    />
                    <StatCard
                        label="Review Queue"
                        value={stats?.pending}
                        icon={<Timer size={18} />}
                        trend="Critical"
                        variant="warning"
                        subtitle="Awaiting Validation"
                    />
                    <StatCard
                        label="Rep Capacity"
                        value={stats?.rep_allocation}
                        icon={<BarChart3 size={18} />}
                        trend="Optimal"
                        variant="brand"
                        subtitle="Fleet Utilization"
                    />
                    <StatCard
                        label="Billing Load"
                        value={stats?.slip_generated}
                        icon={<DatabaseZap size={18} />}
                        trend="Active"
                        variant="brand"
                        subtitle="Slips Generating"
                    />
                    <StatCard
                        label="Duty Complete"
                        value={stats?.executed}
                        icon={<CheckCircle size={18} />}
                        trend="Success"
                        variant="success"
                        subtitle="Shift Completion"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Live Ledger */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2 mb-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-neutral-800">Recent Activity</h2>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Live Audit Trail</span>
                        </div>
                        <button className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:underline">View Ledger</button>
                    </div>
                    <div className="app-card overflow-hidden">
                        <DataGrid
                            data={ledger || []}
                            columns={ledgerColumns}
                            isLoading={ledgerLoading}
                        />
                    </div>
                </section>

                {/* Gap Analysis */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2 mb-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-neutral-800">Inventory Discrepancies</h2>
                            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Discrepancy Audit</span>
                        </div>
                        <span className="
                                text-[9px] 
                                font-bold 
                                uppercase 
                                tracking-widest
                                px-2 py-0.5
                                rounded-full
                                bg-danger-50
                                text-danger-700
                                border border-danger-100
                            ">
                            Action Required
                        </span>
                    </div>
                    <div className="app-card overflow-hidden">
                        <DataGrid
                            data={gap || []}
                            columns={gapColumns}
                            isLoading={gapLoading}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    trend,
    variant,
    subtitle
}: {
    label: string,
    value: number | string,
    icon: React.ReactNode,
    trend?: string,
    variant: 'brand' | 'warning' | 'success',
    subtitle?: string
}) {
    const statusConfig = {
        brand: {
            badge: 'bg-brand-50 text-brand-700 border-brand-100',
            icon: 'text-brand-600'
        },
        success: {
            badge: 'bg-success-50 text-success-700 border-success-100',
            icon: 'text-success-600'
        },
        warning: {
            badge: 'bg-warning-50 text-warning-700 border-warning-100',
            icon: 'text-warning-600'
        },
    }[variant];

    return (
        <div className="app-card p-6 flex flex-col gap-4 group">
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-none bg-neutral-100 border border-neutral-200 flex items-center justify-center smooth-transition group-hover:border-brand-200 group-hover:bg-brand-50/50">
                    <div className={statusConfig.icon}>
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${statusConfig.badge}`}>
                        {trend}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    {label}
                </div>
                <div className="text-3xl font-extrabold text-neutral-900 tabular-nums tracking-tight">
                    {value || 0}
                </div>
                {subtitle && (
                    <div className="mt-1 text-[11px] text-neutral-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {subtitle}
                    </div>
                )}
            </div>
        </div>
    )
}
