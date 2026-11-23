"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type Header,
  type Row,
} from "@tanstack/react-table";
import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Search,
} from "lucide-react";

import { useIsMobile } from "@/hooks/useIsMobile";
import { Input, IconButton } from "@/app/components/ui";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  className?: string;
  /** Accessible name of the table (read by screen readers, not shown). */
  caption?: string;
  /** Extra controls shown next to the search box (filters, toggles…). */
  toolbar?: ReactNode;
  emptyMessage?: string;
};

// Spanish collation: ignores case and accents ("álvaro" sorts with "Alberto"),
// and compares digits numerically ("9" < "10").
const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

function spanishSort<T>(a: Row<T>, b: Row<T>, columnId: string): number {
  const x = a.getValue(columnId);
  const y = b.getValue(columnId);
  if (x == null || x === "") return y == null || y === "" ? 0 : 1;
  if (y == null || y === "") return -1;
  if (typeof x === "number" && typeof y === "number") return x - y;
  return collator.compare(String(x), String(y));
}

/** Column title as plain text (for mobile labels and sort announcements). */
function headerText<T>(header: ColumnDef<T>["header"], fallback: string): string {
  return typeof header === "string" ? header : fallback;
}

/**
 * Tabla de datos con búsqueda, orden y paginación.
 * Es un panel completo (borde, fondo, padding): no la envuelvas en <Card>.
 * En celular se muestra como lista de tarjetas.
 */
export function DataTable<T extends object>({
  data,
  columns,
  className,
  caption,
  toolbar,
  emptyMessage = "No hay resultados.",
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const isMobile = useIsMobile();

  const table = useReactTable({
    data,
    columns,
    defaultColumn: { sortingFn: spanishSort },
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  const search = (
    <div className="w-full sm:max-w-sm">
      <Input
        type="search"
        placeholder="Buscar..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        aria-label={caption ? `Buscar en ${caption}` : "Buscar"}
        icon={<Search className="h-[18px] w-[18px]" />}
      />
    </div>
  );

  // Announced politely when the search changes the number of results
  const resultCount = (
    <p className="text-fg-muted text-sm" aria-live="polite">
      {total === 1 ? "1 resultado" : `${total} resultados`}
    </p>
  );

  const empty = (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <ClipboardList className="text-fg-muted mb-3 h-10 w-10" aria-hidden="true" />
      <p className="text-fg-muted text-sm">{emptyMessage}</p>
    </div>
  );

  const pagination = table.getPageCount() > 1 && (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-fg-muted text-sm">
        Mostrando <span className="text-fg font-semibold">{from}</span>–
        <span className="text-fg font-semibold">{to}</span> de{" "}
        <span className="text-fg font-semibold">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          variant="outline"
          aria-label="Primera página"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft aria-hidden="true" />
        </IconButton>
        <IconButton
          variant="outline"
          aria-label="Página anterior"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft aria-hidden="true" />
        </IconButton>
        <span className="text-fg px-2 text-sm whitespace-nowrap">
          Página {pageIndex + 1} de {table.getPageCount()}
        </span>
        <IconButton
          variant="outline"
          aria-label="Página siguiente"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight aria-hidden="true" />
        </IconButton>
        <IconButton
          variant="outline"
          aria-label="Última página"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight aria-hidden="true" />
        </IconButton>
      </div>
    </nav>
  );

  // ---------- Phone: search + card list ----------
  if (isMobile) {
    return (
      <div className={`flex flex-col gap-4 ${className ?? ""}`}>
        <div className="flex flex-col gap-2">
          {search}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {resultCount}
            {toolbar}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="border-line bg-surface rounded-2xl border">{empty}</div>
        ) : (
          <ul className="flex flex-col gap-3" aria-label={caption}>
            {rows.map((row) => (
              <li
                key={row.id}
                className="border-line bg-surface rounded-2xl border p-4 shadow-sm"
              >
                <dl className="grid gap-3">
                  {row.getVisibleCells().map((cell) => {
                    const label = headerText(cell.column.columnDef.header, "");
                    return (
                      <div key={cell.id} className="min-w-0">
                        {label && (
                          <dt className="text-fg-muted text-xs font-semibold tracking-wide uppercase">
                            {label}
                          </dt>
                        )}
                        <dd className="text-fg mt-0.5 break-words">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </li>
            ))}
          </ul>
        )}

        {pagination}
      </div>
    );
  }

  // ---------- Desktop: one framed panel (toolbar · table · pagination) ----------
  return (
    <section
      aria-label={caption}
      className={`border-line bg-surface overflow-hidden rounded-2xl border shadow-sm ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
        {search}
        <div className="flex flex-wrap items-center gap-4">
          {toolbar}
          {resultCount}
        </div>
      </div>

      <div className="border-line overflow-x-auto border-t">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <HeaderCell key={header.id} header={header} />
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length}>{empty}</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-line even:bg-surface-muted hover:bg-accent/5 border-t transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="text-fg px-4 py-3 align-middle whitespace-nowrap first:pl-5 last:pr-5"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && <div className="border-line border-t px-4 py-3 sm:px-5">{pagination}</div>}
    </section>
  );
}

// Header style; padding lives on the <th> (plain) or on its <button> (sortable)
const thBase =
  "group bg-brand-azul text-xs font-semibold tracking-wide whitespace-nowrap text-white uppercase";
const cellPadding = "px-4 py-3";

/** Sortable headers are real buttons with aria-sort on the <th> (WCAG 2.1.1, 4.1.2). */
function HeaderCell<T>({ header }: { header: Header<T, unknown> }) {
  const content = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext());

  if (!header.column.getCanSort()) {
    return (
      <th scope="col" className={`${thBase} ${cellPadding} first:pl-5 last:pr-5`}>
        {content}
      </th>
    );
  }

  const sorted = header.column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  const name = headerText(header.column.columnDef.header, header.column.id);
  const next =
    sorted === "asc" ? "descendente" : sorted === "desc" ? "sin orden" : "ascendente";

  return (
    <th
      scope="col"
      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
      className={thBase}
    >
      <button
        type="button"
        onClick={header.column.getToggleSortingHandler()}
        title={`Ordenar ${name}: ${next}`}
        className="flex w-full cursor-pointer items-center gap-1.5 px-4 py-3 text-left uppercase group-first:pl-5 group-last:pr-5 hover:bg-white/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
      >
        {content}
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${sorted ? "" : "opacity-60"}`}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}
