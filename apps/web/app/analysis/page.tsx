'use client';
import { LayoutDashboard, BarChart3, Timer, PieChart, Users, FileText, AlertTriangle, TrendingUp, History } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisIndexPage() {
    const analysisModules = [
        { label: 'Pending Analysis', href: '/analysis/pending', icon: Timer, desc: 'Queue bottlenecks and aging pending POs.' },
        { label: 'REP Analysis', href: '/analysis/rep', icon: Users, desc: 'Fleet performance and allocation efficiency.' },
        { label: 'Funnel Analysis', href: '/analysis/funnel', icon: PieChart, desc: 'Conversion from RAW to EXECUTED.' },
        { label: 'Order Slip Analysis', href: '/analysis/order-slip', icon: FileText, desc: 'Billing patterns and slip generation metrics.' },
        { label: 'Exception Analysis', href: '/analysis/exception', icon: AlertTriangle, desc: 'Detailed breakdown of system exceptions.' },
    ];

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-none shadow-soft flex items-center justify-center border border-neutral-200/60">
                        <BarChart3 size={28} className="text-brand-600" />
                    </div>
                    Intelligence Hub
                </h1>
                <p className="text-sm text-neutral-400 font-medium mt-2">Select an analysis module for specialized insights.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analysisModules.map((module) => (
                    <Link key={module.href} href={module.href}>
                        <div className="app-card p-6 hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer group h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 bg-neutral-100 group-hover:bg-brand-50 rounded-none flex items-center justify-center border border-neutral-200 transition-colors">
                                    <module.icon className="text-neutral-500 group-hover:text-brand-600" size={20} />
                                </div>
                                <TrendingUp size={16} className="text-neutral-200 group-hover:text-brand-200" />
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900 mb-1 uppercase tracking-tight">{module.label}</h3>
                            <p className="text-xs text-neutral-400 font-medium leading-relaxed">{module.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
