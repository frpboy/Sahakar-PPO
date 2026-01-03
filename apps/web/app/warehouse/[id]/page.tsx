'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const ITEM_STATUSES = [
    'PENDING',
    'BILLED',
    'NOT_BILLED',
    'PARTIALLY_BILLED',
    'PRODUCT_CHANGED',
    'SUPPLIER_ITEM_DAMAGED',
    'SUPPLIER_ITEM_MISSING'
];

export default function WarehouseExecutionPage() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});

    const { data: slip, isLoading } = useQuery({
        queryKey: ['order-slip', id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/order-slips/${id}`);
            return res.json();
        },
        enabled: !!id
    });

    const updateStatusMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`http://localhost:3001/slip-items/${data.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.payload),
            });
            if (!res.ok) throw new Error('Update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order-slip', id] });
            setEditingId(null);
        }
    });

    const handleEditClick = (item: any) => {
        setEditingId(item.id);
        setEditFormData({
            status: item.status,
            receivedQty: item.qtyReceived || item.qty, // Default prepopulate
            qtyDamaged: item.qtyDamaged,
            qtyPending: item.qtyPending,
            invoiceId: item.invoiceId,
            notes: item.notes
        });
    };

    const handleSave = (itemId: string) => {
        updateStatusMutation.mutate({
            id: itemId,
            payload: { ...editFormData, userEmail: 'warehouse@sahakar.com' }
        });
    };

    const handleInputChange = (field: string, value: any) => {
        setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">&larr; Back to List</button>
                <h1 className="text-2xl font-bold">Execution: {slip.supplier}</h1>
            </div>

            <div className="bg-white rounded shadow border overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Req Qty</th>

                            {/* Execution Fields */}
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Recv Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bad Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Inv #</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Notes</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {slip.items.map((item: any) => {
                            const isEditing = editingId === item.id;
                            return (
                                <tr key={item.id} className={isEditing ? 'bg-blue-50' : ''}>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {item.itemName} <br />
                                        <span className="text-xs text-gray-500">{item.orderId}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold">{item.qty}</td>

                                    <td className="px-4 py-3 text-sm">
                                        {isEditing ? (
                                            <select
                                                className="border rounded text-sm py-1"
                                                value={editFormData.status}
                                                onChange={(e) => handleInputChange('status', e.target.value)}
                                            >
                                                {ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'BILLED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.status}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-sm">
                                        {isEditing ? (
                                            <input type="number" className="border rounded w-16 px-1" value={editFormData.receivedQty} onChange={(e) => handleInputChange('receivedQty', e.target.value)} />
                                        ) : item.qtyReceived}
                                    </td>

                                    <td className="px-4 py-3 text-sm">
                                        {isEditing ? (
                                            <input type="number" className="border rounded w-16 px-1" value={editFormData.qtyDamaged} onChange={(e) => handleInputChange('qtyDamaged', e.target.value)} />
                                        ) : item.qtyDamaged}
                                    </td>

                                    <td className="px-4 py-3 text-sm">
                                        {isEditing ? (
                                            <input type="text" className="border rounded w-20 px-1" value={editFormData.invoiceId || ''} onChange={(e) => handleInputChange('invoiceId', e.target.value)} placeholder="Inv#" />
                                        ) : item.invoiceId}
                                    </td>

                                    <td className="px-4 py-3 text-sm">
                                        {isEditing ? (
                                            <input type="text" className="border rounded w-24 px-1" value={editFormData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} />
                                        ) : item.notes}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-blue-600 cursor-pointer">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-1">
                                                <span onClick={() => handleSave(item.id)} className="font-semibold text-green-700">Save</span>
                                                <span onClick={() => setEditingId(null)} className="text-gray-500">Cancel</span>
                                            </div>
                                        ) : (
                                            <span onClick={() => handleEditClick(item)}>Update</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
