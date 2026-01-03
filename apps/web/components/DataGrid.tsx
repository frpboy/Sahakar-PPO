'use client';

import React, { useMemo, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    Row,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DataGridProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    isLoading?: boolean;
    onRowClick?: (row: TData) => void;
    stickyHeader?: boolean;
    frozenColumns?: number;
}

export function DataGrid<TData>({
    data,
    columns,
    isLoading,
    onRowClick,
    stickyHeader = true,
    frozenColumns = 0,
}: DataGridProps<TData>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const { rows } = table.getRowModel();

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 36, // Compact row height from spec
        overscan: 10,
    });

    const virtualRows = virtualizer.getVirtualItems();

    if (isLoading) {
        return (
            <div className="w-full space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-9 w-full bg-gray-100 animate-pulse rounded-sm" />
                ))}
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className="spreadsheet-grid overflow-auto max-h-[calc(100vh-200px)] relative w-full"
        >
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                <table className="w-full border-collapse text-sm">
                    <thead className={stickyHeader ? 'sticky top-0 z-20 bg-[var(--background)] shadow-sm' : ''}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-[var(--border)]">
                                {headerGroup.headers.map((header, index) => {
                                    const isFrozen = index < frozenColumns;
                                    return (
                                        <th
                                            key={header.id}
                                            className={`
                        px-4 py-2 text-left font-semibold text-[var(--text-secondary)] bg-gray-50/50 uppercase tracking-wider text-[10px]
                        ${isFrozen ? 'sticky left-0 z-10 bg-gray-50' : ''}
                      `}
                                            style={{
                                                width: header.getSize(),
                                                minWidth: header.column.columnDef.minSize,
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="relative">
                        {virtualRows.map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            return (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={`
                    border-b border-[var(--border)] hover:bg-gray-50/50 transition-colors cursor-default group
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    {row.getVisibleCells().map((cell, index) => {
                                        const isFrozen = index < frozenColumns;
                                        return (
                                            <td
                                                key={cell.id}
                                                className={`
                          px-4 py-1.5 whitespace-nowrap overflow-hidden text-ellipsis
                          ${isFrozen ? 'sticky left-0 z-10 bg-white group-hover:bg-gray-50' : ''}
                        `}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {data.length === 0 && !isLoading && (
                <div className="p-8 text-center text-[var(--text-secondary)] italic">
                    No records found.
                </div>
            )}
        </div>
    );
}
