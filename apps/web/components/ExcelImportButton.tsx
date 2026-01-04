import React from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportButtonProps {
    onImport: (data: any[]) => void;
    entityType: 'products' | 'suppliers' | 'rep-master';
    className?: string;
}

export function ExcelImportButton({ onImport, entityType, className = '' }: ExcelImportButtonProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    alert('Excel file is empty. Please upload a file with data.');
                    return;
                }

                onImport(jsonData);

                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } catch (error) {
                console.error('Error parsing Excel file:', error);
                alert(`Error reading Excel file: ${error instanceof Error ? error.message : 'Please check the file format.'}`);
            }
        };
        reader.onerror = () => {
            alert('Failed to read file. Please try again.');
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id={`excel-import-${entityType}`}
            />
            <label
                htmlFor={`excel-import-${entityType}`}
                className="btn-secondary flex items-center gap-2 cursor-pointer inline-flex"
            >
                <Upload size={18} />
                Import Excel
            </label>
        </div>
    );
}
