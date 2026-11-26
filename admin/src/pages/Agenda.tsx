import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Banknote, CheckCheck, ChevronLeft, ChevronRight, CircleCheck, Clock, Droplets, Plus, UserX } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { Button, Card, ErrorBox, PageHeader, SectionTitle, Segmented, Spinner, Stat, cx } from "../components/ui";
import { useAppData } from "../lib/appData";
import { brlRound, cap, durationBetween, fmt, minutesOfDay, timeToMinutes, toDateInput } from "../lib/format";
import { useLoad } from "../lib/hooks";
import { slotTimes, SLOT_MINUTES } from "../lib/slots";
import { run, supabase } from "../lib/supabase";
import { ACTIVE_STATUSES, STATUS_LABEL, type Appointment, type Settings, type Status } from "../lib/types";
import { AppointmentSheet, type AppointmentDefaults } from "./AppointmentSheet";

const ROW = 52; // altura em px de cada bloco de 30 min
const WEEK_ROW = 44; // na semana, blocos um pouco mais baixos

type View = "dia" | "semana" | "mes";
type SheetState = { appointment?: Appointment; defaults?: AppointmentDefaults } | null;

const VIEW_KEY = "tspa-agenda-view";
function savedView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "semana" || v === "mes" ? v : "dia";
  } catch {
    return "dia";
  }
}

/** Primeiro nome da profissional do atendimento, só quando há mais de uma ativa. */
function useProfessionalLabel() {
  const { professionals, professionalName } = useAppData();
  const multi = professionals.filter((p) => p.active).length > 1;
  return (a: Appointment) => (multi && a.professional_id ? professionalName(a.professional_id).split(" ")[0] : "");
}

const weekOf = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });
const byDay = (appts: Appointment[], d: Date) => appts.filter((a) => a.starts_at.startsWith(toDateInput(d)));

export default function Agenda() {
  const { settings, professionals } = useAppData();
  const activeProfessionals = Math.max(1, professionals.filter((p) => p.active).length);
  const [, navigate] = useLocation();
  const search = useSearch();
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [view, setViewState] = useState<View>(savedView);
  const [sheet, setSheet] = useState<SheetState>(null);

  function setView(next: View) {
    setViewState(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* navegação privada: só não lembra a escolha */
    }
  }

  function openDay(d: Date) {
    setDay(startOfDay(d));
    setView("dia");
  }

  // Período carregado: a semana do dia escolhido, ou o mês inteiro (com as semanas das pontas)
  const weekStart = weekOf(day);
  const from = view === "mes" ? weekOf(startOfMonth(day)) : weekStart;
  const to = view === "mes" ? addDays(endOfWeek(endOfMonth(day), { weekStartsOn: 1 }), 1) : addDays(weekStart, 7);
  const fromKey = toDateInput(from);
  const toKey = toDateInput(to);

  const { data, loading, error, reload } = useLoad(
    () =>
      run(
        supabase
          .from("appointments")
          .select("*, clients(name, whatsapp)")
          .gte("starts_at", `${fromKey}T00:00:00`)
          .lt("starts_at", `${toKey}T00:00:00`)
          .order("starts_at"),
      ) as Promise<Appointment[]>,
    [fromKey, toKey],
  );

  // Vindo de Clientes/Leads com ?cliente=ID: abre um novo agendamento já com a cliente
  useEffect(() => {
    const clientId = new URLSearchParams(search).get("cliente");
    if (clientId) {
      setSheet({ defaults: { clientId, date: toDateInput(day) } });
      navigate("/agenda", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const appts = data ?? [];
  const dayKey = toDateInput(day);
  const dayAppts = byDay(appts, day);
  const cancelled = dayAppts.filter((a) => a.status === "cancelado");

  // Indicadores do período que está na tela
  const periodAppts =
    view === "dia" ? dayAppts : view === "semana" ? appts : appts.filter((a) => isSameMonth(new Date(a.starts_at), day));
  const periodDays = view === "dia" ? 1 : view === "semana" ? 7 : getDaysInMonth(day);
  const active = periodAppts.filter((a) => ACTIVE_STATUSES.includes(a.status));
  // Tempo disponível = horário aberto × dias × profissionais ativas
  const openMinutes = (timeToMinutes(settings.close_time) - timeToMinutes(settings.open_time)) * periodDays * activeProfessionals;
  const professionalMinutes = active
    .filter((a) => a.needs_professional)
    .reduce((sum, a) => sum + durationBetween(a.starts_at, a.ends_at), 0);
  const occupancy = openMinutes > 0 ? Math.round((professionalMinutes / openMinutes) * 100) : 0;
  const expected = active.reduce((sum, a) => sum + Number(a.price), 0);

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, i);
        return { date: d, count: byDay(appts, d).filter((a) => a.status !== "cancelado").length };
      }),
    [appts, weekStart],
  );

  const subtitle =
    view === "dia"
      ? cap(fmt(day, "EEEE, d 'de' MMMM"))
      : view === "semana"
        ? `${fmt(weekStart, "d")}${isSameMonth(weekStart, addDays(weekStart, 6)) ? "" : fmt(weekStart, " 'de' MMM")} a ${fmt(addDays(weekStart, 6), "d 'de' MMMM")}`
        : cap(fmt(day, "MMMM 'de' yyyy"));

  function shift(direction: 1 | -1) {
    if (view === "mes") setDay(startOfMonth(addMonths(day, direction)));
    else setDay(addDays(day, 7 * direction));
  }

  const showingToday =
    view === "dia" ? isToday(day) : view === "semana" ? isSameDay(weekStart, weekOf(new Date())) : isSameMonth(day, new Date());

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={subtitle}
        action={
          <Button onClick={() => setSheet({ defaults: { date: dayKey } })} aria-label="Novo agendamento">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Agendar</span>
          </Button>
        }
      />

      <Segmented
        value={view}
        onChange={setView}
        className="mb-4 md:max-w-xs"
        options={[
          { value: "dia", label: "Dia" },
          { value: "semana", label: "Semana" },
          { value: "mes", label: "Mês" },
        ]}
      />

      {view === "dia" ? (
        /* Faixa da semana */
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shift(-1)} aria-label="Semana anterior" className="grid h-9 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="grid flex-1 grid-cols-7 gap-1">
            {week.map(({ date, count }) => {
              const selected = isSameDay(date, day);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setDay(date)}
                  className={cx("flex flex-col items-center rounded-2xl py-2 transition-colors", selected ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                  aria-pressed={selected}
                >
                  <span className={cx("text-[0.65rem] uppercase tracking-wider", selected ? "opacity-80" : "text-muted-foreground")}>{fmt(date, "EEEEEE")}</span>
                  <span className={cx("text-base font-semibold tabular-nums", isToday(date) && !selected && "text-primary")}>{fmt(date, "d")}</span>
                  <span className={cx("mt-0.5 h-4 min-w-4 rounded-full px-1 text-[0.65rem] font-semibold leading-4", count ? (selected ? "bg-primary-foreground/20" : "bg-primary/15 text-primary") : "opacity-0")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => shift(1)} aria-label="Próxima semana" className="grid h-9 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-full bg-muted p-1">
          <button type="button" onClick={() => shift(-1)} aria-label={view === "mes" ? "Mês anterior" : "Semana anterior"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-card">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium">{subtitle}</span>
          <button type="button" onClick={() => shift(1)} aria-label={view === "mes" ? "Próximo mês" : "Próxima semana"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-card">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
      {!showingToday && (
        <div className="mt-2 text-center">
          <button type="button" className="text-sm font-medium text-primary" onClick={() => setDay(startOfDay(new Date()))}>
            Voltar para hoje
          </button>
        </div>
      )}

      {/* Indicadores do período */}
      <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
        <Stat label="Atendimentos" value={active.length} />
        <Stat label="Previsto" value={brlRound(expected)} />
        <Stat label="Ocupação" value={`${occupancy}%`} hint={activeProfessionals > 1 ? "da equipe" : "da profissional"} />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorBox message={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : view === "dia" ? (
          <DayGrid
            day={day}
            settings={settings}
            appointments={dayAppts.filter((a) => a.status !== "cancelado")}
            onSlot={(time, room) => setSheet({ defaults: { date: dayKey, time, room } })}
            onOpen={(appointment) => setSheet({ appointment })}
          />
        ) : view === "semana" ? (
          <>
            <div className="hidden md:block">
              <WeekGrid
                weekStart={weekStart}
                settings={settings}
                appointments={appts.filter((a) => a.status !== "cancelado")}
                onSlot={(date, time) => setSheet({ defaults: { date, time } })}
                onOpen={(appointment) => setSheet({ appointment })}
                onDay={openDay}
              />
            </div>
            <div className="md:hidden">
              <WeekList weekStart={weekStart} appointments={appts} onOpen={(appointment) => setSheet({ appointment })} onDay={openDay} />
            </div>
          </>
        ) : (
          <MonthGrid month={day} appointments={appts} onDay={openDay} />
        )}
      </div>

      {data && <StatusLegend />}

      {view === "dia" && cancelled.length > 0 && (
        <>
          <SectionTitle>Cancelados</SectionTitle>
          <Card className="divide-y divide-border/70">
            {cancelled.map((a) => (
              <button key={a.id} type="button" onClick={() => setSheet({ appointment: a })} className="flex w-full items-center justify-between px-4 py-3 text-left">
                <span className="text-muted-foreground line-through">
                  {fmt(a.starts_at, "HH:mm")} · {a.clients?.name} · {a.service_name}
                </span>
              </button>
            ))}
          </Card>
        </>
      )}

      <AppointmentSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        onSaved={reload}
        appointment={sheet?.appointment}
        defaults={sheet?.defaults}
      />
    </>
  );
}

/* ---------- Semana: grade de horários (computador) ---------- */
function WeekGrid({ weekStart, settings, appointments, onSlot, onOpen, onDay }: {
  weekStart: Date;
  settings: Settings;
  appointments: Appointment[];
  onSlot: (date: string, time: string) => void;
  onOpen: (appointment: Appointment) => void;
  onDay: (date: Date) => void;
}) {
  const proLabel = useProfessionalLabel();
  const open = timeToMinutes(settings.open_time);
  const close = timeToMinutes(settings.close_time);
  const slots = slotTimes(settings);
  const height = ((close - open) / SLOT_MINUTES) * WEEK_ROW;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Card className="overflow-hidden">
      <div className="flex border-b border-border/70 bg-card">
        <div className="w-12 shrink-0" />
        {days.map((d) => (
          <button
            key={d.toISOString()}
            type="button"
            onClick={() => onDay(d)}
            className="flex flex-1 flex-col items-center border-l border-border/70 py-2 hover:bg-muted/60"
            aria-label={`Abrir ${fmt(d, "EEEE, d 'de' MMMM")}`}
          >
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{fmt(d, "EEE")}</span>
            <span className={cx("grid h-7 w-7 place-items-center rounded-full text-sm font-semibold tabular-nums", isToday(d) && "bg-primary text-primary-foreground")}>
              {fmt(d, "d")}
            </span>
          </button>
        ))}
      </div>

      <div className="relative flex" style={{ height }}>
        <div className="w-12 shrink-0">
          {slots.map((t) => (
            <div key={t} style={{ height: WEEK_ROW }} className="pr-1.5 pt-1 text-right text-[0.7rem] tabular-nums text-muted-foreground">
              {t.endsWith(":00") ? t : ""}
            </div>
          ))}
        </div>

        {days.map((d) => {
          const key = toDateInput(d);
          const dayList = byDay(appointments, d);
          // Só divide a coluna (Sala 1 à esquerda, Sala 2 à direita) nos dias com atendimento na Sala 2
          const split = dayList.some((a) => a.room === 2);
          return (
            <div key={key} className={cx("relative flex-1 border-l border-border/70", isToday(d) && "bg-primary/[0.03]")}>
              {slots.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSlot(key, t)}
                  style={{ top: i * WEEK_ROW, height: WEEK_ROW }}
                  className={cx("absolute inset-x-0 border-t hover:bg-primary/5", t.endsWith(":00") ? "border-border/70" : "border-dashed border-border/40")}
                  aria-label={`Agendar ${fmt(d, "EEEE")} às ${t}`}
                />
              ))}
              {dayList.map((a) => {
                const top = ((minutesOfDay(a.starts_at) - open) / SLOT_MINUTES) * WEEK_ROW;
                const blockHeight = Math.max((durationBetween(a.starts_at, a.ends_at) / SLOT_MINUTES) * WEEK_ROW - 3, WEEK_ROW - 6);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onOpen(a)}
                    style={{ top: top + 1.5, height: blockHeight }}
                    className={cx(
                      "absolute z-[1] overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left text-[0.7rem] leading-tight shadow-sm",
                      !split ? "inset-x-0.5" : a.room === 1 ? "left-0.5 right-1/2 mr-px" : "left-1/2 right-0.5 ml-px",
                      STATUS_STYLE[a.status],
                    )}
                    title={`${fmt(a.starts_at, "HH:mm")}–${fmt(a.ends_at, "HH:mm")} · ${a.clients?.name ?? ""} · ${a.service_name} · Sala ${a.room}${proLabel(a) ? ` · ${proLabel(a)}` : ""}`}
                  >
                    <span className="block font-semibold tabular-nums">
                      {fmt(a.starts_at, "HH:mm")}
                      {split && <span className="ml-1 font-normal opacity-70">S{a.room}</span>}
                      {a.paid && <Banknote className="ml-0.5 inline h-3 w-3 text-primary" aria-label="Pago" />}
                    </span>
                    <span className="block truncate font-semibold">{a.clients?.name ?? "Cliente"}</span>
                    <span className="block truncate opacity-80">{a.service_name}</span>
                    {proLabel(a) && <span className="block truncate opacity-70">{proLabel(a)}</span>}
                    <StatusLine status={a.status} />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------- Semana: lista por dia (celular) ---------- */
function WeekList({ weekStart, appointments, onOpen, onDay }: {
  weekStart: Date;
  appointments: Appointment[];
  onOpen: (appointment: Appointment) => void;
  onDay: (date: Date) => void;
}) {
  const proLabel = useProfessionalLabel();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="space-y-3">
      {days.map((d) => {
        const list = byDay(appointments, d);
        const count = list.filter((a) => a.status !== "cancelado").length;
        return (
          <Card key={d.toISOString()} className={cx(isToday(d) && "border-primary/50")}>
            <button type="button" onClick={() => onDay(d)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="font-medium">
                {cap(fmt(d, "EEEE, d"))}
                {isToday(d) && <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-primary">hoje</span>}
              </span>
              <span className="text-sm text-muted-foreground">{count ? `${count} atendimento${count > 1 ? "s" : ""}` : "Livre"}</span>
            </button>
            {list.length > 0 && (
              <ul className="divide-y divide-border/70 border-t border-border/70">
                {list.map((a) => (
                  <li key={a.id}>
                    <button type="button" onClick={() => onOpen(a)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50">
                      <span className={cx("h-8 w-1 shrink-0 rounded-full", STATUS_DOT[a.status])} aria-hidden="true" />
                      <span className="w-12 shrink-0 text-sm font-semibold tabular-nums">{fmt(a.starts_at, "HH:mm")}</span>
                      <span className={cx("min-w-0 flex-1", a.status === "cancelado" && "text-muted-foreground line-through")}>
                        <span className="block truncate text-sm font-medium">{a.clients?.name ?? "Cliente"}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {a.service_name} · Sala {a.room}
                          {proLabel(a) && ` · ${proLabel(a)}`}

                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs">
                        <StatusLine status={a.status} />
                        {a.paid && <Banknote className="h-3.5 w-3.5 text-primary" aria-label="Pago" />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Mês: calendário ---------- */
function MonthGrid({ month, appointments, onDay }: { month: Date; appointments: Appointment[]; onDay: (date: Date) => void }) {
  const start = weekOf(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const weekdays = days.slice(0, 7);

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/70">
        {weekdays.map((d) => (
          <span key={d.toISOString()} className="py-2 text-center text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="md:hidden">{fmt(d, "EEEEE")}</span>
            <span className="hidden md:inline">{fmt(d, "EEE")}</span>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const list = byDay(appointments, d).filter((a) => a.status !== "cancelado");
          const inMonth = isSameMonth(d, month);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onDay(d)}
              className={cx(
                "flex min-h-[4.25rem] flex-col items-center gap-1 border-border/70 p-1 text-left hover:bg-muted/60 md:min-h-[6.5rem] md:items-stretch md:p-1.5",
                i % 7 !== 0 && "border-l",
                i >= 7 && "border-t",
                !inMonth && "bg-muted/30 text-muted-foreground/60",
              )}
              aria-label={`${fmt(d, "d 'de' MMMM")}: ${list.length} atendimento(s)`}
            >
              <span
                className={cx(
                  "grid h-7 w-7 place-items-center rounded-full text-sm tabular-nums",
                  isToday(d) ? "bg-primary font-semibold text-primary-foreground" : "font-medium",
                )}
              >
                {fmt(d, "d")}
              </span>
              {/* Celular: quantidade */}
              {list.length > 0 && (
                <span className={cx("rounded-full px-1.5 text-[0.7rem] font-semibold leading-5 md:hidden", inMonth ? "bg-primary/15 text-primary" : "bg-muted")}>
                  {list.length}
                </span>
              )}
              {/* Computador: primeiros horários */}
              <span className="hidden w-full space-y-0.5 md:block">
                {list.slice(0, 3).map((a) => (
                  <span key={a.id} className={cx("block truncate rounded px-1 text-[0.7rem] leading-[1.15rem]", STATUS_CHIP[a.status])}>
                    <span className="font-semibold tabular-nums">{fmt(a.starts_at, "HH:mm")}</span> {a.clients?.name?.split(" ")[0]}
                  </span>
                ))}
                {list.length > 3 && <span className="block px-1 text-[0.7rem] text-muted-foreground">+{list.length - 3} mais</span>}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* Cores dos status:
   Agendado   = aguardando confirmação (ocre, borda tracejada)
   Confirmado = em aberto, confirmado (verde sálvia cheio)
   Concluído  = encerrado (cinza, apagado, com ✓)
   Faltou     = terracota */
const STATUS_DOT: Record<Status, string> = {
  agendado: "bg-ochre",
  confirmado: "bg-primary",
  concluido: "bg-muted-foreground/40",
  faltou: "bg-terracotta",
  cancelado: "bg-border",
};

const STATUS_CHIP: Record<Status, string> = {
  agendado: "border border-dashed border-ochre/70 bg-ochre/10",
  confirmado: "bg-primary/25",
  concluido: "bg-muted text-muted-foreground line-through decoration-muted-foreground/40",
  faltou: "bg-terracotta/15 text-terracotta",
  cancelado: "hidden",
};

const STATUS_STYLE: Record<Status, string> = {
  agendado: "border border-dashed border-ochre/80 border-l-ochre bg-card text-foreground",
  confirmado: "border-primary bg-primary/25 text-foreground",
  concluido: "border-muted-foreground/30 bg-muted/70 text-muted-foreground",
  faltou: "border-terracotta bg-terracotta/12 text-terracotta",
  cancelado: "hidden",
};

const STATUS_TEXT: Record<Status, string> = {
  agendado: "text-ochre",
  confirmado: "text-primary",
  concluido: "text-muted-foreground",
  faltou: "text-terracotta",
  cancelado: "text-muted-foreground",
};

/** Ícone e texto curto do status, mostrados em todos os blocos. */
function StatusLine({ status, className }: { status: Status; className?: string }) {
  const Icon = status === "concluido" ? CheckCheck : status === "confirmado" ? CircleCheck : status === "faltou" ? UserX : Clock;
  const label = status === "agendado" ? "A confirmar" : STATUS_LABEL[status];
  return (
    <span className={cx("flex items-center gap-1 font-medium", STATUS_TEXT[status], className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function StatusLegend() {
  const items: Status[] = ["agendado", "confirmado", "concluido", "faltou"];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((st) => (
        <span key={st} className="flex items-center gap-1.5">
          <span className={cx("h-3.5 w-5 rounded-[5px] border-l-[3px]", STATUS_STYLE[st])} aria-hidden="true" />
          {st === "agendado" ? "A confirmar" : STATUS_LABEL[st]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <Banknote className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Pago
      </span>
    </div>
  );
}

function DayGrid({ day, settings, appointments, onSlot, onOpen }: {
  day: Date;
  settings: Settings;
  appointments: Appointment[];
  onSlot: (time: string, room: 1 | 2) => void;
  onOpen: (appointment: Appointment) => void;
}) {
  const proLabel = useProfessionalLabel();
  const open = timeToMinutes(settings.open_time);
  const close = timeToMinutes(settings.close_time);
  const slots = slotTimes(settings);
  const height = ((close - open) / SLOT_MINUTES) * ROW;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow = isSameDay(day, now) && nowMinutes >= open && nowMinutes <= close;

  return (
    <Card className="overflow-hidden">
      <div className="sticky top-0 z-10 flex border-b border-border/70 bg-card text-sm font-semibold">
        <div className="w-12 shrink-0" />
        <div className="flex-1 border-l border-border/70 px-3 py-2.5">Sala 1</div>
        <div className={cx("flex-1 border-l border-border/70 px-3 py-2.5", !settings.room2_enabled && "text-muted-foreground")}>
          Sala 2 {!settings.room2_enabled && <span className="font-normal">· desativada</span>}
        </div>
      </div>

      <div className="relative flex" style={{ height }}>
        <div className="w-12 shrink-0">
          {slots.map((t) => (
            <div key={t} style={{ height: ROW }} className="pr-1.5 pt-1 text-right text-[0.7rem] tabular-nums text-muted-foreground">
              {t.endsWith(":00") ? t : ""}
            </div>
          ))}
        </div>

        {([1, 2] as const).map((room) => {
          const disabled = room === 2 && !settings.room2_enabled;
          return (
            <div key={room} className="relative flex-1 border-l border-border/70">
              {slots.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSlot(t, room)}
                  style={{ top: i * ROW, height: ROW }}
                  className={cx(
                    "absolute inset-x-0 border-t text-left disabled:cursor-not-allowed",
                    t.endsWith(":00") ? "border-border/70" : "border-dashed border-border/40",
                    !disabled && "hover:bg-primary/5",
                  )}
                  aria-label={`Agendar às ${t} na Sala ${room}`}
                />
              ))}
              {disabled && <div className="blocked-stripes pointer-events-none absolute inset-0 opacity-60" />}

              {appointments
                .filter((a) => a.room === room)
                .map((a) => {
                  const start = minutesOfDay(a.starts_at);
                  const top = ((start - open) / SLOT_MINUTES) * ROW;
                  const blockHeight = Math.max((durationBetween(a.starts_at, a.ends_at) / SLOT_MINUTES) * ROW - 3, ROW - 6);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onOpen(a)}
                      style={{ top: top + 1.5, height: blockHeight }}
                      className={cx(
                        "absolute inset-x-1 z-[1] overflow-hidden rounded-xl border-l-4 px-2 py-1.5 text-left text-xs shadow-sm transition hover:brightness-[0.98]",
                        STATUS_STYLE[a.status],
                      )}
                    >
                      <span className="flex items-center gap-1 font-semibold tabular-nums">
                        {fmt(a.starts_at, "HH:mm")}–{fmt(a.ends_at, "HH:mm")}
                        {a.paid && <Banknote className="h-3.5 w-3.5 text-primary" aria-label="Pago" />}
                        {!a.needs_professional && <Droplets className="h-3.5 w-3.5" aria-label="Não precisa de profissional" />}
                      </span>
                      <span className="block truncate text-[0.8rem] font-semibold">{a.clients?.name ?? "Cliente"}</span>
                      <span className="block truncate opacity-80">{a.service_name}</span>
                      {proLabel(a) && <span className="block truncate opacity-70">{proLabel(a)}</span>}
                      <StatusLine status={a.status} className="mt-0.5" />
                    </button>
                  );
                })}
            </div>
          );
        })}

        {showNow && (
          <div className="pointer-events-none absolute left-10 right-0 z-[2] flex items-center" style={{ top: ((nowMinutes - open) / SLOT_MINUTES) * ROW }}>
            <span className="h-2 w-2 rounded-full bg-danger" />
            <span className="h-px flex-1 bg-danger/70" />
          </div>
        )}
      </div>
    </Card>
  );
}
