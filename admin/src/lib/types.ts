export type Status = "agendado" | "confirmado" | "concluido" | "faltou" | "cancelado";
export type PaymentMethod = "pix" | "credito" | "debito" | "dinheiro" | "pacote";
export type LeadStage = "novo" | "em_contato" | "agendou" | "perdido";
export type LeadSource = "instagram" | "whatsapp" | "indicacao" | "google" | "site" | "outro";
export type Pressure = "leve" | "media" | "firme";

export type Settings = {
  open_time: string; // "08:00:00"
  close_time: string;
  room2_enabled: boolean;
};

export type Service = {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  needs_professional: boolean;
  active: boolean;
  is_sample: boolean;
};

export type Professional = {
  id: string;
  name: string;
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
  whatsapp: string | null;
  birthday: string | null; // "1990-03-14"
  allergies: string | null;
  pregnant: boolean;
  massage_pressure: Pressure | null;
  preferences: string | null;
  notes: string | null;
  is_sample: boolean;
  created_at: string;
};

export type ClientStats = {
  client_id: string;
  visits: number;
  total_spent: number;
  last_visit: string | null;
  next_visit: string | null;
};

export type Appointment = {
  id: string;
  client_id: string;
  service_id: string | null;
  service_ids: string[] | null;
  service_name: string;
  starts_at: string; // horário local, "2026-11-26T10:00:00"
  ends_at: string;
  room: 1 | 2;
  needs_professional: boolean;
  professional_id: string | null;
  price: number;
  status: Status;
  payment_method: PaymentMethod | null;
  paid: boolean;
  notes: string | null;
  is_sample: boolean;
  clients?: { name: string; whatsapp: string | null } | null;
};

export type Transaction = {
  id: string;
  kind: "entrada" | "despesa";
  category: string;
  description: string | null;
  amount: number;
  date: string;
  payment_method: PaymentMethod | null;
  appointment_id: string | null;
  recurring_id: string | null;
  is_sample: boolean;
};

/** Despesa fixa: modelo que o banco lança sozinho todo mês. */
export type RecurringExpense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  day_of_month: number;
  payment_method: PaymentMethod | null;
  active: boolean;
  start_month: string; // "2026-11-01"
  generated_until: string | null;
  is_sample: boolean;
};

export type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  source: LeadSource;
  interest: string | null;
  notes: string | null;
  stage: LeadStage;
  consent: boolean;
  client_id: string | null;
  is_sample: boolean;
  created_at: string;
  last_contact_at: string | null;
  /** Quantas vezes a pessoa enviou o formulário (envios repetidos são juntados) */
  submissions?: number;
  last_submission_at?: string | null;
};

export const STATUS_LABEL: Record<Status, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  credito: "Crédito",
  debito: "Débito",
  dinheiro: "Dinheiro",
  pacote: "Pacote",
};

export const STAGE_LABEL: Record<LeadStage, string> = {
  novo: "Novos",
  em_contato: "Em contato",
  agendou: "Agendou",
  perdido: "Perdido",
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  indicacao: "Indicação",
  google: "Google",
  site: "Site",
  outro: "Outro",
};

export const PRESSURE_LABEL: Record<Pressure, string> = {
  leve: "Leve",
  media: "Média",
  firme: "Firme",
};

export const EXPENSE_CATEGORIES = [
  "Produtos",
  "Aluguel",
  "Energia/Água",
  "Marketing",
  "Lavanderia",
  "Impostos",
  "Outros",
] as const;

export const INCOME_CATEGORIES = ["Atendimentos", "Pacotes", "Produtos", "Outros"] as const;

/** Status que ocupam o horário (cancelado e faltou liberam). */
export const ACTIVE_STATUSES: Status[] = ["agendado", "confirmado", "concluido"];
