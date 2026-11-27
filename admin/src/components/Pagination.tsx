import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "./ui";

type PaginationProps = {
  page: number; // começa em 1
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  /** "clientes", "leads"… */
  itemLabel?: string;
};

/** Números de página com reticências: 1 … 4 5 6 … 12 */
function pageItems(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pages - 1) items.push("…");
  items.push(pages);
  return items;
}

const arrow = "grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35";

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [20, 30, 50], itemLabel = "itens" }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const prev = (
    <button type="button" className={arrow} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior">
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
  const next = (
    <button type="button" className={arrow} onClick={() => onPageChange(page + 1)} disabled={page >= pages} aria-label="Próxima página">
      <ChevronRight className="h-4 w-4" />
    </button>
  );

  return (
    <nav aria-label="Paginação" className="px-3 py-2.5 text-sm text-muted-foreground">
      {/* Celular */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        {prev}
        <span>
          Página <strong className="font-medium text-foreground">{page}</strong> de {pages} · {total} {itemLabel}
        </span>
        {next}
      </div>

      {/* Computador */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <span className="pl-1 tabular-nums">
          {from}–{to} de {total} {itemLabel}
        </span>
        <div className="flex items-center gap-1">
          {prev}
          {pageItems(page, pages).map((item, i) =>
            item === "…" ? (
              <span key={`gap-${i}`} className="w-6 text-center">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? "page" : undefined}
                className={cx(
                  "h-9 min-w-9 rounded-full border px-2 tabular-nums transition-colors",
                  item === page ? "border-border bg-card font-medium text-foreground shadow-sm" : "border-transparent hover:bg-muted hover:text-foreground",
                )}
              >
                {item}
              </button>
            ),
          )}
          {next}
        </div>
        {onPageSizeChange ? (
          <label className="relative flex items-center gap-1.5">
            Por página
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 cursor-pointer appearance-none rounded-full bg-transparent pl-2 pr-6 font-medium text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {pageSizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 h-3.5 w-3.5" />
          </label>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
