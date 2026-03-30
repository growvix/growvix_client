import * as React from "react"
import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
    type PaginationState,
    type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from "@/constants"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    initialPageSize?: number
    filterColumn?: string
    filterPlaceholder?: string
    onRowClick?: (row: TData) => void
    hidePagination?: boolean
    topLeftContent?: React.ReactNode
    topRightContent?: React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    initialPageSize = DEFAULT_PAGE_SIZE,
    filterColumn = "",
    filterPlaceholder = "Filter...",
    onRowClick,
    hidePagination = false,
    topLeftContent,
    topRightContent,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialPageSize,
    })

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onPaginationChange: setPagination,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
        },
    })

    const totalPages = table.getPageCount()
    const currentPage = table.getState().pagination.pageIndex

    const getVisiblePages = () => {
        const pages: (number | string)[] = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            for (let i = 0; i < totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 2) {
                pages.push(0, 1, 2, "ellipsis", totalPages - 1)
            } else if (currentPage >= totalPages - 3) {
                pages.push(0, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1)
            } else {
                pages.push(0, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages - 1)
            }
        }

        return pages
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center gap-4 py-4 w-full flex-wrap">
                <div className="flex items-center gap-4 flex-1">
                    {filterColumn && (
                        <div className="relative w-full max-w-sm">
                            <Input
                                placeholder={filterPlaceholder}
                                value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
                                onChange={(event) => {
                                    table.getColumn(filterColumn)?.setFilterValue(event.target.value)
                                }}
                                className="w-full pr-8 bg-input/30 dark:bg-input/50"
                            />

                            {(table.getColumn(filterColumn)?.getFilterValue() as string) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => table.getColumn(filterColumn)?.setFilterValue("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                    {topLeftContent}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    
                    {!hidePagination && (
                        <div className="flex items-center gap-2">
                            {topRightContent}
                            <span className="text-sm text-muted-foreground">Rows per page</span>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger className="h-9 w-[80px]">
                                    <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {PAGE_SIZE_OPTIONS.map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.columnDef.meta?.label ?? column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                </div>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader className="bg-gray-900/10 dark:bg-muted/70">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    onClick={() => onRowClick?.(row.original)}
                                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {!hidePagination && (
                <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {table.getRowModel().rows.length} of {data.length} entries
                    </div>
                    <div className="flex items-center space-x-2">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => table.previousPage()}
                                        className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                {getVisiblePages().map((page, index) =>
                                    page === "ellipsis" ? (
                                        <PaginationItem key={`ellipsis-${index}`}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    ) : (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => table.setPageIndex(page as number)}
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {(page as number) + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )
                                )}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => table.nextPage()}
                                        className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            )}
        </div>
    )
}
