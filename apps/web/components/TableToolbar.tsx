'use client';

import React from 'react';
import { Filter, X, Star } from 'lucide-react';
import { FilterState } from './FilterPanel';
import { SortMenu, SortOption } from './SortMenu';

interface TableToolbarProps {
    onOpenFilter: () => void;
    filters: FilterState;
    onRemoveFilter: (key: keyof FilterState, value?: any) => void;
    onClearAll: () => void;
    sortOptions: SortOption[];
    activeSort?: SortOption;
    onSort: (option: SortOption) => void;
    savedFilters?: Array<{ name: string, filters: FilterState }>;
    onApplySavedFilter?: (filters: FilterState) => void;
    children?: React.ReactNode;
}

export function TableToolbar({
    onOpenFilter,
    filters,
    onRemoveFilter,
    onClearAll,
    sortOptions,
    activeSort,
    onSort,
    savedFilters = [],
    onApplySavedFilter,
    children
}: TableToolbarProps) {

    // Helper to get active filter count
    const activeCount = Object.keys(filters).filter(key => {
        const val = filters[key as keyof FilterState];
        if (Array.isArray(val)) return val.length > 0;
        return val !== undefined && val !== '' && val !== false;
    }).length;

    return (
        <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                        <div className="flex items-center gap-2 mr-4 pr-4 border-r border-neutral-200">
                            <Star size={14} className="text-warning-500 fill-warning-500" />
                            <div className="flex gap-2">
                                {savedFilters.map((sf, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onApplySavedFilter?.(sf.filters)}
                                        className="text-[10px] font-bold text-neutral-500 uppercase px-2 py-1 bg-white border border-neutral-200 rounded hover:border-brand-300 hover:text-brand-600 transition-colors"
                                    >
                                        {sf.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {children}
                </div>

                <div className="flex items-center gap-3">
                    <SortMenu
                        options={sortOptions}
                        activeSort={activeSort}
                        onSort={onSort}
                    />

                    <button
                        onClick={onOpenFilter}
                        className={`
                            flex items-center gap-2 px-4 py-2 border rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all
                            ${activeCount > 0
                                ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                                : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'}
                        `}
                    >
                        <Filter size={16} />
                        Filter
                        {activeCount > 0 && (
                            <span className="ml-1 bg-white text-brand-600 px-1.5 rounded-full text-[9px] font-black">
                                {activeCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Chips */}
            {activeCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mr-2">Active Filters:</span>
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;

                        const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
                        const displayValue = Array.isArray(value) ? value.join(', ') : String(value);

                        return (
                            <div
                                key={key}
                                className="flex items-center gap-2 px-2 py-1 bg-brand-50 border border-brand-100 rounded text-[10px] text-brand-700 font-bold uppercase tracking-tight"
                            >
                                <span className="text-brand-400 font-black">{label}:</span>
                                <span>{displayValue === 'true' ? 'YES' : displayValue}</span>
                                <button
                                    onClick={() => onRemoveFilter(key as keyof FilterState)}
                                    className="p-0.5 hover:bg-brand-200 rounded-full transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        onClick={onClearAll}
                        className="text-[9px] font-black text-neutral-400 uppercase hover:text-danger-600 transition-colors ml-2 underline underline-offset-4"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}
        </div>
    );
}
