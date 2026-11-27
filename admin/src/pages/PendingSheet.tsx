import { useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { CheckCheck, PartyPopper, UserX, X } from "lucide-react";
import { Sheet } from "../components/Sheet";
import { useToast } from "../components/Toast";
import { Button, cx } from "../components/ui";
import { useAppData } from "../lib/appData";
import { friendlyError } from "../lib/errors";
import { brl, fmt } from "../lib/format";
import { run, supabase } from "../lib/supabase";
import { PAYMENT_LABEL, type Appointment, type PaymentMethod, type Status } from "../lib/types";

/** "Hoje, 10:00" · "Ontem, 16:30" · "Seg, 24/11 às 09:00" */
function whenLabel(startsAt: string) {
  const days = differenceInCalendarDays(new Date(), parseISO(startsAt));
  const time = fmt(startsAt, "HH:mm");
  if (days === 0) return `Hoje, ${time}`;
  if (days === 1) return `Ontem, ${time}`;
  return `${fmt(startsAt, "EEE, dd/MM")} às ${time}`;
}

const PAYMENTS = Object.keys(PAYMENT_LABEL) as PaymentMethod[];

/**
 * Atendimentos que já passaram do horário e continuam como agendado/confirmado.
 * Em cada um: Concluído (pergunta como foi pago), Faltou ou Cancelado.
 */
export function PendingSheet({ open, onClose, onChanged, onOpenAppointment }: {
  open: boolean;
  onClose: () => void;
  /** Algo mudou: recarregar a Agenda */
  onChanged: () => void;
  onOpenAppointment: (a: Appointment) => void;
}) {
  const { pending, refreshPending } = useAppData();
  const toast = useToast();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function resolve(a: Appointment, status: Status, payment?: PaymentMethod | null) {
    setSavingId(a.id);
    try {
      const patch: Partial<Appointment> = { status };
      if (status === "concluido" && payment !== undefined) {
        patch.paid = payment !== null;
        patch.payment_method = payment;
      }
      await run(supabase.from("appointments").update(patch).eq("id", a.id));
      const first = a.clients?.name?.split(" ")[0] ?? "Cliente";
      toast(
        status === "concluido"
          ? patch.paid
            ? `${first}: concluído e pago.`
            : a.paid
              ? `${first}: concluído.`
              : `${first}: concluído, fica em “A receber”.`
          : status === "faltou"
            ? `${first}: marcado como falta.`
            : `${first}: cancelado.`,
      );
      setPayingId(null);
      await refreshPending();
      onChanged();
    } catch (err) {
      toast(friendlyError(err), "error");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Atendimentos pendentes">
      {pending.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-serif text-2xl">Tudo em dia</p>
          <p className="mt-1 text-sm text-muted-foreground">Nenhum atendimento esperando status.</p>
          <Button className="mt-5" variant="secondary" onClick={onClose}>Fechar</Button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Já passaram do horário e continuam como agendados. Diga o que aconteceu em cada um.
          </p>
          <ul className="divide-y divide-border/70">
            {pending.map((a) => {
              const busy = savingId === a.id;
              const paying = payingId === a.id;
              return (
                <li key={a.id} className={cx("py-3.5 transition-opacity", busy && "pointer-events-none opacity-50")}>
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="min-w-0 text-left" onClick={() => onOpenAppointment(a)} title="Abrir o atendimento completo">
                      <span className="block truncate font-medium">{a.clients?.name ?? "Cliente"}</span>
                      <span className="block text-sm text-muted-foreground">
                        {whenLabel(a.starts_at)} · {a.service_name} · Sala {a.room}
                      </span>
                    </button>
                    <span className="shrink-0 text-right">
                      <span className="block font-medium tabular-nums">{brl(a.price)}</span>
                      {a.paid && <span className="text-xs text-primary">já pago</span>}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => (a.paid ? resolve(a, "concluido") : setPayingId(paying ? null : a.id))}
                      aria-expanded={a.paid ? undefined : paying}
                      className={cx(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                        paying ? "bg-primary/80 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      <CheckCheck className="h-4 w-4" /> Concluído
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(a, "faltou")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-3.5 text-sm font-medium text-terracotta hover:bg-terracotta/10"
                    >
                      <UserX className="h-4 w-4" /> Faltou
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(a, "cancelado")}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-3.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                    >
                      <X className="h-4 w-4" /> Cancelado
                    </button>
                  </div>

                  {paying && (
                    <div className="mt-2.5 rounded-2xl bg-muted/70 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Concluído · como foi pago?</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PAYMENTS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => resolve(a, "concluido", p)}
                            className="h-8 rounded-full border border-input bg-card px-3 text-sm font-medium hover:border-primary hover:text-primary"
                          >
                            {PAYMENT_LABEL[p]}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => resolve(a, "concluido", null)}
                          className="h-8 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-card"
                        >
                          Ainda não pagou
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
