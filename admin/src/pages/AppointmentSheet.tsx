import { useEffect, useMemo, useState } from "react";
import { addDays, addMinutes, parseISO } from "date-fns";
import { Check, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { Button, Field, Input, Segmented, Select, Switch, Textarea } from "../components/ui";
import { useToast } from "../components/Toast";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { brl, durationBetween, fmt, normalize, phone, toDateInput } from "../lib/format";
import { buildRange, findConflict, slotTimes } from "../lib/slots";
import { run, supabase } from "../lib/supabase";
import {
  PAYMENT_LABEL,
  PRESSURE_LABEL,
  STATUS_LABEL,
  type Appointment,
  type Client,
  type PaymentMethod,
  type Service,
  type Status,
} from "../lib/types";
import { confirmationMessage, waLink } from "../lib/whatsapp";

export type AppointmentDefaults = { date?: string; time?: string; room?: 1 | 2; clientId?: string };

type ClientOption = Pick<Client, "id" | "name" | "whatsapp" | "allergies" | "pregnant" | "massage_pressure" | "preferences">;

export function AppointmentSheet({ open, onClose, onSaved, appointment, defaults }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  appointment?: Appointment | null;
  defaults?: AppointmentDefaults;
}) {
  const { settings, services, professionals, professionalName } = useAppData();
  const toast = useToast();
  const editing = Boolean(appointment);

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState<string>("");
  const [clientQuery, setClientQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [professionalId, setProfessionalId] = useState("");
  const [servicesTouched, setServicesTouched] = useState(false);
  const [durationMin, setDurationMin] = useState(60);
  const [date, setDate] = useState(toDateInput(new Date()));
  const [time, setTime] = useState("09:00");
  const [room, setRoom] = useState<1 | 2>(1);
  const [price, setPrice] = useState("0");
  const [status, setStatus] = useState<Status>("agendado");
  const [payment, setPayment] = useState<PaymentMethod | "">("");
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche o formulário toda vez que abre
  useEffect(() => {
    if (!open) return;
    setError(null);
    setClientQuery("");
    setNewName("");
    setNewWhatsapp("");
    if (appointment) {
      setClientMode("existing");
      setClientId(appointment.client_id);
      setServiceIds(appointment.service_ids?.length ? appointment.service_ids : appointment.service_id ? [appointment.service_id] : []);
      setServicesTouched(false);
      setProfessionalId(appointment.professional_id ?? professionals.find((p) => p.active)?.id ?? "");
      setDurationMin(durationBetween(appointment.starts_at, appointment.ends_at));
      setDate(appointment.starts_at.slice(0, 10));
      setTime(appointment.starts_at.slice(11, 16));
      setRoom(appointment.room);
      setPrice(String(appointment.price));
      setStatus(appointment.status);
      setPayment(appointment.payment_method ?? "");
      setPaid(appointment.paid);
      setNotes(appointment.notes ?? "");
    } else {
      setClientMode("existing");
      setClientId(defaults?.clientId ?? "");
      setServiceIds([]);
      setServicesTouched(false);
      setProfessionalId(professionals.find((p) => p.active)?.id ?? "");
      setDurationMin(60);
      setPrice("0");
      setDate(defaults?.date ?? toDateInput(new Date()));
      setTime(defaults?.time ?? settings.open_time.slice(0, 5));
      setRoom(defaults?.room ?? 1);
      setStatus("agendado");
      setPayment("");
      setPaid(false);
      setNotes("");
    }
    run(supabase.from("clients").select("id, name, whatsapp, allergies, pregnant, massage_pressure, preferences").order("name"))
      .then((rows) => setClients((rows ?? []) as ClientOption[]))
      .catch((err) => setError(friendlyError(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment?.id]);

  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedServices = serviceIds.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => Boolean(s));
  const serviceOptions = services.filter((s) => s.active && !serviceIds.includes(s.id));
  // Atendimento antigo cujo serviço foi apagado do cadastro: mantém nome e duração que já tinha
  const keepsOldServices = Boolean(appointment) && !servicesTouched && selectedServices.length === 0;
  const serviceLabel = selectedServices.length ? selectedServices.map((s) => s.name).join(" + ") : appointment?.service_name ?? "";
  const needsProfessional = selectedServices.length
    ? selectedServices.some((s) => s.needs_professional)
    : appointment?.needs_professional ?? true;
  // Lista de profissionais: as ativas, mais a do atendimento (se ela tiver sido desativada depois)
  const professionalOptions = professionals.filter((p) => p.active || p.id === professionalId);
  const showProfessional = needsProfessional && (professionalOptions.length > 1 || !professionalOptions.some((p) => p.id === professionalId));

  const times = useMemo(() => {
    const list = slotTimes(settings);
    if (time && !list.includes(time)) list.push(time);
    return list.sort();
  }, [settings, time]);

  const endTime = fmt(addMinutes(parseISO(`${date}T${time}:00`), durationMin), "HH:mm");

  const matches = useMemo(() => {
    const q = normalize(clientQuery.trim());
    if (!q) return [];
    return clients.filter((c) => normalize(c.name).includes(q) || (c.whatsapp ?? "").includes(q)).slice(0, 6);
  }, [clients, clientQuery]);

  /** Troca a lista de serviços e soma duração e valor. */
  function applyServices(ids: string[]) {
    setServiceIds(ids);
    setServicesTouched(true);
    const list = ids.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => Boolean(s));
    setDurationMin(list.reduce((sum, s) => sum + s.duration_min, 0) || 60);
    setPrice(String(list.reduce((sum, s) => sum + Number(s.price), 0)));
  }

  async function save() {
    setError(null);
    const priceValue = Number(price.replace(",", "."));
    if (clientMode === "existing" && !clientId) return setError("Escolha a cliente ou cadastre uma nova.");
    if (clientMode === "new" && newName.trim().length < 2) return setError("Digite o nome da nova cliente.");
    if (selectedServices.length === 0 && !keepsOldServices) return setError("Escolha pelo menos um serviço.");
    if (needsProfessional && !professionalId) {
      return setError(professionals.some((p) => p.active) ? "Escolha a profissional." : "Cadastre uma profissional em Mais → Profissionais.");
    }
    if (Number.isNaN(priceValue) || priceValue < 0) return setError("Valor inválido.");
    if (paid && !payment) return setError("Escolha a forma de pagamento para marcar como pago.");

    const range = buildRange(date, time, durationMin);

    setSaving(true);
    let createdClientId: string | null = null;
    try {
      const nextDay = toDateInput(addDays(parseISO(date), 1));
      const sameDay = (await run(
        supabase
          .from("appointments")
          .select("*, clients(name, whatsapp)")
          .gte("starts_at", `${date}T00:00:00`)
          .lt("starts_at", `${nextDay}T00:00:00`),
      )) as Appointment[];
      const conflict = findConflict(
        { id: appointment?.id, ...range, room, needs_professional: needsProfessional, professional_id: needsProfessional ? professionalId : null, status },
        sameDay,
        settings,
        professionalName,
      );
      if (conflict) {
        setError(conflict);
        return;
      }

      let finalClientId = clientId;
      if (clientMode === "new") {
        const created = await run(
          supabase
            .from("clients")
            .insert({ name: newName.trim(), whatsapp: newWhatsapp.replace(/\D/g, "") || null })
            .select("id")
            .single(),
        );
        createdClientId = (created as { id: string }).id;
        finalClientId = createdClientId;
      }

      const payload = {
        client_id: finalClientId,
        service_id: selectedServices[0]?.id ?? appointment?.service_id ?? null,
        service_ids: selectedServices.length ? selectedServices.map((s) => s.id) : appointment?.service_ids ?? [],
        service_name: serviceLabel,
        ...range,
        room,
        needs_professional: needsProfessional,
        professional_id: needsProfessional ? professionalId : null,
        price: priceValue,
        status,
        payment_method: payment || null,
        paid,
        notes: notes.trim() || null,
      };

      if (appointment) await run(supabase.from("appointments").update(payload).eq("id", appointment.id));
      else await run(supabase.from("appointments").insert(payload));

      toast(editing ? "Agendamento atualizado." : "Agendamento criado.");
      onSaved();
      onClose();
    } catch (err) {
      if (createdClientId) await supabase.from("clients").delete().eq("id", createdClientId);
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!appointment) return;
    if (!window.confirm("Excluir este agendamento? Se ele estava pago, a entrada no financeiro também sai.")) return;
    setSaving(true);
    try {
      await run(supabase.from("appointments").delete().eq("id", appointment.id));
      toast("Agendamento excluído.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const whatsappNumber = clientMode === "existing" ? selectedClient?.whatsapp : newWhatsapp;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Agendamento" : "Novo agendamento"}
      footer={
        <div className="flex items-center gap-2.5">
          {editing && (
            <Button variant="danger" size="icon" className="h-11 w-11" onClick={remove} aria-label="Excluir agendamento" disabled={saving}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {editing && whatsappNumber && (
            <a
              href={waLink(whatsappNumber, confirmationMessage(selectedClient?.name ?? "", serviceLabel, `${date}T${time}:00`))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-input px-4 text-sm font-medium hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" /> Confirmar
            </a>
          )}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Cliente */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/80">Cliente</span>
            {!editing && (
              <button
                type="button"
                className="text-sm font-medium text-primary"
                onClick={() => setClientMode(clientMode === "existing" ? "new" : "existing")}
              >
                {clientMode === "existing" ? "+ Nova cliente" : "Escolher existente"}
              </button>
            )}
          </div>
          {clientMode === "new" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="WhatsApp com DDD" inputMode="tel" value={newWhatsapp} onChange={(e) => setNewWhatsapp(e.target.value)} />
            </div>
          ) : selectedClient ? (
            <div className="flex items-center justify-between rounded-xl border border-input bg-card px-3.5 py-2.5">
              <div>
                <p className="font-medium">{selectedClient.name}</p>
                {selectedClient.whatsapp && <p className="text-sm text-muted-foreground">{phone(selectedClient.whatsapp)}</p>}
              </div>
              {!editing && (
                <button type="button" onClick={() => setClientId("")} aria-label="Trocar cliente" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="relative">
              <Input placeholder="Buscar por nome ou WhatsApp" value={clientQuery} onChange={(e) => setClientQuery(e.target.value)} autoComplete="off" />
              {matches.length > 0 && (
                <ul className="absolute inset-x-0 top-12 z-10 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                  {matches.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="w-full px-3.5 py-2.5 text-left hover:bg-muted" onClick={() => setClientId(c.id)}>
                        <span className="font-medium">{c.name}</span>
                        {c.whatsapp && <span className="ml-2 text-sm text-muted-foreground">{phone(c.whatsapp)}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {clientQuery.trim() && matches.length === 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Nenhuma cliente encontrada.{" "}
                  <button type="button" className="font-medium text-primary" onClick={() => { setClientMode("new"); setNewName(clientQuery); }}>
                    Cadastrar “{clientQuery.trim()}”
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {clientMode === "existing" && selectedClient && (selectedClient.allergies || selectedClient.pregnant || selectedClient.massage_pressure || selectedClient.preferences) && (
          <div className="-mt-1 rounded-xl bg-taupe/10 px-3.5 py-2.5 text-sm text-taupe dark:text-accent-foreground">
            <p className="flex flex-wrap gap-x-3 gap-y-1 font-medium">
              {selectedClient.pregnant && <span>Gestante</span>}
              {selectedClient.allergies && <span>Alergias: {selectedClient.allergies}</span>}
              {selectedClient.massage_pressure && <span>Pressão {PRESSURE_LABEL[selectedClient.massage_pressure].toLowerCase()}</span>}
            </p>
            {selectedClient.preferences && <p className="mt-0.5 opacity-90">{selectedClient.preferences}</p>}
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground/80">Serviços</span>
          {selectedServices.length > 0 && (
            <ul className="mb-2 divide-y divide-border/70 rounded-xl border border-input bg-card">
              {selectedServices.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.duration_min} min · {brl(s.price)}
                      {!s.needs_professional && " · sem profissional"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyServices(serviceIds.filter((id) => id !== s.id))}
                    aria-label={`Tirar ${s.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {keepsOldServices && (
            <p className="mb-2 rounded-xl border border-input bg-card px-3.5 py-2.5 font-medium">{appointment?.service_name}</p>
          )}
          {selectedServices.length || keepsOldServices ? (
            // Já tem serviço: vira um link discreto; o seletor invisível por cima abre a lista nativa
            <label className="relative inline-flex cursor-pointer items-center gap-1 rounded-full px-1 py-1 text-sm text-muted-foreground hover:text-primary">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Adicionar serviço
              <select
                value=""
                onChange={(e) => e.target.value && applyServices([...(keepsOldServices ? [] : serviceIds), e.target.value])}
                aria-label="Adicionar serviço"
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">Adicionar serviço</option>
                {serviceOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.duration_min} min · {brl(s.price)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Select value="" onChange={(e) => e.target.value && applyServices([e.target.value])} aria-label="Adicionar serviço">
              <option value="">Escolha o serviço…</option>
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_min} min · {brl(s.price)}
                </option>
              ))}
            </Select>
          )}
          {selectedServices.length > 1 && (
            <p className="mt-1.5 text-sm font-medium text-primary">
              Total: {durationMin} min · {brl(selectedServices.reduce((sum, s) => sum + Number(s.price), 0))}
            </p>
          )}
          {selectedServices.length > 1 && needsProfessional && selectedServices.some((s) => !s.needs_professional) && (
            <p className="mt-1 text-xs text-muted-foreground">
              O atendimento todo fica com a profissional escolhida. Para o serviço sem profissional acontecer na Sala 2 ao mesmo tempo, agende-o separado.
            </p>
          )}
        </div>

        {showProfessional && (
          <Field label="Profissional">
            <Select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
              {!professionalId && <option value="">Escolha…</option>}
              {professionalOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {!p.active ? " (desativada)" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </Field>
          <Field label="Hora" hint={`Termina às ${endTime}`}>
            <Select value={time} onChange={(e) => setTime(e.target.value)}>
              {times.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Sala" hint={!settings.room2_enabled ? "A Sala 2 está desativada (Mais → Ajustes)." : undefined}>
          <Segmented
            value={room}
            onChange={setRoom}
            options={[
              { value: 1, label: "Sala 1" },
              { value: 2, label: "Sala 2", disabled: !settings.room2_enabled && appointment?.room !== 2 },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Forma de pagamento">
          <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod | "")}>
            <option value="">Ainda não definida</option>
            {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => (
              <option key={p} value={p}>
                {PAYMENT_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-xl bg-muted/60 px-4 py-3">
          <Switch
            checked={paid}
            onChange={setPaid}
            label="Pago"
            description={paid ? "Entra automaticamente no Financeiro." : status === "concluido" ? "Fica em “A receber” até marcar como pago." : undefined}
          />
        </div>

        <Field label="Observações">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: prefere música baixa" />
        </Field>

        {error && (
          <p className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {editing && appointment?.paid && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5" /> Pagamento registrado no Financeiro.
          </p>
        )}
      </div>
    </Sheet>
  );
}
