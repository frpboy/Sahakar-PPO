'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeSimple,
    Import,
    Clock,
    UserBag,
    PageSearch,
    BoxIso,
    GraphUp,
    Settings
} from 'iconoir-react';
import { useUserRole } from '../context/UserRoleContext';

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/', icon: HomeSimple },
    { label: 'PPO Input', href: '/order-import', icon: Import },
    { label: 'Pending', href: '/pending-orders', icon: Clock },
    { label: 'Rep Alloc', href: '/rep-allocation', icon: UserBag },
    { label: 'Order Slips', href: '/order-slips', icon: PageSearch },
    { label: 'Warehouse', href: '/warehouse', icon: BoxIso },
    // { label: 'Analysis', href: '/analysis', icon: GraphUp }, // Merged into Dashboard basically, but keeping placeholder if needed
    // { label: 'Masters', href: '/masters', icon: Settings }, // Not implemented yet
];

export function Sidebar() {
    const pathname = usePathname();
    const { role, can } = useUserRole();

    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col z-30">
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <span className="text-xl font-bold text-gray-800 tracking-tight">Sahakar PPO</span>
            </div>

            <nav className="flex-1 py-6 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    // RBAC Check
                    if (item.label === 'PPO Input' && !can('view_ppo_input')) return null;
                    if (item.label === 'Rep Alloc' && !can('view_rep')) return null;
                    if (item.label === 'Order Slips' && !can('view_slips')) return null;
                    // Pending and Warehouse generally visible but actions restricted, though spec says Purchase Staff shouldn't see Warehouse/Slips?
                    // Spec: "Billing Staff: Order Slips only".
                    if (role === 'BILLING_STAFF' && !['Order Slips', 'Warehouse', 'Dashboard'].includes(item.label)) return null;
                    if (role === 'PURCHASE_STAFF' && ['Order Slips', 'Warehouse', 'PPO Input'].includes(item.label)) return null;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-all relative group
                ${isActive
                                    ? 'text-indigo-600 bg-indigo-50/50'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }
              `}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1 bottom-1 w-1 bg-indigo-600 rounded-r-full shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                            )}
                            <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-2' : 'stroke-1.5'}`} />
                            <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        JD
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">John Doe</div>
                        <div className="text-xs text-gray-500">Purchase Dept</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
