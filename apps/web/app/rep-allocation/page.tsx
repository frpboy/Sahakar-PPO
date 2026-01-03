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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
        <div className="flex flex-col h-full bg-neutral-50 font-sans antialiased">
            <header className="bg-white border-b border-neutral-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-primary-900 tracking-tight flex items-center gap-3 uppercase">
                            <UserCircle size={24} className="text-primary-700" />
                            Representation Allocation
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold mt-1 uppercase tracking-widest leading-none">Final representative validation & Stock assignment</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <FilterBar
                            filters={[]}
                            onFilterChange={() => { }}
                            onSearch={setSearchTerm}
                            onReset={() => setSearchTerm('')}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 space-y-8 overflow-auto">
                {Object.entries(groupedItems).map(([productName, groupItems]: [string, any[]]) => (
                    <div key={productName} className="bg-white erp-card overflow-hidden shadow-sm border-neutral-200">
                        <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[11px] font-bold text-primary-900 uppercase tracking-widest leading-none">
                                    {productName}
                                </h2>
                                <StatusBadge status="REP_ALLOCATION" className="scale-90 origin-left" />
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Total Required</p>
                                    <p className="text-sm font-bold tabular-nums text-primary-900">{groupItems.reduce((acc, i) => acc + i.pendingItem.orderRequest.reqQty, 0)}</p>
                                </div>
                                <div className="text-right border-l border-neutral-200 pl-8">
                                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Allocated</p>
                                    <p className="text-sm font-bold tabular-nums text-accent-600">{groupItems.reduce((acc, i) => acc + (i.pendingItem.orderedQty || 0), 0)}</p>
                                </div>
                            </div>
                        </div>

                        <DataGrid
                            data={groupItems}
                            columns={columns}
                        />
                    </div>
                ))}

                {Object.keys(groupedItems).length === 0 && !isLoading && (
                    <div className="bg-white erp-card p-20 text-center shadow-sm">
                        <div className="max-w-xs mx-auto">
                            <Info size={48} className="text-neutral-200 mx-auto mb-4" />
                            <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider">No Allocations Found</h3>
                            <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-widest leading-relaxed">Adjust filters or check pending orders to process new items.</p>
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
        </div>
    );
}
