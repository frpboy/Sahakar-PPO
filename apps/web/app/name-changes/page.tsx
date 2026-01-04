'use client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { Edit3 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface NameChange {
    id: string;
    productId: string;
    supplierId?: string;
    oldName: string;
    newName: string;
    reason?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    createdAt: string;
}

export default function NameChangesPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    const { data: nameChanges, isLoading } = useQuery({
        queryKey: ['name-changes'],
        queryFn: async () => {
            // TODO: Add GET /name-changes endpoint
            // For now, return empty
            return [];
        }
    });

    const columns = useMemo<ColumnDef<NameChange>[]>(() => [
        {
            header: 'Date',
            accessorKey: 'createdAt',
            size: 120,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-900">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            header: 'Old Name',
            accessorKey: 'oldName',
            size: 200,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.oldName}</span>
            )
        },
        {
            header: 'New Name',
            accessorKey: 'newName',
            size: 200,
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-neutral-900">{row.original.newName}</span>
            )
        },
        {
            header: 'Reason',
            accessorKey: 'reason',
            size: 250,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.reason || '-'}</span>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                        <Edit3 size={22} className="text-brand-600" />
                    </div>
                    Product Name Changes
                </h1>
                <p className="text-sm text-neutral-500 mt-1">Track product name modification history</p>
            </header>

            <div className="app-card overflow-hidden flex-1">
                {nameChanges && nameChanges.length > 0 ? (
                    <DataGrid data={nameChanges} columns={columns} isLoading={isLoading} />
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-sm text-neutral-500">No name changes recorded yet.</p>
                        <p className="text-xs text-neutral-400 mt-2">Backend: Add GET /name-changes endpoint to display data</p>
                    </div>
                )}
            </div>
        </div>
    );
}
