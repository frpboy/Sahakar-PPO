'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import groupBy from 'lodash/groupBy';

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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});

    const { data: items, isLoading } = useQuery({
        queryKey: ['rep-items'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3001/rep-items');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            await fetch(`http://localhost:3001/rep-items/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.payload),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            setEditingId(null);
        },
    });

    const groupedItems = useMemo(() => {
        if (!items) return {};
        return groupBy(items, (item: RepItem) => item.pendingItem.orderRequest.productName);
    }, [items]);

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

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold">Rep Allocation</h1>

            {Object.entries(groupedItems).map(([productName, groupItems]: [string, any[]]) => (
                <div key={productName} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-semibold text-gray-800">{productName}</h2>
                        <div className="text-sm text-gray-500">
                            Total Req: {groupItems.reduce((acc, i) => acc + i.pendingItem.orderRequest.reqQty, 0)} |
                            Total Alloc: {groupItems.reduce((acc, i) => acc + (i.pendingItem.orderedQty || 0), 0)}
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Req Qty</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Buy (Ordered)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Stock</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Offer</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {groupItems.map((item: RepItem) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm">{item.pendingItem.orderRequest.customerId}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{item.pendingItem.orderRequest.orderId}</td>
                                    <td className="px-4 py-3 text-sm">{item.pendingItem.orderRequest.reqQty}</td>

                                    <td className="px-4 py-3 text-sm">
                                        {editingId === item.id ? (
                                            <input
                                                type="number" className="border rounded w-16 px-1"
                                                value={editFormData.orderedQty}
                                                onChange={(e) => handleInputChange('orderedQty', e.target.value)}
                                            />
                                        ) : item.pendingItem.orderedQty}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {editingId === item.id ? (
                                            <input
                                                type="number" className="border rounded w-16 px-1"
                                                value={editFormData.stockQty}
                                                onChange={(e) => handleInputChange('stockQty', e.target.value)}
                                            />
                                        ) : item.pendingItem.stockQty}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {editingId === item.id ? (
                                            <input
                                                type="number" className="border rounded w-16 px-1"
                                                value={editFormData.offerQty}
                                                onChange={(e) => handleInputChange('offerQty', e.target.value)}
                                            />
                                        ) : item.pendingItem.offerQty}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {editingId === item.id ? (
                                            <input
                                                type="text" className="border rounded w-24 px-1"
                                                value={editFormData.notes || ''}
                                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                            />
                                        ) : item.pendingItem.notes}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-blue-600 cursor-pointer">
                                        {editingId === item.id ? (
                                            <span onClick={() => handleSave(item.id)}>Save</span>
                                        ) : (
                                            <span onClick={() => handleEditClick(item)}>Edit</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}
