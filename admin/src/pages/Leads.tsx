import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarPlus, Check, ChevronDown, Flame, Info, MessageCircle, Plus, Search, SlidersHorizontal, Snowflake, Thermometer } from "lucide-react";
import { useLocation } from "wouter";
import { Kanban, type KanbanColumn } from "../components/Kanban";
import { MenuOption, MenuSection, Popover } from "../components/Popover";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Badge, Button, Card, ErrorBox, Field, Input, PageHeader, Select, Spinner, Textarea, cx } from "../components/ui";
import { friendlyError } from "../lib/errors";
import { firstName, fmt, normalize, plural } from "../lib/format";
import { COLD_AFTER_DAYS, TEMPERATURE_LABEL, leadReference, leadTemperature, type Temperature } from "../lib/leadTemperature";
import { useLoad } from "../lib/hooks";
import { run, supabase } from "../lib/supabase";
import { SOURCE_LABEL, STAGE_LABEL, type Lead, type LeadSource, type LeadStage } from "../lib/types";
import { leadMessage, waLink } from "../lib/whatsapp";

const STAGES: LeadStage[] = ["novo", "em_contato", "agendou", "perdido"];

const GUIDE_KEY = "tspa-leads-guia";

const TEMPERATURE_STYLE: Record<Temperature, { className: string; icon: typeof Flame }> = {
  quente: { className: "bg-terracotta/15 text-terracotta ring-1 ring-inset ring-terracotta/30", icon: Flame },
  morno: { className: "bg-ochre/15 text-ochre ring-1 ring-inset ring-ochre/30", icon: Thermometer },
  frio: { className: "bg-dusk/15 text-dusk ring-1 ring-inset ring-dusk/30", icon: Snowflake },
};

type Show = "todos" | Temperature | "cliente";
type Sort = "espera" | "recentes" | "nome";
const SORT_LABEL: Record<Sort, string> = { espera: "Esperando há mais tempo", recentes: "Mais recentes", nome: "Nome (A–Z)" };
const SHOW_LABEL: Record<Show, string> = { todos: "Todos", quente: "Quentes", morno: "Mornos", frio: "Frios", cliente: "Já é cliente" };
const SOURCES = Object.keys(SOURCE_LABEL) as LeadSource[];

const COLUMNS: KanbanColumn<LeadStage>[] = [
  { id: "novo", title: STAGE_LABEL.novo },
  { id: "em_contato", title: STAGE_LABEL.em_contato, shortTitle: "Contato" },
  { id: "agendou", title: STAGE_LABEL.agendou, dropHint: "Soltar aqui abre o agendamento" },
  { id: "perdido", title: STAGE_LABEL.perdido, muted: true },
];

export default function Leads() {
  const toast = useToast();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState<Lead | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<Show>("todos");
  const [source, setSource] = useState<LeadSource | null>(null);
  const [sort, setSort] = useState<Sort>("espera");
  // Guia "Como funciona": aberto na primeira visita, depois lembra a escolha
  const [guideOpen, setGuideOpen] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) !== "fechado";
    } catch {
      return true;
    }
  });
  function toggleGuide() {
    setGuideOpen((open) => {
      try {
        localStorage.setItem(GUIDE_KEY, open ? "fechado" : "aberto");
      } catch {
        /* navegação privada */
      }
      return !open;
    });
  }

  const { data, loading, error, reload, setData } = useLoad(
    () => run(supabase.from("leads").select("*").order("created_at", { ascending: false })) as Promise<Lead[]>,
    [],
  );
  const all = data ?? [];

  const matchesShow = (l: Lead, s: Show) =>
    s === "todos" ? true : s === "cliente" ? Boolean(l.client_id) : leadTemperature(l)?.temperature === s;

  const leads = useMemo(() => {
    const term = normalize(search.trim());
    const digits = search.replace(/\D/g, "");
    const list = all.filter(
      (l) =>
        matchesShow(l, show) &&
        (!source || l.source === source) &&
        (!term ||
          normalize(l.name).includes(term) ||
          normalize(l.interest ?? "").includes(term) ||
          (digits.length >= 3 && l.whatsapp.includes(digits))),
    );
    return list.sort((a, b) => {
      if (sort === "nome") return a.name.localeCompare(b.name, "pt-BR");
      if (sort === "recentes") return b.created_at.localeCompare(a.created_at);
      // Padrão: no funil, quem está esperando há mais tempo primeiro; nas outras, os mais recentes
      const open = (l: Lead) => l.stage === "novo" || l.stage === "em_contato";
      if (open(a) && open(b)) return leadReference(a).localeCompare(leadReference(b));
      return b.created_at.localeCompare(a.created_at);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, search, show, source, sort]);

  const metrics = useMemo(() => {
    const total = all.length;
    const converted = all.filter((l) => l.stage === "agendou").length;
    const bySource = new Map<LeadSource, { total: number; converted: number }>();
    for (const l of all) {
      const cur = bySource.get(l.source) ?? { total: 0, converted: 0 };
      cur.total += 1;
      if (l.stage === "agendou") cur.converted += 1;
      bySource.set(l.source, cur);
    }
    const best = [...bySource.entries()].sort((a, b) => b[1].converted - a[1].converted || b[1].total - a[1].total)[0];
    const cold = all.filter((l) => leadTemperature(l)?.temperature === "frio").length;
    return { total, rate: total ? Math.round((converted / total) * 100) : 0, best: best && best[1].converted > 0 ? best[0] : null, cold };
  }, [all]);

  /** Muda a etapa e registra contato agora (o lead "esquenta"). Devolve o estado anterior para desfazer. */
  async function setStage(lead: Lead, next: LeadStage, lastContact: string | null = new Date().toISOString()) {
    setData((list) => (list ?? []).map((l) => (l.id === lead.id ? { ...l, stage: next, last_contact_at: lastContact } : l)));
    const { error } = await supabase.from("leads").update({ stage: next, last_contact_at: lastContact }).eq("id", lead.id);
    if (error) {
      toast(friendlyError(error), "error");
      reload();
    }
  }

  /** Abre um agendamento já preenchido com o lead. Ele só vai para "Agendou" quando o agendamento for salvo. */
  function schedule(lead: Lead) {
    navigate(`/agenda?lead=${lead.id}`);
  }

  function move(lead: Lead, to: LeadStage) {
    if (to === lead.stage) return;
    if (to === "agendou") return schedule(lead);
    const before = { stage: lead.stage, last_contact_at: lead.last_contact_at };
    setStage(lead, to);
    toast(`${firstName(lead.name)} foi para ${STAGE_LABEL[to]}.`, "ok", {
      label: "Desfazer",
      onClick: () => setStage(lead, before.stage, before.last_contact_at),
    });
  }

  function openWhatsapp(lead: Lead) {
    window.open(waLink(lead.whatsapp, leadMessage(lead.name, lead.interest, lead.stage === "em_contato")), "_blank", "noopener");
    // Conta como contato: Novos → Em contato, e a temperatura volta a "quente"
    setStage(lead, lead.stage === "novo" ? "em_contato" : lead.stage);
  }

  const customized = show !== "todos" || source !== null || sort !== "espera";
  const summary = [show !== "todos" && SHOW_LABEL[show], source && SOURCE_LABEL[source], sort !== "espera" && SORT_LABEL[sort].toLowerCase()].filter(Boolean).join(" · ");

  const subtitle = (
    <span className="flex flex-wrap items-center gap-x-1.5">
      {all.length > 0 && (
        <span>
          {plural(metrics.total, "lead", "leads")} · {metrics.rate}% agendaram
          {metrics.best && ` · melhor origem: ${SOURCE_LABEL[metrics.best]}`} ·
        </span>
      )}
      <button type="button" onClick={toggleGuide} className="inline-flex items-center gap-1 text-primary" aria-expanded={guideOpen}>
        <Info className="h-3.5 w-3.5" aria-hidden="true" /> Como funciona
        <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", guideOpen && "rotate-180")} aria-hidden="true" />
      </button>
    </span>
  );

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={subtitle}
        action={
          <Button onClick={() => setEditing("new")} aria-label="Novo lead">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Lead</span>
          </Button>
        }
      />

      {guideOpen && <LeadsGuide onClose={toggleGuide} />}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Buscar por nome, WhatsApp ou interesse" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" aria-label="Buscar lead" />
        </div>
        <Popover
          className="max-h-[70svh] w-64 overflow-y-auto"
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
                {(Object.keys(SHOW_LABEL) as Show[]).map((s) => (
                  <MenuOption key={s} selected={show === s} hint={all.filter((l) => matchesShow(l, s)).length} onSelect={() => { setShow(s); close(); }}>
                    {show === s && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                    {SHOW_LABEL[s]}
                  </MenuOption>
                ))}
              </MenuSection>
              <div className="mx-2 my-1.5 border-t border-border" />
              <MenuSection title="Origem">
                <MenuOption selected={source === null} onSelect={() => { setSource(null); close(); }}>
                  {source === null && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                  Todas
                </MenuOption>
                {SOURCES.filter((s) => all.some((l) => l.source === s)).map((s) => (
                  <MenuOption key={s} selected={source === s} hint={all.filter((l) => l.source === s).length} onSelect={() => { setSource(s); close(); }}>
                    {source === s && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                    {SOURCE_LABEL[s]}
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

      {customized ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Mostrando <strong className="font-medium text-foreground">{summary}</strong>
          <button type="button" onClick={() => { setShow("todos"); setSource(null); setSort("espera"); }} className="ml-2 font-medium text-primary underline-offset-2 hover:underline">
            Limpar
          </button>
        </p>
      ) : (
        metrics.cold > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {metrics.cold === 1 ? "1 lead está" : `${metrics.cold} leads estão`} há {COLD_AFTER_DAYS} dias ou mais sem contato.{" "}
            <button type="button" className="font-medium text-primary" onClick={() => setShow("frio")}>
              Ver frios
            </button>
          </p>
        )
      )}

      <div className="mt-4">
        {error ? (
          <ErrorBox message={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner />
        ) : (
          <Kanban
            columns={COLUMNS}
            items={leads}
            getId={(l) => l.id}
            getColumn={(l) => l.stage}
            onMove={move}
            empty={(c) => <p className="px-2 py-6 text-center text-sm text-muted-foreground">{search || customized ? "Nenhum lead neste filtro." : `Nenhum lead em “${c.title}”.`}</p>}
            renderCard={(lead, { dragging }) => (
              <LeadCard
                lead={lead}
                dragging={dragging}
                onOpen={() => setEditing(lead)}
                onWhatsapp={() => openWhatsapp(lead)}
                onSchedule={() => schedule(lead)}
                onMove={(to) => move(lead, to)}
              />
            )}
          />
        )}
      </div>

      <LeadSheet lead={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} onSaved={reload} />
    </>
  );
}

const TEMP_BORDER: Record<Temperature, string> = {
  quente: "border-l-4 border-l-terracotta",
  morno: "border-l-4 border-l-ochre",
  frio: "border-l-4 border-l-dusk",
};

function LeadCard({ lead, dragging, onOpen, onWhatsapp, onSchedule, onMove }: {
  lead: Lead;
  dragging: boolean;
  onOpen: () => void;
  onWhatsapp: () => void;
  onSchedule: () => void;
  onMove: (to: LeadStage) => void;
}) {
  const temp = leadTemperature(lead);
  const closed = lead.stage === "perdido";
  return (
    <Card className={cx("p-3", temp && TEMP_BORDER[temp.temperature], dragging ? "cursor-grabbing" : "cursor-grab")}>
      <button type="button" className="block w-full text-left" onClick={onOpen}>
        <span className="flex items-start justify-between gap-2">
          <span className={cx("font-medium leading-snug", closed && "text-muted-foreground")}>{lead.name}</span>
          <Badge>{SOURCE_LABEL[lead.source]}</Badge>
        </span>
        {(lead.interest || (closed && lead.notes)) && (
          <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{lead.interest || lead.notes}</span>
        )}
        {((lead.submissions ?? 1) > 1 || (lead.client_id && lead.stage !== "agendou")) && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {(lead.submissions ?? 1) > 1 && <Badge className="bg-primary/10 text-primary">enviou {lead.submissions}×</Badge>}
            {lead.client_id && lead.stage !== "agendou" && <Badge className="bg-accent text-accent-foreground">já é cliente</Badge>}
          </span>
        )}
        {temp ? (
          <TemperatureTag lead={lead} />
        ) : (
          <span className="mt-1 block text-xs text-muted-foreground">{formatDistanceToNow(parseISO(lead.created_at), { locale: ptBR, addSuffix: true })}</span>
        )}
      </button>
      {!dragging && (
        <div className="mt-2.5 flex items-center gap-1.5">
          {!closed && (
            <button type="button" onClick={onWhatsapp} aria-label={`WhatsApp de ${lead.name}`} title="WhatsApp" className="grid h-8 w-8 place-items-center rounded-full border border-input text-muted-foreground hover:bg-muted hover:text-foreground">
              <MessageCircle className="h-4 w-4" />
            </button>
          )}
          {lead.stage !== "agendou" && !closed && (
            <button type="button" onClick={onSchedule} aria-label={`Agendar ${lead.name}`} title="Agendar" className="grid h-8 w-8 place-items-center rounded-full border border-input text-muted-foreground hover:bg-muted hover:text-foreground">
              <CalendarPlus className="h-4 w-4" />
            </button>
          )}
          <span className="ml-auto">
            <Popover
              className="w-48"
              trigger={({ open, toggle }) => (
                <button type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  Mover <ChevronDown className="h-3.5 w-3.5" />
                </button>
              )}
            >
              {(close) => (
                <div role="menu">
                  <MenuSection title="Mover para">
                    {STAGES.filter((s) => s !== lead.stage).map((s) => (
                      <MenuOption key={s} selected={false} onSelect={() => { close(); onMove(s); }}>
                        {s === "agendou" ? "Agendou (abre agendamento)" : STAGE_LABEL[s]}
                      </MenuOption>
                    ))}
                  </MenuSection>
                </div>
              )}
            </Popover>
          </span>
        </div>
      )}
    </Card>
  );
}

function TemperatureTag({ lead }: { lead: Lead }) {
  const t = leadTemperature(lead);
  if (!t) return null;
  const { className, icon: Icon } = TEMPERATURE_STYLE[t.temperature];
  return (
    <span className={cx("mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {TEMPERATURE_LABEL[t.temperature]} · {t.detail}
    </span>
  );
}

function LeadSheet({ lead, open, onClose, onSaved }: { lead: Lead | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ name: "", whatsapp: "", source: "instagram" as LeadSource, interest: "", notes: "", stage: "novo" as LeadStage });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      name: lead?.name ?? "",
      whatsapp: lead?.whatsapp ?? "",
      source: lead?.source ?? "instagram",
      interest: lead?.interest ?? "",
      notes: lead?.notes ?? "",
      stage: lead?.stage ?? "novo",
    });
  }, [open, lead]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (form.name.trim().length < 2) return setError("Digite o nome.");
    const digits = form.whatsapp.replace(/\D/g, "");
    if (digits.length < 10) return setError("Digite o WhatsApp com DDD.");
    setSaving(true);
    setError(null);
    const payload = { name: form.name.trim(), whatsapp: digits, source: form.source, interest: form.interest.trim() || null, notes: form.notes.trim() || null, stage: form.stage };
    try {
      if (lead) await run(supabase.from("leads").update(payload).eq("id", lead.id));
      else await run(supabase.from("leads").insert({ ...payload, consent: true, consent_at: new Date().toISOString() }));
      toast("Lead salvo.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  /** Para contatos fora do painel (ligação, Instagram): registra que houve conversa hoje. */
  async function registerContact() {
    if (!lead) return;
    setSaving(true);
    try {
      const stage = lead.stage === "novo" ? "em_contato" : lead.stage;
      await run(supabase.from("leads").update({ last_contact_at: new Date().toISOString(), stage }).eq("id", lead.id));
      toast("Contato registrado.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!lead) return;
    const ok = await confirm({
      title: "Excluir lead?",
      message: (
        <>
          <strong className="text-foreground">{lead.name}</strong> sai do funil. Se a pessoa só não quis agendar agora, prefira mover para Perdido (assim a taxa de conversão fica correta).
        </>
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await run(supabase.from("leads").delete().eq("id", lead.id));
      toast("Lead excluído.");
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
      title={lead ? lead.name : "Novo lead"}
      footer={
        <div className="flex gap-2">
          {lead && <Button variant="danger" onClick={remove} disabled={saving}>Excluir</Button>}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>Salvar</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nome">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input inputMode="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="83 99999-0000" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Origem">
            <Select value={form.source} onChange={(e) => set("source", e.target.value as LeadSource)}>
              {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </Select>
          </Field>
          <Field label="Etapa">
            <Select value={form.stage} onChange={(e) => set("stage", e.target.value as LeadStage)}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Interesse">
          <Input value={form.interest} onChange={(e) => set("interest", e.target.value)} placeholder="Ex.: Head Spa Ritual" />
        </Field>
        <Field label="Anotações">
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>
        {lead && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm">
            <span>
              <span className="block font-medium">Último contato</span>
              <span className="text-muted-foreground">
                {lead.last_contact_at ? fmt(lead.last_contact_at, "dd/MM/yyyy 'às' HH:mm") : "Ainda sem contato"}
              </span>
            </span>
            <Button size="sm" variant="outline" onClick={registerContact} disabled={saving}>
              Falei hoje
            </Button>
          </div>
        )}
        {lead && !lead.consent && <p className="text-xs text-muted-foreground">Sem registro de consentimento LGPD.</p>}
        {error && <p className="rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}

/** Explica o que é lead, as etapas e quando entrar em contato em cada temperatura. */
function LeadsGuide({ onClose }: { onClose: () => void }) {
  const temps: { t: Temperature; when: string; action: string }[] = [
    { t: "quente", when: "Hoje ou ontem", action: "Responda no mesmo dia. É quando a chance de agendar é maior." },
    { t: "morno", when: "2 a 6 dias sem contato", action: "Mande um lembrete leve: sugira dois horários ou conte de um cuidado que combina com o interesse do lead." },
    {
      t: "frio",
      when: `${COLD_AFTER_DAYS} dias ou mais sem contato`,
      action: "Faça uma última tentativa, com carinho e sem pressão. Sem resposta, mova para Perdido.",
    },
  ];
  return (
    <Card className="mb-5 p-4 text-sm leading-relaxed">
      <p className="font-medium text-foreground">O que é um lead</p>
      <p className="mt-1 text-muted-foreground">
        Alguém que mostrou interesse no TSpa (formulário do site, Instagram, WhatsApp, indicação) e ainda não agendou.
        Quando agenda, vira cliente.
      </p>

      <p className="mt-4 font-medium text-foreground">Etapas</p>
      <p className="mt-1 text-muted-foreground">
        <strong className="font-medium text-foreground">Novos</strong> (ainda sem contato) →{" "}
        <strong className="font-medium text-foreground">Em contato</strong> (você já respondeu) →{" "}
        <strong className="font-medium text-foreground">Agendou</strong> (virou cliente) ou{" "}
        <strong className="font-medium text-foreground">Perdido</strong> (não vai agendar agora).
      </p>

      <p className="mt-4 font-medium text-foreground">Temperatura e quando entrar em contato</p>
      <p className="mt-1 text-muted-foreground">Vale para Novos e Em contato, contando desde o último contato.</p>
      <ul className="mt-2 space-y-2">
        {temps.map(({ t, when, action }) => {
          const Icon = TEMPERATURE_STYLE[t].icon;
          return (
            <li key={t} className="flex gap-3">
              <span className={cx("mt-0.5 inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium", TEMPERATURE_STYLE[t].className)}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {TEMPERATURE_LABEL[t]}
              </span>
              <span className="text-muted-foreground">
                <span className="text-foreground">{when}.</span> {action}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-muted-foreground">
        Tocar em <strong className="font-medium text-foreground">WhatsApp</strong>, mudar a etapa ou usar{" "}
        <strong className="font-medium text-foreground">Falei hoje</strong> conta como contato e deixa o lead quente de novo.
      </p>
      <button type="button" onClick={onClose} className="mt-3 text-sm font-medium text-primary">
        Entendi, esconder
      </button>
    </Card>
  );
}
