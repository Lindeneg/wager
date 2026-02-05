"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {LoadingState} from "@/components/feedback";
import {cn} from "@/lib/utils";

export interface Column<T> {
    key: string;
    header: string;
    className?: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    rowClassName?: (item: T) => string;
    getRowKey: (item: T) => string | number;
}

export function DataTable<T>({
    columns,
    data,
    loading,
    emptyMessage = "No data",
    onRowClick,
    rowClassName,
    getRowKey,
}: DataTableProps<T>) {
    if (loading && data.length === 0) {
        return <LoadingState />;
    }

    return (
        <div className="rounded-lg border bg-white dark:bg-zinc-900">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col.key} className={col.className}>
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="text-center text-zinc-500">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow
                                key={getRowKey(item)}
                                onClick={
                                    onRowClick
                                        ? () => onRowClick(item)
                                        : undefined
                                }
                                className={cn(
                                    onRowClick &&
                                        "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800",
                                    rowClassName?.(item)
                                )}>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        className={col.className}>
                                        {col.render
                                            ? col.render(item)
                                            : (item as Record<string, unknown>)[
                                                  col.key
                                              ]?.toString()}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
