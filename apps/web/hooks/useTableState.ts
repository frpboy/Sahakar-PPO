'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { FilterState } from '../components/FilterPanel';
import { SortOption } from '../components/SortMenu';

interface UseTableStateOptions {
    defaultFilters?: FilterState;
    defaultSort?: SortOption;
    storageKey?: string;
}

export function useTableState({
    defaultFilters = {},
    defaultSort,
    storageKey
}: UseTableStateOptions = {}) {
    // Core State
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [sort, setSort] = useState<SortOption | undefined>(defaultSort);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [savedFilters, setSavedFilters] = useState<Array<{ name: string, filters: FilterState }>>([]);

    // Persistence
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(`saved_filters_${storageKey}`);
            if (saved) {
                try {
                    setSavedFilters(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse saved filters', e);
                }
            }
        }
    }, [storageKey]);

    const saveCurrentFilter = useCallback((name: string) => {
        if (!storageKey) return;
        const newList = [...savedFilters, { name, filters }];
        setSavedFilters(newList);
        localStorage.setItem(`saved_filters_${storageKey}`, JSON.stringify(newList));
    }, [filters, savedFilters, storageKey]);

    const deleteSavedFilter = useCallback((name: string) => {
        if (!storageKey) return;
        const newList = savedFilters.filter(f => f.name !== name);
        setSavedFilters(newList);
        localStorage.setItem(`saved_filters_${storageKey}`, JSON.stringify(newList));
    }, [savedFilters, storageKey]);

    // Handlers
    const applyFilters = useCallback((nextFilters: FilterState) => {
        setFilters(nextFilters);
    }, []);

    const removeFilter = useCallback((key: keyof FilterState) => {
        setFilters(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters({});
    }, []);

    const applySort = useCallback((nextSort: SortOption) => {
        setSort(nextSort);
    }, []);

    // Filter Chips calculation
    const activeFilterCount = useMemo(() => {
        return Object.keys(filters).filter(key => {
            const val = filters[key as keyof FilterState];
            if (Array.isArray(val)) return val.length > 0;
            return val !== undefined && val !== '' && val !== false;
        }).length;
    }, [filters]);

    return {
        // State
        filters,
        sort,
        isFilterOpen,
        savedFilters,
        activeFilterCount,

        // Setters
        setIsFilterOpen,
        applyFilters,
        removeFilter,
        clearAllFilters,
        applySort,
        saveCurrentFilter,
        deleteSavedFilter
    };
}
