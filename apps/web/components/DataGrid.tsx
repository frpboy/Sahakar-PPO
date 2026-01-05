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
    enableRowSelection?: boolean;
    onBulkDelete?: (selectedIds: string[]) => void;
    getRowId?: (row: TData) => string;
}

export function DataGrid<TData>({
    data,
    columns,
    isLoading = false,
    onRowClick,
    stickyHeader = true,
    frozenColumns = 0,
    enableColumnResizing = true,
    isRowLocked = () => false,
    isRowHidden = () => false,
    enableRowSelection = false,
    onBulkDelete,
    getRowId = (row: any) => row.id,
}: DataGridProps<TData>) {
    const [columnResizeMode] = React.useState<ColumnResizeMode>('onChange');
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: 50, // Changed from 100 to 50
    });
    const [rowSelection, setRowSelection] = React.useState({});

    // Add checkbox column if row selection is enabled
    const tableColumns = useMemo(() => {
        if (!enableRowSelection) return columns;

        const checkboxColumn: ColumnDef<TData, any> = {
            id: 'select',
            size: 50,
            header: ({ table }) => {
                const ref = React.useRef<HTMLInputElement>(null);
                React.useEffect(() => {
                    if (ref.current) {
                        ref.current.indeterminate = table.getIsSomePageRowsSelected();
                    }
                }, [table.getIsSomePageRowsSelected()]);

                return (
                    <input
                        ref={ref}
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={table.getToggleAllPageRowsSelectedHandler()}
                        className="w-4 h-4 cursor-pointer"
                    />
                );
            },
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    disabled={!row.getCanSelect()}
                    onChange={row.getToggleSelectedHandler()}
                    className="w-4 h-4 cursor-pointer"
                />
            ),
        };

        return [checkboxColumn, ...columns];
    }, [columns, enableRowSelection]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
        enableRowSelection: enableRowSelection,
        getRowId: getRowId as any,
        columnResizeMode,
        enableColumnResizing,
        state: {
            pagination,
            rowSelection,
        },
    });

    const { rows } = table.getRowModel();

    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44,
        overscan: 10,
    });

    const virtualRows = virtualizer.getVirtualItems();

    const handleBulkDelete = () => {
        const selectedRows = table.getFilteredSelectedRowModel().rows;
        const selectedIds = selectedRows.map(row => getRowId(row.original));

        if (selectedIds.length === 0) {
            alert('Please select at least one item to delete');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedIds.length} item(s)?`)) {
            onBulkDelete?.(selectedIds);
            setRowSelection({});
        }
    };

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
            {/* Top Toolbar with Bulk Delete */}
            {enableRowSelection && onBulkDelete && Object.keys(rowSelection).length > 0 && (
                <div className="bg-white border-x border-t border-neutral-200 rounded-t-xl p-3 flex items-center justify-between">
                    <span className="text-sm text-neutral-600 font-medium">
                        {Object.keys(rowSelection).length} item(s) selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2 bg-danger-600 text-white font-semibold text-sm rounded hover:bg-danger-700 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Selected
                    </button>
                </div>
            )}
            <div
                ref={parentRef}
                className={`spreadsheet-grid overflow-auto flex-1 relative w-full border border-neutral-200 shadow-sm bg-white max-h-[calc(100vh-220px)] ${enableRowSelection && Object.keys(rowSelection).length > 0 ? 'border-t-0' : 'rounded-xl'}`}
            >
                <table className="w-full border-collapse table-fixed text-[13px]">
                    <colgroup>
                        {table.getAllLeafColumns().map((column) => (
                            <col key={column.id} style={{ width: column.getSize() }} />
                        ))}
                    </colgroup>
                    <thead className="z-30">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="divide-x divide-neutral-200">
                                {headerGroup.headers.map((header, index) => {
                                    const isPinnedLeft = index < frozenColumns;
                                    const isPinnedRight = index === headerGroup.headers.length - 1; // Always pin last column as per specs
                                    const meta = header.column.columnDef.meta as any;
                                    const align = meta?.align || 'left';

                                    return (
                                        <th
                                            key={header.id}
                                            style={{
                                                width: header.getSize(),
                                                minWidth: header.getSize(),
                                                maxWidth: header.getSize()
                                            }}
                                            className={`
                                                px-3 py-2.5 text-[11px] font-black text-neutral-500 uppercase tracking-widest bg-white border-b-2 border-neutral-200
                                                ${stickyHeader ? 'sticky top-0 z-40' : ''}
                                                ${isPinnedLeft ? 'sticky left-0 z-50 border-r border-neutral-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                                                ${isPinnedRight ? 'sticky right-0 z-50 border-l border-neutral-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                                                ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}
                                                shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]
                                            `}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="relative divide-y divide-neutral-100">
                        {virtualRows.length > 0 && virtualRows[0].start > 0 && (
                            <tr>
                                <td style={{ height: `${virtualRows[0].start}px` }} colSpan={100} />
                            </tr>
                        )}
                        {virtualRows.map((virtualRow) => {
                            const row = rows[virtualRow.index];
                            return (
                                <tr
                                    key={row.id}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={`
                                        hover:bg-brand-50/30 transition-colors cursor-default group h-[48px] divide-x divide-neutral-100
                                        ${onRowClick ? 'cursor-pointer' : ''}
                                    `}
                                >
                                    {row.getVisibleCells().map((cell, index) => {
                                        const isPinnedLeft = index < frozenColumns;
                                        const isPinnedRight = index === row.getVisibleCells().length - 1;
                                        const meta = cell.column.columnDef.meta as any;
                                        const align = meta?.align || 'left';

                                        return (
                                            <td
                                                key={cell.id}
                                                style={{
                                                    width: cell.column.getSize(),
                                                    minWidth: cell.column.getSize(),
                                                    maxWidth: cell.column.getSize()
                                                }}
                                                className={`
                                                    px-3 py-3 whitespace-nowrap overflow-hidden text-ellipsis text-neutral-700 align-middle
                                                    ${isPinnedLeft ? 'sticky left-0 z-10 bg-white group-hover:bg-neutral-50 border-r border-neutral-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                                                    ${isPinnedRight ? 'sticky right-0 z-10 bg-white group-hover:bg-neutral-50 border-l border-neutral-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                                                    ${align === 'right' ? 'text-right tabular-nums font-bold text-neutral-900 px-4' : align === 'center' ? 'text-center' : 'text-left'}
                                                `}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {virtualRows.length > 0 && virtualizer.getTotalSize() > virtualRows[virtualRows.length - 1].end && (
                            <tr>
                                <td style={{ height: `${virtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end}px` }} colSpan={100} />
                            </tr>
                        )}
                    </tbody>
                </table>
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
