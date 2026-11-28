import { useEffect, useMemo, useState } from "react";
import { addDays, addMinutes, parseISO } from "date-fns";
import { Check, MessageCircle, Package, Plus, Trash2, X } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { Button, Field, Input, Segmented, Select, Switch, Textarea } from "../components/ui";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { brl, durationBetween, fmt, nameKey, normalize, phone, phoneKey, toDateInput } from "../lib/format";
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
  type PackageUsage,
} from "../lib/types";
import { afterVisitMessage, confirmationMessage, waLink } from "../lib/whatsapp";

export type AppointmentDefaults = { date?: string; time?: string; room?: 1 | 2; clientId?: string; leadId?: string };

type LeadInfo = { id: string; name: string; whatsapp: string; interest: string | null; client_id: string | null };

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
  const confirm = useConfirm();
  const editing = Boolean(appointment);

  const [clients, setClients] = useState<ClientOption[]>([]);
  // Agendamento vindo de um lead: ao salvar, o lead passa para "Agendou"
  const [lead, setLead] = useState<LeadInfo | null>(null);
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
  const [paidAt, setPaidAt] = useState("");
  // Pacotes da cliente e o que está sendo usado neste atendimento
  const [clientPackages, setClientPackages] = useState<PackageUsage[]>([]);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [packageTouched, setPackageTouched] = useState(false);
  const today = toDateInput(new Date());
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
      setPaidAt(appointment.paid_at ?? "");
      setPackageId(appointment.package_id ?? null);
      setPackageTouched(true);
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
      setPaidAt("");
      setPackageId(null);
      setPackageTouched(false);
      setNotes("");
    }
    setLead(null);
    const leadId = !appointment ? defaults?.leadId : undefined;
    Promise.all([
      run(supabase.from("clients").select("id, name, whatsapp, allergies, pregnant, massage_pressure, preferences").order("name")),
      leadId ? run(supabase.from("leads").select("id, name, whatsapp, interest, client_id").eq("id", leadId).maybeSingle()) : null,
    ])
      .then(([rows, leadRow]) => {
        const list = (rows ?? []) as ClientOption[];
        setClients(list);
        const info = leadRow as LeadInfo | null;
        if (!info) return;
        setLead(info);
        // Cliente: a ligada ao lead, ou uma já cadastrada com o mesmo WhatsApp, ou uma nova com os dados do lead
        const match = info.client_id ?? list.find((c) => c.whatsapp && phoneKey(c.whatsapp) === phoneKey(info.whatsapp))?.id;
        if (match) {
          setClientMode("existing");
          setClientId(match);
        } else {
          setClientMode("new");
          setNewName(info.name);
          setNewWhatsapp(info.whatsapp);
        }
        // Serviços: os que o lead marcou no formulário, quando existem no cadastro
        const wanted = (info.interest ?? "").split(",").map((i) => i.trim().toLowerCase()).filter(Boolean);
        const ids = services.filter((s) => s.active && wanted.includes(s.name.toLowerCase())).map((s) => s.id);
        if (ids.length) applyServices(ids);
      })
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

  /** Nova cliente com o mesmo WhatsApp ou nome de uma já cadastrada */
  const newClientMatch = useMemo(() => {
    if (clientMode !== "new") return null;
    const pk = phoneKey(newWhatsapp);
    const nk = nameKey(newName);
    const byPhone = pk.length >= 10 ? clients.find((c) => c.whatsapp && phoneKey(c.whatsapp) === pk) : undefined;
    const byName = nk.length >= 2 ? clients.find((c) => nameKey(c.name) === nk) : undefined;
    return byPhone ? { client: byPhone, by: "whatsapp" as const } : byName ? { client: byName, by: "nome" as const } : null;
  }, [clientMode, clients, newName, newWhatsapp]);

  // Pacotes da cliente escolhida
  useEffect(() => {
    if (!open || clientMode !== "existing" || !clientId) {
      setClientPackages([]);
      return;
    }
    let cancelled = false;
    run(supabase.from("package_usage").select("*").eq("client_id", clientId).order("paid_at"))
      .then((rows) => !cancelled && setClientPackages(rows as PackageUsage[]))
      .catch(() => !cancelled && setClientPackages([]));
    return () => {
      cancelled = true;
    };
  }, [open, clientMode, clientId]);

  /** Pacote que serve para este atendimento: mesmo serviço (um só), com sessão livre e válido na data */
  const eligiblePackage = useMemo(() => {
    if (selectedServices.length !== 1) return undefined;
    const serviceId = selectedServices[0].id;
    return clientPackages.find(
      (p) =>
        p.service_id === serviceId &&
        (p.id === appointment?.package_id || (p.state === "ativo" && p.available > 0)) &&
        (!p.expires_at || p.expires_at >= date),
    );
  }, [clientPackages, selectedServices, appointment?.package_id, date]);
  const usingPackage = packageId ? clientPackages.find((p) => p.id === packageId) : undefined;

  // Novo atendimento: já usa o pacote quando existe um que serve (até a pessoa desligar)
  useEffect(() => {
    if (packageTouched) return;
    setPackageId(eligiblePackage?.id ?? null);
  }, [eligiblePackage, packageTouched]);

  // Usando pacote: valor = valor por sessão do pacote
  useEffect(() => {
    if (usingPackage) setPrice(String(usingPackage.unit_price));
  }, [usingPackage]);

  function togglePackage(on: boolean) {
    setPackageTouched(true);
    if (on && eligiblePackage) {
      setPackageId(eligiblePackage.id);
    } else {
      setPackageId(null);
      setPaid(false);
      setPaidAt("");
      setPayment("");
      setPrice(String(selectedServices.reduce((sum, s) => sum + Number(s.price), 0)));
    }
  }

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
    if (newClientMatch) {
      return setError(`${newClientMatch.client.name} já está cadastrada com esse ${newClientMatch.by === "whatsapp" ? "WhatsApp" : "nome"}. Use a cliente existente.`);
    }
    if (selectedServices.length === 0 && !keepsOldServices) return setError("Escolha pelo menos um serviço.");
    if (needsProfessional && !professionalId) {
      return setError(professionals.some((p) => p.active) ? "Escolha a profissional." : "Cadastre uma profissional em Mais → Profissionais.");
    }
    if (Number.isNaN(priceValue) || priceValue < 0) return setError("Valor inválido.");
    if (!usingPackage && paid && !payment) return setError("Escolha a forma de pagamento para marcar como pago.");
    if (paid && paidAt > today) return setError("A data do pagamento não pode ser no futuro.");

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
        // Sessão de pacote: o banco marca como paga (na data da venda) e não cria nova entrada
        package_id: usingPackage ? usingPackage.id : null,
        payment_method: usingPackage ? "pacote" : payment || null,
        paid: usingPackage ? true : paid,
        paid_at: usingPackage ? null : paid ? paidAt || null : null,
        notes: notes.trim() || null,
      };

      if (appointment) await run(supabase.from("appointments").update(payload).eq("id", appointment.id));
      else await run(supabase.from("appointments").insert(payload));

      // Só agora, com o agendamento salvo, o lead vira "Agendou"
      if (lead && !appointment) {
        const { error: leadError } = await supabase
          .from("leads")
          .update({ stage: "agendou", client_id: finalClientId, last_contact_at: new Date().toISOString() })
          .eq("id", lead.id);
        if (leadError) toast("Agendamento salvo, mas não consegui mover o lead para Agendou. Faça isso em Leads.", "error");
      }

      toast(editing ? "Agendamento atualizado." : lead ? "Agendamento criado. O lead foi para Agendou." : "Agendamento criado.");
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
    const ok = await confirm({
      title: "Excluir agendamento?",
      message: appointment.paid
        ? "Ele estava pago: a entrada correspondente também sai do Financeiro. Não dá para desfazer."
        : "Não dá para desfazer. Se a cliente só desmarcou, prefira mudar o status para Cancelado.",
    });
    if (!ok) return;
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
              href={waLink(
                whatsappNumber,
                appointment?.status === "concluido"
                  ? afterVisitMessage(selectedClient?.name ?? "", serviceLabel)
                  : confirmationMessage(selectedClient?.name ?? "", serviceLabel, `${date}T${time}:00`),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-input px-4 text-sm font-medium hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" /> {appointment?.status === "concluido" ? "Como foi?" : "Confirmar"}
            </a>
          )}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>
            Salvar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {lead && (
          <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-sm text-primary">
            Agendamento do lead <strong className="font-semibold">{lead.name}</strong>. Ele só vai para “Agendou” quando você salvar.
          </p>
        )}
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
              {newClientMatch && (
                <p className="rounded-xl bg-ochre/10 px-3.5 py-2.5 text-sm sm:col-span-2" role="status">
                  {newClientMatch.by === "whatsapp" ? "Esse WhatsApp já é de " : "Já existe uma cliente chamada "}
                  <strong>{newClientMatch.client.name}</strong>.{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => { setClientMode("existing"); setClientId(newClientMatch.client.id); }}
                  >
                    Usar esta cliente
                  </button>
                </p>
              )}
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

        {(eligiblePackage || usingPackage) && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3">
            <Package className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <Switch
                checked={Boolean(usingPackage)}
                onChange={togglePackage}
                label={
                  usingPackage && appointment?.package_id === usingPackage.id
                    ? `Sessão do pacote de ${usingPackage.sessions}`
                    : `Usar o pacote · sessão ${(eligiblePackage ?? usingPackage)!.used + (eligiblePackage ?? usingPackage)!.reserved + 1} de ${(eligiblePackage ?? usingPackage)!.sessions}`
                }
                description={usingPackage ? "Já pago na venda do pacote. Não gera nova entrada no Financeiro." : `${(eligiblePackage ?? usingPackage)!.available} sessão(ões) disponível(is) no pacote.`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)" hint={usingPackage ? "valor por sessão do pacote" : undefined}>
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} readOnly={Boolean(usingPackage)} className={usingPackage ? "text-muted-foreground" : undefined} />
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

        {!usingPackage && (
          <>
            <Field label="Forma de pagamento">
              <Select value={payment} onChange={(e) => setPayment(e.target.value as PaymentMethod | "")}>
                <option value="">Ainda não definida</option>
                {/* "Pacote" só aparece em atendimentos antigos que já usavam; os novos usam o controle de pacotes */}
                {(Object.keys(PAYMENT_LABEL) as PaymentMethod[])
                  .filter((p) => p !== "pacote" || payment === "pacote")
                  .map((p) => (
                    <option key={p} value={p}>
                      {PAYMENT_LABEL[p]}
                    </option>
                  ))}
              </Select>
            </Field>
          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <Switch
              checked={paid}
              onChange={(v) => {
                setPaid(v);
                // Padrão: hoje se o atendimento ainda vai acontecer (pagou adiantado); senão, o dia do atendimento
                if (v && !paidAt) setPaidAt(date > today ? today : date);
              }}
              label="Pago"
              description={paid ? "Entra no Financeiro na data do pagamento." : status === "concluido" ? "Fica em “A receber” até marcar como pago." : undefined}
            />
            {paid && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 pt-3">
                <label htmlFor="paid-at" className="text-sm font-medium text-foreground/80">Pago em</label>
                <Input id="paid-at" type="date" value={paidAt} max={today} onChange={(e) => setPaidAt(e.target.value)} className="h-10 w-auto" />
                {paidAt && paidAt !== date && (
                  <span className="text-xs text-muted-foreground">
                    Atendimento em {fmt(`${date}T00:00:00`, "dd/MM/yy")} · o valor entra no Financeiro em {fmt(`${paidAt}T00:00:00`, "dd/MM/yy")}.
                  </span>
                )}
              </div>
            )}
          </div>
          </>
        )}

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
