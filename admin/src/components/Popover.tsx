import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./ui";

/**
 * Menu que abre abaixo de um botão. Fecha ao clicar fora, com Esc ou quando `close()` é chamado.
 */
export function Popover({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cx(
            "absolute top-full z-30 mt-2 rounded-2xl border border-border bg-card p-1.5 shadow-lg",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Opção de menu com marcação de escolhida */
export function MenuOption({
  selected,
  onSelect,
  children,
  hint,
  tone,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
  hint?: ReactNode;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
        selected ? "bg-primary/10 font-medium text-primary" : tone === "danger" ? "text-danger hover:bg-danger/10" : "text-foreground hover:bg-muted",
      )}
    >
      <span>{children}</span>
      {hint !== undefined && <span className={cx("tabular-nums", selected || tone ? "" : "text-muted-foreground")}>{hint}</span>}
    </button>
  );
}

export function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={title}>
      <p className="px-3 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
