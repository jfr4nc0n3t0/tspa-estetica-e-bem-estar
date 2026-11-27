import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cx } from "./ui";

export type KanbanColumn<C extends string> = {
  id: C;
  title: string;
  /** Nome curto para as abas do celular (ex.: "Contato") */
  shortTitle?: string;
  /** Texto que aparece na coluna enquanto se arrasta um card para ela (ex.: "Soltar aqui abre o agendamento") */
  dropHint?: string;
  muted?: boolean;
};

type KanbanProps<T, C extends string> = {
  columns: KanbanColumn<C>[];
  items: T[];
  getId: (item: T) => string;
  getColumn: (item: T) => C;
  renderCard: (item: T, opts: { dragging: boolean }) => ReactNode;
  /** Soltou o card em outra coluna */
  onMove: (item: T, to: C) => void;
  empty?: (column: KanbanColumn<C>) => ReactNode;
};

// Primeiro onde o ponteiro está; se não estiver sobre nada, a coluna que mais se sobrepõe
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length ? hits : rectIntersection(args);
};

/**
 * Quadro kanban com arrastar e soltar (mouse, toque e teclado).
 * Computador: colunas lado a lado. Celular: colunas deslizando, com abas no topo;
 * para arrastar no celular, segure o card por meio segundo.
 */
export function Kanban<T, C extends string>({ columns, items, getId, getColumn, renderCard, onMove, empty }: KanbanProps<T, C>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 450, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? items.find((i) => getId(i) === activeId) : undefined;

  // Celular: qual coluna está na tela (para as abas)
  const scroller = useRef<HTMLDivElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      setVisibleIndex(Math.round(el.scrollLeft / (first.offsetWidth + 12)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  function showColumn(index: number) {
    const col = scroller.current?.children[index] as HTMLElement | undefined;
    col?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setVisibleIndex(index);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    navigator.vibrate?.(15);
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const item = items.find((i) => getId(i) === String(e.active.id));
    const to = e.over?.id as C | undefined;
    if (item && to && to !== getColumn(item)) onMove(item, to);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      {/* Celular: abas das colunas */}
      <div className="mb-3 flex gap-1 rounded-full bg-muted p-1 md:hidden" role="tablist" aria-label="Colunas">
        {columns.map((c, i) => {
          const count = items.filter((it) => getColumn(it) === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={visibleIndex === i}
              onClick={() => showColumn(i)}
              className={cx(
                "h-8 min-w-0 flex-1 truncate rounded-full px-1.5 text-xs font-medium transition-colors",
                visibleIndex === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {c.shortTitle ?? c.title} <span className="tabular-nums opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={scroller}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:grid md:snap-none md:grid-cols-4 md:overflow-visible md:px-0"
      >
        {columns.map((c) => (
          <Column
            key={c.id}
            column={c}
            count={items.filter((it) => getColumn(it) === c.id).length}
            dragging={activeId !== null}
            fromHere={active ? getColumn(active) === c.id : false}
          >
            {items
              .filter((it) => getColumn(it) === c.id)
              .map((it) => (
                <DraggableCard key={getId(it)} id={getId(it)}>
                  {renderCard(it, { dragging: false })}
                </DraggableCard>
              ))}
            {items.every((it) => getColumn(it) !== c.id) && empty?.(c)}
          </Column>
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
        {active ? <div className="rotate-[-2deg] cursor-grabbing shadow-xl">{renderCard(active, { dragging: true })}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column<C extends string>({ column, count, dragging, fromHere, children }: {
  column: KanbanColumn<C>;
  count: number;
  dragging: boolean;
  fromHere: boolean;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section
      ref={setNodeRef}
      aria-label={column.title}
      className={cx(
        "flex min-h-[14rem] w-[85%] shrink-0 snap-start flex-col rounded-2xl bg-muted/50 p-2 transition-colors md:w-auto md:min-w-0",
        column.muted && !isOver && "opacity-80",
        isOver && !fromHere && "bg-primary/10 ring-2 ring-primary/40",
      )}
    >
      <p className="flex items-center justify-between px-1.5 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {column.title} <span className="tabular-nums">{count}</span>
      </p>
      <div className="flex flex-1 flex-col gap-2">
        {children}
        {dragging && !fromHere && (
          <div
            className={cx(
              "grid min-h-[3.25rem] place-items-center rounded-xl border-2 border-dashed px-3 text-center text-xs transition-colors",
              isOver ? "border-primary text-primary" : "border-border text-muted-foreground",
            )}
          >
            {column.dropHint ?? "Solte aqui"}
          </div>
        )}
      </div>
    </section>
  );
}

function DraggableCard({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  // Teclado (Espaço/Enter) só arrasta com o foco no próprio card, não nos botões de dentro
  const { onKeyDown, ...pointer } = listeners ?? {};
  return (
    <div
      ref={setNodeRef}
      {...pointer}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget) onKeyDown?.(e);
      }}
      {...attributes}
      role="listitem"
      aria-roledescription="card arrastável"
      className={cx("touch-manipulation rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50", isDragging && "opacity-30")}
    >
      {children}
    </div>
  );
}
