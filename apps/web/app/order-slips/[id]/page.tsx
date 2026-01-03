'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

export default function OrderSlipDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: slip, isLoading } = useQuery({
        queryKey: ['order-slip', id],
        queryFn: async () => {
            const res = await fetch(`http://localhost:3001/order-slips/${id}`);
            return res.json();
        },
        enabled: !!id
    });

    if (isLoading) return <div className="p-8">Loading slip details...</div>;
    if (!slip) return <div className="p-8">Slip not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">&larr; Back</button>
                <h1 className="text-2xl font-bold">Order Slip: {slip.supplier}</h1>
            </div>

            <div className="bg-white p-6 rounded shadow border">
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <span className="text-gray-500">Date:</span> {new Date(slip.slipDate).toLocaleDateString()}
                    </div>
                    <div>
                        <span className="text-gray-500">ID:</span> {slip.id}
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200 border-t">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Order ID</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Customer</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Remarks</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {slip.items.map((item: any) => (
                            <tr key={item.id}>
                                <td className="px-4 py-3 text-sm font-medium">{item.itemName}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.orderId}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.customerId}</td>
                                <td className="px-4 py-3 text-sm font-bold">{item.qty}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{item.remarks}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
