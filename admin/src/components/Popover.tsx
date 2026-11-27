import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./ui";

const GAP = 8; // distância entre o botão e o menu
const EDGE = 8; // margem mínima das bordas da tela
const BOTTOM_BAR = 88; // barra de navegação do celular (fica por cima do conteúdo)

/**
 * Menu que abre junto a um botão. Fica por cima de tudo (fora de colunas que cortam o conteúdo),
 * abre para baixo e vira para cima quando não cabe. Fecha ao clicar fora, com Esc,
 * ao rolar a página ou quando `close()` é chamado.
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
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  // Posição: abaixo do botão; se não couber, acima. Alinhado à direita ou à esquerda do botão.
  // Devolve false se o botão saiu da tela (aí o menu fecha).
  const place = useCallback(() => {
    if (!anchor.current || !panel.current) return true;
    const a = anchor.current.getBoundingClientRect();
    const p = panel.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (a.bottom < 0 || a.top > vh || a.right < 0 || a.left > vw) return false;
    const bottomLimit = vh - (vw < 768 ? BOTTOM_BAR : EDGE);
    const fitsBelow = a.bottom + GAP + p.height <= bottomLimit;
    const fitsAbove = a.top - GAP - p.height >= EDGE;
    const top = fitsBelow || !fitsAbove ? Math.min(a.bottom + GAP, Math.max(EDGE, bottomLimit - p.height)) : a.top - GAP - p.height;
    let left = align === "end" ? a.right - p.width : a.left;
    left = Math.min(Math.max(EDGE, left), vw - p.width - EDGE);
    setStyle({ top, left });
    return true;
  }, [align]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) {
      setStyle({ visibility: "hidden" });
      return;
    }
    const inside = (t: EventTarget | null) =>
      Boolean(t && (anchor.current?.contains(t as Node) || panel.current?.contains(t as Node)));
    const onDown = (e: MouseEvent | TouchEvent) => !inside(e.target) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // Rolou a página ou o quadro: o menu acompanha o botão; fecha só se o botão sair da tela
    let frame = 0;
    const onScroll = (e: Event) => {
      if (inside(e.target)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => !place() && setOpen(false));
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [open, place]);

  return (
    <div ref={anchor} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open &&
        createPortal(
          <div
            ref={panel}
            style={style}
            // Não deixa o toque/clique no menu chegar ao card arrastável (React repassa eventos de portais)
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={cx(
              "fixed z-[55] max-h-[70svh] overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-lg",
              className,
            )}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
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
