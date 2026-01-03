'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

// Types
type PendingItem = {
    id: string;
    orderRequest: {
        productName: string;
        orderId: string;
        customerId: string;
        reqQty: number;
        rep?: string;
        primarySupplier?: string;
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<PendingItem>>({});

    const { data: items, isLoading } = useQuery({
        queryKey: ['pending-items'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3001/pending-items');
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`http://localhost:3001/pending-items/${data.id}`, {
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
        },
    });

    const moveToRepMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`http://localhost:3001/pending-items/${id}/move-to-rep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: 'admin@sahakar.com' }), // TODO: real auth
            });
            if (!res.ok) throw new Error('Move failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
        },
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

    if (isLoading) return <div className="p-8">Loading pending orders...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Pending Purchase Orders</h1>

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cust/Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Req Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items?.map((item: PendingItem) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.orderRequest.productName}
                                    <div className="text-xs text-gray-500">{item.orderRequest.primarySupplier}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.orderRequest.customerId} <br /> {item.orderRequest.orderId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.orderRequest.reqQty}
                                </td>

                                {/* Editable Fields */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editingId === item.id ? (
                                        <input
                                            type="number"
                                            className="border rounded w-20 px-2 py-1"
                                            value={editFormData.orderedQty}
                                            onChange={(e) => handleInputChange('orderedQty', e.target.value)}
                                        />
                                    ) : item.orderedQty}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editingId === item.id ? (
                                        <input
                                            type="number"
                                            className="border rounded w-20 px-2 py-1"
                                            value={editFormData.stockQty}
                                            onChange={(e) => handleInputChange('stockQty', e.target.value)}
                                        />
                                    ) : item.stockQty}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editingId === item.id ? (
                                        <input
                                            type="number"
                                            className="border rounded w-20 px-2 py-1"
                                            value={editFormData.offerQty}
                                            onChange={(e) => handleInputChange('offerQty', e.target.value)}
                                        />
                                    ) : item.offerQty}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editingId === item.id ? (
                                        <input
                                            type="text"
                                            className="border rounded w-32 px-2 py-1"
                                            value={editFormData.notes || ''}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                        />
                                    ) : item.notes}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {editingId === item.id ? (
                                        <>
                                            <button onClick={() => handleSave(item.id)} className="text-green-600 hover:text-green-900">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEditClick(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Move to Rep? This cannot be undone.')) {
                                                        moveToRepMutation.mutate(item.id);
                                                    }
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                                disabled={moveToRepMutation.isPending}
                                            >
                                                {moveToRepMutation.isPending ? 'Moving...' : 'Move to Rep'}
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
