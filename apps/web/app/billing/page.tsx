'use client';
import { DollarSign, Receipt } from 'lucide-react';

export default function BillingPlaceholder() {
    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-none shadow-soft flex items-center justify-center border border-neutral-200/60">
                        <DollarSign size={22} className="text-brand-600" />
                    </div>
                    Billing Management
                </h1>
                <p className="text-sm text-neutral-500 mt-1">Invoice processing and status updates</p>
            </header>

            <div className="app-card overflow-hidden flex-1">
                <div className="p-12 text-center">
                    <Receipt className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                    <h3 className="text-lg font-bold text-neutral-700 mb-2">Coming Soon</h3>
                    <p className="text-sm text-neutral-500">Billing interface will be available shortly.</p>
                    <p className="text-xs text-neutral-400 mt-2">Note: Billing features may be redundant with order-slips/:id page</p>
                </div>
            </div>
        </div>
    );
}
