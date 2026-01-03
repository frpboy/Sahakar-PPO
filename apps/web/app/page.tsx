'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function DashboardPage() {
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => (await fetch('http://localhost:3001/analysis/stats')).json()
    });

    const { data: ledger } = useQuery({
        queryKey: ['dashboard-ledger'],
        queryFn: async () => (await fetch('http://localhost:3001/analysis/ledger?limit=10')).json()
    });

    const { data: gap } = useQuery({
        queryKey: ['dashboard-gap'],
        queryFn: async () => (await fetch('http://localhost:3001/analysis/gap')).json()
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <div className="space-x-4">
                    <Link href="/order-import" className="text-blue-600 hover:underline">Import</Link> |
                    <Link href="/pending-orders" className="text-blue-600 hover:underline">Pending</Link> |
                    <Link href="/rep-allocation" className="text-blue-600 hover:underline">Rep Alloc</Link> |
                    <Link href="/order-slips" className="text-blue-600 hover:underline">Slips</Link> |
                    <Link href="/warehouse" className="text-blue-600 hover:underline">Warehouse</Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard label="Raw Ingested" value={stats?.raw} color="bg-gray-100" />
                <StatCard label="Pending Review" value={stats?.pending} color="bg-yellow-100" />
                <StatCard label="In Rep Alloc" value={stats?.rep_allocation} color="bg-blue-100" />
                <StatCard label="Slip Generated" value={stats?.slip_generated} color="bg-purple-100" />
                <StatCard label="Executed" value={stats?.executed} color="bg-green-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Ledger */}
                <div className="bg-white p-6 rounded shadow border">
                    <h2 className="text-xl font-bold mb-4">Live Status Ledger</h2>
                    <div className="overflow-y-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Event</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Staff</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ledger?.map((event: any) => (
                                    <tr key={event.id}>
                                        <td className="px-4 py-2 text-xs text-gray-500">
                                            {new Date(event.createdAt).toLocaleTimeString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm font-medium">
                                            {event.itemNew}
                                            <div className="text-xs text-gray-400">{event.supplier}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                            {event.notes && <div className="text-xs text-gray-500 mt-1">"{event.notes}"</div>}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-500">
                                            {event.staff.split('@')[0]}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Gap Analysis */}
                <div className="bg-white p-6 rounded shadow border">
                    <h2 className="text-xl font-bold mb-4">Gap Analysis (Potential Issues)</h2>
                    <div className="overflow-y-auto max-h-96">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Supplier</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Req vs Recv</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {gap?.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-2 text-sm font-medium">
                                            {item.itemName}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-500">
                                            {item.orderSlip?.supplier}
                                        </td>
                                        <td className="px-4 py-2 text-sm">
                                            <span className="font-bold text-gray-900">{item.qty}</span>
                                            <span className="text-gray-400 mx-1">→</span>
                                            <span className={`font-bold ${item.qtyReceived < item.qty ? 'text-red-600' : 'text-green-600'}`}>
                                                {item.qtyReceived || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className={`${color} p-4 rounded shadow border border-opacity-10`}>
            <div className="text-gray-500 text-sm font-medium uppercase">{label}</div>
            <div className="text-3xl font-bold text-gray-800 mt-1">{value || 0}</div>
        </div>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'BILLED': return 'bg-green-100 text-green-800';
        case 'PENDING': return 'bg-yellow-100 text-yellow-800';
        case 'SUPPLIER_ITEM_MISSING': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
