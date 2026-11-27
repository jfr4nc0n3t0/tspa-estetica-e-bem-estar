// Lógica das notificações do painel (sem nada específico do Deno, para dar para testar com Node).
// Horários do banco são do spa (Brasília) e sem fuso, como "2026-11-27T10:00:00".

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type Subscription = { id: string; endpoint: string; p256dh: string; auth: string };
export type Payload = { title: string; body: string; url: string; tag: string };
/** Envia para um aparelho. `gone` = o aparelho não existe mais (desinstalou / desativou): apagar. */
export type SendFn = (sub: Subscription, payload: Payload) => Promise<{ ok: boolean; gone: boolean }>;

type Appt = {
  id: string;
  starts_at: string;
  service_name: string;
  room: number;
  clients: { name: string } | null;
};

const TZ = "America/Sao_Paulo";
/** Até quanto tempo depois do horário ainda vale mandar o resumo (se o agendador atrasar) */
const DAILY_WINDOW_MIN = 180;

/** "Agora" no horário do spa: { date: "2026-11-27", time: "07:31", ts: "2026-11-27T07:31:00" } */
export function spaNow(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  return { date, time, ts: `${date}T${time}:${parts.second}` };
}

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const hhmm = (ts: string) => ts.slice(11, 16);
const firstName = (name: string | undefined) => (name ?? "Cliente").trim().split(/\s+/)[0];

/** Soma minutos a um horário local sem fuso ("2026-11-27T10:00:00" + 30 → "2026-11-27T10:30:00") */
function addMinutes(ts: string, minutes: number) {
  const d = new Date(`${ts}Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 19);
}

export function dailyPayload(appts: Appt[]): Payload {
  const lines = appts.slice(0, 4).map((a) => `${hhmm(a.starts_at)} · ${firstName(a.clients?.name)} · ${a.service_name}`);
  if (appts.length > 4) lines.push(`+ ${appts.length - 4} ${appts.length - 4 === 1 ? "outro" : "outros"}`);
  return {
    title: `Hoje: ${appts.length} ${appts.length === 1 ? "atendimento" : "atendimentos"}`,
    body: lines.join("\n"),
    url: "/agenda",
    tag: "resumo-do-dia",
  };
}

export function reminderPayload(a: Appt, nowTs: string): Payload {
  const minutes = Math.max(1, Math.round((Date.parse(`${a.starts_at}Z`) - Date.parse(`${nowTs}Z`)) / 60000));
  return {
    title: `Em ${minutes} min · ${hhmm(a.starts_at)}`,
    body: `${firstName(a.clients?.name)} · ${a.service_name} · Sala ${a.room}`,
    url: "/agenda",
    tag: `lembrete-${a.id}`,
  };
}

/** Marca como enviado. Retorna false se outro disparo já marcou (evita mandar duas vezes). */
async function claim(db: SupabaseClient, kind: "resumo" | "lembrete", ref: string) {
  const { data, error } = await db.from("push_log").upsert({ kind, ref }, { onConflict: "kind,ref", ignoreDuplicates: true }).select("ref");
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function broadcast(db: SupabaseClient, subs: Subscription[], send: SendFn, payload: Payload) {
  let delivered = 0;
  for (const sub of subs) {
    const result = await send(sub, payload);
    if (result.gone) await db.from("push_subscriptions").delete().eq("id", sub.id);
    else if (result.ok) {
      delivered++;
      await db.from("push_subscriptions").update({ last_success_at: new Date().toISOString() }).eq("id", sub.id);
    }
  }
  return delivered;
}

export type RunResult = { subscriptions: number; daily: number; reminders: number; test: boolean };

/**
 * Roda a cada poucos minutos: manda o resumo do dia (uma vez, no horário dos ajustes)
 * e um lembrete para cada atendimento que começa dentro do tempo configurado.
 */
export async function runNotifications(db: SupabaseClient, send: SendFn, opts: { now?: Date; test?: boolean } = {}): Promise<RunResult> {
  const now = spaNow(opts.now ?? new Date());
  const result: RunResult = { subscriptions: 0, daily: 0, reminders: 0, test: Boolean(opts.test) };

  const { data: subs, error: subsError } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  if (subsError) throw subsError;
  result.subscriptions = subs?.length ?? 0;
  if (!subs?.length) return result;

  if (opts.test) {
    await broadcast(db, subs, send, {
      title: "Notificações ativadas",
      body: "Você vai receber o resumo do dia e um lembrete antes de cada atendimento.",
      url: "/mais",
      tag: "teste",
    });
    return result;
  }

  const { data: settings, error: settingsError } = await db.from("settings").select("notify_daily_time, notify_before_min").eq("id", 1).single();
  if (settingsError) throw settingsError;

  const select = "id, starts_at, service_name, room, clients(name)";
  const active = ["agendado", "confirmado"];

  // Resumo do dia
  const dailyAt = toMin(String(settings.notify_daily_time).slice(0, 5));
  const nowMin = toMin(now.time);
  if (nowMin >= dailyAt && nowMin < dailyAt + DAILY_WINDOW_MIN && (await claim(db, "resumo", now.date))) {
    const { data, error } = await db
      .from("appointments")
      .select(select)
      .in("status", active)
      .gte("starts_at", `${now.date}T00:00:00`)
      .lte("starts_at", `${now.date}T23:59:59`)
      .order("starts_at");
    if (error) throw error;
    const appts = (data ?? []) as unknown as Appt[];
    if (appts.length) result.daily = await broadcast(db, subs, send, dailyPayload(appts));
  }

  // Lembretes: atendimentos que começam entre agora e agora + N minutos
  const { data: soon, error: soonError } = await db
    .from("appointments")
    .select(select)
    .in("status", active)
    .gt("starts_at", now.ts)
    .lte("starts_at", addMinutes(now.ts, Number(settings.notify_before_min)))
    .order("starts_at");
  if (soonError) throw soonError;
  for (const a of (soon ?? []) as unknown as Appt[]) {
    // O horário entra na chave: se remarcar, avisa de novo no horário novo
    if (await claim(db, "lembrete", `${a.id}@${a.starts_at}`)) {
      result.reminders += await broadcast(db, subs, send, reminderPayload(a, now.ts));
    }
  }

  return result;
}
