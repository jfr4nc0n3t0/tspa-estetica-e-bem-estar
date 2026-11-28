import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Card, ErrorBox, PageHeader, Segmented, SectionTitle, Spinner, cx } from "../components/ui";
import { useAppData } from "../lib/appData";
import {
  FEES_RATE,
  loadAnalytics,
  periodLabel,
  periodOf,
  shiftPeriod,
  workdaysLeft,
  type Analytics,
  type BreakEven,
  type Kpis,
  type Opportunities,
  type Period,
  type PeriodKind,
  type Ranked,
} from "../lib/analytics";
import { friendlyError } from "../lib/errors";
import { brlRound, plural } from "../lib/format";
import { SOURCE_LABEL } from "../lib/types";
import { missYouMessage, packageExpiringMessage, waLink } from "../lib/whatsapp";

const TOP = 5;
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAYS_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const SHIFTS = ["Manhã", "Tarde", "Noite"];
const SHIFTS_LONG = ["de manhã", "à tarde", "à noite"];

/** Mais → Análises: o que está dando certo no TSpa, por mês, ano ou desde o início. */
export default function Analises() {
  const { services, settings } = useAppData();
  const [period, setPeriod] = useState<Period>(() => periodOf("mes", new Date()));
  const [data, setData] = useState<{ analytics: Analytics; previous: Kpis | null; opportunities: Opportunities; breakEven: BreakEven | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loadAnalytics(period, services)
      .then((d) => active && setData(d))
      .catch((err) => active && setError(friendlyError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [period, services, attempt]);

  return (
    <div>
      <Link href="/mais" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Mais
      </Link>
      <PageHeader title="Análises" subtitle="O que está dando certo no TSpa" />

      {/* Mesmo seletor de período do Financeiro */}
      <Segmented<PeriodKind>
        value={period.kind}
        onChange={(kind) => setPeriod(periodOf(kind, new Date()))}
        className="mb-4 md:max-w-[20rem]"
        options={[
          { value: "mes", label: "Mês" },
          { value: "ano", label: "Ano" },
          { value: "tudo", label: "Tudo" },
        ]}
      />
      <div className="flex items-center justify-between rounded-full bg-muted p-1">
        {period.kind !== "tudo" ? (
          <button type="button" onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label={period.kind === "mes" ? "Mês anterior" : "Ano anterior"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-card">
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-9 w-9" />
        )}
        <span className="font-medium">{periodLabel(period)}</span>
        {period.kind !== "tudo" ? (
          <button type="button" onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label={period.kind === "mes" ? "Próximo mês" : "Próximo ano"} className="grid h-9 w-9 place-items-center rounded-full hover:bg-card">
            <ChevronRight className="h-5 w-5" />
          </button>
        ) : (
          <span className="h-9 w-9" />
        )}
      </div>

      {error && <ErrorBox message={error} onRetry={() => setAttempt((n) => n + 1)} />}
      {!error && !data && loading && <Spinner />}
      {data && !error && (
        <div className={cx("transition-opacity", loading && "opacity-60")}>
          <Content period={period} goal={settings.monthly_goal} {...data} />
        </div>
      )}
    </div>
  );
}

function Content({ period, goal, analytics: a, previous, opportunities: o, breakEven }: {
  period: Period;
  goal: number;
  analytics: Analytics;
  previous: Kpis | null;
  opportunities: Opportunities;
  breakEven: BreakEven | null;
}) {
  const [svcBy, setSvcBy] = useState<"count" | "amount">("count");
  const [cliBy, setCliBy] = useState<"count" | "amount">("count");
  const services = svcBy === "count" ? a.services.filter((s) => s.count > 0) : [...a.services].filter((s) => s.amount > 0).sort((x, y) => y.amount - x.amount);
  const clients = cliBy === "count" ? a.clientsByVisits.filter((c) => c.count > 0) : a.clientsBySpend;
  const empty = a.concluded === 0 && a.revenue === 0;

  return (
    <>
      {period.kind === "mes" && <Goal period={period} done={a.concluded} goal={goal} breakEven={breakEven} />}

      <div className={cx("grid grid-cols-2 gap-2.5 md:grid-cols-4", period.kind === "mes" ? "mt-2.5" : "mt-5")}>
        <Kpi label={period.kind === "mes" ? "entrou no mês" : "entrou no período"} value={brlRound(a.revenue)} now={a.revenue} before={previous?.revenue} />
        <Kpi label="ticket médio" value={brlRound(a.ticket)} now={a.ticket} before={previous?.ticket} />
        <Kpi label={a.newClients === 1 ? "cliente nova" : "clientes novas"} value={String(a.newClients)} now={a.newClients} before={previous?.newClients} absolute />
        <Kpi
          label="faltas e cancelamentos"
          value={a.noShowRate === null ? "—" : `${Math.round(a.noShowRate * 100)}%`}
          now={a.noShowRate === null ? null : a.noShowRate * 100}
          before={previous?.noShowRate == null ? null : previous.noShowRate * 100}
          points
          lowerIsBetter
        />
      </div>

      {empty ? (
        <Card className="mt-5 p-5 text-center text-sm text-muted-foreground">Nenhum atendimento concluído nem pagamento neste período.</Card>
      ) : (
        <>
          <SectionTitle>Serviços que mais saíram</SectionTitle>
          <Card className="p-4">
            <Chips value={svcBy} onChange={setSvcBy} options={[["count", "Quantidade"], ["amount", "Faturamento"]]} />
            <RankList
              items={services}
              by={svcBy}
              format={(r) => (svcBy === "count" ? { main: String(r.count), sub: r.amount > 0 ? brlRound(r.amount) : undefined } : { main: brlRound(r.amount), sub: r.count ? plural(r.count, "atendimento", "atendimentos") : undefined })}
            />
            {services[0] && <Tip>{services[0].label} foi o {svcBy === "count" ? "mais procurado" : "que mais faturou"}. Vale destacar no Instagram e no status do WhatsApp.</Tip>}
            {svcBy === "amount" && <p className="mt-2 text-xs text-muted-foreground">Faturamento pelos pagamentos do período; pacote conta na venda.</p>}
          </Card>

          <SectionTitle>Clientes do período</SectionTitle>
          <Card className="p-4">
            <Chips value={cliBy} onChange={setCliBy} options={[["count", "Mais vieram"], ["amount", "Mais gastaram"]]} />
            <RankList
              items={clients}
              by={cliBy}
              numbered
              format={(r) =>
                cliBy === "count"
                  ? { main: plural(r.count, "visita", "visitas"), sub: r.amount > 0 ? brlRound(r.amount) : undefined }
                  : { main: brlRound(r.amount), sub: r.count ? plural(r.count, "visita", "visitas") : undefined }
              }
            />
          </Card>

          <SectionTitle>Novas e de volta</SectionTitle>
          <NewVsReturning {...a.newVsReturning} />

          <SectionTitle>Dias e horários mais procurados</SectionTitle>
          <Heat heat={a.heat} />
        </>
      )}

      <SectionTitle>De onde vêm as clientes</SectionTitle>
      <Sources leads={a.leads} />

      <SectionTitle>Vale uma mensagem</SectionTitle>
      <Lapsed items={o.lapsed} />

      <SectionTitle>Pacotes</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3.5">
          <p className="font-serif text-3xl leading-none">{a.packagesSold}</p>
          <p className="mt-1 text-xs text-muted-foreground">{a.packagesSold === 1 ? "vendido" : "vendidos"} no período</p>
        </Card>
        <Card className="p-3.5">
          <p className="font-serif text-3xl leading-none">{o.sessionsToUse}</p>
          <p className="mt-1 text-xs text-muted-foreground">sessões ainda a usar</p>
        </Card>
      </div>
      {o.expiring.length > 0 && (
        <Card className="mt-2.5 divide-y divide-border/70">
          <p className="px-4 pb-1 pt-3 text-xs text-muted-foreground">Vencem nos próximos 30 dias</p>
          {o.expiring.map((x) => (
            <div key={x.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{x.client?.name ?? "Cliente"} · {x.service_name}</p>
                <p className="text-xs text-muted-foreground">
                  {plural(x.available, "sessão", "sessões")} · vence em {x.expires_at!.slice(8, 10)}/{x.expires_at!.slice(5, 7)}
                </p>
              </div>
              {x.client?.whatsapp && (
                <WaButton href={waLink(x.client.whatsapp, packageExpiringMessage(x.client.name, x.service_name, x.available, x.expires_at!))} label={`Lembrar ${x.client.name} do pacote`} />
              )}
            </div>
          ))}
        </Card>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Atendimentos contam os concluídos. Dinheiro segue o Financeiro (data do pagamento).
      </p>
    </>
  );
}

function Goal({ period, done, goal, breakEven }: { period: Period; done: number; goal: number; breakEven: BreakEven | null }) {
  const [how, setHow] = useState(false);
  const left = workdaysLeft(period);
  const pays = breakEven?.count ?? null;
  const max = Math.max(goal, done, pays ?? 0);
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  const missing = goal - done;
  let tip: ReactNode;
  if (done >= goal) tip = "Meta do mês alcançada. 🌿";
  else if (left) tip = `Faltam ${missing} para a meta. Ainda há ${plural(left, "dia de atendimento", "dias de atendimento")}: cerca de ${Math.ceil(missing / left)} por dia.`;
  else if (pays !== null) tip = done >= pays ? `O mês pagou o custo fixo e ficou ${missing} abaixo da meta.` : `Ficou abaixo dos ${pays} atendimentos que pagam o custo fixo.`;
  else tip = `Ficou ${missing} abaixo da meta.`;

  return (
    <>
      <SectionTitle action={<Link href="/mais" className="text-xs font-medium normal-case tracking-normal text-primary">Mudar meta</Link>}>Meta do mês</SectionTitle>
      <Card className="p-4">
        <p className="font-serif text-5xl leading-none">
          {done}
          <span className="ml-2 font-sans text-sm text-muted-foreground">atendimentos de {goal}</span>
        </p>
        <div className="relative mb-1.5 mt-4 h-2.5 rounded-full bg-muted">
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: pct(done) }} />
          {pays !== null && <span className="absolute -top-1 h-[18px] w-0.5 bg-taupe" style={{ left: pct(pays) }} aria-hidden="true" />}
        </div>
        <div className="flex justify-between text-[0.7rem] text-muted-foreground">
          <span>{pays !== null ? `${pays} pagam o mês ${done >= pays ? "✓" : ""}` : "\u00a0"}</span>
          <span>meta {goal}</span>
        </div>
        <Tip>{tip}</Tip>

        {breakEven?.missing === "fixas" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Para saber quantos atendimentos pagam o mês, cadastre as despesas fixas (aluguel, água, energia…) em{" "}
            <Link href="/financeiro" className="font-medium text-primary">Financeiro</Link>.
          </p>
        )}
        {breakEven?.missing === "ticket" && (
          <p className="mt-3 text-xs text-muted-foreground">Ainda não há atendimentos pagos nos últimos 90 dias para calcular quantos pagam o mês.</p>
        )}
        {breakEven && !breakEven.missing && (
          <>
            <button type="button" onClick={() => setHow((v) => !v)} className="mt-3 text-xs font-medium text-primary" aria-expanded={how}>
              {how ? "Esconder a conta" : "Como chegamos nos " + pays + "?"}
            </button>
            {how && (
              <div className="mt-2 space-y-1 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
                <p className="flex justify-between"><span>Despesas fixas do mês</span><span className="font-medium text-foreground">{brlRound(breakEven.fixed)}</span></p>
                <p className="flex justify-between"><span>Ticket médio (últimos 90 dias)</span><span className="font-medium text-foreground">{brlRound(breakEven.ticket)}</span></p>
                <p className="flex justify-between"><span>− imposto e maquininha ({Math.round(FEES_RATE * 1000) / 10}%)</span><span>{brlRound(breakEven.ticket * FEES_RATE)}</span></p>
                {breakEven.productsPer > 0 && (
                  <p className="flex justify-between"><span>− produtos por atendimento</span><span>{brlRound(breakEven.productsPer)}</span></p>
                )}
                <p className="flex justify-between border-t border-border pt-1"><span>Sobra de cada atendimento</span><span className="font-medium text-foreground">{brlRound(breakEven.net)}</span></p>
                <p className="pt-1">{brlRound(breakEven.fixed)} ÷ {brlRound(breakEven.net)} = {pays} atendimentos.</p>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}

function Kpi({ label, value, now, before, absolute, points, lowerIsBetter }: {
  label: string;
  value: string;
  now: number | null;
  before: number | null | undefined;
  absolute?: boolean;
  points?: boolean;
  lowerIsBetter?: boolean;
}) {
  let change: ReactNode = null;
  if (now !== null && before !== null && before !== undefined) {
    const diff = now - before;
    if (Math.abs(diff) >= 0.5 && (absolute || points || before > 0)) {
      const up = diff > 0;
      const good = lowerIsBetter ? !up : up;
      const text = absolute ? `${Math.abs(Math.round(diff))}` : points ? `${Math.abs(Math.round(diff))} p.p.` : `${Math.abs(Math.round((diff / before) * 100))}%`;
      change = (
        <span className={cx("text-[0.7rem] font-semibold", good ? "text-primary" : "text-terracotta")}>
          {up ? "▲" : "▼"} {text}
        </span>
      );
    }
  }
  return (
    <Card className="p-3.5">
      <p className="font-serif text-[1.6rem] leading-tight">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        {label} {change}
      </p>
    </Card>
  );
}

function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="mb-3 flex gap-1.5" role="radiogroup">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cx(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RankList({ items, by, format, numbered = true }: { items: Ranked[]; by: "count" | "amount"; format: (r: Ranked) => { main: string; sub?: string }; numbered?: boolean }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, TOP);
  const max = Math.max(1, ...items.map((r) => r[by]));
  if (!items.length) return <p className="py-2 text-sm text-muted-foreground">Nada neste período.</p>;
  return (
    <>
      <ol className="divide-y divide-border/70">
        {shown.map((r, i) => {
          const f = format(r);
          return (
            <li key={r.key} className="flex items-center gap-3 py-2.5 first:pt-0">
              {numbered && <span className="w-4 font-serif text-lg text-muted-foreground/60">{i + 1}</span>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.label}</p>
                {r.detail && <p className="truncate text-xs text-muted-foreground">{r.detail}</p>}
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${(r[by] / max) * 100}%` }} />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">{f.main}</p>
                {f.sub && <p className="text-[0.7rem] text-muted-foreground">{f.sub}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {items.length > TOP && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-2 text-sm font-medium text-primary">
          {all ? "Mostrar menos" : `Ver todos (${items.length})`}
        </button>
      )}
    </>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return <p className="mt-3 rounded-xl bg-primary/10 px-3 py-2 text-[0.8rem] leading-snug text-primary">{children}</p>;
}

function NewVsReturning({ novas, voltaram }: { novas: number; voltaram: number }) {
  const total = novas + voltaram;
  if (!total) return <Card className="p-4 text-sm text-muted-foreground">Nenhuma cliente atendida neste período.</Card>;
  const pctBack = Math.round((voltaram / total) * 100);
  return (
    <Card className="p-4">
      <div className="flex justify-between text-sm">
        <span><strong>{novas}</strong> {novas === 1 ? "nova" : "novas"}</span>
        <span><strong>{voltaram}</strong> voltaram</span>
      </div>
      <div className="my-2 flex h-3 overflow-hidden rounded-full bg-muted">
        <div className="bg-sand" style={{ width: `${100 - pctBack}%` }} />
        <div className="bg-primary" style={{ width: `${pctBack}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{pctBack}% das clientes atendidas já tinham vindo antes.</p>
    </Card>
  );
}

function Heat({ heat }: { heat: number[][] }) {
  const days = useMemo(() => [1, 2, 3, 4, 5, 6, ...(heat[0].some((n) => n > 0) ? [0] : [])], [heat]);
  const max = Math.max(1, ...heat.flat());
  const total = heat.flat().reduce((s, n) => s + n, 0);
  const cells = days.flatMap((d) => [0, 1, 2].map((s) => ({ d, s, n: heat[d][s] })));
  const busiest = [...cells].sort((a, b) => b.n - a.n).slice(0, 2).filter((c) => c.n > 0);
  const quiet = cells.filter((c) => c.s < 2 && c.d !== 0).sort((a, b) => a.n - b.n).slice(0, 2);
  const say = (c: { d: number; s: number }) => `${DAYS_LONG[c.d]} ${SHIFTS_LONG[c.s]}`;
  return (
    <Card className="p-4">
      <div className="grid items-center gap-1 text-center text-[0.65rem] text-muted-foreground" style={{ gridTemplateColumns: `2.6rem repeat(${days.length}, 1fr)` }}>
        <span />
        {days.map((d) => <span key={d}>{DAYS[d]}</span>)}
        {SHIFTS.map((label, s) => (
          <Row key={label} label={label}>
            {days.map((d) => (
              <span
                key={d}
                title={`${DAYS[d]} · ${label}: ${heat[d][s]}`}
                className="h-6 rounded-md"
                style={{ background: heat[d][s] ? `hsl(var(--primary) / ${0.15 + 0.85 * (heat[d][s] / max)})` : "hsl(var(--muted))" }}
              />
            ))}
          </Row>
        ))}
      </div>
      {total >= 8 && busiest.length > 0 && (
        <Tip>
          Mais cheio: {busiest.map(say).join(" e ")}. Com espaço: {quiet.map(say).join(" e ")}: bom momento para uma ação ou um convite.
        </Tip>
      )}
    </Card>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <span className="text-left">{label}</span>
      {children}
    </>
  );
}

function Sources({ leads }: { leads: Analytics["leads"] }) {
  if (!leads.length) return <Card className="p-4 text-sm text-muted-foreground">Nenhum lead neste período.</Card>;
  const max = Math.max(1, ...leads.map((l) => l.total));
  const best = leads.filter((l) => l.total >= 3).sort((a, b) => b.converted / b.total - a.converted / a.total)[0];
  return (
    <Card className="p-4">
      <ul className="divide-y divide-border/70">
        {leads.map((l) => (
          <li key={l.source} className="flex items-center gap-3 py-2.5 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{SOURCE_LABEL[l.source]}</p>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/80" style={{ width: `${(l.total / max) * 100}%` }} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{plural(l.total, "lead", "leads")}</p>
              <p className="text-[0.7rem] text-muted-foreground">{l.converted} {l.converted === 1 ? "virou cliente" : "viraram clientes"}</p>
            </div>
          </li>
        ))}
      </ul>
      {best && best.converted > 0 && (
        <Tip>
          {SOURCE_LABEL[best.source]} é a origem que mais vira cliente: {best.converted} de {best.total}.
          {best.source === "indicacao" ? " Vale um mimo para quem indica." : ""}
        </Tip>
      )}
    </Card>
  );
}

function Lapsed({ items }: { items: Opportunities["lapsed"] }) {
  const [all, setAll] = useState(false);
  if (!items.length) return <Card className="p-4 text-sm text-muted-foreground">Ninguém sumido há mais de 60 dias. 🌿</Card>;
  const shown = all ? items : items.slice(0, TOP);
  return (
    <Card className="divide-y divide-border/70">
      <p className="px-4 pb-1 pt-3 text-xs text-muted-foreground">Gastavam bem e não vêm há mais de 60 dias</p>
      {shown.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {brlRound(c.total_spent)} no total · {c.days} dias sem vir
            </p>
          </div>
          {c.whatsapp && <WaButton href={waLink(c.whatsapp, missYouMessage(c.name))} label={`Mandar mensagem para ${c.name}`} />}
        </div>
      ))}
      {items.length > TOP && (
        <button type="button" onClick={() => setAll((v) => !v)} className="w-full px-4 py-2.5 text-left text-sm font-medium text-primary">
          {all ? "Mostrar menos" : `Ver todas (${items.length})`}
        </button>
      )}
    </Card>
  );
}

function WaButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-primary hover:bg-primary/10"
    >
      <MessageCircle className="h-4 w-4" />
    </a>
  );
}
