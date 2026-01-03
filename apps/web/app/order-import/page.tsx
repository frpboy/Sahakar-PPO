'use client';
import { useState, useMemo } from 'react';
import { Import, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';

export default function OrderImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userEmail', 'admin@sahakar.com'); // TODO: Context auth

        try {
            const res = await fetch('http://localhost:8080/order-requests/import', {
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {status.toUpperCase()}
                    </span>
                );
            }
        },
    ], []);

    return (
        <div className="flex flex-col h-full bg-[var(--background)]">
            {/* Header Area */}
            <header className="bg-white border-b border-[var(--border)] px-8 py-6 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <Import className="w-6 h-6 text-indigo-600" />
                            PPO Input
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">
                            Upload and ingestion of pharmaceutical purchase orders
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-auto">
                <div className="bg-white rounded-lg shadow-sm border border-[var(--border)] p-6 mb-8 max-w-2xl">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">
                        File Ingestion
                    </h2>

                    <div className="space-y-6">
                        <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-8 transition-colors hover:border-indigo-400 group">
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                                <Import className="mx-auto h-12 w-12 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                                    <span className="relative rounded-md font-bold text-indigo-600 hover:text-indigo-500">
                                        {file ? file.name : 'Upload PO file'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">XLSX up to 10MB</p>
                            </div>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all uppercase tracking-wide"
                        >
                            {uploading ? 'Processing Data...' : 'Validate & Import Orders'}
                        </button>
                    </div>
                </div>

                {result && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-lg border border-[var(--border)] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-md">
                                        <InfoCircle className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Total Rows</p>
                                        <p className="text-2xl font-bold tabular-nums">{result.total || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-[var(--border)] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 rounded-md">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Imported</p>
                                        <p className="text-2xl font-bold tabular-nums text-green-600">{result.imported || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-lg border border-[var(--border)] shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 rounded-md">
                                        <WarningTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase">Duplicates</p>
                                        <p className="text-2xl font-bold tabular-nums text-amber-600">{result.skipped || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Error Log */}
                        {result.errors && result.errors.length > 0 && (
                            <div className="bg-white rounded-lg border border-red-100 overflow-hidden shadow-sm">
                                <div className="bg-red-50/50 px-6 py-3 border-b border-red-100">
                                    <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider flex items-center gap-2">
                                        <WarningTriangle className="w-4 h-4" />
                                        Error Report
                                    </h3>
                                </div>
                                <div className="max-h-60 overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-[10px] text-gray-400 font-bold uppercase">
                                            <tr>
                                                <th className="px-6 py-2 text-left">Row</th>
                                                <th className="px-6 py-2 text-left">Issue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {result.errors.map((err: any, i: number) => (
                                                <li key={i} className="px-6 py-2 flex items-center gap-4 text-xs font-medium text-red-600">
                                                    <span className="w-12 tabular-nums">{err.row}</span>
                                                    <span>{err.error}</span>
                                                </li>
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
