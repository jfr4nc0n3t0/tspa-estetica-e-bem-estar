import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function brl(value: number | string | null | undefined) {
  return brlFormatter.format(Number(value ?? 0));
}

export function fmt(date: Date | string, pattern: string) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

/** "2026-11-26T10:00:00" (horário local, sem fuso), como o banco guarda. */
export function toLocalTimestamp(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

export function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** "08:00:00" → minutos desde 00:00 */
export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutos desde 00:00 de um timestamp local */
export function minutesOfDay(timestamp: string) {
  const d = parseISO(timestamp);
  return d.getHours() * 60 + d.getMinutes();
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Formata "83999990001" como "(83) 99999-0001" */
export function phone(value: string | null | undefined) {
  if (!value) return "";
  let d = value.replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

/** Para busca: sem acentos e em minúsculas */
export function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function durationBetween(start: string, end: string) {
  return Math.round((Date.parse(end) - Date.parse(start)) / 60000);
}

/** Só a primeira letra maiúscula: "quinta-feira, 26 de novembro" → "Quinta-feira, 26 de novembro" */
export function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const brlRoundFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Valor sem centavos, para indicadores compactos: "R$ 2.360" */
export function brlRound(value: number | string | null | undefined) {
  return brlRoundFormatter.format(Math.round(Number(value ?? 0)));
}
