import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CalendarPlus, ChevronDown, Flame, Info, MessageCircle, Plus, Snowflake, Thermometer } from "lucide-react";
import { useLocation } from "wouter";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Badge, Button, Card, ErrorBox, Field, Input, PageHeader, Select, Spinner, Stat, Textarea, cx } from "../components/ui";
import { friendlyError } from "../lib/errors";
import { fmt, phone } from "../lib/format";
import { COLD_AFTER_DAYS, TEMPERATURE_LABEL, leadReference, leadTemperature, type Temperature } from "../lib/leadTemperature";
import { useLoad } from "../lib/hooks";
import { run, supabase } from "../lib/supabase";
import { SOURCE_LABEL, STAGE_LABEL, type Lead, type LeadSource, type LeadStage } from "../lib/types";
import { leadMessage, waLink } from "../lib/whatsapp";

const STAGES: LeadStage[] = ["novo", "em_contato", "agendou", "perdido"];
const NEXT: Partial<Record<LeadStage, LeadStage>> = { novo: "em_contato", em_contato: "agendou" };

const GUIDE_KEY = "tspa-leads-guia";

const TEMPERATURE_STYLE: Record<Temperature, { className: string; icon: typeof Flame }> = {
  quente: { className: "bg-terracotta/15 text-terracotta ring-1 ring-inset ring-terracotta/30", icon: Flame },
  morno: { className: "bg-ochre/15 text-ochre ring-1 ring-inset ring-ochre/30", icon: Thermometer },
  frio: { className: "bg-dusk/15 text-dusk ring-1 ring-inset ring-dusk/30", icon: Snowflake },
};

export default function Leads() {
  const toast = useToast();
  const [, navigate] = useLocation();
  const [stage, setStage] = useState<LeadStage>("novo");
  const [editing, setEditing] = useState<Lead | "new" | null>(null);
  const [tempFilter, setTempFilter] = useState<Temperature | null>(null);
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
  // No funil (Novos/Em contato), quem está esperando há mais tempo aparece primeiro
  const leads = useMemo(
    () =>
      [...(data ?? [])].sort((a, b) => {
        const open = (l: Lead) => l.stage === "novo" || l.stage === "em_contato";
        if (open(a) && open(b)) return leadReference(a).localeCompare(leadReference(b));
        return b.created_at.localeCompare(a.created_at);
      }),
    [data],
  );
  const tempCounts = useMemo(() => {
    const counts: Record<Temperature, number> = { quente: 0, morno: 0, frio: 0 };
    for (const l of leads) {
      const t = leadTemperature(l);
      if (t) counts[t.temperature] += 1;
    }
    return counts;
  }, [leads]);
  const visible = (l: Lead) => !tempFilter || leadTemperature(l)?.temperature === tempFilter;

  const metrics = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter((l) => l.stage === "agendou").length;
    const bySource = new Map<LeadSource, { total: number; converted: number }>();
    for (const l of leads) {
      const cur = bySource.get(l.source) ?? { total: 0, converted: 0 };
      cur.total += 1;
      if (l.stage === "agendou") cur.converted += 1;
      bySource.set(l.source, cur);
    }
    const best = [...bySource.entries()].sort((a, b) => b[1].converted - a[1].converted || b[1].total - a[1].total)[0];
    return {
      total,
      rate: total ? Math.round((converted / total) * 100) : 0,
      converted,
      best: best ? { source: best[0], ...best[1] } : null,
    };
  }, [leads]);

  /** Muda a etapa e/ou registra um contato agora (o lead "esquenta"). */
  async function updateStage(lead: Lead, next: LeadStage) {
    const last_contact_at = new Date().toISOString();
    setData((list) => (list ?? []).map((l) => (l.id === lead.id ? { ...l, stage: next, last_contact_at } : l)));
    const { error } = await supabase.from("leads").update({ stage: next, last_contact_at }).eq("id", lead.id);
    if (error) {
      toast(friendlyError(error), "error");
      reload();
    }
  }

  async function schedule(lead: Lead) {
    try {
      let clientId = lead.client_id;
      if (!clientId) {
        const created = (await run(
          supabase.from("clients").insert({ name: lead.name, whatsapp: lead.whatsapp.replace(/\D/g, "") || null, notes: lead.interest ? `Interesse: ${lead.interest}` : null }).select("id").single(),
        )) as { id: string };
        clientId = created.id;
      }
      await run(supabase.from("leads").update({ stage: "agendou", client_id: clientId, last_contact_at: new Date().toISOString() }).eq("id", lead.id));
      navigate(`/agenda?cliente=${clientId}`);
    } catch (err) {
      toast(friendlyError(err), "error");
    }
  }

  function openWhatsapp(lead: Lead) {
    window.open(waLink(lead.whatsapp, leadMessage(lead.name, lead.interest)), "_blank", "noopener");
    // Conta como contato: Novos → Em contato, e a temperatura volta a "quente"
    updateStage(lead, lead.stage === "novo" ? "em_contato" : lead.stage);
  }

  const counts = Object.fromEntries(STAGES.map((s) => [s, leads.filter((l) => l.stage === s && visible(l)).length])) as Record<LeadStage, number>;

  function toggleTemp(t: Temperature) {
    const next = tempFilter === t ? null : t;
    setTempFilter(next);
    // No celular, pula para a aba que tem leads dessa temperatura
    if (next) {
      const first = STAGES.find((s) => leads.some((l) => l.stage === s && leadTemperature(l)?.temperature === next));
      if (first) setStage(first);
    }
  }

  const TEMP_BORDER: Record<Temperature, string> = {
    quente: "border-l-4 border-l-terracotta",
    morno: "border-l-4 border-l-ochre",
    frio: "border-l-4 border-l-dusk",
  };
  const card = (lead: Lead) => (
    <Card key={lead.id} className={cx("p-3.5", leadTemperature(lead) && TEMP_BORDER[leadTemperature(lead)!.temperature])}>
      <button type="button" className="block w-full text-left" onClick={() => setEditing(lead)}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-snug">{lead.name}</p>
          <Badge>{SOURCE_LABEL[lead.source]}</Badge>
        </div>
        {lead.interest && <p className="mt-1 text-sm text-foreground/80">{lead.interest}</p>}
        {((lead.submissions ?? 1) > 1 || lead.client_id) && (
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            {(lead.submissions ?? 1) > 1 && <Badge className="bg-primary/10 text-primary">enviou {lead.submissions}×</Badge>}
            {lead.client_id && lead.stage !== "agendou" && <Badge className="bg-accent text-accent-foreground">já é cliente</Badge>}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {phone(lead.whatsapp)} · {formatDistanceToNow(parseISO(lead.created_at), { locale: ptBR, addSuffix: true })}
        </p>
        <TemperatureTag lead={lead} />
      </button>
      {lead.stage !== "perdido" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => openWhatsapp(lead)}>
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          {lead.stage !== "agendou" && (
            <Button size="sm" variant="secondary" onClick={() => schedule(lead)}>
              <CalendarPlus className="h-4 w-4" /> Agendar
            </Button>
          )}
          {NEXT[lead.stage] && NEXT[lead.stage] !== "agendou" && (
            <Button size="sm" variant="ghost" onClick={() => updateStage(lead, NEXT[lead.stage]!)}>
              {STAGE_LABEL[NEXT[lead.stage]!]} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={
          <button type="button" onClick={toggleGuide} className="inline-flex items-center gap-1 text-primary" aria-expanded={guideOpen}>
            <Info className="h-3.5 w-3.5" aria-hidden="true" /> Como funciona
            <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", guideOpen && "rotate-180")} aria-hidden="true" />
          </button>
        }
        action={
          <Button onClick={() => setEditing("new")} aria-label="Novo lead">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Lead</span>
          </Button>
        }
      />

      {guideOpen && <LeadsGuide onClose={toggleGuide} />}

      {error ? (
        <div><ErrorBox message={error} onRetry={reload} /></div>
      ) : loading && !data ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <Stat label="Leads" value={metrics.total} />
            <Stat label="Conversão" value={`${metrics.rate}%`} hint={`${metrics.converted} agendaram`} />
            <Stat label="Melhor origem" value={metrics.best ? SOURCE_LABEL[metrics.best.source] : "—"} hint={metrics.best ? `${metrics.best.converted} de ${metrics.best.total}` : undefined} />
          </div>

          {/* Temperatura dos leads em aberto: toque para filtrar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["quente", "morno", "frio"] as Temperature[]).map((t) => {
              const Icon = TEMPERATURE_STYLE[t].icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTemp(t)}
                  aria-pressed={tempFilter === t}
                  className={cx(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition",
                    TEMPERATURE_STYLE[t].className,
                    tempFilter === t && "ring-2 ring-current",
                    tempFilter && tempFilter !== t && "opacity-50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {tempCounts[t]} {TEMPERATURE_LABEL[t].toLowerCase()}
                  {tempCounts[t] !== 1 && "s"}
                </button>
              );
            })}
            {tempFilter && (
              <button type="button" onClick={() => setTempFilter(null)} className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                Ver todos
              </button>
            )}
          </div>
          {tempCounts.frio > 0 && !tempFilter && (
            <p className="mt-2 text-sm text-muted-foreground">
              {tempCounts.frio === 1 ? "1 lead está" : `${tempCounts.frio} leads estão`} há {COLD_AFTER_DAYS} dias ou mais sem contato.{" "}
              <button type="button" className="font-medium text-primary" onClick={() => toggleTemp("frio")}>
                Ver frios
              </button>
            </p>
          )}

          {/* Celular: abas por etapa */}
          <div className="mt-5 md:hidden">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={cx("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium", stage === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >
                  {STAGE_LABEL[s]} <span className="opacity-70">{counts[s]}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {leads.filter((l) => l.stage === stage && visible(l)).map(card)}
              {counts[stage] === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhum lead em “{STAGE_LABEL[stage]}”.</p>}
            </div>
          </div>

          {/* Computador: colunas do funil */}
          <div className="mt-6 hidden grid-cols-4 gap-3 md:grid">
            {STAGES.map((s) => (
              <div key={s} className="min-w-0">
                <p className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {STAGE_LABEL[s]} <span>{counts[s]}</span>
                </p>
                <div className="space-y-2">{leads.filter((l) => l.stage === s && visible(l)).map(card)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <LeadSheet lead={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} onSaved={reload} />
    </>
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
