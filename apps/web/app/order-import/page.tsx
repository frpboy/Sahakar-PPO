'use client';
import { useState, useMemo } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info } from 'lucide-react';
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
        <div className="flex flex-col h-full bg-neutral-50">
            {/* Header Area */}
            <header className="bg-white border-b border-neutral-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-primary-900 tracking-tight flex items-center gap-3 uppercase">
                            <Upload size={24} className="text-primary-700" />
                            PPO Ingestion
                        </h1>
                        <p className="text-[10px] text-neutral-400 font-bold mt-1 uppercase tracking-widest leading-none">
                            High-volume pharmaceutical purchase order validation
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-auto space-y-8">
                <div className="bg-white erp-card p-8 max-w-2xl mx-auto shadow-sm">
                    <h2 className="text-[11px] font-bold uppercase tracking-widest text-primary-900 mb-6 flex items-center gap-2">
                        <Upload size={16} className="text-primary-700" />
                        File Ingestion Core
                    </h2>

                    <div className="space-y-6">
                        <div className="relative border-2 border-dashed border-neutral-200 rounded-lg p-10 transition-all hover:border-primary-500 bg-neutral-50/50 group">
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                                <Upload className="mx-auto h-12 w-12 text-neutral-300 group-hover:text-primary-700 transition-colors" />
                                <div className="mt-4 flex text-sm text-neutral-600 justify-center">
                                    <span className="relative rounded-md font-bold text-primary-700">
                                        {file ? file.name : 'Select PO SpreadSheet'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wide">XLSX Maximum 10MB</p>
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary-700 hover:bg-primary-900 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            {uploading ? 'Validating Ingestion...' : 'Execute Import Pipeline'}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SummaryCard
                                label="Total Rows"
                                value={result.total || 0}
                                icon={<Info size={20} />}
                                variant="neutral"
                            />
                            <SummaryCard
                                label="Imported"
                                value={result.imported || 0}
                                icon={<CheckCircle size={20} />}
                                variant="accent"
                            />
                            <SummaryCard
                                label="Duplicates"
                                value={result.skipped || 0}
                                icon={<AlertTriangle size={20} />}
                                variant="warning"
                            />
                        </div>

                        {/* Error Log */}
                        {result.errors && result.errors.length > 0 && (
                            <div className="bg-white erp-card shadow-sm border-error-100">
                                <div className="bg-error-100/30 px-6 py-4 border-b border-error-100">
                                    <h3 className="text-[11px] font-bold text-error-600 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle size={18} />
                                        Ingestion Error Report
                                    </h3>
                                </div>
                                <div className="max-h-80 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-neutral-50 text-[10px] text-neutral-400 font-bold uppercase sticky top-0 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Excel Row</th>
                                                <th className="px-6 py-3 text-left">Validation Issue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {result.errors.map((err: any, i: number) => (
                                                <tr key={i} className="hover:bg-error-100/10 transition-colors">
                                                    <td className="px-6 py-3 tabular-nums font-bold text-error-600">{err.row}</td>
                                                    <td className="px-6 py-3 text-neutral-700 text-xs">{err.error}</td>
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

function SummaryCard({ label, value, icon, variant }: { label: string, value: number, icon: React.ReactNode, variant: 'neutral' | 'accent' | 'warning' }) {
    const colors = {
        neutral: 'text-primary-700 border-neutral-200 bg-white',
        accent: 'text-accent-600 border-accent-100 bg-accent-100/20',
        warning: 'text-warning-600 border-warning-100 bg-warning-100/20',
    }[variant];

    return (
        <div className={`p-6 rounded-md border shadow-sm ${colors} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-white border border-neutral-100 shadow-sm">
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
                    <p className="text-3xl font-bold tabular-nums tracking-tighter">{value}</p>
                </div>
            </div>
        </div>
    );
}
