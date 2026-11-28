-- Meta de atendimentos por mês (Mais → Meta do mês; aparece em Análises).
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
alter table public.settings add column if not exists monthly_goal smallint not null default 45;
alter table public.settings drop constraint if exists settings_monthly_goal;
alter table public.settings add constraint settings_monthly_goal check (monthly_goal between 1 and 999);
