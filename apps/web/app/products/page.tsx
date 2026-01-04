'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { ExcelImportButton } from '../../components/ExcelImportButton';
import { Package, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

interface Product {
    id: string;
    legacyId?: string;
    productCode?: string;
    itemName: string;
    aliasName?: string;
    packing?: string;
    category?: string;
    subcategory?: string;
    genericName?: string;
    patent?: string;
    hsnCode?: string;
    productType?: string;
    mrp?: number;
    ptr?: number;
    pts?: number;
    landedCost?: number;
    gstPercent?: number;
    discountPercent?: number;
    stock?: number;
    primarySupplierId?: string;
    secondarySupplierId?: string;
    repId?: string;
    active: boolean;
    createdAt: string;
}

interface Supplier {
    id: string;
    supplierName: string;
}

interface Rep {
    id: string;
    name: string;
}

export default function ProductsPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'tax' | 'suppliers'>('general');

    const initialFormState = {
        legacyId: '',
        productCode: '',
        itemName: '',
        aliasName: '',
        packing: '',
        category: '',
        subcategory: '',
        genericName: '',
        patent: '',
        hsnCode: '',
        productType: '',
        mrp: '',
        ptr: '',
        pts: '',
        landedCost: '',
        gstPercent: '',
        discountPercent: '',
        stock: '',
        primarySupplierId: '',
        secondarySupplierId: '',
        repId: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    // Fetch Products
    const { data: products, isLoading } = useQuery({
        queryKey: ['products', search],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/products?search=${search}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json();
        }
    });

    // Fetch Suppliers for Dropdown & Import
    const { data: suppliers } = useQuery<Supplier[]>({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/suppliers`);
            if (!res.ok) throw new Error('Failed to fetch suppliers');
            return res.json();
        }
    });

    // Fetch REPs for Dropdown & Import
    const { data: reps } = useQuery<Rep[]>({
        queryKey: ['reps'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/rep-master`);
            if (!res.ok) throw new Error('Failed to fetch reps');
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

    const handleExcelImport = async (data: any[]) => {
        try {
            let successCount = 0;
            let updateCount = 0;
            let errorCount = 0;

            // Create Lookups
            const supplierMap = new Map<string, string>();
            suppliers?.forEach(s => supplierMap.set(s.supplierName.toUpperCase(), s.id));

            const repMap = new Map<string, string>();
            reps?.forEach(r => r.name && repMap.set(r.name.toUpperCase(), r.id));

            // Product Lookup for Upsert
            // Keys: ProductCode (Primary), ItemName (Secondary)
            const existingMap = new Map<string, Product>();
            products?.forEach((p: Product) => {
                if (p.productCode) existingMap.set(p.productCode.toUpperCase(), p);
                existingMap.set(p.itemName.toUpperCase(), p);
                if (p.legacyId) existingMap.set(p.legacyId.toString().toUpperCase(), p);
            });

            for (const row of data) {
                try {
                    // Resolve FKs
                    const pSupName = (row['Primary supplier'] || row['primarySupplier'] || '').toString().toUpperCase();
                    const sSupName = (row['Secondary supplier'] || row['secondarySupplier'] || '').toString().toUpperCase();
                    const repName = (row['Rep'] || row['rep'] || '').toString().toUpperCase();

                    const pSupId = supplierMap.get(pSupName);
                    const sSupId = supplierMap.get(sSupName);
                    const rId = repMap.get(repName);

                    const productCode = (row['Product Code'] || row['productCode'] || '').toString().trim();
                    const itemName = (row['Name'] || row['Item Name'] || row['itemName'] || '').toString().trim();
                    const legacyId = (row['id'] || row['Legacy ID'] || row['legacyId'] || '').toString().trim();

                    if (!itemName) continue;

                    // Match existing
                    const matchKey = productCode ? productCode.toUpperCase() : (legacyId ? legacyId.toUpperCase() : itemName.toUpperCase());
                    const existing = existingMap.get(matchKey);

                    const payload = {
                        legacyId,
                        productCode,
                        itemName,
                        aliasName: (row['Alias Name'] || row['aliasName'] || '').toString(),
                        packing: (row['Packing'] || row['pack ing'] || row['packing'] || '').toString(),
                        category: (row['Category'] || row['category'] || '').toString(),
                        subcategory: (row['Sub Category'] || row['Subcategory'] || row['subcategory'] || '').toString(),
                        genericName: (row['Generic Name'] || row['genericName'] || '').toString(),
                        patent: (row['Patent'] || row['patent'] || '').toString(),
                        hsnCode: (row['Hsn Code'] || row['hsnCode'] || '').toString(),
                        productType: (row['Type'] || row['productType'] || '').toString(),
                        mrp: row['MRP'] || row['mrp'],
                        ptr: row['PTR'] || row['ptr'],
                        pts: row['PTS'] || row['pts'],
                        landedCost: row['L co st'] || row['landedCost'],
                        gstPercent: row['GSI %'] || row['GST %'] || row['gstPercent'],
                        discountPercent: row['Dis c%'] || row['discountPercent'],
                        stock: parseInt(row['Sto ck'] || row['stock'] || '0'),
                        primarySupplierId: pSupId,
                        secondarySupplierId: sSupId,
                        repId: rId
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
                    console.error('Import Row Error:', err);
                    errorCount++;
                }
            }

            alert(`Import complete: ${successCount} added, ${updateCount} updated, ${errorCount} errors`);
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) {
            console.error('Import Error:', error);
            alert('Error importing products');
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setActiveTab('general');
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            legacyId: product.legacyId || '',
            productCode: product.productCode || '',
            itemName: product.itemName,
            aliasName: product.aliasName || '',
            packing: product.packing || '',
            category: product.category || '',
            subcategory: product.subcategory || '',
            genericName: product.genericName || '',
            patent: product.patent || '',
            hsnCode: product.hsnCode || '',
            productType: product.productType || '',
            mrp: product.mrp?.toString() || '',
            ptr: product.ptr?.toString() || '',
            pts: product.pts?.toString() || '',
            landedCost: product.landedCost?.toString() || '',
            gstPercent: product.gstPercent?.toString() || '',
            discountPercent: product.discountPercent?.toString() || '',
            stock: product.stock?.toString() || '',
            primarySupplierId: product.primarySupplierId || '',
            secondarySupplierId: product.secondarySupplierId || '',
            repId: product.repId || ''
        });
        setIsModalOpen(true);
    };

    const handleBulkDelete = async (selectedIds: string[]) => {
        try {
            await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
            alert(`Successfully deleted ${selectedIds.length} product(s)`);
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete some products');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            legacyId: formData.legacyId?.toUpperCase() || undefined,
            productCode: formData.productCode?.toUpperCase() || undefined,
            itemName: formData.itemName.toUpperCase(),
            aliasName: formData.aliasName?.toUpperCase() || undefined,
            packing: formData.packing?.toUpperCase() || undefined,
            category: formData.category?.toUpperCase() || undefined,
            subcategory: formData.subcategory?.toUpperCase() || undefined,
            genericName: formData.genericName?.toUpperCase() || undefined,
            patent: formData.patent?.toUpperCase() || undefined,
            hsnCode: formData.hsnCode || undefined,
            productType: formData.productType?.toUpperCase() || undefined,
            mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
            ptr: formData.ptr ? parseFloat(formData.ptr) : undefined,
            pts: formData.pts ? parseFloat(formData.pts) : undefined,
            landedCost: formData.landedCost ? parseFloat(formData.landedCost) : undefined,
            gstPercent: formData.gstPercent ? parseFloat(formData.gstPercent) : undefined,
            discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : undefined,
            stock: formData.stock ? parseInt(formData.stock) : 0,
            primarySupplierId: formData.primarySupplierId || undefined,
            secondarySupplierId: formData.secondarySupplierId || undefined,
            repId: formData.repId || undefined
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setFormData({ ...formData, [field]: value });
        }
    };

    const formatCurrency = (val: string | number | undefined) => {
        if (val === undefined || val === null || val === '') return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return isNaN(num) ? '-' : num.toFixed(2);
    };

    const columns = useMemo<ColumnDef<Product>[]>(() => [
        {
            header: 'Code',
            accessorKey: 'productCode',
            size: 100,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-brand-600">{row.original.productCode || '-'}</span>
                    <span className="text-[10px] text-neutral-400">#{row.original.legacyId || ''}</span>
                </div>
            )
        },
        {
            header: 'Product',
            accessorKey: 'itemName',
            size: 360,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-neutral-900 truncate" title={row.original.itemName}>
                        {row.original.itemName}
                    </span>
                    {row.original.aliasName && (
                        <span className="text-[10px] text-neutral-500 truncate" title={row.original.aliasName}>
                            {row.original.aliasName}
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Packing',
            accessorKey: 'packing',
            size: 100,
            cell: ({ row }) => <span className="text-xs text-neutral-600">{row.original.packing || '-'}</span>
        },
        {
            header: 'Pricing (₹)',
            accessorKey: 'mrp',
            size: 120,
            meta: { align: 'right' },
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-900">MRP: {formatCurrency(row.original.mrp)}</span>
                    <span className="text-[10px] text-neutral-500">PTR: {formatCurrency(row.original.ptr)}</span>
                </div>
            )
        },
        {
            header: 'Stock',
            accessorKey: 'stock',
            size: 100,
            meta: { align: 'right' },
            cell: ({ row }) => (
                <span className={`text-xs font-bold ${row.original.stock && row.original.stock > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {row.original.stock || 0}
                </span>
            )
        },
        {
            header: 'Actions',
            size: 100,
            meta: { align: 'center' },
            cell: ({ row }) => (
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1 text-brand-600 hover:bg-brand-100 transition-colors"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Delete this product?')) {
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
    ], [deleteMutation]);

    const InputField = ({ label, field, placeholder, type = 'text' }: any) => (
        <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">{label}</label>
            <input
                type={type}
                value={(formData as any)[field]}
                onChange={(e) => type === 'number' ? handleNumericInput(e, field) : setFormData({ ...formData, [field]: e.target.value })}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-neutral-300 rounded-sm text-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            />
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <Package size={22} className="text-brand-600" />
                        </div>
                        Products Master
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage catalog, pricing, and supplier mappings</p>
                </div>
                <div className="flex gap-3">
                    <ExcelImportButton onImport={handleExcelImport} entityType="products" />
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
                </div>
            </header>

            {/* Search */}
            <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, code, legacy ID, alias..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-sm focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="app-card overflow-hidden flex-1 flex flex-col">
                <DataGrid
                    data={products || []}
                    columns={columns}
                    isLoading={isLoading}
                    enableRowSelection={true}
                    onBulkDelete={handleBulkDelete}
                    getRowId={(row) => row.id}
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-neutral-900">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">✕</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-neutral-200 bg-neutral-50">
                            {[
                                { id: 'general', label: 'General Info' },
                                { id: 'pricing', label: 'Pricing & Cost' },
                                { id: 'tax', label: 'Tax & Regulatory' },
                                { id: 'suppliers', label: 'Suppliers & REP' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-brand-600 text-brand-600 bg-white'
                                        : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-white'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Form Body */}
                        <div className="p-8 overflow-y-auto flex-1">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {activeTab === 'general' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField label="Item Name *" field="itemName" placeholder="e.g. PARACETAMOL 500MG" />
                                        <InputField label="Alias Name" field="aliasName" placeholder="e.g. CROCIN" />
                                        <InputField label="Product Code" field="productCode" placeholder="Internal Code" />
                                        <InputField label="Legacy ID" field="legacyId" placeholder="ID from old system" />
                                        <InputField label="Packing" field="packing" placeholder="e.g. 10x10" />
                                        <InputField label="Category" field="category" placeholder="e.g. PHARMA" />
                                        <InputField label="Subcategory" field="subcategory" placeholder="e.g. TABLET" />
                                        <InputField label="Product Type" field="productType" placeholder="e.g. ETHICAL / GENERIC" />
                                    </div>
                                )}

                                {activeTab === 'pricing' && (
                                    <div className="grid grid-cols-3 gap-6">
                                        <InputField label="MRP" field="mrp" placeholder="0.00" type="number" />
                                        <InputField label="PTR" field="ptr" placeholder="0.00" type="number" />
                                        <InputField label="PTS" field="pts" placeholder="0.00" type="number" />
                                        <InputField label="Landed Cost" field="landedCost" placeholder="0.00" type="number" />
                                        <InputField label="Stock Qty" field="stock" placeholder="0" type="number" />
                                    </div>
                                )}

                                {activeTab === 'tax' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <InputField label="HSN Code" field="hsnCode" placeholder="Tax Code" />
                                        <InputField label="GST %" field="gstPercent" placeholder="12 or 18" type="number" />
                                        <InputField label="Discount %" field="discountPercent" placeholder="0.00" type="number" />
                                        <InputField label="Patent Status" field="patent" placeholder="e.g. Patented / Off-patent" />
                                        <div className="col-span-2">
                                            <InputField label="Generic Name" field="genericName" placeholder="Chemical composition" />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'suppliers' && (
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-700 mb-1">Primary Supplier</label>
                                            <select
                                                value={formData.primarySupplierId}
                                                onChange={(e) => setFormData({ ...formData, primarySupplierId: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-sm text-sm"
                                            >
                                                <option value="">Select Supplier</option>
                                                {suppliers?.map(s => (
                                                    <option key={s.id} value={s.id}>{s.supplierName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-700 mb-1">Secondary Supplier</label>
                                            <select
                                                value={formData.secondarySupplierId}
                                                onChange={(e) => setFormData({ ...formData, secondarySupplierId: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-sm text-sm"
                                            >
                                                <option value="">Select Supplier</option>
                                                {suppliers?.map(s => (
                                                    <option key={s.id} value={s.id}>{s.supplierName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-neutral-700 mb-1">REP</label>
                                            <select
                                                value={formData.repId}
                                                onChange={(e) => setFormData({ ...formData, repId: e.target.value })}
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-sm text-sm"
                                            >
                                                <option value="">Select REP</option>
                                                {reps?.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3 rounded-b-lg">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2.5 text-neutral-700 font-medium hover:bg-neutral-200 rounded-sm transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn-brand px-6 text-sm"
                            >
                                {editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
