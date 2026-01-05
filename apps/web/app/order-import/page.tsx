'use client';
import { useState, useMemo } from 'react';
import { Upload, CheckCircle, AlertTriangle, Info, FileText, LayoutDashboard, Archive, Package, BarChart3, ListChecks, Loader2, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { DataGrid } from '../../components/DataGrid';
import { ColumnDef } from '@tanstack/react-table';
import { useUserRole } from '../../context/UserRoleContext';

type IngestStage =
    | 'IDLE'
    | 'UPLOADING'
    | 'VALIDATING'
    | 'AGGREGATING'
    | 'FINALIZING'
    | 'DONE'
    | 'ERROR';

export default function OrderImportPage() {
    const { currentUser, role, can } = useUserRole();
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [stage, setStage] = useState<IngestStage>('IDLE');
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [showDuplicates, setShowDuplicates] = useState(false);

    // Role Guard
    const isAllowed = can('MANAGE_IMPORT') || role === 'SUPER_ADMIN' || role === 'PROCUREMENT_HEAD';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files ? Array.from(e.target.files) : [];
        setFiles(list);
        setResult(null);
        setStage('IDLE');
    };

    const handleUpload = async () => {
        if (!files || files.length === 0) {
            alert('Please select a file first');
            return;
        }
        if (!currentUser) {
            alert('User context missing. Please refresh the page.');
            return;
        }

        setUploading(true);
        setResult(null);
        setCurrentFileIndex(0);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api';
            const aggregated = {
                rowsRead: 0,
                rowsAccepted: 0,
                pendingCreated: 0,
                pendingUpdated: 0,
                duplicatesSkipped: 0,
                filesProcessed: 0,
                errors: [] as any[],
                preview: [] as any[]
            };

            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                setCurrentFileIndex(i);
                setStage('UPLOADING');

                const formData = new FormData();
                formData.append('file', f);
                formData.append('userEmail', currentUser.email || 'unknown@sahakar.com');

                // Simulation: Give time for stages to be visible if processing is too fast
                setStage('VALIDATING');
                const res = await fetch(`${apiUrl}/ppo/import/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    setStage('ERROR');
                    const errorText = await res.text();
                    let errorMessage = `Upload failed (HTTP ${res.status})`;
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    } catch {
                        errorMessage = errorText || errorMessage;
                    }
                    aggregated.errors.push({ row: '-', column: 'FILE', value: f.name, error: errorMessage });
                    continue;
                }

                setStage('AGGREGATING');
                const data = await res.json();
                const metrics = data?.data; // { fileName, summary, preview, errors }
                const summary = metrics?.summary;

                if (summary) {
                    aggregated.rowsRead += summary.rowsRead || 0;
                    aggregated.rowsAccepted += summary.rowsAccepted || 0;
                    aggregated.pendingCreated += summary.pendingCreated || 0;
                    aggregated.pendingUpdated += summary.pendingUpdated || 0;
                    aggregated.duplicatesSkipped += summary.duplicatesSkipped || 0;
                }
                aggregated.filesProcessed += 1;

                if (metrics?.errors && Array.isArray(metrics.errors)) {
                    aggregated.errors.push(...metrics.errors);
                }

                if (metrics?.preview && Array.isArray(metrics.preview)) {
                    aggregated.preview.push(...metrics.preview);
                }
            }

            setStage('FINALIZING');
            setResult(aggregated);
            setStage('DONE');
        } catch (error) {
            setStage('ERROR');
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            alert(`Error: ${errorMessage}`);
            setResult({ error: errorMessage });
        } finally {
            setUploading(false);
        }
    };

    const columns = useMemo<ColumnDef<any>[]>(() => [
        { header: 'ROW', accessorKey: 'row', size: 60, meta: { align: 'center' } },
        { header: 'ORDER ID', accessorKey: 'orderId', size: 100, cell: (info) => <span className="font-mono text-[10px] text-brand-600 font-bold">#{info.getValue() as string}</span> },
        { header: 'PROD ID', accessorKey: 'productId', size: 100, cell: (info) => <span className="font-mono text-[10px] text-neutral-400 font-bold">{info.getValue() as string || 'N/A'}</span> },
        { header: 'ITEM NAME', accessorKey: 'productName', size: 200, cell: (info) => <span className="text-xs font-bold text-neutral-900 uppercase truncate">{info.getValue() as string}</span> },
        { header: 'REQ QTY', accessorKey: 'reqQty', size: 80, meta: { align: 'right' }, cell: (info) => <span className="tabular-nums font-bold text-neutral-600">{info.getValue() as number}</span> },
        {
            header: 'DECISION', accessorKey: 'decision', size: 100, cell: (info) => {
                const decision = info.getValue() as string;
                const colors: any = {
                    'CREATED': 'bg-success-100 text-success-700',
                    'UPDATED': 'bg-brand-100 text-brand-700',
                    'DUPLICATE': 'bg-neutral-100 text-neutral-600',
                    'REJECTED': 'bg-danger-100 text-danger-700'
                };
                return <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${colors[decision] || 'bg-neutral-100'}`}>{decision}</span>;
            }
        },
        { header: 'REASON', accessorKey: 'reason', size: 180, cell: (info) => <span className="text-[10px] italic text-neutral-500">{info.getValue() as string}</span> },
    ], []);

    if (!isAllowed) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-danger-50 flex items-center justify-center rounded-none mb-6 border border-danger-100">
                    <Lock size={40} className="text-danger-600" />
                </div>
                <h1 className="text-2xl font-black text-neutral-900 mb-2 uppercase tracking-tight">Access Restricted</h1>
                <p className="text-neutral-500 font-medium">Only Procurement Head or Master Admins can execute PPO Ingestion.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent font-sans pb-20">
            <header className="mb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-none shadow-[0_1px_3px_rgba(16_24_40/0.1)] flex items-center justify-center border border-neutral-200/80">
                                <Upload size={28} className="text-brand-600" />
                            </div>
                            PPO Ingestion & Analytics
                        </h1>
                        <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                            Stage: <span className={stage === 'ERROR' ? 'text-danger-600' : 'text-brand-600'}>{stage}</span>
                        </p>
                    </div>
                </div>
            </header>

            <main className="space-y-10">
                <section className={`app-card p-12 bg-white flex flex-col items-center border-t-4 ${stage === 'DONE' ? 'border-success-500' : 'border-brand-500 shadow-xl shadow-brand-500/5'}`}>
                    <div className="max-w-2xl w-full text-center">
                        <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-none flex items-center justify-center mx-auto mb-6 transition-all group-hover:scale-110">
                            {uploading ? <Loader2 size={32} className="text-brand-600 animate-spin" /> : <FileText size={32} className="text-brand-600" />}
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900 mb-2 tracking-tight uppercase">Ingest Purchase Orders</h2>
                        <p className="text-sm text-neutral-400 font-medium mb-10">Multi-file sequential processing with deterministic validation.</p>

                        <div className="flex items-center justify-center">
                            <input
                                type="file"
                                accept=".xlsx"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                                disabled={uploading || stage === 'DONE'}
                            />
                            {!result && !uploading && (
                                <label
                                    htmlFor="file-upload"
                                    className="btn-brand cursor-pointer flex items-center gap-3 shadow-xl shadow-brand-500/20 active:scale-95 transition-all"
                                >
                                    <LayoutDashboard size={20} />
                                    Select PPO Files
                                </label>
                            )}
                        </div>

                        {files.length > 0 && (
                            <div className="mt-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-6 py-3 bg-neutral-50 border border-neutral-200 rounded-none text-[11px] font-black uppercase tracking-widest text-neutral-700 flex items-center gap-3">
                                    <FileText size={18} className="text-brand-600" />
                                    {files.length <= 3
                                        ? files.map(f => f.name).join(', ')
                                        : `${files.length} Files Selected`}
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || stage === 'DONE'}
                                    className="btn-brand w-full max-w-sm h-14 text-sm tracking-widest disabled:bg-neutral-200 disabled:shadow-none transition-all flex items-center justify-center gap-3"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Processing {currentFileIndex + 1} of {files.length} — {stage}...</span>
                                        </>
                                    ) : stage === 'DONE' ? (
                                        <>
                                            <CheckCircle size={20} />
                                            <span>Ingestion Completed</span>
                                        </>
                                    ) : 'Ingest PPO Files'}
                                </button>
                                {stage === 'DONE' && (
                                    <button
                                        onClick={() => { setFiles([]); setResult(null); setStage('IDLE'); }}
                                        className="text-brand-600 text-[10px] font-black uppercase hover:underline"
                                    >
                                        Start New Batch
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {result && !result.error && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <SummaryCard
                                label="Rows Read"
                                value={result.rowsRead}
                                icon={<Archive size={20} />}
                                color="brand"
                                sub="Total in files"
                            />
                            <SummaryCard
                                label="Accepted"
                                value={result.rowsAccepted}
                                icon={<CheckCircle size={20} />}
                                color="brand"
                                sub="Successfully saved"
                            />
                            <SummaryCard
                                label="Pending Created"
                                value={result.pendingCreated}
                                icon={<BarChart3 size={20} />}
                                color="success"
                                sub="New aggregation"
                            />
                            <SummaryCard
                                label="Pending Updated"
                                value={result.pendingUpdated}
                                icon={<ListChecks size={20} />}
                                color="brand"
                                sub="Existing aggregation"
                            />
                            <SummaryCard
                                label="Duplicates"
                                value={result.duplicatesSkipped}
                                icon={<Info size={20} />}
                                color="brand"
                                sub="Skipped records"
                            />
                        </div>

                        {/* Preview Section */}
                        <div className="flex items-center justify-between px-2 mb-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Ingest Preview</h2>
                                <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold bg-neutral-100 px-2 py-0.5 shadow-sm">Audit Logic Log</span>
                            </div>
                        </div>

                        <div className="app-card overflow-hidden bg-white shadow-xl shadow-neutral-200/40">
                            <DataGrid
                                data={result.preview || []}
                                columns={columns}
                            />
                        </div>

                        {/* Duplicates Section */}
                        {result.duplicatesSkipped > 0 && (
                            <div className="app-card overflow-hidden bg-white border-neutral-200">
                                <button
                                    onClick={() => setShowDuplicates(!showDuplicates)}
                                    className="w-full h-12 px-6 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors border-b border-neutral-200"
                                >
                                    <span className="text-[11px] font-black uppercase tracking-widest text-neutral-600 flex items-center gap-2">
                                        <Archive size={16} />
                                        Skipped Duplicates ({result.duplicatesSkipped})
                                    </span>
                                    {showDuplicates ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {showDuplicates && (
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            {result.preview.filter((p: any) => p.decision === 'DUPLICATE').slice(0, 50).map((p: any, idx: number) => (
                                                <div key={idx} className="p-2 border border-neutral-100 bg-neutral-50/50 text-[10px] font-bold text-neutral-500 rounded truncate">
                                                    #{p.orderId} - {p.productName}
                                                </div>
                                            ))}
                                        </div>
                                        {result.duplicatesSkipped > 50 && (
                                            <p className="text-[10px] text-neutral-400 mt-4 italic">Showing first 50 duplicates. Review PPO Input for full list.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error Log */}
                        {result.errors && result.errors.length > 0 && (
                            <div className="app-card overflow-hidden border-danger-200/50 shadow-2xl shadow-danger-500/5 animate-in shake duration-500">
                                <div className="bg-danger-50 px-6 py-4 border-b border-danger-200/50">
                                    <h3 className="text-xs font-black text-danger-700 flex items-center gap-3 uppercase tracking-widest">
                                        <AlertTriangle size={20} />
                                        Deterministic Error Report
                                    </h3>
                                </div>
                                <div className="max-h-96 overflow-auto">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-neutral-50 text-[10px] text-neutral-400 font-bold uppercase sticky top-0 shadow-sm border-b border-neutral-200/60 z-10">
                                            <tr>
                                                <th className="px-6 py-4 text-left font-black">ROW</th>
                                                <th className="px-6 py-4 text-left font-black text-brand-600">COLUMN</th>
                                                <th className="px-6 py-4 text-left font-black">RAW VALUE</th>
                                                <th className="px-6 py-4 text-left font-black text-danger-600">ERROR MESSAGE</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100/60">
                                            {result.errors.map((err: any, i: number) => (
                                                <tr key={i} className="hover:bg-danger-50/30 transition-colors group">
                                                    <td className="px-6 py-3 tabular-nums font-black text-neutral-400 group-hover:text-danger-600">{err.row || '-'}</td>
                                                    <td className="px-6 py-3 font-black text-neutral-600 uppercase group-hover:text-brand-600">{err.column || 'GENERAL'}</td>
                                                    <td className="px-6 py-3 font-mono text-neutral-400 truncate max-w-[200px]">{err.value || 'N/A'}</td>
                                                    <td className="px-6 py-3 text-neutral-900 font-bold">{err.error || 'Unknown Validation Error'}</td>
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

function SummaryCard({ label, value, icon, color, sub }: { label: string, value: any, icon: React.ReactNode, color: 'brand' | 'success', sub?: string }) {
    const statusConfig = {
        brand: { badge: 'bg-brand-50 text-brand-700 border-brand-100', icon: 'text-brand-600' },
        success: { badge: 'bg-success-50 text-success-700 border-success-100', icon: 'text-success-600' },
    }[color];

    return (
        <div className="app-card p-6 flex flex-col gap-4 group hover:border-brand-300 transition-all border-b-4 border-b-transparent hover:border-b-brand-500 shadow-md">
            <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-none bg-neutral-50 shadow-inner flex items-center justify-center smoothly transition group-hover:bg-brand-50">
                    <div className={statusConfig.icon}>
                        {icon}
                    </div>
                </div>
                {sub && (
                    <div className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none bg-neutral-100 text-neutral-400 border border-neutral-200">
                        {sub}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 group-hover:text-brand-600 transition-colors">
                    {label}
                </div>
                <div className="text-4xl font-black text-neutral-900 tabular-nums tracking-tighter">
                    {value || 0}
                </div>
            </div>
        </div>
    );
}
