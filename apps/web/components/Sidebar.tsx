'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    ShieldCheck,
    BarChart3,
    Database,
    Settings,
    FileText,
    ChevronDown,
    ChevronRight,
    Package,
    ChevronLeft,
    Users
} from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

type MenuSection = {
    title: string;
    icon: any;
    items: { label: string; href: string }[];
    // roles?: string[]; // Implementing implicit role visibility via code for now
};

const MENU_SECTIONS: MenuSection[] = [
    {
        title: 'Overview',
        icon: LayoutDashboard,
        items: [
            { label: 'Dashboard', href: '/' }
        ]
    },
    {
        title: 'Procurement',
        icon: ShoppingCart,
        items: [
            { label: 'PPO Input', href: '/order-import' },
            { label: 'Pending Purchase Orders', href: '/pending-orders' },
            { label: 'REP Orders', href: '/rep-allocation' }
        ]
    },
    {
        title: 'Billing & Execution',
        icon: Receipt,
        items: [
            { label: "Today's Order Slips", href: '/order-slips' },
            { label: 'Billing Execution', href: '/billing' },
            { label: 'Order Slip History', href: '/order-slips/history' }
        ]
    },
    {
        title: 'Status & Compliance',
        icon: ShieldCheck,
        items: [
            { label: 'Master Status Ledger', href: '/ledger' },
            { label: 'Status Summary', href: '/status-summary' },
            { label: 'Supplier Reliability', href: '/supplier-reliability' },
            { label: 'Aging Report', href: '/aging-report' },
            { label: 'Fraud Alerts', href: '/fraud-alerts' }
        ]
    },
    {
        title: 'Analytics',
        icon: BarChart3,
        items: [
            { label: 'Operational Analysis', href: '/analysis' },
            { label: 'Funnel Analysis', href: '/analysis?tab=funnel' },
            { label: 'Variance / Gap Analysis', href: '/analysis?tab=variance' }
        ]
    },
    {
        title: 'Masters',
        icon: Database,
        items: [
            { label: 'Suppliers', href: '/suppliers' },
            { label: 'Products', href: '/products' },
            { label: 'Item Name Changes', href: '/name-changes' },
            { label: 'REP Master', href: '/rep-master' }
        ]
    },
    {
        title: 'System Admin',
        icon: Settings,
        items: [
            { label: 'Users & Roles', href: '/users' },
            { label: 'System Settings', href: '/settings' },
            { label: 'Duty Sessions', href: '/duty-sessions' }
        ]
    },
    {
        title: 'Audit & Logs',
        icon: FileText,
        items: [
            { label: 'Audit Logs', href: '/logs' },
            { label: 'System Events', href: '/logs/events' }
        ]
    }
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { role } = useUserRole(); // Keep for future role logic

    // State for expanded sections
    // Default: strict object instead of array for faster lookup
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

    // Load persisted state on mount
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_state');
        if (saved) {
            try {
                setOpenSections(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse sidebar state', e);
            }
        }
    }, []);

    // Auto-expand based on route
    useEffect(() => {
        const newOpenSections = { ...openSections };
        let changed = false;

        MENU_SECTIONS.forEach(section => {
            const hasActiveItem = section.items.some(item =>
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            );
            if (hasActiveItem && !newOpenSections[section.title]) {
                newOpenSections[section.title] = true;
                changed = true;
            }
        });

        if (changed) {
            setOpenSections(newOpenSections);
            // Don't save auto-expansion to localStorage? Or should we?
            // User requested "Remember last-open section", which usually implies manual toggles.
            // But "Auto-expand based on route" is also requested.
            // I'll save it to keep UI consistent on refresh.
            localStorage.setItem('sidebar_state', JSON.stringify(newOpenSections));
        }
    }, [pathname]);

    const toggleSection = (title: string) => {
        if (isCollapsed) return; // Don't toggle in collapsed mode
        const newState = {
            ...openSections,
            [title]: !openSections[title]
        };
        setOpenSections(newState);
        localStorage.setItem('sidebar_state', JSON.stringify(newState));
    };

    return (
        <aside
            className={`
                ${isCollapsed ? 'w-20' : 'w-72'} 
                h-screen bg-white border-r border-neutral-200/60 
                fixed left-0 top-0 flex flex-col z-50 
                transition-all duration-300 ease-in-out shadow-sm
            `}
        >
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-5 border-b border-neutral-100/50">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                            <Package className="text-white w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-neutral-900 tracking-tight leading-none">Sahakar <span className="text-brand-600">PPO</span></span>
                            <span className="text-[10px] text-neutral-400 font-medium tracking-wide mt-1">OPERATIONAL COMMAND</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className={`w-8 h-8 rounded-lg bg-neutral-50 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 smooth-transition flex items-center justify-center ${isCollapsed ? 'mx-auto' : ''}`}
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Scrollable Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scrollbar-hide">
                {MENU_SECTIONS.map((section) => {
                    const isOpen = openSections[section.title] && !isCollapsed;
                    const Icon = section.icon;
                    // Check if any child is active
                    const isSectionActive = section.items.some(item =>
                        item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                    );

                    return (
                        <div key={section.title} className="space-y-1">
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.title)}
                                title={isCollapsed ? section.title : undefined}
                                className={`
                                    w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                                    ${isSectionActive ? 'bg-brand-50/50 text-brand-700' : 'hover:bg-neutral-50 text-neutral-600'}
                                    ${isCollapsed ? 'justify-center' : 'justify-between'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        size={20}
                                        strokeWidth={isSectionActive ? 2.5 : 2}
                                        className={`transition-colors duration-200 ${isSectionActive ? 'text-brand-600' : 'text-neutral-400 group-hover:text-neutral-600'}`}
                                    />
                                    {!isCollapsed && (
                                        <span className={`text-sm font-semibold tracking-tight ${isSectionActive ? 'text-brand-900' : ''}`}>
                                            {section.title}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <ChevronDown
                                        size={16}
                                        className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                )}
                            </button>

                            {/* Submenu (Only if Expanded and not Collapsed) */}
                            {(!isCollapsed && isOpen) && (
                                <div className="pl-11 pr-2 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-200">
                                    {section.items.map((item) => {
                                        const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`
                                                    block px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 border-l-2
                                                    ${isActive
                                                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                                                        : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}
                                                `}
                                            >
                                                {item.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100/50 bg-white">
                <div className={`w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100/50 group ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-neutral-400 group-hover:text-brand-600 group-hover:scale-110 transition-all duration-300">
                        <Users size={16} />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-neutral-900 truncate">Support Hub</span>
                            <span className="text-[10px] text-neutral-400 font-medium tracking-tight truncate">Sahakar Desk</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
