import { useEffect, useState } from "react";
import { toLocalTimestamp } from "./format";
import type { Appointment, Status } from "./types";

/** Status que ainda esperam um desfecho (concluído, faltou ou cancelado). */
export const OPEN_STATUSES: Status[] = ["agendado", "confirmado"];

/** Agora no formato do banco ("2026-11-27T10:00:00", horário local sem fuso). */
export const nowTs = () => toLocalTimestamp(new Date());

/** Já terminou e continua agendado/confirmado: precisa que a dona diga o que aconteceu. */
export function isPending(a: Pick<Appointment, "status" | "ends_at">, now = nowTs()) {
  return OPEN_STATUSES.includes(a.status) && a.ends_at <= now;
}

/** "Agora" que se atualiza a cada minuto (para os blocos virarem pendentes sem recarregar). */
export function useNowTs() {
  const [now, setNow] = useState(nowTs);
  useEffect(() => {
    const id = setInterval(() => setNow(nowTs()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
