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

/** Data usada para medir a temperatura: último contato ou, se nunca houve, a chegada do lead. */
export function leadReference(lead: Lead) {
  return lead.last_contact_at ?? lead.created_at;
}

/** Temperatura só faz sentido para quem ainda está no funil (Novos e Em contato). */
export function leadTemperature(lead: Lead, now = new Date()) {
  if (lead.stage !== "novo" && lead.stage !== "em_contato") return null;
  const days = Math.max(0, differenceInCalendarDays(now, parseISO(leadReference(lead))));
  const temperature: Temperature = days < WARM_AFTER_DAYS ? "quente" : days < COLD_AFTER_DAYS ? "morno" : "frio";
  const when = days === 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`;
  const detail = lead.last_contact_at ? `último contato ${when}` : `chegou ${when}, sem contato`;
  return { temperature, days, detail };
}
