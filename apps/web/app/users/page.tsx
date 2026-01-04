'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { Users, Edit, Shield } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { RoleBadge } from '../../components/RoleBadge';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
}

export default function UsersPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: '', role: '', active: true });

    const { data: users, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/users?search=${search}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`${apiUrl}/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update user');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            setEditingUser(null);
        }
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, role: user.role, active: user.active });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            updateMutation.mutate({ id: editingUser.id, data: formData });
        }
    };

    const columns = useMemo<ColumnDef<User>[]>(() => [
        {
            header: 'Email',
            accessorKey: 'email',
            size: 220,
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-neutral-900">{row.original.email}</span>
            )
        },
        {
            header: 'Name',
            accessorKey: 'name',
            size: 180,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-900">{row.original.name}</span>
            )
        },
        {
            header: 'Role',
            accessorKey: 'role',
            size: 160,
            cell: ({ row }) => <RoleBadge role={row.original.role} />
        },
        {
            header: 'Status',
            accessorKey: 'active',
            size: 100,
            cell: ({ row }) => (
                <span className={`text-xs font-bold ${row.original.active ? 'text-success-600' : 'text-neutral-400'}`}>
                    {row.original.active ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            header: 'Actions',
            size: 80,
            cell: ({ row }) => (
                <button
                    onClick={() => handleEdit(row.original)}
                    className="p-1 text-brand-600 hover:bg-brand-100"
                >
                    <Edit size={16} />
                </button>
            )
        }
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <Users size={22} className="text-brand-600" />
                        </div>
                        User Management
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage user accounts and permissions</p>
                </div>
            </header>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid data={users || []} columns={columns} isLoading={isLoading} />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">
                            Edit User: {editingUser?.email}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="PROCUREMENT_HEAD">Procurement Head</option>
                                    <option value="PURCHASE_STAFF">Purchase Staff</option>
                                    <option value="BILLING_HEAD">Billing Head</option>
                                    <option value="BILLING_STAFF">Billing Staff</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-medium text-neutral-700">Active</label>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingUser(null);
                                    }}
                                    className="px-4 py-2 text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-brand">
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
