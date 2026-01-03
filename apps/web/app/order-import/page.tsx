'use client';
import { useState } from 'react';

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
        formData.append('userEmail', 'test-admin@sahakar.com'); // TODO: Real auth

        try {
            // Assuming API proxy is set up or full URL
            const res = await fetch('http://localhost:3001/order-requests/import', {
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

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Import Purchase Orders</h1>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Excel File
                    </label>
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                <div className="mt-4">
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {uploading ? 'Importing...' : 'Validate & Import'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="mt-8 bg-gray-50 p-6 rounded border">
                    <h3 className="font-semibold mb-2">Import Results</h3>
                    <p>Total Rows: {result.total}</p>
                    <p className="text-green-600">Imported: {result.imported}</p>
                    <p className="text-yellow-600">Skipped (Duplicate): {result.skipped}</p>

                    {result.errors && result.errors.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-red-600 font-medium">Errors:</h4>
                            <ul className="list-disc pl-5 text-sm text-red-500">
                                {result.errors.map((err: any, i: number) => (
                                    <li key={i}>Row {JSON.stringify(err.row)}: {err.error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
