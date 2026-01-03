'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import { StatusBadge } from '../../../components/StatusBadge';
import { useToast } from '../../../components/Toast';
import { ArrowLeft } from 'lucide-react';

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
    const { showToast } = useToast();

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
            showToast('Item status updated', 'success');
        },
        onError: () => showToast('Failed to update status', 'error')
    });

    const handleEditClick = (item: any) => {
        setEditingId(item.id);
        setEditFormData({
            status: item.status,
            receivedQty: item.qtyReceived || item.qty,
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

    const columns = [
        {
            header: 'Item',
            cell: (item: any) => (
                <div>
                    <div className="font-medium text-gray-900">{item.itemName}</div>
                    <div className="text-xs text-gray-500">{item.orderId}</div>
                </div>
            )
        },
        { header: 'Req Qty', accessorKey: 'qty' as any, className: 'font-bold' },
        {
            header: 'Status',
            cell: (item: any) => editingId === item.id ? (
                <select
                    className="border rounded text-sm py-1 px-2 focus:ring-2 focus:ring-blue-500 bg-white"
                    value={editFormData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                >
                    {ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            ) : <StatusBadge status={item.status} />
        },
        {
            header: 'Recv Qty',
            cell: (item: any) => editingId === item.id ? (
                <input type="number" className="border rounded w-16 px-1 text-sm" value={editFormData.receivedQty} onChange={(e) => handleInputChange('receivedQty', e.target.value)} />
            ) : item.qtyReceived
        },
        {
            header: 'Bad Qty',
            cell: (item: any) => editingId === item.id ? (
                <input type="number" className="border rounded w-16 px-1 text-sm" value={editFormData.qtyDamaged} onChange={(e) => handleInputChange('qtyDamaged', e.target.value)} />
            ) : item.qtyDamaged
        },
        {
            header: 'Inv #',
            cell: (item: any) => editingId === item.id ? (
                <input type="text" className="border rounded w-20 px-1 text-sm" value={editFormData.invoiceId || ''} onChange={(e) => handleInputChange('invoiceId', e.target.value)} />
            ) : item.invoiceId
        },
        {
            header: 'Notes',
            cell: (item: any) => editingId === item.id ? (
                <input type="text" className="border rounded w-24 px-1 text-sm" value={editFormData.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} />
            ) : <span className="text-xs truncate max-w-[100px]" title={item.notes}>{item.notes}</span>
        },
        {
            header: 'Action',
            cell: (item: any) => editingId === item.id ? (
                <div className="flex gap-2">
                    <button onClick={() => handleSave(item.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">Cancel</button>
                </div>
            ) : (
                <button onClick={() => handleEditClick(item)} className="text-xs text-indigo-600 font-medium hover:underline">Update</button>
            )
        }
    ];

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-800">Execution: {slip.supplier}</h1>

            <DataGrid
                data={slip.items}
                columns={columns}
            />
        </div>
    );
}
