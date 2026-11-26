import { addMinutes, parseISO } from "date-fns";
import { minutesToTime, timeToMinutes, toLocalTimestamp } from "./format";
import { ACTIVE_STATUSES, type Appointment, type Settings } from "./types";

export const SLOT_MINUTES = 30;

/** Horários de início possíveis (blocos de 30 min) entre abertura e fechamento. */
export function slotTimes(settings: Settings) {
  const open = timeToMinutes(settings.open_time);
  const close = timeToMinutes(settings.close_time);
  const list: string[] = [];
  for (let m = open; m < close; m += SLOT_MINUTES) list.push(minutesToTime(m));
  return list;
}

export function buildRange(date: string, time: string, durationMin: number) {
  const start = parseISO(`${date}T${time}:00`);
  const end = addMinutes(start, durationMin);
  return { starts_at: toLocalTimestamp(start), ends_at: toLocalTimestamp(end) };
}

type Candidate = {
  id?: string;
  starts_at: string;
  ends_at: string;
  room: 1 | 2;
  needs_professional: boolean;
  professional_id: string | null;
  status: Appointment["status"];
};

/**
 * Mesmas regras do banco, checadas antes de salvar para dar uma mensagem clara.
 * (O banco confere de novo, então nada passa mesmo se esta checagem falhar.)
 */
export function findConflict(
  candidate: Candidate,
  others: Appointment[],
  settings: Settings,
  professionalName: (id: string | null) => string = () => "",
): string | null {
  if (!ACTIVE_STATUSES.includes(candidate.status)) return null;

  if (candidate.room === 2 && !settings.room2_enabled) {
    return "A Sala 2 está desativada. Ative em Mais → Ajustes para usá-la.";
  }

  const startDay = candidate.starts_at.slice(0, 10);
  const endDay = candidate.ends_at.slice(0, 10);
  const startTime = candidate.starts_at.slice(11, 16);
  const endTime = candidate.ends_at.slice(11, 16);
  const open = settings.open_time.slice(0, 5);
  const close = settings.close_time.slice(0, 5);
  if (startDay !== endDay || startTime < open || endTime > close) {
    return `Fora do horário de funcionamento (${open} às ${close}).`;
  }

  for (const other of others) {
    if (other.id === candidate.id || !ACTIVE_STATUSES.includes(other.status)) continue;
    const overlaps = candidate.starts_at < other.ends_at && other.starts_at < candidate.ends_at;
    if (!overlaps) continue;
    const who = other.clients?.name ? ` (${other.clients.name}, ${other.starts_at.slice(11, 16)})` : "";
    if (other.room === candidate.room) return `A Sala ${candidate.room} já está ocupada nesse horário${who}.`;
    if (candidate.professional_id && other.professional_id === candidate.professional_id) {
      const name = professionalName(candidate.professional_id) || "A profissional";
      return `${name} já está atendendo nesse horário${who}.`;
    }
  }
  return null;
}
