'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Upload,
    ClipboardList,
    Truck,
    FileText,
    Receipt,
    ListChecks,
    BarChart3,
    Factory,
    Package,
    Users,
    Settings,
    LogOut,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'PPO Input', href: '/order-import', icon: Upload },
    { label: 'Pending', href: '/pending-orders', icon: ClipboardList },
    { label: 'Rep Alloc', href: '/rep-allocation', icon: Truck },
    { label: 'Order Slips', href: '/order-slips', icon: FileText },
    { label: 'Warehouse', href: '/warehouse', icon: Package },
    { label: 'Status Ledger', href: '/ledger', icon: ListChecks },
    { label: 'Analysis', href: '/analysis', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const { role, can } = useUserRole();

    return (
        <aside className="w-64 h-screen bg-white border-r border-neutral-200/60 fixed left-0 top-0 flex flex-col z-30 smooth-transition">
            <div className="h-20 flex items-center px-8">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <Package className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold text-neutral-900 tracking-tight">Sahakar <span className="text-brand-600">PPO</span></span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-4 mb-4">Main Menu</div>
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    // RBAC Check
                    if (item.label === 'PPO Input' && !can('view_ppo_input')) return null;
                    if (item.label === 'Rep Alloc' && !can('view_rep')) return null;
                    if (item.label === 'Order Slips' && !can('view_slips')) return null;
                    if (role === 'BILLING_STAFF' && !['Order Slips', 'Warehouse', 'Dashboard'].includes(item.label)) return null;
                    if (role === 'PURCHASE_STAFF' && ['Order Slips', 'Warehouse', 'PPO Input'].includes(item.label)) return null;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
                                ${isActive
                                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-brand-600'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={20} className={`smooth-transition ${isActive ? 'text-brand-600' : 'text-neutral-400 group-hover:text-brand-500'}`} />
                                <span>{item.label}</span>
                            </div>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-600 shadow-glow shadow-brand-500/50" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-neutral-200/60">
                <div className="bg-neutral-50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                        ?
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-neutral-900">Need help?</div>
                        <div className="text-[10px] text-neutral-500 font-medium">Check documentation</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
