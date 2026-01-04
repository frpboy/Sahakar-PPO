'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { Clock } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface DutySession {
    id: string;
    userId: string;
    startTime: string;
    endTime: string | null;
    active: boolean;
}

export default function DutySessionsPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['duty-sessions'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/duty-sessions`);
            if (!res.ok) throw new Error('Failed to fetch duty sessions');
            return res.json();
        }
    });

    const columns = useMemo<ColumnDef<DutySession>[]>(() => [
        {
            header: 'User ID',
            accessorKey: 'userId',
            size: 280,
            cell: ({ row }) => (
                <span className="text-xs font-mono text-neutral-600">{row.original.userId}</span>
            )
        },
        {
            header: 'Start Time',
            accessorKey: 'startTime',
            size: 160,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-900">
                    {new Date(row.original.startTime).toLocaleString()}
                </span>
            )
        },
        {
            header: 'End Time',
            accessorKey: 'endTime',
            size: 160,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-900">
                    {row.original.endTime ? new Date(row.original.endTime).toLocaleString() : '-'}
                </span>
            )
        },
        {
            header: 'Status',
            accessorKey: 'active',
            size: 100,
            cell: ({ row }) => (
                <span className={`text-xs font-bold ${row.original.active ? 'text-success-600' : 'text-neutral-400'}`}>
                    {row.original.active ? 'Active' : 'Ended'}
                </span>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                        <Clock size={22} className="text-brand-600" />
                    </div>
                    Duty Sessions
                </h1>
                <p className="text-sm text-neutral-500 mt-1">Track billing staff duty sessions</p>
            </header>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid data={sessions || []} columns={columns} isLoading={isLoading} />
            </div>
        </div>
    );
}
