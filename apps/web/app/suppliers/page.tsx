'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { ExcelImportButton } from '../../components/ExcelImportButton';
import { Store, Plus, Edit, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface Supplier {
    id: string;
    supplierCode?: string;
    supplierName: string;
    contactPerson?: string;
    mobile?: string;
    email?: string;
    gstNumber?: string;
    address?: string;
    creditDays?: number;
    active: boolean;
}

export default function SuppliersPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        supplierCode: '',
        supplierName: '',
        contactPerson: '',
        mobile: '',
        email: '',
        gstNumber: '',
        address: '',
        creditDays: ''
    });

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers', search],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/suppliers?search=${search}`);
            if (!res.ok) throw new Error('Failed to fetch suppliers');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${apiUrl}/suppliers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create supplier');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`${apiUrl}/suppliers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update supplier');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setIsModalOpen(false);
            setEditingSupplier(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${apiUrl}/suppliers/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete supplier');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        }
    });

    const handleExcelImport = async (data: any[]) => {
        try {
            let successCount = 0;
            let updateCount = 0;
            let errorCount = 0;

            // Create Lookup for Existing Suppliers
            // Normalizing keys to UpperCase for case-insensitive matching
            const existingMap = new Map<string, Supplier>();
            suppliers?.forEach((s: Supplier) => {
                if (s.supplierCode) existingMap.set(s.supplierCode.toUpperCase(), s);
                existingMap.set(s.supplierName.toUpperCase(), s);
            });

            for (const row of data) {
                try {
                    const code = (row['Supplier Code'] || row['supplierCode'] || '').toString().trim();
                    const name = (row['Alias'] || row['Supplier Name'] || row['supplierName'] || row['name'] || '').toString().trim();

                    if (!name) continue; // Skip empty rows

                    const matchKey = code ? code.toUpperCase() : name.toUpperCase();
                    const existing = existingMap.get(matchKey);

                    const payload = {
                        supplierCode: code,
                        supplierName: name,
                        contactPerson: (row['Contact Person'] || row['contactPerson'] || '').toString(),
                        mobile: (row['Mobile'] || row['mobile'] || row['phone'] || '').toString(),
                        email: (row['Email'] || row['email'] || '').toString(),
                        gstNumber: (row['GSTNo'] || row['GST Number'] || row['gstNumber'] || row['gst'] || '').toString(),
                        address: ((row['Address'] || '') + (row['City'] ? `, ${row['City']}` : '')).trim(),
                        creditDays: row['Credit Days'] || row['creditDays']
                    };

                    if (existing) {
                        // Update
                        await updateMutation.mutateAsync({ id: existing.id, data: payload });
                        updateCount++;
                    } else {
                        // Create
                        await createMutation.mutateAsync(payload);
                        successCount++;
                    }
                } catch (err) {
                    errorCount++;
                }
            }

            alert(`Import complete: ${successCount} added, ${updateCount} updated, ${errorCount} errors`);
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        } catch (error) {
            alert('Error importing suppliers');
        }
    };

    const resetForm = () => {
        setFormData({
            supplierCode: '',
            supplierName: '',
            contactPerson: '',
            mobile: '',
            email: '',
            gstNumber: '',
            address: '',
            creditDays: ''
        });
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            supplierCode: supplier.supplierCode || '',
            supplierName: supplier.supplierName,
            contactPerson: supplier.contactPerson || '',
            mobile: supplier.mobile || '',
            email: supplier.email || '',
            gstNumber: supplier.gstNumber || '',
            address: supplier.address || '',
            creditDays: supplier.creditDays?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            supplierCode: formData.supplierCode?.toUpperCase() || undefined,
            supplierName: formData.supplierName.toUpperCase(),
            contactPerson: formData.contactPerson?.toUpperCase() || undefined,
            mobile: formData.mobile || undefined,
            email: formData.email || undefined,
            gstNumber: formData.gstNumber?.toUpperCase() || undefined,
            address: formData.address?.toUpperCase() || undefined,
            creditDays: formData.creditDays ? parseInt(formData.creditDays) : undefined
        };

        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow only integers
        if (value === '' || /^\d+$/.test(value)) {
            setFormData({ ...formData, creditDays: value });
        }
    };

    const columns = useMemo<ColumnDef<Supplier>[]>(() => [
        {
            header: 'Code',
            accessorKey: 'supplierCode',
            size: 100, // Increased
            cell: ({ row }) => (
                <span className="text-xs font-bold text-brand-600">{row.original.supplierCode || '-'}</span>
            )
        },
        {
            header: 'Supplier Name',
            accessorKey: 'supplierName',
            size: 250, // Increased
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-neutral-900 truncate" title={row.original.supplierName}>
                    {row.original.supplierName}
                </span>
            )
        },
        {
            header: 'Contact',
            accessorKey: 'contactPerson',
            size: 150, // Increased
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs text-neutral-900 truncate">{row.original.contactPerson || '-'}</span>
                    <span className="text-[10px] text-neutral-500">{row.original.mobile}</span>
                </div>
            )
        },
        {
            header: 'GST',
            accessorKey: 'gstNumber',
            size: 140, // Increased
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.gstNumber || '-'}</span>
            )
        },
        {
            header: 'Credit Days',
            accessorKey: 'creditDays',
            size: 80,
            cell: ({ row }) => (
                <span className="text-xs font-bold text-neutral-900">{row.original.creditDays || 0}</span>
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
                            if (confirm('Delete this supplier?')) {
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
                            <Store size={22} className="text-brand-600" />
                        </div>
                        Suppliers Master
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage supplier database and contacts</p>
                </div>
                <div className="flex gap-3">
                    <ExcelImportButton onImport={handleExcelImport} entityType="suppliers" />
                    <button
                        onClick={() => {
                            resetForm();
                            setEditingSupplier(null);
                            setIsModalOpen(true);
                        }}
                        className="btn-brand flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Supplier
                    </button>
                </div>
            </header>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, code, or contact..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid data={suppliers || []} columns={columns} isLoading={isLoading} />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-none shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">
                            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Supplier Code</label>
                                    <input
                                        type="text"
                                        value={formData.supplierCode}
                                        onChange={(e) => setFormData({ ...formData, supplierCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Supplier Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.supplierName}
                                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">GST Number</label>
                                    <input
                                        type="text"
                                        value={formData.gstNumber}
                                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Credit Days</label>
                                <input
                                    type="text"
                                    value={formData.creditDays}
                                    onChange={handleNumericInput}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingSupplier(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-none hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-brand">
                                    {editingSupplier ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
