'use client';

import { useQuery } from '@tanstack/react-query';
import { DataGrid } from '../../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { Activity } from 'lucide-react';

export default function SystemEventsPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: events, isLoading } = useQuery({
        queryKey: ['system-events'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/logs`); // Reusing logs for now
            if (!res.ok) throw new Error('Failed to fetch events');
            return res.json();
        }
    });

    const columns: ColumnDef<any>[] = [
        {
            header: 'Timestamp',
            accessorKey: 'eventDatetime',
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-400">{new Date(row.original.eventDatetime).toLocaleString()}</span>
        },
        {
            header: 'Event',
            accessorKey: 'action',
            cell: ({ row }) => <span className="font-bold text-[10px] uppercase text-brand-600">{row.original.action}</span>
        },
        {
            header: 'Resource',
            accessorKey: 'resource',
            cell: ({ row }) => <span className="text-sm font-medium">{row.original.resource}</span>
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
                    <Activity className="text-brand-600" />
                    System Events
                </h1>
                <p className="text-sm text-neutral-400 font-medium">Detailed log of critical system-level operations.</p>
            </header>

            <div className="app-card">
                <DataGrid data={events || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
