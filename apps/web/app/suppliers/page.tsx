'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { DataGrid } from '../../components/DataGrid';
import { ExcelImportButton } from '../../components/ExcelImportButton';
import { Store, Plus, Edit, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { FilterPanel, FilterState } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../components/Toast';
import { useUserRole } from '../../context/UserRoleContext';

interface Supplier {
    id: string;
    alias: string;
    supplierName: string;
    area?: string;
    mobile?: string;
    address?: string;
    city?: string;
    closingBalance?: string;
    balanceType?: string;
    regNo?: string;
    dlNo?: string;
    gstNo?: string;
    active: boolean;
}

export default function SuppliersPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        alias: '',
        supplierName: '',
        mobile: '',
        address: '',
        city: '',
        closingBalance: '',
        balanceType: 'Cr',
        regNo: '',
        dlNo: '',
        gstNo: ''
    });

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
        savedFilters, activeFilterCount
    } = useTableState({
        storageKey: 'suppliers',
        defaultSort: { id: 'name_asc', label: 'Name (A-Z)', field: 'supplierName', direction: 'asc' }
    });

    const sortOptions: SortOption[] = [
        { id: 'name_asc', label: 'Supplier Name (A-Z)', field: 'supplierName', direction: 'asc' },
        { id: 'name_desc', label: 'Supplier Name (Z-A)', field: 'supplierName', direction: 'desc' },
        { id: 'city_asc', label: 'City (A-Z)', field: 'city', direction: 'asc' },
        { id: 'city_desc', label: 'City (Z-A)', field: 'city', direction: 'desc' },
        { id: 'bal_desc', label: 'Balance (High → Low)', field: 'closingBalance', direction: 'desc' },
        { id: 'bal_asc', label: 'Balance (Low → High)', field: 'closingBalance', direction: 'asc' },
    ];

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const res = await fetch(`${apiUrl}/suppliers`);
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
                if (s.alias) existingMap.set(s.alias.toUpperCase(), s);
                existingMap.set(s.supplierName.toUpperCase(), s);
            });

            for (const row of data) {
                try {
                    const alias = (row['Alias'] || '').toString().trim();
                    const name = (row['Supplier Name'] || row['supplierName'] || row['name'] || '').toString().trim();

                    if (!name) continue; // Skip empty rows

                    const matchKey = alias ? alias.toUpperCase() : name.toUpperCase();
                    const existing = existingMap.get(matchKey);

                    const payload = {
                        alias: alias,
                        supplierName: name,
                        mobile: (row['Mobile'] || row['mobile'] || row['phone'] || '').toString(),
                        address: (row['Address'] || '').toString(),
                        city: (row['City'] || '').toString(),
                        closingBalance: (row['Closing Balance'] || row['closingBalance'] || '0').toString(),
                        balanceType: (row['Balance Type'] || row['balanceType'] || 'Cr').toString(),
                        regNo: (row['Reg No'] || row['regNo'] || '').toString(),
                        dlNo: (row['DL No'] || row['dlNo'] || '').toString(),
                        gstNo: (row['GST No'] || row['gstNo'] || row['GST Number'] || row['gstNumber'] || row['gst'] || '').toString()
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
            alias: '',
            supplierName: '',
            mobile: '',
            address: '',
            city: '',
            closingBalance: '',
            balanceType: 'Cr',
            regNo: '',
            dlNo: '',
            gstNo: ''
        });
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            alias: supplier.alias || '',
            supplierName: supplier.supplierName,
            mobile: supplier.mobile || '',
            address: supplier.address || '',
            city: supplier.city || '',
            closingBalance: supplier.closingBalance || '',
            balanceType: supplier.balanceType || 'Cr',
            regNo: supplier.regNo || '',
            dlNo: supplier.dlNo || '',
            gstNo: supplier.gstNo || ''
        });
        setIsModalOpen(true);
    };

    const handleBulkDelete = async (selectedIds: string[]) => {
        try {
            await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
            alert(`Successfully deleted ${selectedIds.length} supplier(s)`);
        } catch (error) {
            console.error('Bulk delete error:', error);
            alert('Failed to delete some suppliers');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            alias: formData.alias.toUpperCase(),
            supplierName: formData.supplierName.toUpperCase(),
            mobile: formData.mobile || undefined,
            address: formData.address?.toUpperCase() || undefined,
            city: formData.city?.toUpperCase() || undefined,
            closingBalance: formData.closingBalance || '0',
            balanceType: formData.balanceType,
            regNo: formData.regNo || undefined,
            dlNo: formData.dlNo || undefined,
            gstNo: formData.gstNo || undefined
        };

        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data });
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

    const filteredItems = useMemo(() => {
        if (!suppliers) return [];
        let result = [...suppliers];

        // Apply Search/Filters
        if (filters.productName) { // Using productName filter as a generic search for supplier in this context
            result = result.filter(item =>
                item.supplierName?.toLowerCase().includes(filters.productName!.toLowerCase()) ||
                item.alias?.toLowerCase().includes(filters.productName!.toLowerCase())
            );
        }
        if (filters.supplier) {
            result = result.filter(item =>
                item.supplierName?.toLowerCase().includes(filters.supplier!.toLowerCase())
            );
        }
        if (filters.area) { // Custom filter in FilterPanel
            result = result.filter(item =>
                item.city?.toLowerCase().includes(filters.area!.toLowerCase()) ||
                item.address?.toLowerCase().includes(filters.area!.toLowerCase())
            );
        }

        // Apply Sorting
        if (sort) {
            result.sort((a, b) => {
                let valA: any = '';
                let valB: any = '';

                if (sort.field === 'supplierName') {
                    valA = a.supplierName || '';
                    valB = b.supplierName || '';
                } else if (sort.field === 'city') {
                    valA = a.city || '';
                    valB = b.city || '';
                } else if (sort.field === 'closingBalance') {
                    valA = parseFloat(a.closingBalance || '0');
                    valB = parseFloat(b.closingBalance || '0');
                }

                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [suppliers, filters, sort]);

    const columns = useMemo<ColumnDef<Supplier>[]>(() => [
        {
            header: 'Code',
            size: 80,
            cell: ({ row }) => {
                const code = row.original.alias || row.original.id?.toString().substring(0, 6).toUpperCase();
                return <span className="font-mono text-[10px] text-neutral-400 font-bold">#{code}</span>
            }
        },
        {
            header: 'Name',
            accessorKey: 'supplierName',
            size: 220,
            cell: ({ row }) => <span className="font-bold text-neutral-900 uppercase truncate text-[11px]" title={row.original.supplierName}>{row.original.supplierName}</span>
        },
        {
            header: 'Area',
            accessorKey: 'area',
            size: 150,
            cell: ({ row }) => <span className="text-[11px] text-neutral-500 uppercase font-medium">{row.original.area || '-'}</span>
        },
        {
            header: 'Alias',
            accessorKey: 'alias',
            size: 100,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-bold italic uppercase">{row.original.alias || '-'}</span>
        },
        {
            header: 'Mobile',
            size: 120,
            cell: ({ row }) => <span className="tabular-nums text-[11px] text-neutral-600">{row.original.mobile || '-'}</span>
        },
        {
            header: 'Address',
            size: 250,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 truncate max-w-[240px]" title={row.original.address}>{row.original.address || '-'}</span>
        },
        {
            header: 'City',
            size: 120,
            cell: ({ row }) => <span className="text-[11px] font-bold text-neutral-700 uppercase">{row.original.city || '-'}</span>
        },
        {
            header: 'Closing Balance',
            size: 140,
            meta: { align: 'right' },
            cell: ({ row }) => (
                <span className={`text-[11px] font-black ${parseFloat(row.original.closingBalance || '0') > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                    ₹{parseFloat(row.original.closingBalance || '0').toFixed(2)}
                </span>
            )
        },
        {
            header: 'Dr / Cr',
            size: 80,
            meta: { align: 'center' },
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">{row.original.balanceType || 'Cr'}</span>
        },
        {
            header: 'Reg No',
            size: 120,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400">{row.original.regNo || '-'}</span>
        },
        {
            header: 'Dl No',
            size: 120,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400">{row.original.dlNo || '-'}</span>
        },
        {
            header: 'GST No',
            size: 150,
            cell: ({ row }) => <span className="text-[10px] font-bold text-neutral-800 uppercase tracking-tight">{row.original.gstNo || '-'}</span>
        },
        {
            header: 'ACTIONS',
            size: 80,
            cell: ({ row }) => (
                <div className="flex gap-1 justify-center">
                    <button
                        onClick={() => handleEdit(row.original)}
                        className="p-1.5 text-neutral-300 hover:text-brand-600 hover:bg-brand-50 rounded transition-colors"
                    >
                        <Edit size={14} />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Delete this supplier?')) {
                                deleteMutation.mutate(row.original.id);
                            }
                        }}
                        className="p-1.5 text-neutral-300 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ], [deleteMutation]);

    return (
        <div className="flex flex-col h-full bg-neutral-50/50">
            <header className="px-6 py-4 bg-white border-b border-neutral-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
                            <Store className="text-brand-600" />
                            SUPPLIER MASTER HUB
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                            Enterprise Resource & Vendor Management Console
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <ExcelImportButton onImport={handleExcelImport} entityType="suppliers" />
                        <button
                            onClick={() => {
                                resetForm();
                                setEditingSupplier(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Supplier
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-hidden">
                <TableToolbar
                    onOpenFilter={() => setIsFilterOpen(true)}
                    filters={filters as any}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    sortOptions={sortOptions}
                    activeSort={sort}
                    onSort={applySort}
                />

                <DataGrid
                    data={filteredItems}
                    columns={columns}
                    isLoading={isLoading}
                    enableRowSelection={true}
                    onBulkDelete={handleBulkDelete}
                    getRowId={(row) => row.id}
                />
            </main>

            <FilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={filters as any}
                onApply={applyFilters}
                onClear={clearAllFilters}
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-none shadow-xl max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold text-neutral-900 mb-4">
                            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Alias/Short Name</label>
                                    <input
                                        type="text"
                                        value={formData.alias}
                                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Closing Balance</label>
                                    <input
                                        type="text"
                                        value={formData.closingBalance}
                                        onChange={(e) => handleNumericInput(e, 'closingBalance')}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Balance Type</label>
                                    <select
                                        value={formData.balanceType}
                                        onChange={(e) => setFormData({ ...formData, balanceType: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="Dr">Debit (Dr)</option>
                                        <option value="Cr">Credit (Cr)</option>
                                    </select>
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
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">GST No</label>
                                    <input
                                        type="text"
                                        value={formData.gstNo}
                                        onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500 uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">DL No</label>
                                    <input
                                        type="text"
                                        value={formData.dlNo}
                                        onChange={(e) => setFormData({ ...formData, dlNo: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500 uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Reg No</label>
                                    <input
                                        type="text"
                                        value={formData.regNo}
                                        onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:ring-2 focus:ring-brand-500 uppercase"
                                    />
                                </div>
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
