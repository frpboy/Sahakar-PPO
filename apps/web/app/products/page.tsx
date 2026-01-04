'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface Product {
    id: string;
    legacyId?: string;
    productCode?: string;
    itemName: string;
    packing?: string;
    category?: string;
    subcategory?: string;
    mrp?: number;
    active: boolean;
    createdAt: string;
}

export default function ProductsPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        legacyId: '',
        productCode: '',
        itemName: '',
        packing: '',
        category: '',
        subcategory: '',
        mrp: ''
    });

    const { data: products, isLoading } = useQuery({
        queryKey: ['products', search],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/products?search=${search}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json();
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${apiUrl}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to create product');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsModalOpen(false);
            resetForm();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`${apiUrl}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update product');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsModalOpen(false);
            setEditingProduct(null);
            resetForm();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${apiUrl}/products/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete product');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    const resetForm = () => {
        setFormData({
            legacyId: '',
            productCode: '',
            itemName: '',
            packing: '',
            category: '',
            subcategory: '',
            mrp: ''
        });
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            legacyId: product.legacyId || '',
            productCode: product.productCode || '',
            itemName: product.itemName,
            packing: product.packing || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            mrp: product.mrp?.toString() || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            mrp: formData.mrp ? parseFloat(formData.mrp) : undefined
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const columns = useMemo<ColumnDef<Product>[]>(() => [
        {
            header: 'Product Code',
            accessorKey: 'productCode',
            size: 100,
            cell: ({ row }) => (
                <span className="text-xs font-bold text-brand-600">{row.original.productCode || '-'}</span>
            )
        },
        {
            header: 'Item Name',
            accessorKey: 'itemName',
            size: 250,
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-neutral-900">{row.original.itemName}</span>
            )
        },
        {
            header: 'Packing',
            accessorKey: 'packing',
            size: 100,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.packing || '-'}</span>
            )
        },
        {
            header: 'Category',
            accessorKey: 'category',
            size: 120,
            cell: ({ row }) => (
                <span className="text-xs text-neutral-600">{row.original.category || '-'}</span>
            )
        },
        {
            header: 'MRP',
            accessorKey: 'mrp',
            size: 80,
            cell: ({ row }) => (
                <span className="text-xs font-bold text-neutral-900">₹{row.original.mrp?.toFixed(2) || '0.00'}</span>
            )
        },
        {
            header: 'Actions',
            size: 100,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1 text-brand-600 hover:bg-brand-100 rounded transition-colors"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Delete this product?')) {
                                deleteMutation.mutate(row.original.id);
                            }
                        }}
                        className="p-1 text-error-600 hover:bg-error-100 rounded transition-colors"
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
                            <Package size={22} className="text-brand-600" />
                        </div>
                        Products Master
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage product catalog and inventory items</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingProduct(null);
                        setIsModalOpen(true);
                    }}
                    className="btn-brand flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </header>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, code, or legacy ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
            </div>

            <div className="app-card overflow-hidden flex-1">
                <DataGrid data={products || []} columns={columns} isLoading={isLoading} />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-none shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Legacy ID</label>
                                    <input
                                        type="text"
                                        value={formData.legacyId}
                                        onChange={(e) => setFormData({ ...formData, legacyId: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Product Code</label>
                                    <input
                                        type="text"
                                        value={formData.productCode}
                                        onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Packing</label>
                                    <input
                                        type="text"
                                        value={formData.packing}
                                        onChange={(e) => setFormData({ ...formData, packing: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">MRP (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.mrp}
                                        onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Subcategory</label>
                                    <input
                                        type="text"
                                        value={formData.subcategory}
                                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditingProduct(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-neutral-700 border border-neutral-300 rounded-none hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-brand">
                                    {editingProduct ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
