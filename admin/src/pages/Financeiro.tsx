import { useEffect, useMemo, useState } from "react";
import { addMonths, addYears, endOfMonth, endOfYear, getYear, setMonth as withMonth, startOfMonth, startOfYear } from "date-fns";
import { CalendarClock, ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, PageHeader, SectionTitle, Segmented, Select, Spinner, Stat, Switch, cx } from "../components/ui";
import { friendlyError } from "../lib/errors";
import { brl, cap, fmt, toDateInput } from "../lib/format";
import { useLoad } from "../lib/hooks";
import { run, supabase } from "../lib/supabase";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_LABEL,
  type Appointment,
  type PaymentMethod,
  type RecurringExpense,
  type Transaction,
} from "../lib/types";

type View = "mes" | "ano";

export default function Financeiro() {
  const [view, setView] = useState<View>("mes");
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [editing, setEditing] = useState<Transaction | "new" | "new-recurring" | null>(null);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [receiving, setReceiving] = useState<Appointment | null>(null);

  // Período na tela: o mês escolhido ou o ano inteiro dele
  const from = toDateInput(view === "mes" ? month : startOfYear(month));
  const to = toDateInput(view === "mes" ? endOfMonth(month) : endOfYear(month));
  const monthFrom = toDateInput(month);
  const monthTo = toDateInput(endOfMonth(month));

  const tx = useLoad(
    // Antes de carregar, lança as despesas fixas que faltam até o mês atual
    async () => (await supabase.rpc("generate_recurring_expenses"), run(supabase.from("transactions").select("*, appointments(starts_at)").gte("date", from).lte("date", to).order("date", { ascending: false }).order("created_at", { ascending: false })) as Promise<Transaction[]>),
    [from, to],
  );
  const recurring = useLoad(
    () => run(supabase.from("recurring_expenses").select("*").order("day_of_month").order("description")) as Promise<RecurringExpense[]>,
    [],
  );
  const pending = useLoad(
    () => run(supabase.from("appointments").select("*, clients(name, whatsapp)").eq("status", "concluido").eq("paid", false).order("starts_at")) as Promise<Appointment[]>,
    [],
  );

  const list = tx.data ?? [];
  const income = list.filter((t) => t.kind === "entrada");
  const expenses = list.filter((t) => t.kind === "despesa");
  const totalIn = income.reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const fromAppointments = income.filter((t) => t.appointment_id);
  const ticket = fromAppointments.length ? fromAppointments.reduce((s, t) => s + Number(t.amount), 0) / fromAppointments.length : 0;
  const pendingList = pending.data ?? [];
  const pendingTotal = pendingList.reduce((s, a) => s + Number(a.price), 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, { kind: Transaction["kind"]; total: number }>();
    for (const t of list) {
      const key = `${t.kind}:${t.category}`;
      const cur = map.get(key) ?? { kind: t.kind, total: 0 };
      cur.total += Number(t.amount);
      map.set(key, cur);
    }
    return [...map.entries()]
      .map(([key, v]) => ({ category: key.split(":")[1], ...v }))
      .sort((a, b) => (a.kind === b.kind ? b.total - a.total : a.kind === "entrada" ? -1 : 1));
  }, [list]);
  const maxCategory = Math.max(1, ...byCategory.map((c) => c.total));

  const reloadAll = async () => {
    await tx.reload();
    pending.reload();
    recurring.reload();
  };

  // Meses futuros: despesas fixas que ainda vão ser lançadas (só aviso, não entram nos totais)
  const recurringList = recurring.data ?? [];
  const projected =
    view === "mes"
      ? recurringList.filter((r) => r.active && r.start_month <= monthFrom && (!r.generated_until || r.generated_until < monthFrom))
      : [];
  const projectedTotal = projected.reduce((s, r) => s + Number(r.amount), 0);

  function openMonth(index: number) {
    setMonth(startOfMonth(withMonth(month, index)));
    setView("mes");
  }

  const shift = (direction: 1 | -1) => setMonth(view === "mes" ? addMonths(month, direction) : startOfMonth(addYears(month, direction)));
  const today = toDateInput(new Date());

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Entradas, despesas e o que falta receber"
        action={
          <Button onClick={() => setEditing("new")} aria-label="Novo lançamento">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Lançamento</span>
          </Button>
        }
      />

      <Segmented
        value={view}
        onChange={setView}
        className="mb-4 md:max-w-[14rem]"
        options={[
          { value: "mes", label: "Mês" },
          { value: "ano", label: "Ano" },
        ]}
      />

      <div className="flex items-center justify-between rounded-full bg-muted p-1">
        <button type="button" onClick={() => shift(-1)} aria-label={view === "mes" ? "Mês anterior" : "Ano anterior"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-card">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-medium">{view === "mes" ? cap(fmt(month, "MMMM 'de' yyyy")) : getYear(month)}</span>
        <button type="button" onClick={() => shift(1)} aria-label={view === "mes" ? "Próximo mês" : "Próximo ano"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-card">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {tx.error ? (
        <div className="mt-4"><ErrorBox message={tx.error} onRetry={tx.reload} /></div>
      ) : tx.loading && !tx.data ? (
        <Spinner />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            <Stat label="Entradas" value={brl(totalIn)} />
            <Stat label="Despesas" value={brl(totalOut)} />
            <Stat label="Resultado" value={brl(totalIn - totalOut)} tone={totalIn - totalOut >= 0 ? "positive" : "negative"} />
            <Stat label="Ticket médio" value={brl(ticket)} hint={`${fromAppointments.length} atendimentos pagos`} />
          </div>

          {projected.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Repeat className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Previstas: {brl(projectedTotal)} em {projected.length} despesa{projected.length > 1 ? "s" : ""} fixa{projected.length > 1 ? "s" : ""}, lançadas
              quando o mês chegar.
            </p>
          )}

          {view === "ano" && <YearOverview year={getYear(month)} transactions={list} onMonth={openMonth} />}

          {/* A receber */}
          <SectionTitle>A receber</SectionTitle>
          {pendingList.length === 0 ? (
            <Card className="px-4 py-4 text-sm text-muted-foreground">Tudo recebido. Nenhum atendimento concluído sem pagamento.</Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <span className="text-sm text-muted-foreground">{pendingList.length} atendimento(s) concluído(s)</span>
                <span className="font-semibold tabular-nums text-taupe">{brl(pendingTotal)}</span>
              </div>
              <ul className="divide-y divide-border/70">
                {pendingList.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                    <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.clients?.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {a.service_name} · {fmt(a.starts_at, "dd/MM")}
                      </p>
                    </div>
                    <span className="tabular-nums">{brl(a.price)}</span>
                    <Button size="sm" variant="secondary" onClick={() => setReceiving(a)}>
                      Recebi
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Gráfico por categoria */}
          <SectionTitle>{view === "ano" ? "Por categoria no ano" : "Por categoria"}</SectionTitle>
          {byCategory.length === 0 ? (
            <Card className="px-4 py-4 text-sm text-muted-foreground">Sem lançamentos {view === "ano" ? "neste ano" : "neste mês"}.</Card>
          ) : (
            <Card className="space-y-3 p-4">
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-chart-in" /> Entradas</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-chart-out" /> Despesas</span>
              </div>
              {byCategory.map((c) => (
                <div key={`${c.kind}-${c.category}`}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>
                      {c.category} <span className="text-xs text-muted-foreground">· {c.kind === "entrada" ? "entrada" : "despesa"}</span>
                    </span>
                    <span className="tabular-nums">{brl(c.total)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cx("h-full rounded-full", c.kind === "entrada" ? "bg-chart-in" : "bg-chart-out")}
                      style={{ width: `${(c.total / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Lançamentos (só no mês) */}
          {view === "mes" && (
            <>
              <SectionTitle>Lançamentos</SectionTitle>
              {list.length === 0 && projected.length === 0 ? (
                <Empty title="Nada por aqui ainda" action={<Button variant="outline" onClick={() => setEditing("new")}>Adicionar lançamento</Button>}>
                  Agendamentos marcados como pagos entram sozinhos. Despesas você adiciona aqui.
                </Empty>
              ) : (
                <Card className="divide-y divide-border/70">
                  {projected.map((r) => (
                    <button key={`prevista-${r.id}`} type="button" onClick={() => setEditingRecurring(r)} className="flex w-full items-center gap-3 bg-muted/30 px-4 py-3 text-left text-muted-foreground hover:bg-muted/50">
                      <div className="w-10 shrink-0 text-center">
                        <p className="text-base font-semibold leading-none tabular-nums">{String(r.day_of_month).padStart(2, "0")}</p>
                        <p className="text-[0.65rem] uppercase">{fmt(month, "MMM")}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.description}</p>
                        <p className="flex items-center gap-1.5 truncate text-xs">
                          {r.category} <Badge className="border border-dashed border-border bg-transparent">prevista</Badge>
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums">− {brl(r.amount)}</span>
                    </button>
                  ))}
                  {list.map((t) => (
                    <button key={t.id} type="button" onClick={() => setEditing(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                      <div className="w-10 shrink-0 text-center">
                        <p className="text-base font-semibold leading-none tabular-nums">{fmt(t.date, "dd")}</p>
                        <p className="text-[0.65rem] uppercase text-muted-foreground">{fmt(t.date, "MMM")}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{t.description || t.category}</p>
                        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          {t.category}
                          {t.payment_method && ` · ${PAYMENT_LABEL[t.payment_method]}`}
                          {t.appointment_id && <Badge className="bg-primary/10 text-primary">agenda</Badge>}
                          {t.appointments && t.appointments.starts_at.slice(0, 10) !== t.date && (
                            <span className="text-muted-foreground">· atendimento em {fmt(t.appointments.starts_at, "dd/MM/yy")}</span>
                          )}
                          {t.recurring_id && (
                            <Badge className="bg-muted text-muted-foreground">
                              <Repeat className="h-3 w-3" aria-hidden="true" /> fixa
                            </Badge>
                          )}
                        </p>
                      </div>
                      <span className={cx("font-semibold tabular-nums", t.kind === "entrada" ? "text-primary" : "text-taupe")}>
                        {t.kind === "entrada" ? "+" : "−"} {brl(t.amount)}
                      </span>
                    </button>
                  ))}
                </Card>
              )}

              <SectionTitle
                action={
                  <Button size="sm" variant="secondary" onClick={() => setEditing("new-recurring")}>
                    <Plus className="h-4 w-4" /> Fixa
                  </Button>
                }
              >
                Despesas fixas
              </SectionTitle>
              {recurringList.length === 0 ? (
                <Card className="px-4 py-4 text-sm text-muted-foreground">
                  Aluguel, internet, contador… Cadastre uma vez e ela é lançada sozinha todo mês.
                </Card>
              ) : (
                <Card className="divide-y divide-border/70">
                  {recurringList.map((r) => (
                    <button key={r.id} type="button" onClick={() => setEditingRecurring(r)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                      <Repeat className={cx("h-4 w-4 shrink-0", r.active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className={cx("truncate font-medium", !r.active && "text-muted-foreground")}>{r.description}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.category} · todo dia {r.day_of_month}
                          {r.payment_method && ` · ${PAYMENT_LABEL[r.payment_method]}`}
                        </p>
                      </div>
                      {!r.active && <Badge>pausada</Badge>}
                      <span className="tabular-nums">{brl(r.amount)}</span>
                    </button>
                  ))}
                </Card>
              )}
            </>
          )}
        </>
      )}

      <TransactionSheet
        transaction={editing === "new" || editing === "new-recurring" ? null : editing}
        defaultRecurring={editing === "new-recurring"}
        open={editing !== null}
        defaultDate={today >= monthFrom && today <= monthTo ? today : monthFrom}
        onClose={() => setEditing(null)}
        onSaved={reloadAll}
      />
      <ReceiveSheet appointment={receiving} onClose={() => setReceiving(null)} onSaved={reloadAll} />
      <RecurringSheet item={editingRecurring} onClose={() => setEditingRecurring(null)} onSaved={reloadAll} />
    </>
  );
}

/* ---------- Visão anual: gráfico mês a mês + tabela ---------- */

const compactNumber = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const plainNumber = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
/** Valor sem "R$" e sem centavos, para caber na tabela do celular: 2.984 */
const reais = (v: number) => plainNumber.format(Math.round(v));

/** Topo "redondo" para o eixo: 1, 2, 2.5, 5 ou 10 × potência de 10. */
function niceMax(value: number) {
  if (value <= 0) return 100;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value) ?? 10;
  return step * power;
}

function YearOverview({ year, transactions, onMonth }: { year: number; transactions: Transaction[]; onMonth: (index: number) => void }) {
  const [active, setActive] = useState<number | null>(null);
  const now = new Date();

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
        const inMonth = transactions.filter((t) => t.date.startsWith(prefix));
        const entradas = inMonth.filter((t) => t.kind === "entrada").reduce((s, t) => s + Number(t.amount), 0);
        const despesas = inMonth.filter((t) => t.kind === "despesa").reduce((s, t) => s + Number(t.amount), 0);
        return { i, date: new Date(year, i, 1), entradas, despesas, resultado: entradas - despesas, count: inMonth.length };
      }),
    [transactions, year],
  );
  const top = niceMax(Math.max(...months.map((m) => Math.max(m.entradas, m.despesas))));
  const ticks = [top, top / 2, 0];
  const pct = (v: number) => `${(v / top) * 100}%`;
  const current = (i: number) => year === now.getFullYear() && i === now.getMonth();
  const best = months.reduce((b, m) => (m.resultado > b.resultado ? m : b), months[0]);
  const sel = active !== null ? months[active] : null;

  return (
    <>
      <SectionTitle>Mês a mês</SectionTitle>
      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-chart-in" /> Entradas</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-chart-out" /> Despesas</span>
          </div>
          {best.resultado > 0 && <span>Melhor mês: {cap(fmt(best.date, "MMMM"))} ({brl(best.resultado)})</span>}
        </div>

        {/* Detalhe do mês tocado / com o mouse em cima */}
        <div className="mb-6 min-h-[2.75rem] rounded-xl bg-muted/60 px-3 py-2 text-xs">
          {sel ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-semibold text-foreground">{cap(fmt(sel.date, "MMMM"))}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-chart-in" /> {brl(sel.entradas)}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-chart-out" /> {brl(sel.despesas)}</span>
              <span className={sel.resultado >= 0 ? "text-primary" : "text-danger"}>Resultado {brl(sel.resultado)}</span>
              <button type="button" className="ml-auto font-medium text-primary" onClick={() => onMonth(sel.i)}>
                Ver mês →
              </button>
            </div>
          ) : (
            <span className="leading-7 text-muted-foreground">Toque num mês para ver os valores.</span>
          )}
        </div>

        <div className="flex gap-2" onMouseLeave={() => setActive(null)}>
          {/* Eixo de valores */}
          <div className="relative h-44 w-9 shrink-0 text-right text-[0.65rem] tabular-nums text-muted-foreground">
            <span className="absolute -top-5 right-0">R$</span>
            {ticks.map((t, k) => (
              <span key={t} className="absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(k / (ticks.length - 1)) * 100}%` }}>
                {t === 0 ? "0" : compactNumber.format(t)}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative h-44">
              {ticks.map((t, k) => (
                <div key={t} className={cx("absolute inset-x-0 border-t", t === 0 ? "border-border" : "border-dashed border-border/60")} style={{ top: `${(k / (ticks.length - 1)) * 100}%` }} />
              ))}
              <div className="absolute inset-0 flex">
                {months.map((m) => (
                  <button
                    key={m.i}
                    type="button"
                    onMouseEnter={() => setActive(m.i)}
                    onFocus={() => setActive(m.i)}
                    onClick={() => setActive(active === m.i ? null : m.i)}
                    className={cx("flex h-full flex-1 items-end justify-center gap-[2px] rounded-md px-[1px]", active === m.i && "bg-muted/70")}
                    aria-label={`${cap(fmt(m.date, "MMMM"))}: entradas ${brl(m.entradas)}, despesas ${brl(m.despesas)}`}
                  >
                    {m.entradas > 0 && <span className="w-[40%] max-w-[14px] rounded-t-[4px] bg-chart-in" style={{ height: pct(m.entradas) }} />}
                    {m.despesas > 0 && <span className="w-[40%] max-w-[14px] rounded-t-[4px] bg-chart-out" style={{ height: pct(m.despesas) }} />}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1.5 flex">
              {months.map((m) => (
                <span key={m.i} className={cx("flex-1 text-center text-[0.65rem] uppercase", current(m.i) ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  <span className="sm:hidden">{fmt(m.date, "MMMMM")}</span>
                  <span className="hidden sm:inline">{fmt(m.date, "MMM")}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabela: os mesmos números, para ler com precisão */}
      <Card className="mt-3 overflow-hidden">
        <table className="w-full text-[13px] sm:text-sm">
          <thead className="bg-muted/50 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Mês</th>
              <th className="px-2 py-2 text-right font-medium">Entradas</th>
              <th className="px-2 py-2 text-right font-medium">Despesas</th>
              <th className="px-3 py-2 text-right font-medium">Resultado</th>
            </tr>
            <tr>
              <th colSpan={4} className="px-3 pb-2 text-left text-[0.65rem] font-normal normal-case tracking-normal">Valores em reais, sem centavos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {months.map((m) => (
              <tr
                key={m.i}
                onClick={() => onMonth(m.i)}
                className={cx("cursor-pointer tabular-nums hover:bg-muted/50", m.count === 0 && "text-muted-foreground/70", current(m.i) && "font-medium")}
              >
                <td className="px-3 py-2">{cap(fmt(m.date, "MMM"))}</td>
                <td className="px-2 py-2 text-right">{m.entradas ? reais(m.entradas) : "—"}</td>
                <td className="px-2 py-2 text-right">{m.despesas ? reais(m.despesas) : "—"}</td>
                <td className={cx("px-3 py-2 text-right", m.count > 0 && (m.resultado >= 0 ? "text-primary" : "text-danger"))}>
                  {m.count ? reais(m.resultado) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted/40 font-semibold tabular-nums">
            <tr>
              <td className="px-3 py-2">Total</td>
              <td className="px-2 py-2 text-right">{reais(months.reduce((s, m) => s + m.entradas, 0))}</td>
              <td className="px-2 py-2 text-right">{reais(months.reduce((s, m) => s + m.despesas, 0))}</td>
              <td className="px-3 py-2 text-right">{reais(months.reduce((s, m) => s + m.resultado, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </>
  );
}

function TransactionSheet({ transaction, open, defaultDate, defaultRecurring = false, onClose, onSaved }: {
  transaction: Transaction | null;
  open: boolean;
  defaultRecurring?: boolean;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [kind, setKind] = useState<Transaction["kind"]>("despesa");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [payment, setPayment] = useState<PaymentMethod | "">("");
  const [repeat, setRepeat] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fromAgenda = Boolean(transaction?.appointment_id);
  const day = Number(date.slice(8, 10));

  useEffect(() => {
    if (!open) return;
    setError(null);
    setKind(transaction?.kind ?? "despesa");
    setAmount(transaction ? String(transaction.amount) : "");
    setDate(transaction?.date ?? defaultDate);
    setCategory(transaction?.category ?? EXPENSE_CATEGORIES[0]);
    setDescription(transaction?.description ?? "");
    setPayment(transaction?.payment_method ?? "");
    setRepeat(!transaction && defaultRecurring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id]);

  const categories: readonly string[] = kind === "despesa" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function changeKind(next: Transaction["kind"]) {
    setKind(next);
    setCategory(next === "despesa" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  }

  async function save() {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return setError("Digite um valor maior que zero.");
    setSaving(true);
    setError(null);
    const payload = { kind, amount: value, date, category, description: description.trim() || null, payment_method: payment || null };
    let createdRecurring: string | null = null;
    try {
      if (transaction) {
        await run(supabase.from("transactions").update(payload).eq("id", transaction.id));
      } else if (repeat && kind === "despesa") {
        // Cria a despesa fixa e já lança este mês; os próximos o banco lança sozinho
        const firstMonth = `${date.slice(0, 7)}-01`;
        const created = (await run(
          supabase
            .from("recurring_expenses")
            .insert({
              description: description.trim() || category,
              category,
              amount: value,
              day_of_month: day,
              payment_method: payment || null,
              start_month: firstMonth,
              generated_until: firstMonth,
            })
            .select("id")
            .single(),
        )) as { id: string };
        createdRecurring = created.id;
        await run(supabase.from("transactions").insert({ ...payload, description: description.trim() || category, recurring_id: created.id }));
      } else {
        await run(supabase.from("transactions").insert(payload));
      }
      toast(createdRecurring ? "Despesa fixa criada. Ela será lançada todo mês." : "Lançamento salvo.");
      onSaved();
      onClose();
    } catch (err) {
      if (createdRecurring) await supabase.from("recurring_expenses").delete().eq("id", createdRecurring);
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!transaction) return;
    const ok = await confirm({
      title: "Excluir lançamento?",
      message: transaction.recurring_id
        ? "Sai só o lançamento deste mês. A despesa fixa continua nos próximos meses (para parar, edite em Despesas fixas)."
        : `${transaction.description || transaction.category} · ${brl(transaction.amount)}. Não dá para desfazer.`,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await run(supabase.from("transactions").delete().eq("id", transaction.id));
      toast("Lançamento excluído.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={transaction ? "Lançamento" : repeat ? "Nova despesa fixa" : "Novo lançamento"}
      footer={
        fromAgenda ? undefined : (
          <div className="flex gap-2">
            {transaction && <Button variant="danger" onClick={remove} disabled={saving}>Excluir</Button>}
            <Button className="ml-auto min-w-28" onClick={save} loading={saving}>Salvar</Button>
          </div>
        )
      }
    >
      {fromAgenda ? (
        <div className="space-y-3 text-sm">
          <p className="text-lg font-medium">{transaction?.description}</p>
          <p className="text-muted-foreground">
            {brl(transaction?.amount)} · {transaction && fmt(transaction.date, "dd/MM/yyyy")}
            {transaction?.payment_method && ` · ${PAYMENT_LABEL[transaction.payment_method]}`}
          </p>
          <p className="rounded-xl bg-muted px-3.5 py-3">
            Esta entrada foi criada pelo agendamento marcado como pago. Para mudar o valor ou removê-la, edite o agendamento na Agenda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <Segmented value={kind} onChange={changeKind} options={[{ value: "despesa", label: "Despesa" }, { value: "entrada", label: "Entrada" }]} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)">
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" autoFocus />
            </Field>
            <Field label="Data">
              <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Categoria">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Descrição">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={kind === "despesa" ? "Ex.: óleos essenciais" : "Ex.: venda de vale-presente"} />
          </Field>
          <Field label="Forma de pagamento">
            <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod | "")}>
              <option value="">—</option>
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>)}
            </Select>
          </Field>
          {!transaction && kind === "despesa" && (
            <div className="rounded-xl bg-muted/60 px-4 py-3">
              <Switch
                checked={repeat}
                onChange={setRepeat}
                label="Repetir todo mês"
                description={
                  repeat
                    ? `Despesa fixa: lançada sozinha todo dia ${day}${day > 28 ? " (ou no último dia do mês)" : ""} a partir deste mês.`
                    : "Para aluguel, internet, contador e outras despesas que se repetem."
                }
              />
            </div>
          )}
          {transaction?.recurring_id && (
            <p className="flex gap-2 rounded-xl bg-muted px-3.5 py-3 text-sm text-muted-foreground">
              <Repeat className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Despesa fixa. Mudanças aqui valem só para este mês; para mudar os próximos, edite em Despesas fixas.
            </p>
          )}
          {error && <p className="rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
        </div>
      )}
    </Sheet>
  );
}

/** Edita uma despesa fixa: vale para os próximos meses (os já lançados não mudam). */
function RecurringSheet({ item, onClose, onSaved }: { item: RecurringExpense | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ description: "", category: EXPENSE_CATEGORIES[0] as string, amount: "", day: "5", payment: "" as PaymentMethod | "", active: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setError(null);
    setForm({
      description: item.description,
      category: item.category,
      amount: String(item.amount),
      day: String(item.day_of_month),
      payment: item.payment_method ?? "",
      active: item.active,
    });
  }, [item]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!item) return;
    const value = Number(form.amount.replace(",", "."));
    const day = Number(form.day);
    if (form.description.trim().length < 2) return setError("Digite a descrição.");
    if (!value || value <= 0) return setError("Digite um valor maior que zero.");
    if (!day || day < 1 || day > 31) return setError("Dia entre 1 e 31.");
    setSaving(true);
    setError(null);
    const payload: Partial<RecurringExpense> = {
      description: form.description.trim(),
      category: form.category,
      amount: value,
      day_of_month: day,
      payment_method: form.payment || null,
      active: form.active,
    };
    // Ao reativar, não lança os meses em que ficou pausada: recomeça a partir deste mês
    if (!item.active && form.active) {
      const lastMonth = toDateInput(startOfMonth(addMonths(new Date(), -1)));
      if (!item.generated_until || item.generated_until < lastMonth) payload.generated_until = lastMonth;
    }
    try {
      await run(supabase.from("recurring_expenses").update(payload).eq("id", item.id));
      toast("Despesa fixa salva.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function stop() {
    if (!item) return;
    const ok = await confirm({
      title: "Parar de repetir?",
      message: `“${item.description}” deixa de ser lançada nos próximos meses. Os meses já lançados continuam no Financeiro.`,
      confirmLabel: "Parar de repetir",
    });
    if (!ok) return;
    setSaving(true);
    try {
      await run(supabase.from("recurring_expenses").delete().eq("id", item.id));
      toast("Despesa fixa encerrada.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={item !== null}
      onClose={onClose}
      title="Despesa fixa"
      footer={
        <div className="flex gap-2">
          <Button variant="danger" onClick={stop} disabled={saving}>Parar de repetir</Button>
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="rounded-xl bg-muted px-3.5 py-3 text-sm text-muted-foreground">
          Mudanças valem para os próximos meses. Os lançamentos que já entraram não mudam (edite cada um na lista, se precisar).
        </p>
        <Field label="Descrição">
          <Input value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <Input inputMode="decimal" value={form.amount} onChange={(e) => set("amount", e.target.value)} />
          </Field>
          <Field label="Todo dia" hint="Se o mês for mais curto, usa o último dia.">
            <Input inputMode="numeric" value={form.day} onChange={(e) => set("day", e.target.value.replace(/\D/g, "").slice(0, 2))} />
          </Field>
        </div>
        <Field label="Categoria">
          <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Forma de pagamento">
          <Select value={form.payment} onChange={(e) => set("payment", e.target.value as PaymentMethod | "")}>
            <option value="">—</option>
            {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>)}
          </Select>
        </Field>
        <div className="rounded-xl bg-muted/60 px-4 py-3">
          <Switch
            checked={form.active}
            onChange={(v) => set("active", v)}
            label="Lançar todo mês"
            description={form.active ? "Ativa." : "Pausada: não lança nos próximos meses até você reativar."}
          />
        </div>
        {error && <p className="rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}

function ReceiveSheet({ appointment, onClose, onSaved }: { appointment: Appointment | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPayment(appointment?.payment_method ?? "pix");
    setError(null);
  }, [appointment]);

  async function confirm() {
    if (!appointment) return;
    setSaving(true);
    try {
      await run(supabase.from("appointments").update({ paid: true, payment_method: payment }).eq("id", appointment.id));
      toast("Pagamento registrado.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet
      open={appointment !== null}
      onClose={onClose}
      title="Registrar pagamento"
      footer={<Button className="w-full" onClick={confirm} loading={saving}>Confirmar {appointment && brl(appointment.price)}</Button>}
    >
      {appointment && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {appointment.clients?.name} · {appointment.service_name} · {fmt(appointment.starts_at, "dd/MM")}
          </p>
          <Field label="Forma de pagamento">
            <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod)}>
              {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => <option key={p} value={p}>{PAYMENT_LABEL[p]}</option>)}
            </Select>
          </Field>
          {error && <p className="rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
        </div>
      )}
    </Sheet>
  );
}
