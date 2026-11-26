import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Lead } from "./types";

export type Temperature = "quente" | "morno" | "frio";

/** Até 1 dia sem contato: quente · 2 a 6 dias: morno · 7 dias ou mais: frio. */
export const WARM_AFTER_DAYS = 2;
export const COLD_AFTER_DAYS = 7;

export const TEMPERATURE_LABEL: Record<Temperature, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};

/**
 * Data usada para medir a temperatura: a interação mais recente — seu último contato
 * ou um novo envio do formulário pela pessoa. Sem nenhum dos dois, a chegada do lead.
 */
export function leadReference(lead: Lead) {
  return [lead.last_contact_at, lead.last_submission_at, lead.created_at]
    .filter((d): d is string => Boolean(d))
    .reduce((latest, d) => (Date.parse(d) > Date.parse(latest) ? d : latest));
}

/** Temperatura só faz sentido para quem ainda está no funil (Novos e Em contato). */
export function leadTemperature(lead: Lead, now = new Date()) {
  if (lead.stage !== "novo" && lead.stage !== "em_contato") return null;
  const reference = leadReference(lead);
  const days = Math.max(0, differenceInCalendarDays(now, parseISO(reference)));
  const temperature: Temperature = days < WARM_AFTER_DAYS ? "quente" : days < COLD_AFTER_DAYS ? "morno" : "frio";
  const when = days === 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`;
  const resent = (lead.submissions ?? 1) > 1 && reference === lead.last_submission_at;
  const detail = resent
    ? `enviou o formulário de novo ${when}`
    : lead.last_contact_at && reference === lead.last_contact_at
      ? `último contato ${when}`
      : `chegou ${when}, sem contato`;
  return { temperature, days, detail };
}
