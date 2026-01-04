'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { FilterBar } from '../../components/FilterBar';
import { StatusBadge } from '../../components/StatusBadge';

import { useToast } from '../../components/Toast';
import { ClipboardList, Edit, ArrowRight, Info, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useUserRole } from '../../context/UserRoleContext';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { FilterPanel, FilterState } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';

// Types
// Types
type PendingItem = {
    id: string;
    product_id: string;
    product_name: string;
    mrp?: string;
    packing?: string;
    category?: string;
    subcategory?: string;
    remarks?: string;
    req_qty: number;
    ordered_qty: number;
    stock_qty: number;
    offer_qty: number;
    allocator_notes: string;
    ordered_supplier?: string;
    decided_supplier_id?: string;
    decided_supplier_name?: string;
    rep?: string;
    mobile?: string;
    accepted_date?: string;
    accepted_time?: string;
    done: boolean;
    locked: boolean;
};

export default function PendingOrdersPage() {
    const { currentUser } = useUserRole();
    const { isOnline } = useOfflineSync();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<PendingItem>>({});
    const [movingIds, setMovingIds] = useState<Set<string>>(new Set());

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
        savedFilters, activeFilterCount
    } = useTableState({
        storageKey: 'pending_orders',
        defaultSort: { id: 'date_desc', label: 'Newest First', field: 'accepted_date', direction: 'desc' }
    });

    const sortOptions: SortOption[] = [
        { id: 'name_asc', label: 'Product Name (A-Z)', field: 'product_name', direction: 'asc' },
        { id: 'name_desc', label: 'Product Name (Z-A)', field: 'product_name', direction: 'desc' },
        { id: 'qty_desc', label: 'Req Qty (High → Low)', field: 'req_qty', direction: 'desc' },
        { id: 'qty_asc', label: 'Req Qty (Low → High)', field: 'req_qty', direction: 'asc' },
        { id: 'date_desc', label: 'Date (Newest)', field: 'accepted_date', direction: 'desc' },
        { id: 'date_asc', label: 'Date (Oldest)', field: 'accepted_date', direction: 'asc' },
    ];

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: items, isLoading } = useQuery({
        queryKey: ['pending-items'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/pending-items`);
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`${apiUrl}/pending-items/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.payload),
            });
            if (!res.ok) throw new Error('Update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
            setEditingId(null);
            showToast('Order updated successfully', 'success');
        },
        onError: () => {
            showToast('Failed to update order', 'error');
        }
    });

    const moveToRepMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${apiUrl}/pending-items/${id}/move-to-rep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser?.email || 'unknown@sahakar.com' }),
            });
            if (!res.ok) throw new Error('Move failed');
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
            setMovingIds(prev => {
                const next = new Set(prev);
                next.delete(variables);
                return next;
            });
            showToast('Moved to REP allocation', 'success');
        },
        onError: (_err, variables) => {
            setMovingIds(prev => {
                const next = new Set(prev);
                next.delete(variables);
                return next;
            });
            showToast('Failed to move item', 'error');
        }
    });

    const handleMoveToRep = (id: string) => {
        setMovingIds(prev => new Set(prev).add(id));
        moveToRepMutation.mutate(id);
    };

    const handleEditClick = (item: PendingItem) => {
        setEditingId(item.id);
        setEditFormData({
            ordered_qty: item.ordered_qty,
            stock_qty: item.stock_qty,
            offer_qty: item.offer_qty,
            allocator_notes: item.allocator_notes,
            decided_supplier_id: item.decided_supplier_id,
        });
    };

    const handleSave = (id: string) => {
        // Map back to camelCase payloads if expected by API
        const payload = {
            orderedQty: editFormData.ordered_qty,
            stockQty: editFormData.stock_qty,
            offerQty: editFormData.offer_qty,
            allocatorNotes: editFormData.allocator_notes,
            decidedSupplierId: editFormData.decided_supplier_id,
            done: editFormData.done
        };
        updateMutation.mutate({ id, payload });
    };

    const handleInputChange = (field: string, value: any) => {
        setEditFormData((prev) => ({ ...prev, [field]: value }));
    };

    const filteredItems = useMemo(() => {
        if (!items) return [];
        let result = [...items];

        // Apply Search/Filters
        if (filters.productName) {
            result = result.filter(item =>
                item.product_name?.toLowerCase().includes(filters.productName!.toLowerCase())
            );
        }
        if (filters.supplier) {
            result = result.filter(item =>
                item.decided_supplier_name?.toLowerCase().includes(filters.supplier!.toLowerCase()) ||
                item.ordered_supplier?.toLowerCase().includes(filters.supplier!.toLowerCase())
            );
        }
        if (filters.rep && filters.rep.length > 0) {
            result = result.filter(item =>
                filters.rep!.includes(item.rep || '')
            );
        }
        if (filters.dateFrom) {
            result = result.filter(item =>
                item.accepted_date && item.accepted_date >= filters.dateFrom!
            );
        }
        if (filters.dateTo) {
            result = result.filter(item =>
                item.accepted_date && item.accepted_date <= filters.dateTo!
            );
        }

        // Apply Sorting
        if (sort) {
            result.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                if (sort.field === 'product_name') {
                    valA = a.product_name || '';
                    valB = b.product_name || '';
                } else if (sort.field === 'req_qty') {
                    valA = a.req_qty || 0;
                    valB = b.req_qty || 0;
                } else if (sort.field === 'accepted_date') {
                    valA = a.accepted_date || '';
                    valB = b.accepted_date || '';
                }

                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [items, filters, sort]);

    const columns = useMemo<ColumnDef<PendingItem>[]>(() => [
        {
            header: 'PROD ID',
            size: 80,
            cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-500">{row.original.product_id?.toString().substring(0, 8) || '-'}</span>
        },
        {
            header: 'MRP',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums">₹{row.original.mrp || '0.00'}</span>
        },
        {
            header: 'PACKING',
            size: 80,
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400 uppercase">{row.original.packing || '-'}</span>
        },
        {
            header: 'ITEM NAME',
            size: 220,
            cell: ({ row }) => <span className="font-bold text-neutral-900 uppercase truncate" title={row.original.product_name}>{row.original.product_name}</span>
        },
        {
            header: 'REMARKS',
            size: 120,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 truncate italic">{row.original.remarks || '-'}</span>
        },
        {
            header: 'SUBCATEGORY',
            size: 100,
            cell: ({ row }) => <span className="text-[10px] bg-neutral-100 px-1 rounded font-bold text-neutral-500 uppercase">{row.original.subcategory || 'N/A'}</span>
        },
        {
            header: 'REQ QTY',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold text-neutral-400 text-[11px]">{row.original.req_qty}</span>
        },
        {
            header: 'ORDERED QTY',
            size: 90,
            meta: { align: 'right' },
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-brand-500 p-1 text-xs text-right tabular-nums"
                        value={editFormData.ordered_qty || ''}
                        onChange={(e) => handleInputChange('ordered_qty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-brand-600">{item.ordered_qty}</span>;
            }
        },
        {
            header: 'STOCK IN HAND',
            size: 100,
            meta: { align: 'right' },
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-brand-500 p-1 text-xs text-right tabular-nums"
                        value={editFormData.stock_qty || ''}
                        onChange={(e) => handleInputChange('stock_qty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-neutral-900">{item.stock_qty}</span>;
            }
        },
        {
            header: 'OFFER',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-brand-500 p-1 text-xs text-right tabular-nums"
                        value={editFormData.offer_qty || ''}
                        onChange={(e) => handleInputChange('offer_qty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-success-600">{item.offer_qty}</span>;
            }
        },
        {
            header: 'NOTES',
            size: 150,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="text"
                        className="w-full bg-white border border-brand-500 p-1 text-xs"
                        value={editFormData.allocator_notes || ''}
                        onChange={(e) => handleInputChange('allocator_notes', e.target.value)}
                    />
                ) : <span className="text-[11px] text-neutral-600 truncate">{item.allocator_notes || '-'}</span>;
            }
        },
        {
            header: 'ITEM NAME CHANGE',
            size: 130,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-medium italic">No Change</span>
        },
        {
            header: 'ORDERED SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] font-bold text-neutral-400 uppercase truncate">{row.original.ordered_supplier || '-'}</span>
        },
        {
            header: 'DECIDED SUP',
            size: 150,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="text"
                        className="w-full bg-white border border-brand-500 p-1 text-[10px] font-bold uppercase"
                        value={editFormData.decided_supplier_name || ''}
                        onChange={(e) => handleInputChange('decided_supplier_name', e.target.value)}
                    />
                ) : <span className="text-[11px] font-bold text-brand-600 uppercase truncate">{item.decided_supplier_name || row.original.ordered_supplier || '-'}</span>;
            }
        },
        {
            header: 'PRIMARY SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-400 uppercase truncate">{row.original.ordered_supplier || '-'}</span>
        },
        {
            header: 'SECONDARY SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-400 uppercase truncate">N/A</span>
        },
        {
            header: 'REP',
            size: 100,
            cell: ({ row }) => <span className="text-[11px] font-bold text-neutral-600 uppercase">{row.original.rep || '-'}</span>
        },
        {
            header: 'MOBILE',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-500">{row.original.mobile || '-'}</span>
        },
        {
            header: 'CHANGE TO REP',
            size: 150,
            cell: ({ row }) => (
                <button
                    onClick={() => handleMoveToRep(row.original.id)}
                    disabled={movingIds.has(row.original.id)}
                    className="text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2 py-1 rounded-none border border-brand-100 uppercase tracking-tight transition-colors flex items-center gap-2"
                >
                    {movingIds.has(row.original.id) ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                    Move to REP
                </button>
            )
        },
        {
            header: 'ACCEPT DATE',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-500">{row.original.accepted_date ? new Date(row.original.accepted_date).toLocaleDateString() : '-'}</span>
        },
        {
            header: 'ACCEPTED TIME',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-500">{row.original.accepted_time || '-'}</span>
        },
        {
            header: 'ACTIONS',
            size: 80,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-2">
                        {editingId === item.id ? (
                            <>
                                <button onClick={() => handleSave(item.id)} className="p-1 text-accent-600 hover:bg-neutral-100"><CheckCircle2 size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="p-1 text-error-600 hover:bg-neutral-100"><XCircle size={16} /></button>
                            </>
                        ) : (
                            <button onClick={() => handleEditClick(item)} className="p-1 text-neutral-400 hover:text-brand-600 hover:bg-neutral-100 transition-all"><Edit size={16} /></button>
                        )}
                    </div>
                );
            }
        }
    ], [editingId, editFormData, movingIds, handleMoveToRep, handleSave, handleEditClick]);

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            <header className="px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                            <ClipboardList className="text-brand-600" />
                            PENDING PO PIPELINE
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            High-Precision Supplier Reconciliation & Stock Mapping
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <TableToolbar
                    onOpenFilter={() => setIsFilterOpen(true)}
                    filters={filters as any}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    sortOptions={sortOptions}
                    activeSort={sort}
                    onSort={applySort}
                />

                <DataGrid
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                    onRowClick={(item: PendingItem) => !editingId && handleEditClick(item)}
                />
            </main>

            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters as any}
                onApply={applyFilters}
                onClear={clearAllFilters}
            />



            {/* Edit Drawer Overlay Placeholder (Actually a modal/overlay in System) */}
            {editingId && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-none shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Edit size={20} className="text-brand-600" />
                            Update Allocation
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Ordered Quantity</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.ordered_qty}
                                    onChange={(e) => handleInputChange('ordered_qty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Stock Available</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.stock_qty}
                                    onChange={(e) => handleInputChange('stock_qty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Special Offer Qty</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.offer_qty}
                                    onChange={(e) => handleInputChange('offer_qty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Allocator Notes</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    rows={3}
                                    value={editFormData.allocator_notes}
                                    onChange={(e) => handleInputChange('allocator_notes', e.target.value)}
                                    placeholder="Add any internal remarks here..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => handleSave(editingId)}
                                className="flex-1 btn-brand shadow-lg shadow-brand-500/20"
                            >
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 px-4 py-3 rounded-none border border-neutral-200 text-sm font-bold text-neutral-500 hover:bg-neutral-50 smooth-transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

