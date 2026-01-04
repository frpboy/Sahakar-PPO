'use client';
import { PieChart, TrendingUp, ArrowRight } from 'lucide-react';

export default function FunnelAnalysisPage() {
    const steps = [
        { label: 'RAW PPOs', count: 1250, percent: '100%' },
        { label: 'Validated', count: 1100, percent: '88%' },
        { label: 'REP Allocated', count: 1050, percent: '84%' },
        { label: 'Slips Generated', count: 1000, percent: '80%' },
        { label: 'Executed', count: 950, percent: '76%' },
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <PieChart className="text-brand-600" />
                    Funnel Analysis
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Tracking order conversion through the operational pipeline.</p>
            </header>

            <div className="grid grid-cols-1 gap-4 max-w-2xl">
                {steps.map((step, idx) => (
                    <div key={step.label} className="flex items-center gap-4">
                        <div className="app-card flex-1 p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{step.label}</span>
                                <span className="text-xl font-extrabold text-neutral-900 tabular-nums">{step.count}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-brand-600">{step.percent}</span>
                            </div>
                        </div>
                        {idx < steps.length - 1 && (
                            <ArrowRight className="text-neutral-300" size={20} />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
