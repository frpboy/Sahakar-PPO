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
import { UserBag, Edit, Undo, InfoCircle } from 'iconoir-react';
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
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { can } = useUserRole();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [returnId, setReturnId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: items, isLoading } = useQuery({
        queryKey: ['rep-items'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/rep-items');
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`http://localhost:8080/rep-items/${data.id}`, {
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
            const res = await fetch(`http://localhost:8080/rep-items/${id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: 'admin@sahakar.com' }),
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
                        <span className="font-bold text-gray-900 text-[10px] uppercase">{item.pendingItem.orderRequest.customerId}</span>
                        <span className="text-[9px] text-gray-400 font-bold font-mono tracking-tighter">{item.pendingItem.orderRequest.orderId}</span>
                    </div>
                );
            }
        },
        {
            header: 'Req',
            size: 60,
            cell: ({ row }) => <span className="tabular-nums font-bold text-gray-400">{row.original.pendingItem.orderRequest.reqQty}</span>
        },
        {
            header: 'Buy Qty',
            size: 100,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-indigo-300 rounded px-1 py-0.5 text-xs font-bold tabular-nums"
                        value={editFormData.orderedQty}
                        onChange={(e) => handleInputChange('orderedQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-indigo-600">{item.pendingItem.orderedQty}</span>;
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
                        className="w-full bg-white border border-indigo-300 rounded px-1 py-0.5 text-xs font-bold tabular-nums"
                        value={editFormData.stockQty}
                        onChange={(e) => handleInputChange('stockQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-gray-700">{item.pendingItem.stockQty}</span>;
            }
        },
        {
            header: 'Actions',
            size: 120,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-2">
                        {editingId === item.id ? (
                            <>
                                <button onClick={() => handleSave(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-4 h-4" /></button>
                                <button onClick={() => setEditingId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Cancel className="w-4 h-4" /></button>
                            </>
                        ) : (
                            <>
                                {can('edit_rep') && (
                                    <button onClick={() => handleEditClick(item)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit Allocation"><Edit className="w-4 h-4" /></button>
                                )}
                                {can('return_to_pending') && (
                                    <button onClick={() => setReturnId(item.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Return to Pending"><Undo className="w-4 h-4" /></button>
                                )}
                            </>
                        )}
                    </div>
                );
            }
        }
    ], [editingId, editFormData, can]);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            <header className="bg-white border-b border-[var(--border)] px-8 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                        <UserBag className="w-5 h-5 text-indigo-600" />
                        Representation Allocation
                    </h1>
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
                    <div key={productName} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 px-6 py-3 border-b border-[var(--border)] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest leading-none">
                                    {productName}
                                </h2>
                                <StatusBadge status="REP_ALLOCATION" className="scale-90 origin-left" />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Total Required</p>
                                    <p className="text-sm font-bold tabular-nums text-gray-900">{groupItems.reduce((acc, i) => acc + i.pendingItem.orderRequest.reqQty, 0)}</p>
                                </div>
                                <div className="text-right border-l border-gray-200 pl-6">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Allocated</p>
                                    <p className="text-sm font-bold tabular-nums text-green-600">{groupItems.reduce((acc, i) => acc + (i.pendingItem.orderedQty || 0), 0)}</p>
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
                    <div className="bg-white rounded-lg border border-[var(--border)] p-20 text-center shadow-sm">
                        <div className="max-w-xs mx-auto">
                            <InfoCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase">No Allocations Found</h3>
                            <p className="text-xs text-gray-500 mt-1 font-medium italic">Adjust filters or check pending orders to process new items.</p>
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

// Helpers
function CheckCircle(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> }
function Cancel(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
