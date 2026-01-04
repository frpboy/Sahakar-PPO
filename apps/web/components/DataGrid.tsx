'use client';

import React, { useMemo, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
    ColumnDef,
    Row,
    ColumnResizeMode,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataGridProps<TData> {
    data: TData[];
    columns: ColumnDef<TData, any>[];
    isLoading?: boolean;
    onRowClick?: (row: TData) => void;
    stickyHeader?: boolean;
    frozenColumns?: number;
    enableColumnResizing?: boolean;
    isRowLocked?: (row: TData) => boolean;
    isRowHidden?: (row: TData) => boolean;
}

export function DataGrid<TData>({
    data,
    columns,
    isLoading,
    onRowClick,
    stickyHeader = true,
    frozenColumns = 0,
    enableColumnResizing = true,
    isRowLocked = () => false,
    isRowHidden = () => false,
}: DataGridProps<TData>) {
    const [columnResizeMode] = React.useState<ColumnResizeMode>('onChange');
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 100, // Default to 100
    });

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        columnResizeMode,
        enableColumnResizing,
        state: {
            pagination,
        },
    });

    const { rows } = table.getRowModel();

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 36,
        overscan: 10,
    });

    const virtualRows = virtualizer.getVirtualItems();

    if (isLoading) {
        return (
            <div className="w-full space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-9 w-full bg-neutral-50 animate-pulse rounded-sm" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div
                ref={parentRef}
                className="spreadsheet-grid overflow-auto flex-1 relative w-full rounded-t-md border-t border-x border-neutral-200 shadow-sm bg-white"
            >
                <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    <table className="w-full border-collapse text-[13px]">
                        <thead className={stickyHeader ? 'sticky top-0 z-20 bg-neutral-50 shadow-sm' : ''}>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b border-neutral-200/60">
                                    {headerGroup.headers.map((header, index) => {
                                        const isFrozen = index < frozenColumns;
                                        return (
                                            <th
                                                key={header.id}
                                                className={`
                        px-6 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-widest
                        ${isFrozen ? 'sticky left-0 z-10 bg-neutral-50' : ''}
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
                    border-b border-neutral-200 hover:bg-neutral-50 transition-colors cursor-default group
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
                          px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-neutral-700
                          ${isFrozen ? 'sticky left-0 z-10 bg-white group-hover:bg-neutral-50' : ''}
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
                    <div className="p-8 text-center text-neutral-400 italic text-sm">
                        No records found.
                    </div>
                )}
            </div>

            {/* Pagination Toolbar */}
            <div className="border border-neutral-200 bg-white p-2 flex items-center justify-between rounded-b-md shadow-sm text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Rows per page:</span>
                    <select
                        value={table.getState().pagination.pageSize}
                        onChange={e => {
                            table.setPageSize(Number(e.target.value));
                        }}
                        className="border border-neutral-200 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                    >
                        {[50, 100, 200, 500, 1000].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                {pageSize}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount().toLocaleString()}
                        <span className="text-neutral-400 mx-1">|</span>
                        Total {data.length.toLocaleString()} items
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            title="First Page"
                        >
                            <ChevronFirst size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            title="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            title="Next Page"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                            title="Last Page"
                        >
                            <ChevronLast size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
