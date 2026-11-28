import { useEffect, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { Sheet } from "../components/Sheet";
import { useConfirm } from "../components/Confirm";
import { useToast } from "../components/Toast";
import { Button, Field, Input, Select, Textarea, cx } from "../components/ui";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { brl, fmt, toDateInput } from "../lib/format";
import { run, supabase } from "../lib/supabase";
import { PAYMENT_LABEL, type ClientPackage, type PackageUsage } from "../lib/types";

type Method = ClientPackage["payment_method"];
const METHODS: Method[] = ["pix", "credito", "debito", "dinheiro"];
const VALIDITY = [
  { months: 2, label: "2 meses" }, // pacote Ritmo: 4 sessões a cada 15 dias
  { months: 3, label: "3 meses" },
  { months: 6, label: "6 meses" },
  { months: 12, label: "12 meses" },
  { months: 0, label: "Sem validade" },
];

const expiryFrom = (paidAt: string, months: number) => (months ? format(addMonths(parseISO(paidAt), months), "yyyy-MM-dd") : null);

/** Vender (ou editar) um pacote de sessões de um serviço para uma cliente. */
export function PackageSheet({ open, onClose, onSaved, clientId, clientName, pkg }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  clientId: string;
  clientName: string;
  pkg: PackageUsage | null;
}) {
  const { services } = useAppData();
  const toast = useToast();
  const confirm = useConfirm();
  const today = toDateInput(new Date());
  const [serviceId, setServiceId] = useState("");
  const [sessions, setSessions] = useState("5");
  const [price, setPrice] = useState("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [paidAt, setPaidAt] = useState(today);
  const [method, setMethod] = useState<Method>("pix");
  const [months, setMonths] = useState<number | null>(6); // null = data própria (pacote antigo editado)
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (pkg) {
      setServiceId(pkg.service_id ?? "");
      setSessions(String(pkg.sessions));
      setPrice(String(pkg.price));
      setPriceTouched(true);
      setPaidAt(pkg.paid_at);
      setMethod(pkg.payment_method);
      const match = VALIDITY.find((v) => expiryFrom(pkg.paid_at, v.months) === pkg.expires_at);
      setMonths(match ? match.months : null);
      setExpiresAt(pkg.expires_at);
      setNotes(pkg.notes ?? "");
    } else {
      setServiceId("");
      setSessions("5");
      setPrice("");
      setPriceTouched(false);
      setPaidAt(today);
      setMethod("pix");
      setMonths(6);
      setExpiresAt(null);
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pkg?.id]);

  const service = services.find((s) => s.id === serviceId);
  const serviceOptions = services.filter((s) => s.active || s.id === serviceId);
  const sessionsNum = Number(sessions);
  const priceNum = Number(price.replace(",", "."));
  const perSession = sessionsNum > 0 && priceNum >= 0 ? priceNum / sessionsNum : 0;
  const finalExpiry = months === null ? expiresAt : expiryFrom(paidAt || today, months);

  // Valor sugerido: preço do serviço × sessões (até a pessoa digitar outro)
  useEffect(() => {
    if (!priceTouched && service && sessionsNum > 0) setPrice(String(Number(service.price) * sessionsNum));
  }, [service, sessionsNum, priceTouched]);

  async function save() {
    setError(null);
    if (!service && !pkg) return setError("Escolha o serviço do pacote.");
    if (!Number.isInteger(sessionsNum) || sessionsNum < 1 || sessionsNum > 100) return setError("Número de sessões inválido.");
    if (pkg && sessionsNum < pkg.used + pkg.reserved) {
      return setError(`Esse pacote já tem ${pkg.used + pkg.reserved} sessões usadas ou agendadas.`);
    }
    if (Number.isNaN(priceNum) || priceNum < 0) return setError("Valor inválido.");
    if (!paidAt || paidAt > today) return setError("Data do pagamento inválida.");

    const payload = {
      client_id: clientId,
      service_id: service?.id ?? pkg?.service_id ?? null,
      service_name: service?.name ?? pkg?.service_name ?? "",
      sessions: sessionsNum,
      price: priceNum,
      paid_at: paidAt,
      payment_method: method,
      expires_at: finalExpiry,
      notes: notes.trim() || null,
    };
    setSaving(true);
    try {
      if (pkg) await run(supabase.from("client_packages").update(payload).eq("id", pkg.id));
      else await run(supabase.from("client_packages").insert(payload));
      toast(pkg ? "Pacote atualizado." : "Pacote vendido. O valor entrou no Financeiro.");
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!pkg) return;
    const ok = await confirm({
      title: "Excluir pacote?",
      message: (
        <>
          O valor sai do Financeiro.
          {pkg.used + pkg.reserved > 0 && " As sessões já marcadas com ele deixam de estar pagas e passam para “A receber”."} Não dá para desfazer.
        </>
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await run(supabase.from("client_packages").delete().eq("id", pkg.id));
      toast("Pacote excluído.");
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
      title={pkg ? "Pacote" : "Vender pacote"}
      footer={
        <div className="flex items-center gap-2">
          {pkg && <Button variant="danger" onClick={remove} disabled={saving}>Excluir</Button>}
          <Button className="ml-auto min-w-28" onClick={save} loading={saving}>{pkg ? "Salvar" : "Vender"}</Button>
        </div>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">{clientName}</p>
      <div className="space-y-4">
        <Field label="Serviço">
          <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            {!pkg && <option value="">Escolha o serviço</option>}
            {pkg && !pkg.service_id && <option value="">{pkg.service_name}</option>}
            {serviceOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sessões">
            <Input inputMode="numeric" value={sessions} onChange={(e) => setSessions(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field
            label="Valor do pacote (R$)"
            hint={sessionsNum > 0 && priceNum > 0 ? `${brl(perSession)} por sessão${service ? ` (avulso: ${brl(service.price)})` : ""}` : undefined}
          >
            <Input inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setPriceTouched(true); }} />
          </Field>
          <Field label="Pago em">
            <Input type="date" value={paidAt} max={today} onChange={(e) => setPaidAt(e.target.value)} />
          </Field>
          <Field label="Forma de pagamento">
            <Select value={method} onChange={(e) => setMethod(e.target.value as Method)}>
              {METHODS.map((m) => <option key={m} value={m}>{PAYMENT_LABEL[m]}</option>)}
            </Select>
          </Field>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground/80">Validade</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Validade">
            {VALIDITY.map((v) => (
              <button
                key={v.months}
                type="button"
                role="radio"
                aria-checked={months === v.months}
                onClick={() => setMonths(v.months)}
                className={cx(
                  "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
                  months === v.months ? "border-primary bg-primary/10 text-primary" : "border-input bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {finalExpiry ? `Vale até ${fmt(`${finalExpiry}T00:00:00`, "dd/MM/yyyy")}.` : "Não vence."}
          </p>
        </div>
        <Field label="Observações">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: presente de aniversário" />
        </Field>
        <p className="rounded-xl bg-muted/70 px-3.5 py-3 text-xs text-muted-foreground">
          O valor entra no Financeiro uma vez, na data do pagamento. As sessões usadas depois não geram nova entrada.
          Concluído e Faltou consomem a sessão; Cancelado devolve.
        </p>
      </div>
      {error && <p className="mt-4 rounded-xl bg-danger/10 px-3.5 py-3 text-sm text-danger">{error}</p>}
    </Sheet>
  );
}
