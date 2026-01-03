'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrderSlipsPage() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: slips, isLoading } = useQuery({
        queryKey: ['order-slips'],
        queryFn: async () => {
            const res = await fetch('http://localhost:3001/order-slips');
            return res.json();
        },
    });

    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('http://localhost:3001/order-slips/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: 'admin@sahakar.com' }),
            });
            return res.json();
        },
        onSuccess: (data) => {
            alert(data.message);
            queryClient.invalidateQueries({ queryKey: ['order-slips'] });
            // Invalidate rep/pending items too as they moved
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            queryClient.invalidateQueries({ queryKey: ['pending-items'] });
        },
    });

    if (isLoading) return <div className="p-8">Loading slips...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Order Slips</h1>
                <button
                    onClick={() => {
                        if (confirm('Generate slips for ALL ready items?')) {
                            generateMutation.mutate();
                        }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={generateMutation.isPending}
                >
                    {generateMutation.isPending ? 'Generating...' : 'Generate New Slips'}
                </button>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slip ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {slips?.map((slip: any) => (
                            <tr key={slip.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                    {slip.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {slip.supplier}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(slip.slipDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {slip._count?.items || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                    <Link href={`/order-slips/${slip.id}`} className="hover:underline">View Items</Link>
                                </td>
                            </tr>
                        ))}
                        {slips?.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No slips generated yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
