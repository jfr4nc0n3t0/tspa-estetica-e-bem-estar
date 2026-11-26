import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { run, supabase } from "./supabase";
import type { Professional, Service, Settings } from "./types";

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
};

const AppDataContext = createContext<AppData | null>(null);

const DEFAULT_SETTINGS: Settings = { open_time: "08:00:00", close_time: "20:00:00", room2_enabled: false };

export function AppDataProvider({ email, children }: { email: string; children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const refreshSettings = useCallback(async () => {
    const row = await run(supabase.from("settings").select("open_time, close_time, room2_enabled").eq("id", 1).maybeSingle());
    if (row) setSettings(row as Settings);
  }, []);

  const refreshServices = useCallback(async () => {
    const rows = await run(supabase.from("services").select("*").order("name"));
    setServices((rows ?? []) as Service[]);
  }, []);

  const refreshProfessionals = useCallback(async () => {
    const rows = await run(supabase.from("professionals").select("id, name, active").order("created_at"));
    setProfessionals((rows ?? []) as Professional[]);
  }, []);

  useEffect(() => {
    refreshSettings().catch(() => {});
    refreshServices().catch(() => {});
    refreshProfessionals().catch(() => {});
  }, [refreshSettings, refreshServices, refreshProfessionals]);

  const professionalName = useCallback(
    (id: string | null | undefined) => professionals.find((p) => p.id === id)?.name ?? "",
    [professionals],
  );

  return (
    <AppDataContext.Provider
      value={{ settings, services, professionals, professionalName, email, refreshSettings, refreshServices, refreshProfessionals }}
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
