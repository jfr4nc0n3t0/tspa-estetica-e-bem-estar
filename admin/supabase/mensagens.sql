-- Mensagens editáveis do painel e do site (Mais → Mensagens).
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- Guarda só os textos que forem mudados; sem linha, vale o texto original.

create table if not exists public.message_templates (
  key text primary key check (key ~ '^[a-z][a-z_]{2,40}$'),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  updated_at timestamptz not null default now()
);

-- Só o painel (login da dona) lê e muda os textos
alter table public.message_templates enable row level security;
drop policy if exists admin_all on public.message_templates;
create policy admin_all on public.message_templates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.message_templates from anon;
grant select, insert, update, delete on public.message_templates to authenticated;

-- O site lê só as mensagens "site_..." (as do botão de WhatsApp), por esta função
create or replace function public.site_messages()
returns table (key text, body text)
language sql
stable
security definer
set search_path = public
as $$
  select m.key, m.body from public.message_templates m where m.key like 'site\_%';
$$;
revoke all on function public.site_messages() from public;
grant execute on function public.site_messages() to anon, authenticated;
