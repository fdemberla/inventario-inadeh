"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
} from "flowbite-react";
import { SearchIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { useIsMobile } from "@/hooks/useIsMobile";
import { Input, Card, Button } from "@/app/components/ui";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  className?: string;
};

export function DataTable<T extends object>({
  data,
  columns,
  className,
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const isMobile = useIsMobile();

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={`flex flex-col space-y-4 ${className ?? ""}`}>
      <div className="max-w-sm">
        <Input
          type="text"
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          aria-label="Buscar"
          icon={<SearchIcon size={18} className="text-gray-400" />}
        />
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {table.getRowModel().rows.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay resultados.</p>
            </Card>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Card
                key={row.id}
                hoverable
                className="p-4"
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="mb-2 last:mb-0">
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {flexRender(
                        cell.column.columnDef.header,
                        cell.getContext(),
                      )}
                    </div>
                    <div className="text-gray-800 dark:text-white">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card noPadding className="w-full overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table
              className="min-w-[600px] w-full !bg-transparent dark:!bg-transparent"
            >
              <TableHead className="!bg-transparent dark:!bg-transparent">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="[&>th]:border-b-0">
                    {headerGroup.headers.map((header) => (
                      <TableHeadCell
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="bg-brand-azul/60 dark:bg-brand-azul/40 backdrop-blur-sm hover:bg-brand-azul/80 dark:hover:bg-brand-azul/60 cursor-pointer whitespace-nowrap text-white select-none"
                        aria-label={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {header.column.getCanSort() && (
                            <span aria-hidden="true" className="inline-flex">
                              {header.column.getIsSorted() === "asc" ? (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832l-3.71 3.938a.75.75 0 01-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" /></svg>
                              ) : header.column.getIsSorted() === "desc" ? (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                              ) : (
                                <svg className="h-3.5 w-3.5 opacity-40" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" /></svg>
                              )}
                            </span>
                          )}
                        </span>
                      </TableHeadCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
  
              <TableBody className="!bg-transparent dark:!bg-transparent">
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow className="bg-transparent">
                    <TableCell
                      colSpan={columns.length}
                      className="py-12 text-center !bg-transparent"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm text-gray-400 dark:text-gray-500">No hay resultados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="!bg-transparent border-b border-white/20 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 even:bg-black/5 even:dark:bg-white/10 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-200 !bg-transparent"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>
              Página <span className="font-semibold">{table.getState().pagination.pageIndex + 1}</span> de{" "}
              <span className="font-semibold">{table.getPageCount()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1"
              aria-label="Ir a la primera página"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 py-1"
              aria-label="Ir a la página anterior"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1"
              aria-label="Ir a la página siguiente"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-2 py-1"
              aria-label="Ir a la última página"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
