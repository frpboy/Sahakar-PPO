'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Check, ChevronRight } from 'lucide-react';

export interface SortOption {
    id: string;
    label: string;
    field: string;
    direction: 'asc' | 'desc';
}

interface SortMenuProps {
    options: SortOption[];
    activeSort?: SortOption;
    onSort: (option: SortOption) => void;
}

export function SortMenu({ options, activeSort, onSort }: SortMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-4 py-2 border rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all
                    ${activeSort
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}
                `}
            >
                <ArrowUpDown size={16} />
                Sort Order
                <div className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronRight size={14} className="rotate-90" />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 py-2">
                    <div className="px-4 py-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-50 mb-1">
                        Select Primary Sort
                    </div>
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                onSort(option);
                                setIsOpen(false);
                            }}
                            className={`
                                w-full flex items-center justify-between px-4 py-2.5 text-xs text-left hover:bg-neutral-50 transition-colors
                                ${activeSort?.id === option.id ? 'text-brand-600 bg-brand-50/30' : 'text-neutral-600'}
                            `}
                        >
                            <span className="font-semibold uppercase tracking-tight">{option.label}</span>
                            {activeSort?.id === option.id && <Check size={14} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
