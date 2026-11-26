import { useEffect, useMemo, useState } from "react";
import { Cake, CalendarPlus, Gift, MessageCircle, Plus, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, PageHeader, Segmented, Select, Spinner, Switch, Textarea, cx } from "../components/ui";
import { friendlyError } from "../lib/errors";
import { brl, fmt, normalize, phone } from "../lib/format";
import { useLoad } from "../lib/hooks";
import { run, supabase } from "../lib/supabase";
import { PRESSURE_LABEL, STATUS_LABEL, type Appointment, type Client, type ClientStats, type Pressure } from "../lib/types";
import { birthdayMessage, clientMessage, waLink } from "../lib/whatsapp";

type Row = Client & { stats?: ClientStats };

function birthdayThisMonth(birthday: string | null) {
  return Boolean(birthday) && Number(birthday!.slice(5, 7)) === new Date().getMonth() + 1;
}

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

export default function Clientes() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Row | "new" | null>(null);

  const { data, loading, error, reload } = useLoad(async () => {
    const [clients, stats] = await Promise.all([
      run(supabase.from("clients").select("*").order("name")) as Promise<Client[]>,
      run(supabase.from("client_stats").select("*")) as Promise<ClientStats[]>,
    ]);
    const byId = new Map(stats.map((s) => [s.client_id, s]));
    return clients.map((c) => ({ ...c, stats: byId.get(c.id) }));
  }, []);

  const rows = useMemo(() => {
    const q = normalize(query.trim());
    const list = data ?? [];
    if (!q) return list;
    return list.filter((c) => normalize(c.name).includes(q) || (c.whatsapp ?? "").includes(q.replace(/\D/g, "") || "§"));
  }, [data, query]);

  const todayBirthdays = (data ?? []).filter((c) => birthdayToday(c.birthday));
  const birthdays = (data ?? []).filter((c) => birthdayThisMonth(c.birthday) && !birthdayToday(c.birthday));

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={data ? `${data.length} cadastradas` : undefined}
        action={
          <Button onClick={() => setSelected("new")} aria-label="Nova cliente">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova cliente</span>
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder="Buscar por nome ou WhatsApp" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>

      {todayBirthdays.length > 0 && !query && (
        <Card className="mt-3 border-primary/30 bg-primary/[0.06]">
          <p className="flex items-center gap-2 px-4 pt-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Cake className="h-4 w-4" /> Aniversário hoje
          </p>
          <ul className="divide-y divide-primary/15">
            {todayBirthdays.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => setSelected(c)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-medium">{c.name}</span>
                  <span className="block text-sm text-muted-foreground">{c.whatsapp ? phone(c.whatsapp) : "Sem WhatsApp cadastrado"}</span>
                </button>
                {c.whatsapp && (
                  <a
                    href={waLink(c.whatsapp, birthdayMessage(c.name))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Gift className="h-4 w-4" /> Parabenizar
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {birthdays.length > 0 && !query && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
          <Cake className="h-4 w-4 shrink-0" />
          Aniversariantes do mês: {birthdays.map((c) => `${c.name.split(" ")[0]} (${fmt(c.birthday!, "dd/MM")})`).join(", ")}
        </p>
      )}

      <div className="mt-4">
        {error ? (
          <ErrorBox message={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <Empty title={query ? "Ninguém encontrado" : "Nenhuma cliente ainda"}>
            {query ? "Confira a grafia ou busque pelo WhatsApp." : "Cadastre aqui ou direto pela Agenda, ao criar um agendamento."}
          </Empty>
        ) : (
          <Card className="divide-y divide-border/70">
            {rows.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelected(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-nude font-serif text-lg text-taupe dark:bg-muted dark:text-foreground">
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {c.name}
                    {birthdayToday(c.birthday) ? (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Aniversário hoje" title="Aniversário hoje">
                        <Cake className="h-3 w-3" />
                      </span>
                    ) : (
                      birthdayThisMonth(c.birthday) && <Cake className="h-3.5 w-3.5 text-primary" aria-label="Aniversário este mês" />
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {c.stats?.visits ? `${c.stats.visits} visita(s) · ${brl(c.stats.total_spent)}` : "Sem visitas concluídas"}
                    {c.stats?.last_visit && ` · última ${fmt(c.stats.last_visit, "dd/MM/yy")}`}
                  </p>
                </div>
                {c.stats?.next_visit && <Badge className="bg-primary/10 text-primary">{fmt(c.stats.next_visit, "dd/MM")}</Badge>}
              </button>
            ))}
          </Card>
        )}
      </div>

      <ClientSheet client={selected === "new" ? null : selected} open={selected !== null} onClose={() => setSelected(null)} onSaved={reload} />
    </>
  );
}

function ClientSheet({ client, open, onClose, onSaved }: { client: Row | null; open: boolean; onClose: () => void; onSaved: () => void }) {
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

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (form.name.trim().length < 2) {
      setTab("dados");
      return setError("Digite o nome da cliente.");
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
            <div className="rounded-xl bg-muted/70 px-2 py-2.5">
              <p className="text-lg font-semibold tabular-nums">{client.stats?.visits ?? 0}</p>
              <p className="text-xs text-muted-foreground">visitas</p>
            </div>
            <div className="rounded-xl bg-muted/70 px-2 py-2.5">
              <p className="text-lg font-semibold tabular-nums">{brl(client.stats?.total_spent ?? 0)}</p>
              <p className="text-xs text-muted-foreground">total gasto</p>
            </div>
            <div className="rounded-xl bg-muted/70 px-2 py-2.5">
              <p className="text-lg font-semibold tabular-nums">{client.stats?.last_visit ? fmt(client.stats.last_visit, "dd/MM/yy") : "—"}</p>
              <p className="text-xs text-muted-foreground">última visita</p>
            </div>
          </div>
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
