import { useCallback, useEffect, useRef, useState } from "react";
import { subDays } from "date-fns";
import { AlertTriangle, Cake, CalendarPlus, Check, Gift, MessageCircle, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { DataList, type DataColumn } from "../components/DataList";
import { Pagination } from "../components/Pagination";
import { MenuOption, MenuSection, Popover } from "../components/Popover";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Badge, Button, Empty, ErrorBox, Field, Input, PageHeader, Segmented, Select, Spinner, Switch, Textarea, cx } from "../components/ui";
import { useClientDuplicate } from "../lib/clientDuplicate";
import { friendlyError } from "../lib/errors";
import { brl, brlRound, fmt, nameKey, normalize, phone, phoneKey, plural } from "../lib/format";
import { useLoad } from "../lib/hooks";
import { run, supabase } from "../lib/supabase";
import { PRESSURE_LABEL, STATUS_LABEL, type Appointment, type ClientOverview, type ClientRow, type Pressure } from "../lib/types";
import { birthdayMessage, birthdayMonthMessage, clientMessage, waLink } from "../lib/whatsapp";

/** Regras dos filtros (as mesmas da view client_overview no banco) */
const LOYAL_VISITS = 3;
const LAPSED_DAYS = 60;
const NEW_DAYS = 30;
const DEFAULT_PAGE_SIZE = 20;

type Filter = "todas" | "recorrentes" | "sumidas" | "novas" | "nunca" | "repetidas";
type Sort = "nome" | "recentes" | "visitas" | "valor" | "sumidas";

const SORT_LABEL: Record<Sort, string> = {
  nome: "Nome (A–Z)",
  recentes: "Visita mais recente",
  visitas: "Mais visitas",
  valor: "Maior valor gasto",
  sumidas: "Há mais tempo sem vir",
};

/** Aniversário hoje (quem nasceu em 29/02 comemora em 28/02 nos anos que não são bissextos). */
function birthdayToday(birthday: string | null) {
  if (!birthday) return false;
  const now = new Date();
  const month = Number(birthday.slice(5, 7));
  let day = Number(birthday.slice(8, 10));
  const leap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
  if (month === 2 && day === 29 && !leap) day = 28;
  return month === now.getMonth() + 1 && day === now.getDate();
}

function birthdayThisMonth(birthday: string | null) {
  return Boolean(birthday) && Number(birthday!.slice(5, 7)) === new Date().getMonth() + 1;
}

/** 0 → "hoje", 12 → "há 12 dias", 75 → "há 2 meses" */
function daysAgo(days: number | null) {
  if (days === null) return "";
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return m === 1 ? "há 1 mês" : `há ${m} meses`;
  }
  const y = Math.floor(days / 365);
  return y === 1 ? "há 1 ano" : `há ${y} anos`;
}

const isLapsed = (c: ClientRow) => c.days_since_last !== null && c.days_since_last > LAPSED_DAYS && !c.next_visit;
const isNew = (c: ClientRow) => Date.parse(c.created_at) >= subDays(new Date(), NEW_DAYS).getTime();

/** Monta a consulta paginada da lista conforme busca, filtro e ordem. */
function listQuery(filter: Filter, sort: Sort, search: string) {
  let q = supabase.from("client_list").select("*", { count: "exact" });

  switch (filter) {
    case "recorrentes": q = q.gte("visits", LOYAL_VISITS); break;
    case "sumidas": q = q.gt("days_since_last", LAPSED_DAYS).is("next_visit", null); break;
    case "novas": q = q.gte("created_at", subDays(new Date(), NEW_DAYS).toISOString()); break;
    case "nunca": q = q.eq("visits", 0); break;
    case "repetidas": q = q.eq("has_duplicate", true); break;
  }

  // Busca sem acento por nome, ou por parte do WhatsApp
  const term = normalize(search).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (term) {
    const parts = [`name_key.ilike.*${term.split(" ").join("*")}*`];
    const digits = term.replace(/\D/g, "");
    if (digits.length >= 3) parts.push(`whatsapp.ilike.*${digits}*`);
    q = q.or(parts.join(","));
  }

  switch (sort) {
    case "recentes": q = q.order("last_visit", { ascending: false, nullsFirst: false }); break;
    case "visitas": q = q.order("visits", { ascending: false }).order("total_spent", { ascending: false }); break;
    case "valor": q = q.order("total_spent", { ascending: false }); break;
    case "sumidas": q = q.order("days_since_last", { ascending: false, nullsFirst: false }); break;
  }
  if (filter === "repetidas") q = q.order("whatsapp", { nullsFirst: false });
  return q.order("name_key").order("id");
}

export default function Clientes() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sort, setSort] = useState<Sort>("nome");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<ClientRow | "new" | null>(null);

  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const listTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Mudou busca, filtro, ordem ou tamanho da página: volta para a página 1
  useEffect(() => setPage(1), [debounced, filter, sort, pageSize]);

  const overview = useLoad(async () => (await run(supabase.from("client_overview").select("*").single())) as ClientOverview, []);

  const birthdays = useLoad(
    async () => (await run(supabase.from("client_list").select("*").eq("birthday_month", new Date().getMonth() + 1).order("name_key"))) as ClientRow[],
    [],
  );

  const fetchPage = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * pageSize;
      const { data, count, error: err } = await listQuery(filter, sort, debounced).range(from, from + pageSize - 1);
      if (err) throw err;
      if (id !== requestId.current) return;
      const totalCount = count ?? 0;
      // A página ficou vazia (ex.: excluiu a última cliente dela): volta uma
      if ((data ?? []).length === 0 && page > 1 && totalCount > 0) {
        setPage(Math.ceil(totalCount / pageSize));
        return;
      }
      setRows((data ?? []) as ClientRow[]);
      setTotal(totalCount);
    } catch (err) {
      if (id === requestId.current) setError(friendlyError(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [filter, sort, debounced, page, pageSize]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  function goToPage(p: number) {
    setPage(p);
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Depois de salvar/excluir: recarrega a página atual, o resumo e os aniversários. */
  function reloadAll() {
    fetchPage();
    overview.reload();
    birthdays.reload();
  }

  async function openById(id: string) {
    try {
      const row = (await run(supabase.from("client_list").select("*").eq("id", id).single())) as ClientRow;
      setSelected(row);
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function clearView() {
    setFilter("todas");
    setSort("nome");
  }

  const ov = overview.data;
  // Aniversário hoje: fica no topo da página 1 (sem busca e sem filtro)
  const pinned = filter === "todas" && !debounced && page === 1 ? (birthdays.data ?? []).filter((c) => birthdayToday(c.birthday)) : [];
  const pinnedIds = new Set(pinned.map((c) => c.id));
  const visibleRows = rows ? [...pinned, ...rows.filter((c) => !pinnedIds.has(c.id))] : null;

  const filterOptions: { value: Filter; label: string; count?: number; tone?: "danger" }[] = [
    { value: "todas", label: "Todas", count: ov?.total },
    { value: "recorrentes", label: "Recorrentes", count: ov?.loyal },
    { value: "sumidas", label: "Sumidas", count: ov?.lapsed },
    { value: "novas", label: "Novas", count: ov?.recent },
    { value: "nunca", label: "Nunca vieram", count: ov?.never },
    ...(ov?.duplicates || filter === "repetidas" ? [{ value: "repetidas" as const, label: "Repetidas", count: ov?.duplicates, tone: "danger" as const }] : []),
  ];
  const customized = filter !== "todas" || sort !== "nome";
  const filterLabel = filterOptions.find((f) => f.value === filter)?.label ?? "Todas";

  const subtitle = ov
    ? [plural(ov.total, "cadastrada", "cadastradas"), ov.total ? `${ov.active} ativas` : "", ov.lapsed ? `${ov.lapsed} sumidas` : ""].filter(Boolean).join(" · ")
    : undefined;

  const columns: DataColumn<ClientRow>[] = [
    { key: "avatar", header: "", width: "2.5rem", cell: (c) => <Avatar name={c.name} /> },
    {
      key: "cliente",
      header: "Cliente",
      width: "minmax(0,1fr)",
      cell: (c) => (
        <>
          <p className="truncate font-medium">{c.name}</p>
          <p className="truncate text-sm text-muted-foreground">{c.whatsapp ? phone(c.whatsapp) : "Sem WhatsApp"}</p>
          <ClientBadges client={c} />
        </>
      ),
    },
    { key: "visitas", header: "Visitas", width: "5rem", cell: (c) => <span className="tabular-nums">{c.visits}</span> },
    {
      key: "ultima",
      header: "Última visita",
      width: "8rem",
      cell: (c) =>
        c.last_visit ? (
          <>
            <span className="block tabular-nums">{fmt(c.last_visit, "dd/MM/yy")}</span>
            <span className={cx("block text-xs", isLapsed(c) ? "text-ochre" : "text-muted-foreground")}>{daysAgo(c.days_since_last)}</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { key: "total", header: "Total gasto", width: "7rem", cell: (c) => <span className="font-medium tabular-nums">{brl(c.total_spent)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={subtitle}
        action={
          <Button onClick={() => setSelected("new")} aria-label="Nova cliente">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova cliente</span>
          </Button>
        }
      />

      <div ref={listTop} className="flex scroll-mt-4 gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nome ou WhatsApp" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" aria-label="Buscar cliente" />
        </div>
        <Popover
          className="w-64"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Filtrar e ordenar"
              title="Filtrar e ordenar"
              className={cx(
                "relative grid h-11 w-11 place-items-center rounded-xl border transition-colors",
                customized || open ? "border-primary bg-primary/10 text-primary" : "border-input bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
              {customized && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
            </button>
          )}
        >
          {(close) => (
            <div role="menu">
              <MenuSection title="Mostrar">
                {filterOptions.map((f) => (
                  <MenuOption key={f.value} selected={filter === f.value} tone={f.tone} hint={f.count} onSelect={() => { setFilter(f.value); close(); }}>
                    {filter === f.value && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                    {f.label}
                  </MenuOption>
                ))}
              </MenuSection>
              <div className="mx-2 my-1.5 border-t border-border" />
              <MenuSection title="Ordenar por">
                {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
                  <MenuOption key={s} selected={sort === s} onSelect={() => { setSort(s); close(); }}>
                    {sort === s && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                    {SORT_LABEL[s]}
                  </MenuOption>
                ))}
              </MenuSection>
            </div>
          )}
        </Popover>
      </div>

      {customized && (
        <p className="mt-2 text-sm text-muted-foreground">
          Mostrando <strong className="font-medium text-foreground">{filterLabel}</strong>
          {sort !== "nome" && ` · ${SORT_LABEL[sort].toLowerCase()}`}
          <button type="button" onClick={clearView} className="ml-2 font-medium text-primary underline-offset-2 hover:underline">
            Limpar
          </button>
        </p>
      )}
      {FILTER_HINT[filter] && <p className="mt-1 text-sm text-muted-foreground">{FILTER_HINT[filter]}</p>}

      <div className="mt-4">
        {error ? (
          <ErrorBox message={error} onRetry={reloadAll} />
        ) : loading && !rows ? (
          <Spinner />
        ) : !visibleRows || visibleRows.length === 0 ? (
          <Empty title={search ? "Ninguém encontrado" : filter !== "todas" ? "Ninguém neste filtro" : "Nenhuma cliente ainda"}>
            {search
              ? "Confira a grafia ou busque pelo WhatsApp."
              : filter !== "todas"
                ? "Escolha outro filtro para ver mais clientes."
                : "Cadastre aqui ou direto pela Agenda, ao criar um agendamento."}
          </Empty>
        ) : (
          <DataList
            rows={visibleRows}
            rowKey={(c) => c.id}
            columns={columns}
            mobile={(c) => <MobileRow client={c} />}
            onRowClick={(c) => setSelected(c)}
            trailing={(c) => <BirthdayAction client={c} />}
            rowClassName={(c) => pinnedIds.has(c.id) && "bg-primary/[0.06]"}
            busy={loading}
            footer={
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                itemLabel={total === 1 ? "cliente" : "clientes"}
              />
            }
          />
        )}
      </div>

      <ClientSheet
        client={selected === "new" ? null : selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onSaved={reloadAll}
        onOpenOther={openById}
      />
    </>
  );
}

const FILTER_HINT: Partial<Record<Filter, string>> = {
  sumidas: `Vieram antes, mas estão há mais de ${LAPSED_DAYS} dias sem vir e sem horário marcado. Bom momento para mandar uma mensagem.`,
  repetidas: "Mesmo WhatsApp ou mesmo nome. Abra cada uma, confira e exclua a que sobrou (os agendamentos dela são excluídos juntos).",
};

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-nude font-serif text-lg text-taupe dark:bg-muted dark:text-foreground" aria-hidden="true">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function ClientBadges({ client: c }: { client: ClientRow }) {
  const today = birthdayToday(c.birthday);
  const month = !today && birthdayThisMonth(c.birthday);
  return (
    <div className="mt-1 flex flex-wrap gap-1 empty:hidden">
      {today && <Badge className="bg-primary text-primary-foreground"><Cake className="h-3 w-3" /> Aniversário hoje</Badge>}
      {month && <Badge className="bg-primary/10 text-primary"><Cake className="h-3 w-3" /> Aniversário {fmt(c.birthday!, "dd/MM")}</Badge>}
      {c.next_visit && <Badge className="bg-primary/10 text-primary">Próxima {fmt(c.next_visit, "dd/MM")}</Badge>}
      {isLapsed(c) && <Badge className="bg-ochre/15 text-ochre">Sumida</Badge>}
      {!c.visits && !c.next_visit && isNew(c) && <Badge className="bg-dusk/15 text-dusk">Nova</Badge>}
      {c.no_shows > 0 && <Badge>{plural(c.no_shows, "falta", "faltas")}</Badge>}
      {c.has_duplicate && <Badge className="bg-danger/10 text-danger">Repetida</Badge>}
    </div>
  );
}

function MobileRow({ client: c }: { client: ClientRow }) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
      <Avatar name={c.name} />
      <div className="min-w-0">
        <p className="truncate font-medium">{c.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {c.visits ? `${plural(c.visits, "visita", "visitas")} · ${daysAgo(c.days_since_last)}` : "Sem visitas concluídas"}
        </p>
        <ClientBadges client={c} />
      </div>
      <p className="font-medium tabular-nums">{brlRound(c.total_spent)}</p>
    </div>
  );
}

/** Aniversário no mês: atalho para mandar mensagem no WhatsApp */
function BirthdayAction({ client: c }: { client: ClientRow }) {
  const today = birthdayToday(c.birthday);
  if (!(today || birthdayThisMonth(c.birthday)) || !c.whatsapp) return null;
  return (
    <a
      href={waLink(c.whatsapp, today ? birthdayMessage(c.name) : birthdayMonthMessage(c.name, c.birthday!))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Enviar mensagem de aniversário para ${c.name}`}
      title="Enviar mensagem de aniversário"
      className={cx(
        "grid h-9 w-9 place-items-center rounded-full",
        today ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-primary hover:bg-primary/10",
      )}
    >
      <Gift className="h-4 w-4" />
    </a>
  );
}

function ClientSheet({
  client,
  open,
  onClose,
  onSaved,
  onOpenOther,
}: {
  client: ClientRow | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onOpenOther: (id: string) => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"dados" | "anamnese" | "historico">("dados");
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    birthday: "",
    allergies: "",
    pregnant: false,
    massage_pressure: "" as Pressure | "",
    preferences: "",
    notes: "",
  });
  const [history, setHistory] = useState<Appointment[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab("dados");
    setError(null);
    setHistory(null);
    setForm({
      name: client?.name ?? "",
      whatsapp: client?.whatsapp ?? "",
      birthday: client?.birthday ?? "",
      allergies: client?.allergies ?? "",
      pregnant: client?.pregnant ?? false,
      massage_pressure: client?.massage_pressure ?? "",
      preferences: client?.preferences ?? "",
      notes: client?.notes ?? "",
    });
    if (client) {
      run(supabase.from("appointments").select("*").eq("client_id", client.id).order("starts_at", { ascending: false }))
        .then((rows) => setHistory(rows as Appointment[]))
        .catch((err) => setError(friendlyError(err)));
    }
  }, [open, client]);

  const duplicate = useClientDuplicate(form.name, form.whatsapp, client?.id ?? null, open);
  // Nome/WhatsApp mudaram? (editar outros campos de uma repetida antiga continua liberado)
  const identityChanged = !client || nameKey(form.name) !== nameKey(client.name) || phoneKey(form.whatsapp) !== phoneKey(client.whatsapp);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (form.name.trim().length < 2) {
      setTab("dados");
      return setError("Digite o nome da cliente.");
    }
    if (duplicate && identityChanged) {
      setTab("dados");
      return setError(duplicate.by === "whatsapp" ? `Já existe uma cliente com esse WhatsApp: ${duplicate.name}.` : `Já existe uma cliente chamada ${duplicate.name}. Se for outra pessoa, inclua o sobrenome.`);
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      whatsapp: form.whatsapp.replace(/\D/g, "") || null,
      birthday: form.birthday || null,
      allergies: form.allergies.trim() || null,
      pregnant: form.pregnant,
      massage_pressure: form.massage_pressure || null,
      preferences: form.preferences.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (client) await run(supabase.from("clients").update(payload).eq("id", client.id));
      else await run(supabase.from("clients").insert(payload));
      toast("Cliente salva.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!client) return;
    const ok = await confirm({
      title: "Excluir cliente?",
      message: (
        <>
          <strong className="text-foreground">{client.name}</strong> será excluída junto com o histórico de agendamentos e as entradas ligadas a eles. Não dá para desfazer.
        </>
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await run(supabase.from("clients").delete().eq("id", client.id));
      toast("Cliente excluída.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const stats = client
    ? [
        { label: "visitas", value: String(client.visits) },
        { label: "total gasto", value: brl(client.total_spent) },
        { label: "ticket médio", value: client.visits ? brl(client.avg_ticket) : "—" },
        { label: "última visita", value: client.last_visit ? fmt(client.last_visit, "dd/MM/yy") : "—", hint: daysAgo(client.days_since_last) },
        { label: "cliente desde", value: client.first_visit ? fmt(client.first_visit, "MMM/yy") : "—" },
        client.to_receive > 0
          ? { label: "a receber", value: brl(client.to_receive), danger: true }
          : { label: "faltas", value: String(client.no_shows), danger: client.no_shows > 0 },
      ]
    : [];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={client ? client.name : "Nova cliente"}
      footer={
        <div className="flex items-center gap-2">
          {client && <Button variant="danger" onClick={remove} disabled={saving}>Excluir</Button>}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>Salvar</Button>
        </div>
      }
    >
      {client && (
        <div className="mb-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/70 px-2 py-2.5">
                <p className={cx("text-lg font-semibold tabular-nums [overflow-wrap:anywhere]", "danger" in s && s.danger && "text-danger")}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {"hint" in s && s.hint && <p className="text-[0.7rem] text-muted-foreground">{s.hint}</p>}
              </div>
            ))}
          </div>
          {client.next_visit && (
            <p className="mt-2 text-center text-sm text-primary">Próximo horário: {fmt(client.next_visit, "dd/MM 'às' HH:mm")}</p>
          )}
          {birthdayToday(client.birthday) && client.whatsapp && (
            <a
              href={waLink(client.whatsapp, birthdayMessage(client.name))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Gift className="h-4 w-4" /> Aniversário hoje: enviar parabéns
            </a>
          )}
          <div className="mt-3 flex gap-2">
            {client.whatsapp && (
              <a href={waLink(client.whatsapp, clientMessage(client.name))} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-input text-sm font-medium hover:bg-muted">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            <Button variant="secondary" size="sm" className="h-10 flex-1" onClick={() => navigate(`/agenda?cliente=${client.id}`)}>
              <CalendarPlus className="h-4 w-4" /> Agendar
            </Button>
          </div>
        </div>
      )}

      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-5"
        options={[
          { value: "dados", label: "Dados" },
          { value: "anamnese", label: "Anamnese" },
          ...(client ? [{ value: "historico" as const, label: "Histórico" }] : []),
        ]}
      />

      {tab === "dados" && (
        <div className="space-y-4">
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="WhatsApp" hint={form.whatsapp && phone(form.whatsapp)}>
              <Input inputMode="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="83 99999-0000" />
            </Field>
            <Field label="Aniversário">
              <Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
            </Field>
          </div>
          {duplicate && (
            <div className="flex items-start gap-2.5 rounded-xl bg-ochre/10 px-3.5 py-3 text-sm text-foreground" role="status">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ochre" />
              <p>
                {duplicate.by === "whatsapp" ? "Esse WhatsApp já é de " : "Já existe uma cliente chamada "}
                <strong>{duplicate.name}</strong>
                {duplicate.whatsapp && duplicate.by === "nome" ? ` (${phone(duplicate.whatsapp)})` : ""}.{" "}
                <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => onOpenOther(duplicate.id)}>
                  Abrir cadastro dela
                </button>
              </p>
            </div>
          )}
          <Field label="Observações gerais">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      )}

      {tab === "anamnese" && (
        <div className="space-y-4">
          <p className="rounded-xl bg-muted/70 px-3.5 py-3 text-xs text-muted-foreground">
            Dados de saúde são sensíveis (LGPD). Registre só o necessário para um atendimento seguro.
          </p>
          <Field label="Alergias">
            <Input value={form.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="Ex.: lavanda, látex" />
          </Field>
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <Switch checked={form.pregnant} onChange={(v) => set("pregnant", v)} label="Gestante" />
          </div>
          <Field label="Pressão da massagem">
            <Select value={form.massage_pressure} onChange={(e) => set("massage_pressure", e.target.value as Pressure | "")}>
              <option value="">Não informado</option>
              {(Object.keys(PRESSURE_LABEL) as Pressure[]).map((p) => <option key={p} value={p}>{PRESSURE_LABEL[p]}</option>)}
            </Select>
          </Field>
          <Field label="Preferências e cuidados">
            <Textarea value={form.preferences} onChange={(e) => set("preferences", e.target.value)} placeholder="Ex.: prefere óleo sem perfume, dor lombar" />
          </Field>
        </div>
      )}

      {tab === "historico" && (
        history === null ? (
          <Spinner />
        ) : history.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-2xl border border-border/80">
            {history.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.service_name}</p>
                  <p className="text-sm text-muted-foreground">{fmt(a.starts_at, "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">{brl(a.price)}</p>
                  <p className={cx("text-xs", a.status === "concluido" ? "text-primary" : "text-muted-foreground")}>
                    {STATUS_LABEL[a.status]}{a.paid ? " · pago" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {error && <p className="mt-4 rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
    </Sheet>
  );
}
