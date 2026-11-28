import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { setMessageOverrides } from "./messages";
import { nowTs, OPEN_STATUSES } from "./pending";
import { run, supabase } from "./supabase";
import type { Appointment, Professional, Service, Settings } from "./types";

type AppData = {
  settings: Settings;
  services: Service[];
  professionals: Professional[];
  /** Nome da profissional pelo id ("" se não achar) */
  professionalName: (id: string | null | undefined) => string;
  email: string;
  refreshSettings: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshProfessionals: () => Promise<void>;
  /** Recarrega os textos de Mais → Mensagens (false se a tabela ainda não existe no banco) */
  refreshMessages: () => Promise<boolean>;
  /** Atendimentos que já terminaram e ainda estão como agendado/confirmado (mais antigos primeiro) */
  pending: Appointment[];
  refreshPending: () => Promise<void>;
};

const AppDataContext = createContext<AppData | null>(null);

const DEFAULT_SETTINGS: Settings = { open_time: "08:00:00", close_time: "20:00:00", room2_enabled: false, notify_daily_time: "07:30:00", notify_before_min: 30, monthly_goal: 45 };

export function AppDataProvider({ email, children }: { email: string; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [pending, setPending] = useState<Appointment[]>([]);

  const refreshSettings = useCallback(async () => {
    // "*" + padrão: se o banco ainda não tiver alguma coluna nova, o painel continua funcionando
    const row = await run(supabase.from("settings").select("*").eq("id", 1).maybeSingle());
    if (row) setSettings({ ...DEFAULT_SETTINGS, ...(row as Partial<Settings>) });
  }, []);

  const refreshServices = useCallback(async () => {
    const rows = await run(supabase.from("services").select("*").order("name"));
    setServices((rows ?? []) as Service[]);
  }, []);

  const refreshProfessionals = useCallback(async () => {
    const rows = await run(supabase.from("professionals").select("id, name, active").order("created_at"));
    setProfessionals((rows ?? []) as Professional[]);
  }, []);

  const refreshMessages = useCallback(async () => {
    const { data, error } = await supabase.from("message_templates").select("key, body");
    if (error) {
      setMessageOverrides({});
      return false;
    }
    setMessageOverrides(Object.fromEntries((data ?? []).map((r) => [r.key as string, r.body as string])));
    return true;
  }, []);

  const refreshPending = useCallback(async () => {
    const rows = await run(
      supabase
        .from("appointments")
        .select("*, clients(name, whatsapp)")
        .in("status", OPEN_STATUSES)
        .lte("ends_at", nowTs())
        .order("starts_at")
        .limit(200),
    );
    setPending((rows ?? []) as Appointment[]);
  }, []);

  // Pendências: confere ao abrir, a cada 2 minutos e quando o app volta para a frente
  useEffect(() => {
    const check = () => refreshPending().catch(() => {});
    check();
    const id = setInterval(check, 120_000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshPending]);

  useEffect(() => {
    refreshSettings().catch(() => {});
    refreshServices().catch(() => {});
    refreshProfessionals().catch(() => {});
    refreshMessages().catch(() => {});
  }, [refreshSettings, refreshServices, refreshProfessionals, refreshMessages]);

  const professionalName = useCallback(
    (id: string | null | undefined) => professionals.find((p) => p.id === id)?.name ?? "",
    [professionals],
  );

  return (
    <AppDataContext.Provider
      value={{ settings, services, professionals, professionalName, email, refreshSettings, refreshServices, refreshProfessionals, refreshMessages, pending, refreshPending }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData fora do AppDataProvider");
  return ctx;
}
