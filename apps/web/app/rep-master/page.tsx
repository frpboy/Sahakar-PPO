'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { ExcelImportButton } from '../../components/ExcelImportButton';
import { Users as UsersIcon, Plus, Edit, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface RepMaster {
    id: string;
    name: string;
    mobile?: string;
    email?: string;
    designation?: string;
    active: boolean;
}

export default function RepMasterPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRep, setEditingRep] = useState<RepMaster | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        designation: ''
    });

    const { data: reps, isLoading } = useQuery({
        queryKey: ['rep-master', search],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/rep-master?search=${search}`);
            if (!res.ok) throw new Error('Failed to fetch REPs');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${apiUrl}/rep-master`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create REP');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-master'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`${apiUrl}/rep-master/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update REP');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-master'] });
            setIsModalOpen(false);
            setEditingRep(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${apiUrl}/rep-master/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete REP');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-master'] });
        }
    });

    const handleExcelImport = async (data: any[]) => {
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const row of data) {
                try {
                    await createMutation.mutateAsync({
                        name: row['Name'] || row['name'] || row['REP Name'],
                        mobile: row['Mobile'] || row['mobile'] || row['phone'],
                        email: row['Email'] || row['email'],
                        designation: row['Designation'] || row['designation']
                    });
                    successCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            alert(`Import complete: ${successCount} REPs added, ${errorCount} errors`);
        } catch (error) {
            alert('Error importing REPs');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', mobile: '', email: '', designation: '' });
    };

    const handleEdit = (rep: RepMaster) => {
        setEditingRep(rep);
        setFormData({
            name: rep.name,
            mobile: rep.mobile || '',
            email: rep.email || '',
            designation: rep.designation || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRep) {
            updateMutation.mutate({ id: editingRep.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const columns = useMemo<ColumnDef<RepMaster>[]>(() => [
        {
            header: 'Name',
            accessorKey: 'name',
            size: 180,
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-neutral-900">{row.original.name}</span>
            )
        },
        {
            header: 'Designation',
            accessorKey: 'designation',
            size: 140,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.designation || '-'}</span>
            )
        },
        {
            header: 'Mobile',
            accessorKey: 'mobile',
            size: 120,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-900">{row.original.mobile || '-'}</span>
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
            size: 200,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.email || '-'}</span>
            )
        },
        {
            header: 'Actions',
            size: 100,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1 text-brand-600 hover:bg-brand-100 transition-colors"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Delete this REP?')) {
                                deleteMutation.mutate(row.original.id);
                            }
                        }}
                        className="p-1 text-danger-600 hover:bg-danger-100 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-none shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <UsersIcon size={22} className="text-brand-600" />
                        </div>
                        REP Master
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage sales representatives and field staff</p>
                </div>
                <div className="flex gap-3">
                    <ExcelImportButton onImport={handleExcelImport} entityType="rep-master" />
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingRep(null);
                            setIsModalOpen(true);
                        }}
                        className="btn-brand flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add REP
                    </button>
                </div>
            </header>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, mobile, or designation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid data={reps || []} columns={columns} isLoading={isLoading} />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-none shadow-xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">
                            {editingRep ? 'Edit REP' : 'Add New REP'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Mobile</label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingRep(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-none hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-brand">
                                    {editingRep ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
