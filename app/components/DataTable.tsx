"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
  TextInput,
} from "flowbite-react";

import { useIsMobile } from "@/hooks/useIsMobile";

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
  });

  return (
    <div className={`p-4 ${className ?? ""}`}>
      <div className="mb-4 max-w-xs">
        <TextInput
          placeholder="Buscar..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="focus:ring-brand-azul focus:border-brand-azul shadow-md focus:ring-2 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {table.getRowModel().rows.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              No hay resultados.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="mb-2">
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
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg shadow-md">
          <Table
            hoverable
            striped
            className="min-w-[600px] bg-white dark:bg-gray-900 dark:text-white"
          >
            <TableHead className="bg-brand-azul dark:bg-brand-azul">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="[&>th]:border-b-0">
                  {headerGroup.headers.map((header) => (
                    <TableHeadCell
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="bg-brand-azul hover:bg-brand-azul/90 cursor-pointer whitespace-nowrap text-white select-none dark:text-white"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? ""}
                    </TableHeadCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>

            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center whitespace-nowrap text-gray-300 dark:text-gray-500"
                  >
                    No hay resultados.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-300 dark:hover:bg-gray-100"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-2 whitespace-nowrap text-gray-900"
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
      )}
    </div>
  );
}
