'use client';
import { useState, useMemo } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info, FileText, LayoutDashboard, Archive, Package, BarChart3, ListChecks } from 'lucide-react';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { useUserRole } from '../../context/UserRoleContext';

export default function OrderImportPage() {
    const { currentUser } = useUserRole();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file || !currentUser) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userEmail', currentUser.email || 'unknown@sahakar.com');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
            const res = await fetch(`${apiUrl}/order-requests/import`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error(error);
            setResult({ error: 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const columns = useMemo<ColumnDef<any>[]>(() => [
        { header: 'Row', accessorKey: 'row', size: 60 },
        { header: 'Product', accessorKey: 'productName', size: 250 },
        { header: 'Qty', accessorKey: 'qty', size: 80, cell: (info) => <span className="tabular-nums font-medium">{info.getValue() as number}</span> },
        { header: 'Supplier', accessorKey: 'supplierName', size: 200 },
        {
            header: 'Status', accessorKey: 'status', size: 120, cell: (info) => {
                const status = info.getValue() as string;
                const isError = status.toLowerCase().includes('error');
                return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isError ? 'bg-error-100 text-error-600' : 'bg-accent-100 text-accent-600'}`}>
                        {status.toUpperCase()}
                    </span>
                );
            }
        },
    ], []);

    return (
        <div className="flex flex-col h-full bg-transparent font-sans">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center border border-neutral-200/60">
                            <Upload size={28} className="text-brand-600" />
                        </div>
                        PPO Input & Ingestion
                    </h1>
                    <p className="text-sm text-neutral-500 font-medium mt-2">Bulk import purchase orders and convert them into system-tracked allocations.</p>
                </div>
            </header>

            <main className="space-y-10">
                <section className="saas-card p-10 bg-white">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <FileText size={40} className="text-brand-600" />
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2">Upload Purchase Orders</h2>
                        <p className="text-sm text-neutral-500 mb-8">Select one or multiple PPO files to begin the ingestion process.</p>

                        <div className="flex items-center justify-center">
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="btn-brand cursor-pointer flex items-center gap-3 shadow-xl shadow-brand-500/20"
                            >
                                <LayoutDashboard size={20} />
                                Select PPO SpreadSheet
                            </label>
                        </div>
                        {file && (
                            <div className="mt-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 flex items-center gap-2">
                                    <FileText size={16} className="text-brand-600" />
                                    {file.name}
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="btn-brand w-full max-w-xs"
                                >
                                    {uploading ? 'Processing Pipeline...' : 'Execute Ingestion'}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {result && !result.error && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <SummaryCard
                                label="Total Orders"
                                value={result.totalOrders}
                                icon={<Archive size={20} />}
                                color="brand"
                            />
                            <SummaryCard
                                label="Total Items"
                                value={result.totalItems}
                                icon={<Package size={20} />}
                                color="brand"
                            />
                            <SummaryCard
                                label="Total Quantity"
                                value={result.totalQty}
                                icon={<BarChart3 size={20} />}
                                color="success"
                            />
                            <SummaryCard
                                label="Suppliers Found"
                                value={result.suppliers?.length}
                                icon={<ListChecks size={20} />}
                                color="brand"
                            />
                        </div>

                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-600">
                                <ListChecks size={18} />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">Processed Items Preview</h3>
                        </div>

                        <DataGrid
                            data={result.preview || []}
                            columns={columns}
                        />

                        {/* Error Log */}
                        {result.errors && result.errors.length > 0 && (
                            <div className="saas-card overflow-hidden border-danger-200/50">
                                <div className="bg-danger-50 px-6 py-4 border-b border-danger-200/50">
                                    <h3 className="text-sm font-bold text-danger-700 flex items-center gap-2 uppercase tracking-wide">
                                        <AlertTriangle size={18} />
                                        Validation Error Report
                                    </h3>
                                </div>
                                <div className="max-h-80 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-neutral-50 text-[10px] text-neutral-400 font-bold uppercase sticky top-0 shadow-sm border-b border-neutral-200/60">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Excel Row</th>
                                                <th className="px-6 py-3 text-left">Validation Issue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100/60">
                                            {result.errors.map((err: any, i: number) => (
                                                <tr key={i} className="hover:bg-danger-50 transition-colors">
                                                    <td className="px-6 py-3 tabular-nums font-bold text-danger-600">{err.row}</td>
                                                    <td className="px-6 py-3 text-neutral-600 text-xs font-medium">{err.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

function SummaryCard({ label, value, icon, color }: { label: string, value: any, icon: React.ReactNode, color: 'brand' | 'success' }) {
    const isBrand = color === 'brand';
    return (
        <div className={`p-6 rounded-2xl border border-neutral-200/60 shadow-soft smooth-transition hover:shadow-hover ${isBrand ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white' : 'bg-white text-neutral-900'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBrand ? 'bg-white/20' : 'bg-success-50 text-success-600'}`}>
                    {icon}
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isBrand ? 'text-brand-100' : 'text-neutral-400'}`}>{label}</div>
                <div className="text-3xl font-extrabold tracking-tight tabular-nums">{value || 0}</div>
            </div>
        </div>
    );
}
