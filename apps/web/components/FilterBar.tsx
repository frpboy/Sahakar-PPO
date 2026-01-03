'use client';

import { Search } from 'iconoir-react';

interface FilterOption {
    label: string;
    value: string;
}

interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
}

interface FilterBarProps {
    filters: FilterConfig[];
    onFilterChange: (key: string, value: string) => void;
    onSearch: (term: string) => void;
    onReset: () => void;
}

export function FilterBar({ filters, onFilterChange, onSearch, onReset }: FilterBarProps) {
    return (
        <div className="sticky top-0 z-20 bg-[#F8F9FB] pt-4 pb-4 mb-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 w-64"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                {/* Dynamic Filters */}
                {filters.map((filter) => (
                    <select
                        key={filter.key}
                        className="pl-3 pr-8 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    >
                        <option value="">{filter.label}</option>
                        {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                ))}

                <div className="flex-1" />

                {/* Reset */}
                <button
                    onClick={onReset}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}
