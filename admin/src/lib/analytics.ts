import { addMonths, addYears, format, getDay, isBefore, parseISO, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { run, supabase } from "./supabase";
import type { LeadSource, Service, Status } from "./types";

/**
 * Tela Análises: tudo é calculado aqui, a partir do que o painel já guarda.
 * Dinheiro segue o Financeiro (entradas pela data do pagamento; pacote conta uma vez, na venda).
 * Atendimentos contam só os concluídos, pela data do atendimento.
 */

export type PeriodKind = "mes" | "ano" | "tudo";
export type Period = { kind: PeriodKind; start: Date; end: Date };

/** Imposto (6%) + maquininha (média entre Pix, débito e crédito, ~1,7%), sobre o que entra. */
export const FEES_RATE = 0.077;
/** Janela usada para o ticket médio e o custo de produtos por atendimento. */
const RECENT_DAYS = 90;

export type BreakEven = {
  /** Despesas fixas ativas (Financeiro → despesas fixas), por mês */
  fixed: number;
  /** Ticket médio dos últimos 90 dias */
  ticket: number;
  /** Despesas de "Produtos" dos últimos 90 dias ÷ atendimentos concluídos no mesmo tempo */
  productsPer: number;
  /** O que sobra de cada atendimento para pagar o custo fixo */
  net: number;
  /** Atendimentos que pagam o mês (null quando falta dado) */
  count: number | null;
  /** Por que não deu para calcular */
  missing: "fixas" | "ticket" | null;
};

/** Quantos atendimentos pagam o mês: custo fixo ÷ o que sobra de cada atendimento. */
export async function loadBreakEven(): Promise<BreakEven> {
  const since = new Date();
  since.setDate(since.getDate() - RECENT_DAYS);
  const [fixedRows, incomeRows, productRows, concluded] = await Promise.all([
    run<{ amount: number }[]>(supabase.from("recurring_expenses").select("amount").eq("active", true)),
    run<{ amount: number }[]>(supabase.from("transactions").select("amount").eq("kind", "entrada").not("appointment_id", "is", null).gte("date", day(since))),
    run<{ amount: number }[]>(supabase.from("transactions").select("amount").eq("kind", "despesa").eq("category", "Produtos").gte("date", day(since))),
    supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "concluido").gte("starts_at", ts(since)),
  ]);
  const fixed = (fixedRows ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const income = incomeRows ?? [];
  const ticket = income.length ? income.reduce((s, r) => s + Number(r.amount), 0) / income.length : 0;
  const done = concluded.count ?? 0;
  const productsPer = done ? (productRows ?? []).reduce((s, r) => s + Number(r.amount), 0) / done : 0;
  const net = ticket * (1 - FEES_RATE) - productsPer;
  const missing = fixed <= 0 ? "fixas" : net <= 0 ? "ticket" : null;
  return { fixed, ticket, productsPer, net, count: missing ? null : Math.ceil(fixed / net), missing };
}

const EPOCH = new Date(2020, 0, 1);

export function periodOf(kind: PeriodKind, anchor: Date): Period {
  if (kind === "mes") {
    const start = startOfMonth(anchor);
    return { kind, start, end: addMonths(start, 1) };
  }
  if (kind === "ano") {
    const start = startOfYear(anchor);
    return { kind, start, end: addYears(start, 1) };
  }
  return { kind, start: EPOCH, end: addYears(startOfYear(new Date()), 1) };
}

export function shiftPeriod(p: Period, delta: number): Period {
  if (p.kind === "tudo") return p;
  return periodOf(p.kind, p.kind === "mes" ? addMonths(p.start, delta) : addYears(p.start, delta));
}

export function previousPeriod(p: Period): Period | null {
  return p.kind === "tudo" ? null : shiftPeriod(p, -1);
}

export function periodLabel(p: Period) {
  if (p.kind === "mes") {
    const s = format(p.start, "MMMM 'de' yyyy", { locale: ptBR });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (p.kind === "ano") return format(p.start, "yyyy");
  return "Desde o início";
}

const day = (d: Date) => format(d, "yyyy-MM-dd");
const ts = (d: Date) => format(d, "yyyy-MM-dd'T'00:00:00");

type ApptRow = {
  id: string;
  client_id: string;
  starts_at: string;
  status: Status;
  service_ids: string[] | null;
  service_name: string;
  package_id: string | null;
};

type TxRow = {
  amount: number;
  appointment_id: string | null;
  package_id: string | null;
  appointments: { client_id: string; service_ids: string[] | null; service_name: string } | null;
  client_packages: { client_id: string; service_name: string } | null;
};

type ClientRow = {
  id: string;
  name: string;
  whatsapp: string | null;
  first_visit: string | null;
  last_visit: string | null;
  days_since_last: number | null;
  next_visit: string | null;
  total_spent: number;
};

type LeadRow = { source: LeadSource; stage: string; client_id: string | null };

type PackageRow = {
  id: string;
  client_id: string;
  service_name: string;
  paid_at: string;
  expires_at: string | null;
  available: number;
  state: "ativo" | "concluido" | "vencido";
};

export type Ranked = { key: string; label: string; detail?: string; count: number; amount: number };

export type Analytics = {
  concluded: number;
  revenue: number;
  ticket: number;
  newClients: number;
  noShowRate: number | null; // 0..1, faltas + cancelados sobre os atendimentos que já passaram
  services: Ranked[];
  clientsByVisits: Ranked[];
  clientsBySpend: Ranked[];
  newVsReturning: { novas: number; voltaram: number };
  /** [dia da semana 0=dom..6=sáb][turno 0=manhã,1=tarde,2=noite] = atendimentos concluídos */
  heat: number[][];
  leads: { source: LeadSource; total: number; converted: number }[];
  packagesSold: number;
};

export type Opportunities = {
  lapsed: (ClientRow & { days: number })[];
  sessionsToUse: number;
  expiring: (PackageRow & { client: ClientRow | undefined })[];
};

export type Kpis = Pick<Analytics, "concluded" | "revenue" | "ticket" | "newClients" | "noShowRate">;

/** Nomes dos serviços de um atendimento (vários serviços = um por item), com o peso de cada um no valor. */
function servicesOf(serviceIds: string[] | null, fallback: string, catalog: Map<string, Service>) {
  const found = (serviceIds ?? []).map((id) => catalog.get(id)).filter((s): s is Service => !!s);
  if (!found.length) return [{ name: fallback || "Sem serviço", weight: 1 }];
  const total = found.reduce((s, x) => s + Number(x.price), 0);
  return found.map((s) => ({ name: s.name, weight: total > 0 ? Number(s.price) / total : 1 / found.length }));
}

function rank(map: Map<string, Ranked>, by: "count" | "amount") {
  return Array.from(map.values()).sort((a, b) => b[by] - a[by] || b.amount - a.amount || a.label.localeCompare(b.label));
}

async function fetchPeriod(p: Period) {
  const [appts, txs] = await Promise.all([
    run<ApptRow[]>(
      supabase
        .from("appointments")
        .select("id, client_id, starts_at, status, service_ids, service_name, package_id")
        .gte("starts_at", ts(p.start))
        .lt("starts_at", ts(p.end))
        .limit(10000),
    ),
    run<TxRow[]>(
      supabase
        .from("transactions")
        .select("amount, appointment_id, package_id, appointments(client_id, service_ids, service_name), client_packages(client_id, service_name)")
        .eq("kind", "entrada")
        .gte("date", day(p.start))
        .lt("date", day(p.end))
        .limit(10000),
    ),
  ]);
  return { appts: appts ?? [], txs: txs ?? [] };
}

function kpisOf(p: Period, appts: ApptRow[], txs: TxRow[], clients: ClientRow[]): Kpis {
  const concluded = appts.filter((a) => a.status === "concluido").length;
  const revenue = txs.reduce((s, t) => s + Number(t.amount), 0);
  const fromAppointments = txs.filter((t) => t.appointment_id);
  const ticket = fromAppointments.length ? fromAppointments.reduce((s, t) => s + Number(t.amount), 0) / fromAppointments.length : 0;
  const startKey = ts(p.start);
  const endKey = ts(p.end);
  const newClients = clients.filter((c) => c.first_visit && c.first_visit >= startKey && c.first_visit < endKey).length;
  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
  const past = appts.filter((a) => a.starts_at <= now);
  const missed = past.filter((a) => a.status === "faltou" || a.status === "cancelado").length;
  return { concluded, revenue, ticket, newClients, noShowRate: past.length ? missed / past.length : null };
}

export async function loadAnalytics(p: Period, services: Service[]) {
  const catalog = new Map(services.map((s) => [s.id, s]));
  const prev = previousPeriod(p);
  const [current, before, clientsRaw, leadsRaw, packagesRaw] = await Promise.all([
    fetchPeriod(p),
    prev ? fetchPeriod(prev) : Promise.resolve(null),
    run<ClientRow[]>(
      supabase.from("client_list").select("id, name, whatsapp, first_visit, last_visit, days_since_last, next_visit, total_spent").limit(10000),
    ),
    run<LeadRow[]>(
      supabase.from("leads").select("source, stage, client_id").gte("created_at", p.start.toISOString()).lt("created_at", p.end.toISOString()).limit(10000),
    ),
    run<PackageRow[]>(
      supabase.from("package_usage").select("id, client_id, service_name, paid_at, expires_at, available, state").limit(10000),
    ),
  ]);
  const breakEven = p.kind === "mes" ? await loadBreakEven() : null;
  const clients = clientsRaw ?? [];
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const { appts, txs } = current;
  const concludedAppts = appts.filter((a) => a.status === "concluido");

  // Serviços: quantidade (atendimentos concluídos) e faturamento (pagamentos do período)
  const svc = new Map<string, Ranked>();
  const svcEntry = (name: string) => {
    let r = svc.get(name);
    if (!r) svc.set(name, (r = { key: name, label: name, count: 0, amount: 0 }));
    return r;
  };
  for (const a of concludedAppts) for (const s of servicesOf(a.service_ids, a.service_name, catalog)) svcEntry(s.name).count += 1;
  for (const t of txs) {
    if (t.client_packages) svcEntry(t.client_packages.service_name || "Pacote").amount += Number(t.amount);
    else if (t.appointments)
      for (const s of servicesOf(t.appointments.service_ids, t.appointments.service_name, catalog)) svcEntry(s.name).amount += Number(t.amount) * s.weight;
  }

  // Clientes: visitas (concluídos) e gasto (pagamentos do período, pacotes incluídos)
  const cli = new Map<string, Ranked & { services: Map<string, number> }>();
  const cliEntry = (id: string) => {
    let r = cli.get(id);
    if (!r) cli.set(id, (r = { key: id, label: clientById.get(id)?.name ?? "Cliente", count: 0, amount: 0, services: new Map() }));
    return r;
  };
  for (const a of concludedAppts) {
    const r = cliEntry(a.client_id);
    r.count += 1;
    for (const s of servicesOf(a.service_ids, a.service_name, catalog)) r.services.set(s.name, (r.services.get(s.name) ?? 0) + 1);
  }
  for (const t of txs) {
    const id = t.client_packages?.client_id ?? t.appointments?.client_id;
    if (id) cliEntry(id).amount += Number(t.amount);
  }
  const withDetail = Array.from(cli.values()).map(({ services: used, ...r }) => {
    const fav = Array.from(used.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { ...r, detail: fav };
  });
  const cliMap = new Map(withDetail.map((r) => [r.key, r]));

  // Novas e de volta: clientes atendidas no período
  const seen = new Set(concludedAppts.map((a) => a.client_id));
  const startKey = ts(p.start);
  let novas = 0;
  seen.forEach((id) => {
    const first = clientById.get(id)?.first_visit;
    if (first && first >= startKey) novas += 1;
  });

  // Dias e horários: manhã (< 12h), tarde (12h–18h), noite (18h+)
  const heat = Array.from({ length: 7 }, () => [0, 0, 0]);
  for (const a of concludedAppts) {
    const d = parseISO(a.starts_at);
    const hour = d.getHours();
    heat[getDay(d)][hour < 12 ? 0 : hour < 18 ? 1 : 2] += 1;
  }

  // Origem dos leads do período
  const bySource = new Map<LeadSource, { source: LeadSource; total: number; converted: number }>();
  for (const l of leadsRaw ?? []) {
    const r = bySource.get(l.source) ?? { source: l.source, total: 0, converted: 0 };
    r.total += 1;
    if (l.client_id || l.stage === "agendou") r.converted += 1;
    bySource.set(l.source, r);
  }

  const packages = packagesRaw ?? [];
  const startDay = day(p.start);
  const endDay = day(p.end);

  const analytics: Analytics = {
    ...kpisOf(p, appts, txs, clients),
    services: rank(svc, "count"),
    clientsByVisits: rank(cliMap, "count"),
    clientsBySpend: rank(cliMap, "amount").filter((r) => r.amount > 0),
    newVsReturning: { novas, voltaram: seen.size - novas },
    heat,
    leads: Array.from(bySource.values()).sort((a, b) => b.total - a.total),
    packagesSold: packages.filter((x) => x.paid_at >= startDay && x.paid_at < endDay).length,
  };

  const previous = prev && before ? kpisOf(prev, before.appts, before.txs, clients) : null;

  // Oportunidades (sempre de agora, não dependem do período)
  const today = day(new Date());
  const in30 = day(addMonths(new Date(), 1));
  const opportunities: Opportunities = {
    lapsed: clients
      .filter((c) => (c.days_since_last ?? 0) > 60 && !c.next_visit && Number(c.total_spent) > 0)
      .sort((a, b) => Number(b.total_spent) - Number(a.total_spent))
      .map((c) => ({ ...c, days: c.days_since_last ?? 0 })),
    sessionsToUse: packages.filter((x) => x.state === "ativo").reduce((s, x) => s + Math.max(0, x.available), 0),
    expiring: packages
      .filter((x) => x.state === "ativo" && x.available > 0 && x.expires_at && x.expires_at >= today && x.expires_at <= in30)
      .sort((a, b) => (a.expires_at ?? "").localeCompare(b.expires_at ?? ""))
      .map((x) => ({ ...x, client: clientById.get(x.client_id) })),
  };

  return { analytics, previous, opportunities, breakEven };
}

/** Dias de atendimento (segunda a sábado) que ainda restam no mês, contando hoje. */
export function workdaysLeft(p: Period) {
  const now = new Date();
  if (p.kind !== "mes" || isBefore(p.end, now) || isBefore(now, p.start)) return null;
  let n = 0;
  for (let d = new Date(now.getFullYear(), now.getMonth(), now.getDate()); isBefore(d, p.end); d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0) n += 1;
  }
  return n;
}
