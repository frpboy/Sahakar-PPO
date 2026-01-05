'use client';
import { History, FileStack } from 'lucide-react';

export default function SlipHistoryPage() {
    const isFeatureEnabled = false;

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-none shadow-soft flex items-center justify-center border border-neutral-200/60">
                        <History size={22} className="text-brand-600" />
                    </div>
                    Order Slip History
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    Read-only archive of finalized order slips (date-wise)
                </p>
            </header>

            <div className="app-card overflow-hidden flex-1">
                {!isFeatureEnabled ? (
                    <div className="p-12 text-center">
                        <FileStack className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                        <h3 className="text-lg font-bold text-neutral-700 mb-2">Coming Soon</h3>
                        <p className="text-sm text-neutral-500">
                            Historical slip viewer will be available shortly.
                        </p>
                        <p className="text-xs text-neutral-400 mt-2">
                            Read-only • Date-filtered • No edits allowed
                        </p>
                    </div>
                ) : (
                    // Future: DataGrid (read-only mode)
                    null
                )}
            </div>

            {/*
              TODO:
              - Reuse /order-slips API with date filters
              - Enforce finalized slips only
              - Disable all mutations
              - Read-only detail view
            */}
        </div>
    );
}
