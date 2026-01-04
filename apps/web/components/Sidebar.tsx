'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Upload,
    ClipboardList,
    Truck,
    FileText,
    Archive,
    Receipt,
    ListChecks,
    BarChart3,
    Factory,
    Package,
    RefreshCw,
    Users,
    Shield,
    Settings,
    ScrollText,
    Clock,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    PieChart,
    AlertTriangle,
    Activity,
    History
} from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

const MENU_GROUPS = [
    {
        title: 'Operations',
        items: [
            { label: 'Dashboard', href: '/', icon: LayoutDashboard },
            { label: 'PPO Input', href: '/order-import', icon: Upload },
            { label: 'Pending POs', href: '/pending-orders', icon: ClipboardList },
            { label: 'REP Orders', href: '/rep-allocation', icon: Truck },
        ]
    },
    {
        title: 'Billing',
        items: [
            { label: "Today's Slips", href: '/order-slips', icon: FileText },
            { label: 'Slip History', href: '/order-slips/history', icon: Archive },
            { label: 'Billing Execution', href: '/billing', icon: Receipt },
        ]
    },
    {
        title: 'Order Slip Status',
        items: [
            { label: 'Status Summary', href: '/status-summary', icon: PieChart },
            { label: 'Supplier Reliability', href: '/supplier-reliability', icon: Factory },
            { label: 'Fraud Alerts', href: '/fraud-alerts', icon: AlertTriangle },
            { label: 'Aging Report', href: '/aging-report', icon: History },
        ]
    },
    {
        title: 'Analysis',
        items: [
            { label: 'Status Ledger', href: '/ledger', icon: ListChecks },
            { label: 'Analysis', href: '/analysis', icon: BarChart3 },
        ]
    },
    {
        title: 'Masters',
        items: [
            { label: 'Suppliers', href: '/suppliers', icon: Factory },
            { label: 'Products', href: '/products', icon: Package },
            { label: 'Name Changes', href: '/name-changes', icon: RefreshCw },
            { label: 'REP Master', href: '/rep-master', icon: Users },
        ]
    },
    {
        title: 'System',
        items: [
            { label: 'Users & Roles', href: '/users', icon: Shield },
            { label: 'Settings', href: '/settings', icon: Settings },
            { label: 'Audit Logs', href: '/logs', icon: ScrollText },
            { label: 'System Events', href: '/logs/events', icon: Activity },
            { label: 'Duty Sessions', href: '/duty-sessions', icon: Clock },
        ]
    }
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { role } = useUserRole();

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-white border-r border-neutral-200/60 fixed left-0 top-0 flex flex-col z-50 smooth-transition shadow-sm`}>
            <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-100/50">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                            <Package className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-neutral-900 tracking-tight">Sahakar <span className="text-brand-600">PPO</span></span>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className={`w-8 h-8 rounded-lg bg-neutral-50 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 smooth-transition flex items-center justify-center ${isCollapsed ? 'mx-auto' : ''}`}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8 scrollbar-hide">
                {MENU_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1">
                        {!isCollapsed && (
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-4 mb-3 animate-in fade-in slide-in-from-left-1 duration-300">{group.title}</div>
                        )}
                        {group.items.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? item.label : undefined}
                                    className={`
                                        flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative
                                        ${isActive
                                            ? 'bg-brand-50 text-brand-700'
                                            : 'text-neutral-500 hover:bg-neutral-50 hover:text-brand-600'}
                                        ${isCollapsed ? 'justify-center' : 'justify-between'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={20} className={`smooth-transition ${isActive ? 'text-brand-600' : 'text-neutral-400 group-hover:text-brand-500'}`} />
                                        {!isCollapsed && <span className="truncate max-w-[140px]">{item.label}</span>}
                                    </div>
                                    {!isCollapsed && isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-600 shadow-glow shadow-brand-500/50" />}
                                    {isCollapsed && isActive && (
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-600 rounded-l-full shadow-glow shadow-brand-500/50" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-neutral-100/50">
                <div className={`w-full flex items-center gap-3 p-3 rounded-xl text-neutral-500 group ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-brand-50 group-hover:text-brand-600 smooth-transition">
                        <Users size={16} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-neutral-900">Support Hub</span>
                            <span className="text-[10px] text-neutral-400 font-medium tracking-tight">Sahakar Desk</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
