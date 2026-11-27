import type { CSSProperties, ReactNode } from "react";
import { Card, cx } from "./ui";

export type DataColumn<T> = {
  key: string;
  header: ReactNode;
  /** Largura no grid do computador (ex.: "5rem", "minmax(0,1fr)") */
  width: string;
  cell: (row: T) => ReactNode;
};

type DataListProps<T> = {
  rows: T[];
  rowKey: (row: T) => string;
  /** Colunas da tabela (computador, a partir de md) */
  columns: DataColumn<T>[];
  /** Conteúdo da linha no celular */
  mobile: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
  /** Ação fora da área clicável da linha (ex.: botão de WhatsApp), com largura fixa para alinhar */
  trailing?: (row: T) => ReactNode;
  rowClassName?: (row: T) => string | false | undefined;
  /** Esmaece a lista enquanto a próxima página carrega */
  busy?: boolean;
  footer?: ReactNode;
};

/**
 * Lista responsiva: tabela com cabeçalho no computador e linhas compactas no celular.
 * Cada linha é um botão (abre o item); `trailing` fica fora do botão.
 */
export function DataList<T>({ rows, rowKey, columns, mobile, onRowClick, trailing, rowClassName, busy, footer }: DataListProps<T>) {
  const grid: CSSProperties = { gridTemplateColumns: columns.map((c) => c.width).join(" ") };

  return (
    <Card className={cx("overflow-hidden transition-opacity", busy && "opacity-60")} aria-busy={busy || undefined}>
      <div className="hidden items-center border-b border-border/70 md:flex" aria-hidden="true">
        <div className="grid flex-1 gap-3 py-2.5 pl-4 pr-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground" style={grid}>
          {columns.map((c) => <span key={c.key}>{c.header}</span>)}
        </div>
        {trailing && <span className="w-12 shrink-0" />}
      </div>

      <ul className="divide-y divide-border/70">
        {rows.map((row) => (
          <li key={rowKey(row)} className={cx("flex items-center transition-colors hover:bg-muted/50", rowClassName?.(row))}>
            <button type="button" onClick={() => onRowClick?.(row)} className="min-w-0 flex-1 py-3 pl-4 pr-3 text-left">
              <div className="md:hidden">{mobile(row)}</div>
              <div className="hidden items-center gap-3 md:grid" style={grid}>
                {columns.map((c) => <div key={c.key} className="min-w-0">{c.cell(row)}</div>)}
              </div>
            </button>
            {trailing && <span className="flex w-12 shrink-0 justify-center pr-3 max-md:empty:hidden">{trailing(row)}</span>}
          </li>
        ))}
      </ul>

      {footer && <div className="border-t border-border/70">{footer}</div>}
    </Card>
  );
}
