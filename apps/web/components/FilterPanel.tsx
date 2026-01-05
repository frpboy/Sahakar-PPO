'use client';

import React, { useEffect, useState } from 'react';
import { X, Search, ChevronDown, Filter, Trash2, Save } from 'lucide-react';

export interface FilterState {
    productName?: string;
    orderId?: string;
    customerId?: string;
    customerName?: string;
    rep?: string[];
    mobile?: string;
    supplier?: string;
    area?: string;
    primarySupplier?: string;
    secondarySupplier?: string;
    decidedSupplier?: string;
    category?: string;
    status?: string[];
    stage?: string[];
    dateFrom?: string;
    dateTo?: string;

    // Specialized Flags
    itemNameChange?: boolean;
    reqQtyGt0?: boolean;
}

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterState;
    onApply: (filters: FilterState) => void;
    onClear: () => void;
    stageOptions?: { label: string; value: string }[];
}

export function FilterPanel({ isOpen, onClose, filters, onApply, onClear, stageOptions }: FilterPanelProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);
    const [advancedOpen, setAdvancedOpen] = useState(false);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters, isOpen]);

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleChange = (field: keyof FilterState, value: any) => {
        setLocalFilters(prev => ({ ...prev, [field]: value }));
    };

    const toggleMultiSelect = (field: 'rep' | 'status' | 'stage', value: string) => {
        const current = localFilters[field] || [];
        const next = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        handleChange(field, next);
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl z-[60] flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                            <Filter size={20} className="text-brand-600" />
                            Filter Pipeline
                        </h2>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Multi-dimensional Audit</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X size={20} className="text-neutral-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                    {/* Basic Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100 pb-2">🔍 Basic Search</h3>
                        <div className="space-y-3">
                            <FilterInput label="Product Name" placeholder="Search by name..." value={localFilters.productName} onChange={v => handleChange('productName', v)} />
                            <FilterInput label="Order ID" placeholder="Exact or part..." value={localFilters.orderId} onChange={v => handleChange('orderId', v)} />
                            <div className="grid grid-cols-2 gap-3">
                                <FilterInput label="Customer ID" placeholder="Exact ID" value={localFilters.customerId} onChange={v => handleChange('customerId', v)} />
                                <FilterInput label="Customer Name" placeholder="Name contains" value={localFilters.customerName} onChange={v => handleChange('customerName', v)} />
                            </div>
                        </div>
                    </section>

                    {/* People Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100 pb-2">👤 People & Contacts</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase">REP</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {['Ravi', 'Suresh', 'Amit', 'Vikram'].map(rep => (
                                        <button
                                            key={rep}
                                            onClick={() => toggleMultiSelect('rep', rep)}
                                            className={`px-3 py-1 rounded-sm text-[10px] font-bold border transition-all ${localFilters.rep?.includes(rep)
                                                ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/20'
                                                : 'bg-white border-neutral-200 text-neutral-500 hover:border-brand-300'
                                                }`}
                                        >
                                            {rep}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <FilterInput label="Mobile" placeholder="Last 4 or full..." value={localFilters.mobile} onChange={v => handleChange('mobile', v)} />
                            <FilterInput label="Area / City" placeholder="Search area..." value={localFilters.area} onChange={v => handleChange('area', v)} />
                        </div>
                    </section>

                    {/* Suppliers Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100 pb-2">🏢 Supplier Vectors</h3>
                        <div className="space-y-3">
                            <FilterInput label="Any Supplier" placeholder="Search suppliers..." value={localFilters.supplier} onChange={v => handleChange('supplier', v)} />
                            <FilterInput label="Primary Supplier" placeholder="Search primary..." value={localFilters.primarySupplier} onChange={v => handleChange('primarySupplier', v)} />
                            <FilterInput label="Decided Supplier" placeholder="Search decided..." value={localFilters.decidedSupplier} onChange={v => handleChange('decidedSupplier', v)} />
                            <FilterInput label="Category" placeholder="Search category..." value={localFilters.category} onChange={v => handleChange('category', v)} />
                        </div>
                    </section>

                    {/* Status & Stage */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100 pb-2">📦 Lifecycle State</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase">Stage</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(stageOptions || [
                                        { label: 'PENDING', value: 'PENDING' },
                                        { label: 'REP', value: 'REP' },
                                        { label: 'SLIPPED', value: 'SLIPPED' },
                                        { label: 'CLOSED', value: 'CLOSED' }
                                    ]).map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => toggleMultiSelect('stage', opt.value)}
                                            className={`px-3 py-2 rounded-sm text-[10px] font-bold border transition-all ${localFilters.stage?.includes(opt.value)
                                                ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                                                : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-200'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Date Section */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100 pb-2">📅 Temporal Plane</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase">From</label>
                                <input type="date" value={localFilters.dateFrom} onChange={e => handleChange('dateFrom', e.target.value)} className="w-full border border-neutral-200 rounded-sm p-2 text-xs focus:ring-1 focus:ring-brand-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-400 uppercase">To</label>
                                <input type="date" value={localFilters.dateTo} onChange={e => handleChange('dateTo', e.target.value)} className="w-full border border-neutral-200 rounded-sm p-2 text-xs focus:ring-1 focus:ring-brand-500 outline-none" />
                            </div>
                        </div>
                    </section>

                    {/* Advanced Section */}
                    <section className="space-y-4">
                        <button
                            onClick={() => setAdvancedOpen(!advancedOpen)}
                            className="w-full flex items-center justify-between text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] border-b border-neutral-100 pb-2 bg-neutral-50 px-2 py-1"
                        >
                            🧠 Advanced conditions
                            <ChevronDown size={14} className={`transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {advancedOpen && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Checkbox label="Item Name Changed" checked={localFilters.itemNameChange} onChange={v => handleChange('itemNameChange', v)} />
                                <Checkbox label="Req Qty > 0" checked={localFilters.reqQtyGt0} onChange={v => handleChange('reqQtyGt0', v)} />
                            </div>
                        )}
                    </section>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex gap-3">
                    <button
                        onClick={() => { onClear(); setLocalFilters({}); }}
                        className="flex-1 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-500 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={14} />
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-[2] px-4 py-2.5 bg-brand-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    );
}

function FilterInput({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: any, onChange: (v: string) => void }) {
    return (
        <div className="space-y-1">
            <label className="text-[11px] font-bold text-neutral-500 uppercase">{label}</label>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-300" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full border border-neutral-200 rounded-sm p-2 pl-9 text-xs focus:ring-1 focus:ring-brand-500 outline-none placeholder:text-neutral-300 font-medium"
                />
            </div>
        </div>
    );
}

function Checkbox({ label, checked, onChange }: { label: string, checked: boolean | undefined, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked || false}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 border-neutral-200 rounded-none text-brand-600 focus:ring-brand-500"
            />
            <span className="text-[11px] font-bold text-neutral-600 uppercase group-hover:text-brand-600 transition-colors">{label}</span>
        </label>
    );
}
