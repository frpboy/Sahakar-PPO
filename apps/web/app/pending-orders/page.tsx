'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { FilterBar } from '../../components/FilterBar';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { Clock, Edit, Send, InfoCircle } from 'iconoir-react';
import { ColumnDef } from '@tanstack/react-table';

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
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<PendingItem>>({});
    const [confirmMoveId, setConfirmMoveId] = useState<string | null>(null);

    // Filter State
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

    const { data: items, isLoading } = useQuery({
        queryKey: ['pending-items'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8080/pending-items');
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`http://localhost:8080/pending-items/${data.id}`, {
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
            const res = await fetch(`http://localhost:8080/pending-items/${id}/move-to-rep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: 'admin@sahakar.com' }),
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
                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-[11px] tracking-tight">{item.orderRequest.productName}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{item.orderRequest.primarySupplier}</span>
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
                        <span className="text-[10px] font-bold text-indigo-600">{item.orderRequest.customerId}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{item.orderRequest.orderId}</span>
                    </div>
                );
            }
        },
        {
            header: 'Req',
            accessorKey: 'orderRequest.reqQty',
            size: 60,
            cell: (info) => <span className="tabular-nums font-bold text-gray-500">{info.getValue() as number}</span>
        },
        {
            header: 'Ordered',
            size: 100,
            cell: ({ row }) => {
                const item = row.original;
                return editingId === item.id ? (
                    <input
                        type="number"
                        className="w-full bg-white border border-indigo-300 rounded px-1 py-0.5 text-xs font-bold tabular-nums focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={editFormData.orderedQty}
                        onChange={(e) => handleInputChange('orderedQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-gray-900">{item.orderedQty}</span>;
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
                        className="w-full bg-white border border-indigo-300 rounded px-1 py-0.5 text-xs font-bold tabular-nums focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={editFormData.stockQty}
                        onChange={(e) => handleInputChange('stockQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-gray-900">{item.stockQty}</span>;
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
                        className="w-full bg-white border border-indigo-300 rounded px-1 py-0.5 text-xs font-bold tabular-nums focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={editFormData.offerQty}
                        onChange={(e) => handleInputChange('offerQty', parseInt(e.target.value))}
                    />
                ) : <span className="tabular-nums font-bold text-gray-900">{item.offerQty}</span>;
            }
        },
        {
            header: 'Actions',
            size: 150,
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-2">
                        {editingId === item.id ? (
                            <>
                                <button
                                    onClick={() => handleSave(item.id)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Save Changes"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Cancel"
                                >
                                    <Cancel className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Edit Row"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setConfirmMoveId(item.id)}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Move to Rep"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                );
            }
        }
    ], [editingId, editFormData]);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            <header className="bg-white border-b border-[var(--border)] px-8 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                            <Clock className="w-5 h-5 text-indigo-600" />
                            Pending PO Ledger
                        </h1>
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
                </div>
            </header>

            <main className="flex-1 p-6 relative">
                <DataGrid
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                    frozenColumns={1}
                />
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
        </div>
    );
}

// Dummy components for missing icons/imports if any
function CheckCircle(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> }
function Cancel(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> }
