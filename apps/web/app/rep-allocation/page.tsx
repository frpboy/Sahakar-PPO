'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import groupBy from 'lodash/groupBy';
import { DataGrid } from '../../components/DataGrid';
import { FilterBar } from '../../components/FilterBar';
import { ConfirmModal } from '../../components/ConfirmModal';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useUserRole } from '../../context/UserRoleContext';
import { UserCircle, Edit, Undo, Info, CheckCircle2, XCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

// Types
type RepItem = {
    id: string;
    orderStatus?: string;
    pendingItem: {
        id: string;
        orderedQty: number;
        stockQty: number;
        offerQty: number;
        notes: string;
        orderRequest: {
            productName: string;
            orderId: string;
            customerId: string;
            reqQty: number;
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
    const [searchTerm, setSearchTerm] = useState('');

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

    const groupedItems = useMemo(() => {
        if (!items) return {};
        const filtered = items.filter((item: RepItem) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                item.pendingItem.orderRequest.productName.toLowerCase().includes(searchLower) ||
                item.pendingItem.orderRequest.customerId.toLowerCase().includes(searchLower)
            );
        });
        return groupBy(filtered, (item: RepItem) => item.pendingItem.orderRequest.productName);
    }, [items, searchTerm]);

    const handleEditClick = (item: RepItem) => {
        setEditingId(item.id);
        setEditFormData({
            orderedQty: item.pendingItem.orderedQty,
            stockQty: item.pendingItem.stockQty,
            offerQty: item.pendingItem.offerQty,
            notes: item.pendingItem.notes,
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
            header: 'Customer',
            size: 200,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-primary-900 text-[11px] uppercase tracking-tight">{item.pendingItem.orderRequest.customerId}</span>
                        <span className="text-[10px] text-neutral-400 font-bold tracking-widest">{item.pendingItem.orderRequest.orderId}</span>
                    </div>
                );
            }
        },
        {
            header: 'Req',
            size: 60,
            cell: ({ row }) => <span className="tabular-nums font-bold text-neutral-400">{row.original.pendingItem.orderRequest.reqQty}</span>
        },
        {
            header: 'Buy Qty',
            size: 100,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-primary-500 rounded px-1 py-1 text-xs font-bold tabular-nums focus:ring-2 focus:ring-primary-500/20 outline-none"
                        value={editFormData.orderedQty}
                        onChange={(e) => handleInputChange('orderedQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-primary-700">{item.pendingItem.orderedQty}</span>;
            }
        },
        {
            header: 'Stock',
            size: 100,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-primary-500 rounded px-1 py-1 text-xs font-bold tabular-nums focus:ring-2 focus:ring-primary-500/20 outline-none"
                        value={editFormData.stockQty}
                        onChange={(e) => handleInputChange('stockQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-primary-900">{item.pendingItem.stockQty}</span>;
            }
        },
        {
            header: 'Actions',
            size: 120,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3">
                        {editingId === item.id ? (
                            <>
                                <button onClick={() => handleSave(item.id)} className="p-1 text-accent-600 hover:bg-accent-100 rounded transition-colors"><CheckCircle2 size={18} /></button>
                                <button onClick={() => setEditingId(null)} className="p-1 text-error-600 hover:bg-error-100 rounded transition-colors"><XCircle size={18} /></button>
                            </>
                        ) : (
                            <>
                                {can('edit_rep') && (
                                    <button onClick={() => handleEditClick(item)} className="text-neutral-400 hover:text-primary-700 transition-colors" title="Edit Allocation"><Edit size={18} /></button>
                                )}
                                {can('return_to_pending') && (
                                    <button onClick={() => setReturnId(item.id)} className="text-neutral-400 hover:text-error-600 transition-colors" title="Return to Pending"><Undo size={18} /></button>
                                )}
                            </>
                        )}
                    </div>
                );
            }
        }
    ], [editingId, editFormData, can]);

    return (
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-[0_1px_3px_rgba(16_24_40/0.1)] flex items-center justify-center border border-neutral-200/80">
                            <UserCircle size={28} className="text-brand-600" />
                        </div>
                        Representation Allocation
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium mt-2">Final representative validation and stock assignment for fulfillment.</p>
                </div>
                <div className="flex items-center gap-4">
                    <FilterBar
                        filters={[]}
                        onFilterChange={() => { }}
                        onSearch={setSearchTerm}
                        onReset={() => setSearchTerm('')}
                    />
                </div>
            </header>

            <main className="space-y-10">
                {Object.entries(groupedItems).map(([productName, groupItems]: [string, any[]]) => (
                    <section key={productName} className="flex flex-col gap-4">
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
                        <div className="saas-card overflow-hidden bg-white">
                            <DataGrid
                                data={groupItems}
                                columns={columns}
                            />
                        </div>
                    </section>
                ))}

                {Object.keys(groupedItems).length === 0 && !isLoading && (
                    <div className="saas-card bg-white p-20 text-center">
                        <div className="max-w-xs mx-auto">
                            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
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
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Edit size={20} className="text-brand-600" />
                            Update Allocation
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Consolidated Buy Qty</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.orderedQty}
                                    onChange={(e) => handleInputChange('orderedQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Direct Stock</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.stockQty}
                                    onChange={(e) => handleInputChange('stockQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Allocator Notes</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
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
                                className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-500 hover:bg-neutral-50 smooth-transition"
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

