'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { UserCircle, Edit, Undo, Info, CheckCircle2, XCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid } from '../../components/DataGrid';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useUserRole } from '../../context/UserRoleContext';
import { FilterPanel, FilterState } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';
import { ConfirmModal } from '../../components/ConfirmModal';

// Types
type RepItem = {
    id: string;
    orderStatus?: string;
    notes?: string;
    pendingItem: {
        id: string;
        orderedQty: number;
        stockQty: number;
        offerQty: number;
        notes: string;
        decidedSupplier?: string;
        orderRequest: {
            productName: string;
            orderId: string;
            customerId: string;
            reqQty: number;
            mrp?: string;
            packing?: string;
            remarks?: string;
            subcategory?: string;
            rep?: string;
            mobile?: string;
            primarySup?: string;
            secondarySup?: string;
            acceptedDate?: string;
            acceptedTime?: string;
        }
    }
};

export default function RepAllocationPage() {
    const { currentUser, can } = useUserRole();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [returnId, setReturnId] = useState<string | null>(null);

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
        savedFilters, activeFilterCount
    } = useTableState({
        storageKey: 'rep_allocation',
        defaultSort: { id: 'date_desc', label: 'Newest First', field: 'acceptedDate', direction: 'desc' }
    });

    const sortOptions: SortOption[] = [
        { id: 'name_asc', label: 'Product Name (A-Z)', field: 'productName', direction: 'asc' },
        { id: 'name_desc', label: 'Product Name (Z-A)', field: 'productName', direction: 'desc' },
        { id: 'qty_desc', label: 'Req Qty (High → Low)', field: 'reqQty', direction: 'desc' },
        { id: 'qty_asc', label: 'Req Qty (Low → High)', field: 'reqQty', direction: 'asc' },
        { id: 'date_desc', label: 'Date (Newest)', field: 'acceptedDate', direction: 'desc' },
        { id: 'date_asc', label: 'Date (Oldest)', field: 'acceptedDate', direction: 'asc' },
    ];

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: items, isLoading } = useQuery({
        queryKey: ['rep-items'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/rep-items`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`${apiUrl}/rep-items/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.payload),
            });
            if (!res.ok) throw new Error('Update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            setEditingId(null);
            showToast('Allocation updated successfully', 'success');
        },
        onError: () => showToast('Failed to update allocation', 'error')
    });

    const returnToPendingMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${apiUrl}/rep-items/${id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser?.email || 'unknown@sahakar.com' }),
            });
            if (!res.ok) throw new Error('Return failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            setReturnId(null);
            showToast('Item returned to Pending POs', 'success');
        },
        onError: (err: any) => showToast(err.message, 'error')
    });

    const filteredItems = useMemo(() => {
        if (!items) return [];
        let result = [...items];

        // Apply Search/Filters
        if (filters.productName) {
            result = result.filter(item =>
                item.pendingItem?.orderRequest?.productName?.toLowerCase().includes(filters.productName!.toLowerCase())
            );
        }
        if (filters.orderId) {
            result = result.filter(item =>
                item.pendingItem?.orderRequest?.orderId?.toString().includes(filters.orderId!)
            );
        }
        if (filters.rep && filters.rep.length > 0) {
            result = result.filter(item =>
                filters.rep!.includes(item.pendingItem?.orderRequest?.rep || '')
            );
        }
        if (filters.stage && filters.stage.length > 0) {
            result = result.filter(item =>
                filters.stage!.includes(item.orderStatus?.toUpperCase() || 'PENDING')
            );
        }
        if (filters.dateFrom) {
            result = result.filter(item =>
                item.pendingItem?.orderRequest?.acceptedDate &&
                item.pendingItem.orderRequest.acceptedDate >= filters.dateFrom!
            );
        }
        if (filters.dateTo) {
            result = result.filter(item =>
                item.pendingItem?.orderRequest?.acceptedDate &&
                item.pendingItem.orderRequest.acceptedDate <= filters.dateTo!
            );
        }

        // Apply Sorting
        if (sort) {
            result.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                if (sort.field === 'productName') {
                    valA = a.pendingItem?.orderRequest?.productName || '';
                    valB = b.pendingItem?.orderRequest?.productName || '';
                } else if (sort.field === 'reqQty') {
                    valA = a.pendingItem?.orderRequest?.reqQty || 0;
                    valB = b.pendingItem?.orderRequest?.reqQty || 0;
                } else if (sort.field === 'acceptedDate') {
                    valA = a.pendingItem?.orderRequest?.acceptedDate || '';
                    valB = b.pendingItem?.orderRequest?.acceptedDate || '';
                }

                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [items, filters, sort]);

    const groupedItems = useMemo(() => {
        if (!filteredItems) return {};
        return groupBy(filteredItems, (item: RepItem) => item.pendingItem.orderRequest.productName);
    }, [filteredItems]);

    const handleEditClick = (item: RepItem) => {
        setEditingId(item.id);
        setEditFormData({
            orderedQty: item.pendingItem.orderedQty,
            stockQty: item.pendingItem.stockQty,
            offerQty: item.pendingItem.offerQty,
            notes: item.pendingItem.notes,
            orderStatus: item.orderStatus,
            decidedSupplier: item.pendingItem.decidedSupplier
        });
    };

    const handleSave = (id: string) => {
        updateMutation.mutate({ id, payload: editFormData });
    };

    const handleInputChange = (field: string, value: any) => {
        setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const columns = useMemo<ColumnDef<RepItem>[]>(() => [
        {
            header: 'PROD ID',
            size: 80,
            cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-500">{row.original.pendingItem?.id?.toString().substring(0, 8) || '-'}</span>
        },
        {
            header: 'MRP',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums">₹{row.original.pendingItem?.orderRequest?.mrp || '0.00'}</span>
        },
        {
            header: 'PACKING',
            size: 80,
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400 uppercase">{row.original.pendingItem?.orderRequest?.packing || '-'}</span>
        },
        {
            header: 'ITEM NAME',
            size: 220,
            cell: ({ row }) => <span className="font-bold text-neutral-900 uppercase truncate" title={row.original.pendingItem?.orderRequest?.productName}>{row.original.pendingItem?.orderRequest?.productName}</span>
        },
        {
            header: 'REMARKS',
            size: 120,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 truncate italic">{row.original.pendingItem?.orderRequest?.remarks || '-'}</span>
        },
        {
            header: 'SUBCATEGORY',
            size: 100,
            cell: ({ row }) => <span className="text-[10px] bg-neutral-100 px-1 rounded font-bold text-neutral-500 uppercase">{row.original.pendingItem?.orderRequest?.subcategory || 'N/A'}</span>
        },
        {
            header: 'REQ QTY',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold text-neutral-900">{row.original.pendingItem?.orderRequest?.reqQty}</span>
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
                        value={editFormData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                    />
                ) : <span className="text-[11px] text-neutral-600 truncate">{item.pendingItem?.notes || '-'}</span>;
            }
        },
        {
            header: 'ORDER STATUS',
            size: 120,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <select
                        className="w-full bg-white border border-brand-500 p-1 text-[10px] font-bold uppercase cursor-pointer"
                        value={editFormData.orderStatus || 'PENDING'}
                        onChange={(e) => handleInputChange('orderStatus', e.target.value)}
                    >
                        <option value="PENDING">PENDING</option>
                        <option value="ORDERED">ORDERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="SHORT">SHORT</option>
                    </select>
                ) : <StatusBadge status={(item.orderStatus || 'PENDING').toUpperCase() as any} />;
            }
        },
        {
            header: 'ITEM NAME CHANGE',
            size: 130,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-medium italic">No Change</span>
        },
        {
            header: 'CHANGE TO PENDING ORDER',
            size: 180,
            cell: ({ row }) => (
                <button
                    onClick={() => setReturnId(row.original.id)}
                    disabled={returnToPendingMutation.isPending}
                    className="text-[10px] font-bold text-error-600 hover:text-error-700 bg-error-50 px-2 py-1 rounded-none border border-error-100 uppercase tracking-tight transition-colors"
                >
                    {returnToPendingMutation.isPending ? 'Moving...' : 'Move to Pending'}
                </button>
            )
        },
        {
            header: 'REP',
            size: 100,
            cell: ({ row }) => <span className="text-[11px] font-bold text-neutral-600 uppercase">{row.original.pendingItem?.orderRequest?.rep || '-'}</span>
        },
        {
            header: 'MOBILE',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-500">{row.original.pendingItem?.orderRequest?.mobile || '-'}</span>
        },
        {
            header: 'ORDERED SUPPLIER',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] font-bold text-neutral-400 uppercase truncate">{row.original.pendingItem?.orderRequest?.primarySup || '-'}</span>
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
                        value={editFormData.decidedSupplier || ''}
                        onChange={(e) => handleInputChange('decidedSupplier', e.target.value)}
                    />
                ) : <span className="text-[11px] font-bold text-brand-600 uppercase truncate">{item.pendingItem?.decidedSupplier || row.original.pendingItem?.orderRequest?.primarySup || '-'}</span>;
            }
        },
        {
            header: 'PRIMARY SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-400 uppercase truncate">{row.original.pendingItem?.orderRequest?.primarySup || '-'}</span>
        },
        {
            header: 'SECONDARY SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-400 uppercase truncate">{row.original.pendingItem?.orderRequest?.secondarySup || '-'}</span>
        },
        {
            header: 'ACCEPT DATE',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-500">{row.original.pendingItem?.orderRequest?.acceptedDate ? new Date(row.original.pendingItem.orderRequest.acceptedDate).toLocaleDateString() : '-'}</span>
        },
        {
            header: 'ACCEPTED TIME',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-500">{row.original.pendingItem?.orderRequest?.acceptedTime || '-'}</span>
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
    ], [editingId, editFormData, handleSave, handleEditClick, returnToPendingMutation]);

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            <header className="px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                            <UserCircle className="text-brand-600" />
                            REP ALLOCATION PIPELINE
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            High-Precision Secondary Distribution Control
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <FilterPanel
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onApply={applyFilters}
                    onClear={clearAllFilters}
                />

                <ConfirmModal
                    isOpen={!!returnId}
                    onCancel={() => setReturnId(null)}
                    onConfirm={() => {
                        if (returnId) returnToPendingMutation.mutate(returnId);
                    }}
                    title="Return to Pending?"
                    message="This will remove the item from REP allocation and move it back to the daily pending pool."
                    confirmLabel="Yes, Return"
                    variant="danger"
                />

                <TableToolbar
                    onOpenFilter={() => setIsFilterOpen(true)}
                    filters={filters}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    sortOptions={sortOptions}
                    activeSort={sort}
                    onSort={applySort}
                />

                {Object.keys(groupedItems).length > 0 ? (
                    Object.entries(groupedItems).map(([productName, groupItems]: [string, any[]]) => (
                        <section key={productName} className="flex flex-col gap-4 mb-8">
                            <div className="flex items-center justify-between px-2 mb-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-sm font-semibold text-neutral-800">{productName}</h2>
                                    <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Product Allocation Group</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Target</span>
                                        <span className="text-xs font-bold text-neutral-900 tabular-nums">
                                            {groupItems.reduce((acc, i) => acc + (i.pendingItem?.orderRequest?.reqQty || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="w-px h-6 bg-neutral-200" />
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Allocated</span>
                                        <span className="text-xs font-bold text-brand-600 tabular-nums">
                                            {groupItems.reduce((acc, i) => acc + (i.pendingItem?.orderedQty || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="app-card overflow-hidden bg-white">
                                <DataGrid
                                    data={groupItems}
                                    columns={columns}
                                />
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="app-card bg-white p-20 text-center">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-neutral-50 rounded-none flex items-center justify-center mx-auto mb-6">
                                <Info size={32} className="text-neutral-300" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900">No Allocations Found</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Try adjusting your search criteria or check the pending orders queue.</p>
                        </div>
                    </div>
                )}
            </main>

            <ConfirmModal
                isOpen={!!returnId}
                onConfirm={() => returnId && returnToPendingMutation.mutate(returnId)}
                onCancel={() => setReturnId(null)}
                title="Rollback to Pending"
                message="This will remove the item from Rep Allocation and return it to the Pending stage for re-verification. Continue?"
                confirmLabel="Confirm Rollback"
                variant="danger"
            />

            {/* Edit Modal same as PendingOrders */}
            {editingId && (
                <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-none shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Edit size={20} className="text-brand-600" />
                            Update Allocation
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Consolidated Buy Qty</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.orderedQty}
                                    onChange={(e) => handleInputChange('orderedQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Direct Stock</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.stockQty}
                                    onChange={(e) => handleInputChange('stockQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Allocator Notes</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    rows={3}
                                    value={editFormData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Final remarks for this allocation..."
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

