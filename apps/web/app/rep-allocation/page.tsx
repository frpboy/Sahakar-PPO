'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { UserCircle, Edit, Undo, Info, CheckCircle2, XCircle, ChevronDown, ChevronUp, Lock, RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid } from '../../components/DataGrid';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../components/Toast';
import { useUserRole } from '../../context/UserRoleContext';
import { FilterPanel } from '../../components/FilterPanel';
import { TableToolbar } from '../../components/TableToolbar';
import { SortOption } from '../../components/SortMenu';
import { useTableState } from '../../hooks/useTableState';
import { ConfirmModal } from '../../components/ConfirmModal';

// Types
type RepItem = {
    id: string;
    orderId?: string;
    productId: string;
    productName: string;
    customerName?: string;
    reqQty: number;
    mrp?: string;
    packing?: string;
    remarks?: string;
    subcategory?: string;
    rep?: string;
    mobile?: string;
    primarySup?: string;
    secondarySup?: string;
    decidedSup?: string;
    orderStatus?: string;
    itemNameChange?: string;
    notes?: string;
    acceptedDate?: string;
    acceptedTime?: string;
    pendingItemId: string;
};

interface RepGroup {
    productId: string;
    productName: string;
    targetQty: number;
    allocatedQty: number;
    stockQty: number;
    isLocked: boolean;
    items: RepItem[];
}

export default function RepAllocationPage() {
    const { currentUser, role, can } = useUserRole();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [returnId, setReturnId] = useState<string | null>(null);

    const {
        filters, sort, isFilterOpen, setIsFilterOpen,
        applyFilters, removeFilter, clearAllFilters, applySort,
    } = useTableState({
        storageKey: 'rep_allocation',
        defaultSort: { id: 'date_desc', label: 'Newest First', field: 'acceptedDate', direction: 'desc' }
    });

    const sortOptions: SortOption[] = [
        { id: 'name_asc', label: 'Product Name (A-Z)', field: 'productName', direction: 'asc' },
        { id: 'name_desc', label: 'Product Name (Z-A)', field: 'productName', direction: 'desc' },
        { id: 'date_desc', label: 'Date (Newest)', field: 'acceptedDate', direction: 'desc' },
        { id: 'date_asc', label: 'Date (Oldest)', field: 'acceptedDate', direction: 'asc' },
    ];

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';

    // Role calculations
    const canMoveToRep = can('move_to_rep') || role === 'PROCUREMENT_HEAD' || role === 'SUPER_ADMIN' || role === 'ADMIN';

    const { data: groups, isLoading, isFetching } = useQuery<RepGroup[]>({
        queryKey: ['rep-items', filters, sort],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.productName) params.append('productName', filters.productName);
            if (filters.orderId) params.append('orderId', filters.orderId);
            if (filters.rep?.length) filters.rep.forEach(r => params.append('rep', r));
            if (filters.stage?.length) filters.stage.forEach(s => params.append('status', s));
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);

            const res = await fetch(`${apiUrl}/rep-items?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: { id: string; payload: any }) => {
            const res = await fetch(`${apiUrl}/rep-items/${data.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.payload),
            });
            if (!res.ok) throw new Error('Update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            setEditingId(null);
            showToast('Allocation updated successfully', 'success');
        },
        onError: (err: any) => showToast(err.message, 'error')
    });

    const returnToPendingMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${apiUrl}/rep-items/${id}/return`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: currentUser?.email || 'unknown@sahakar.com' }),
            });
            if (!res.ok) throw new Error('Return failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rep-items'] });
            setReturnId(null);
            showToast('Item returned to Pending POs', 'success');
        },
        onError: (err: any) => showToast(err.message, 'error')
    });

    const handleEditClick = (item: RepItem, isLocked: boolean) => {
        if (isLocked) {
            showToast('This allocation is locked (slip generated)', 'info');
            return;
        }
        setEditingId(item.id);
        setEditFormData({
            orderStatus: item.orderStatus || 'PENDING',
            decidedSup: item.decidedSup,
            notes: item.notes
        });
    };

    const handleSave = (id: string) => {
        updateMutation.mutate({ id, payload: editFormData });
    };

    const handleInputChange = (field: string, value: any) => {
        setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const columns = (isLocked: boolean): ColumnDef<RepItem>[] => [
        {
            header: 'PROD ID',
            size: 80,
            cell: ({ row }) => <span className="font-mono text-[10px] text-neutral-400 font-bold">{row.original.productId?.substring(0, 8) || '-'}</span>
        },
        {
            header: 'MRP',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-bold text-neutral-500">₹{row.original.mrp || '0.00'}</span>
        },
        {
            header: 'PACKING',
            size: 80,
            cell: ({ row }) => <span className="text-[10px] font-black text-neutral-400 uppercase bg-neutral-100 px-1">{row.original.packing || '-'}</span>
        },
        {
            header: 'ITEM NAME',
            size: 220,
            cell: ({ row }) => <span className="font-bold text-neutral-900 uppercase truncate" title={row.original.productName}>{row.original.productName}</span>
        },
        {
            header: 'REMARKS',
            size: 150,
            cell: ({ row }) => <span className="text-[10px] text-neutral-500 truncate italic font-medium">{row.original.remarks || '-'}</span>
        },
        {
            header: 'SUBCATEGORY',
            size: 100,
            cell: ({ row }) => <span className="text-[9px] bg-neutral-50 px-2 py-0.5 border border-neutral-100 rounded-none font-black text-neutral-400 uppercase tracking-tighter">{row.original.subcategory || 'N/A'}</span>
        },
        {
            header: 'REQ QTY',
            size: 80,
            meta: { align: 'right' },
            cell: ({ row }) => <span className="tabular-nums font-black text-brand-600">{row.original.reqQty}</span>
        },
        {
            header: 'NOTES',
            size: 150,
            cell: ({ row }) => <span className="text-[10px] text-neutral-600 truncate font-medium">{row.original.notes || '-'}</span>
        },
        {
            header: 'ORDER STATUS',
            size: 120,
            cell: ({ row }) => <StatusBadge status={(row.original.orderStatus || 'PENDING').toUpperCase() as any} />
        },
        {
            header: 'ITEM NAME CHANGE',
            size: 130,
            cell: ({ row }) => (
                <span className={`text-[10px] font-bold italic ${row.original.itemNameChange ? 'text-warning-600' : 'text-neutral-300'}`}>
                    {row.original.itemNameChange || 'No Change'}
                </span>
            )
        },
        {
            header: 'ROLLBACK',
            size: 120,
            cell: ({ row }) => (
                <button
                    onClick={() => setReturnId(row.original.id)}
                    disabled={returnToPendingMutation.isPending || isLocked || !canMoveToRep}
                    className="text-[9px] font-black text-danger-600 hover:text-white hover:bg-danger-600 active:scale-95 px-3 py-1.5 border border-danger-200 uppercase tracking-widest transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
                >
                    {returnToPendingMutation.isPending ? 'Rolling...' : 'Return'}
                </button>
            )
        },
        {
            header: 'REP',
            size: 100,
            cell: ({ row }) => <span className="text-[11px] font-black text-brand-500 uppercase">{row.original.rep || '-'}</span>
        },
        {
            header: 'MOBILE',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-400 font-bold">{row.original.mobile || '-'}</span>
        },
        {
            header: 'DECIDED SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[10px] font-black text-brand-600 uppercase truncate bg-brand-50 px-2 py-0.5 border border-brand-100">{row.original.decidedSup || row.original.primarySup || '-'}</span>
        },
        {
            header: 'PRIMARY SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 uppercase truncate font-bold">{row.original.primarySup || '-'}</span>
        },
        {
            header: 'SECONDARY SUP',
            size: 150,
            cell: ({ row }) => <span className="text-[10px] text-neutral-400 uppercase truncate font-medium">{row.original.secondarySup || '-'}</span>
        },
        {
            header: 'DATE',
            size: 100,
            cell: ({ row }) => <span className="tabular-nums text-[10px] text-neutral-400 font-bold">{row.original.acceptedDate ? new Date(row.original.acceptedDate).toLocaleDateString() : '-'}</span>
        },
        {
            header: 'ACTIONS',
            size: 80,
            cell: ({ row }) => (
                <button
                    onClick={() => handleEditClick(row.original, isLocked)}
                    disabled={isLocked}
                    className="p-2 text-neutral-400 hover:text-brand-600 hover:bg-brand-50 transition-all disabled:opacity-20"
                >
                    <Edit size={16} />
                </button>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full bg-transparent font-sans pb-20">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-none shadow-[0_1px_3px_rgba(16_24_40/0.1)] flex items-center justify-center border border-neutral-200/80">
                            <UserCircle size={28} className="text-brand-600" />
                        </div>
                        REP Allocation Pipeline
                    </h1>
                    <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest mt-2">Sequential Distribution Control Registry</p>
                </div>
                {isFetching && <RefreshCw size={20} className="animate-spin text-brand-600" />}
            </header>

            <main className="space-y-10">
                <TableToolbar
                    onOpenFilter={() => setIsFilterOpen(true)}
                    filters={filters}
                    onRemoveFilter={removeFilter}
                    onClearAll={clearAllFilters}
                    sortOptions={sortOptions}
                    activeSort={sort}
                    onSort={applySort}
                />

                <FilterPanel
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onApply={applyFilters}
                    onClear={clearAllFilters}
                    stageOptions={[
                        { label: 'PENDING', value: 'PENDING' },
                        { label: 'ORDERED', value: 'ORDERED' },
                        { label: 'CANCELLED', value: 'CANCELLED' },
                        { label: 'SHORT', value: 'SHORT' }
                    ]}
                />

                <ConfirmModal
                    isOpen={!!returnId}
                    onCancel={() => setReturnId(null)}
                    onConfirm={() => returnId && returnToPendingMutation.mutate(returnId)}
                    title="Rollback Allocation?"
                    message="Item will be removed from REP Pipeline and returned to Pending Orders."
                    confirmLabel="Confirm Rollback"
                    variant="danger"
                />

                {isLoading ? (
                    <div className="flex justify-center p-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>
                ) : groups && groups.length > 0 ? (
                    groups.map((group) => (
                        <section key={group.productId} className="flex flex-col gap-4 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between px-4 py-2 bg-white border-l-4 border-l-brand-600 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-sm font-black text-neutral-800 uppercase tracking-tight">{group.productName}</h2>
                                    {group.isLocked && (
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-black uppercase tracking-widest">
                                            <Lock size={10} /> Locked
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-10">
                                    <SummaryStat label="Target" value={group.targetQty} color="neutral" />
                                    <SummaryStat label="Allocated" value={group.allocatedQty} color="brand" />
                                    <SummaryStat label="Stock" value={group.stockQty} color="success" />
                                </div>
                            </div>
                            <div className="app-card overflow-hidden bg-white shadow-xl shadow-neutral-200/40">
                                <DataGrid
                                    data={group.items}
                                    columns={columns(group.isLocked)}
                                />
                            </div>
                        </section>
                    ))
                ) : (
                    <div className="app-card bg-white p-24 text-center border-2 border-dashed border-neutral-200">
                        <div className="max-w-xs mx-auto">
                            <Info size={40} className="text-neutral-200 mx-auto mb-6" />
                            <h3 className="text-lg font-bold text-neutral-900 uppercase">Registry Exhausted</h3>
                            <p className="text-xs text-neutral-400 mt-2 font-medium">Refine your search parameters or check PPO Pipeline.</p>
                        </div>
                    </div>
                )}
            </main>

            {editingId && (
                <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md z-[100] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 curve-duration-300">
                        <div className="bg-brand-600 px-8 py-6 text-white">
                            <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                <Edit size={24} />
                                Update Allocation Registry
                            </h3>
                            <p className="text-brand-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Manual Override Context</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Order Status</label>
                                    <select
                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-brand-500/20 transition-all cursor-pointer"
                                        value={editFormData.orderStatus}
                                        onChange={(e) => handleInputChange('orderStatus', e.target.value)}
                                    >
                                        <option value="PENDING">PENDING</option>
                                        <option value="ORDERED">ORDERED</option>
                                        <option value="CANCELLED">CANCELLED</option>
                                        <option value="SHORT">SHORT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Decided Supplier</label>
                                    <input
                                        type="text"
                                        className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-mono"
                                        value={editFormData.decidedSup || ''}
                                        onChange={(e) => handleInputChange('decidedSup', e.target.value)}
                                        placeholder="VENDOR NAME..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Allocator Remarks</label>
                                <textarea
                                    className="w-full bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                    rows={4}
                                    value={editFormData.notes || ''}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Enter coordination notes here..."
                                />
                            </div>
                        </div>

                        <div className="flex border-t border-neutral-100">
                            <button
                                onClick={() => handleSave(editingId)}
                                disabled={updateMutation.isPending}
                                className="flex-1 h-16 bg-brand-600 text-white text-xs font-black uppercase tracking-widest hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {updateMutation.isPending ? 'Committing...' : 'Commit Changes'}
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 h-16 bg-white text-neutral-400 text-xs font-black uppercase tracking-widest hover:bg-neutral-50 active:scale-95 transition-all"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryStat({ label, value, color }: { label: string, value: number, color: 'brand' | 'success' | 'neutral' }) {
    const colors = {
        brand: 'text-brand-600',
        success: 'text-success-600',
        neutral: 'text-neutral-400'
    };
    return (
        <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{label}</span>
            <span className={`text-sm font-black tabular-nums ${colors[color]}`}>{value}</span>
        </div>
    );
}

function Loader2(props: any) {
    return <RefreshCw {...props} />;
}

