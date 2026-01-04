'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { FilterBar } from '../../components/FilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { ClipboardList, Edit, Send, Info, CheckCircle2, XCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { useUserRole } from '../../context/UserRoleContext';
import { useOfflineSync } from '../../hooks/useOfflineSync';

// Types
type PendingItem = {
    id: string;
    orderRequest: {
        productName: string;
        orderId: string;
        customerId: string;
        reqQty: number;
        primarySupplier?: string;
        secondarySupplier?: string;
    };
    orderedQty: number;
    stockQty: number;
    offerQty: number;
    notes: string;
    orderedSupplier: string;
    decidedSupplier: string;
};

export default function PendingOrdersPage() {
    const { currentUser } = useUserRole();
    const { isOnline } = useOfflineSync();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<PendingItem>>({});
    const [confirmMoveId, setConfirmMoveId] = useState<string | null>(null);

    // Filter State
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
            setConfirmMoveId(null);
            showToast('Item moved to Rep Allocation', 'success');
        },
        onError: () => {
            showToast('Failed to move item', 'error');
        }
    });

    const handleEditClick = (item: PendingItem) => {
        setEditingId(item.id);
        setEditFormData({
            orderedQty: item.orderedQty,
            stockQty: item.stockQty,
            offerQty: item.offerQty,
            notes: item.notes,
            decidedSupplier: item.decidedSupplier || item.orderedSupplier,
        });
    };

    const handleSave = (id: string) => {
        updateMutation.mutate({ id, payload: editFormData });
    };

    const handleInputChange = (field: string, value: any) => {
        setEditFormData((prev) => ({ ...prev, [field]: value }));
    };

    const filteredItems = useMemo(() => {
        if (!items) return [];
        return items.filter((item: PendingItem) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                item.orderRequest.productName.toLowerCase().includes(searchLower) ||
                item.orderRequest.orderId.toLowerCase().includes(searchLower) ||
                item.orderRequest.customerId.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;
            if (filters.supplier && item.orderedSupplier !== filters.supplier) return false;

            return true;
        });
    }, [items, searchTerm, filters]);

    const uniqueSuppliers = useMemo(() => {
        if (!items) return [];
        const suppliers = new Set(items.map((i: PendingItem) => i.orderedSupplier).filter(Boolean));
        return Array.from(suppliers).map(s => ({ label: s as string, value: s as string }));
    }, [items]);

    const columns = useMemo<ColumnDef<PendingItem>[]>(() => [
        {
            header: 'Product Details',
            size: 250,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-primary-900 group-hover:text-primary-700 transition-colors uppercase text-[11px] tracking-tight">{item.orderRequest.productName}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">{item.orderRequest.primarySupplier}</span>
                    </div>
                );
            }
        },
        {
            header: 'Customer Info',
            size: 150,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-primary-700">{item.orderRequest.customerId}</span>
                        <span className="text-[10px] text-neutral-400 font-bold">{item.orderRequest.orderId}</span>
                    </div>
                );
            }
        },
        {
            header: 'Req',
            accessorKey: 'orderRequest.reqQty',
            size: 60,
            cell: (info) => <span className="tabular-nums font-bold text-neutral-400">{info.getValue() as number}</span>
        },
        {
            header: 'Ordered',
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
                ) : <span className="tabular-nums font-bold text-primary-900">{item.orderedQty}</span>;
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
                ) : <span className="tabular-nums font-bold text-primary-900">{item.stockQty}</span>;
            }
        },
        {
            header: 'Offer',
            size: 100,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-primary-500 rounded px-1 py-1 text-xs font-bold tabular-nums focus:ring-2 focus:ring-primary-500/20 outline-none"
                        value={editFormData.offerQty}
                        onChange={(e) => handleInputChange('offerQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-primary-900">{item.offerQty}</span>;
            }
        },
        {
            header: 'Actions',
            size: 150,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3">
                        {editingId === item.id ? (
                            <>
                                <button
                                    onClick={() => handleSave(item.id)}
                                    className="p-1 text-accent-600 hover:bg-accent-100 rounded transition-colors"
                                    title="Save Changes"
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 text-error-600 hover:bg-error-100 rounded transition-colors"
                                    title="Cancel"
                                >
                                    <XCircle size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleEditClick(item)}
                                    className="text-neutral-400 hover:text-primary-700 transition-colors"
                                    title="Edit Row"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => setConfirmMoveId(item.id)}
                                    className="text-neutral-400 hover:text-accent-600 transition-colors"
                                    title="Move to Rep"
                                >
                                    <Send size={18} />
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ], [editingId, editFormData]);

    return (
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-none shadow-[0_1px_3px_rgba(16_24_40/0.1)] flex items-center justify-center border border-neutral-200/80">
                            <ClipboardList size={28} className="text-brand-600" />
                        </div>
                        Pending PO Ledger
                    </h1>
                    <p className="text-sm text-neutral-400 font-medium mt-2">Awaiting supplier confirmation and inventory mapping for incoming orders.</p>
                </div>
                <div className="flex items-center gap-4">
                    <FilterBar
                        filters={[
                            { key: 'supplier', label: 'Supplier', options: uniqueSuppliers }
                        ]}
                        onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
                        onSearch={setSearchTerm}
                        onReset={() => { setFilters({}); setSearchTerm(''); }}
                    />
                </div>
            </header>

            <main className="space-y-4">
                <div className="flex items-center justify-between px-2 mb-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-neutral-800">Supply Chain Reconciliation</h2>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">Pending Allocations</span>
                    </div>
                </div>
                <div className="app-card bg-white overflow-hidden">
                    <DataGrid
                        data={filteredItems}
                        columns={columns}
                        isLoading={isLoading}
                        onRowClick={(item) => !editingId && handleEditClick(item)}
                    />
                </div>
            </main>

            <ConfirmModal
                isOpen={!!confirmMoveId}
                onConfirm={() => confirmMoveId && moveToRepMutation.mutate(confirmMoveId)}
                onCancel={() => setConfirmMoveId(null)}
                title="Consolidate & Move to REP"
                message="This will lock the current quantities and move the item to the Representation Allocation stage. Are you sure?"
                confirmLabel="Confirm Move"
                variant="primary"
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
                                    value={editFormData.orderedQty}
                                    onChange={(e) => handleInputChange('orderedQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Stock Available</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.stockQty}
                                    onChange={(e) => handleInputChange('stockQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Special Offer Qty</label>
                                <input
                                    type="number"
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-bold tabular-nums focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    value={editFormData.offerQty}
                                    onChange={(e) => handleInputChange('offerQty', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Allocator Notes</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-200 rounded-none px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                                    rows={3}
                                    value={editFormData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
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

