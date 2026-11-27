-- =====================================================================
-- TSpa · Painel administrativo — script único do banco de dados
--
-- Como usar: Supabase → SQL Editor → New query → cole TUDO → Run.
-- Pode rodar de novo sem perder dados (o script só cria o que falta e
-- atualiza funções e regras de acesso).
--
-- ANTES DE RODAR: troque o e-mail na última seção ("SEU E-MAIL AQUI")
-- pelo e-mail que você vai usar para entrar no painel.
-- =====================================================================

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;   -- necessário para as regras de conflito de horário

-- ---------------------------------------------------------------------
-- 1. Quem pode usar o painel
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  email text primary key
);

-- Retorna true só para o e-mail cadastrado em admin_users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Ajustes (uma única linha)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id smallint primary key default 1 check (id = 1),
  open_time time not null default '08:00',
  close_time time not null default '20:00',
  room2_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint settings_hours check (close_time > open_time)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. Serviços
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  duration_min int not null check (duration_min between 10 and 480),
  price numeric(10,2) not null default 0 check (price >= 0),
  needs_professional boolean not null default true,
  active boolean not null default true,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

-- Serviços do site (preço zerado: ajuste no painel, em Mais → Serviços).
insert into public.services (name, duration_min, needs_professional)
select v.name, v.duration_min, true
from (values
  ('Massagem Relaxante', 60),
  ('Drenagem Linfática', 60),
  ('Liberação Miofascial', 60),
  ('Hidratação Facial', 50),
  ('Limpeza de Pele', 60),
  ('Ritual dos Pés', 30),
  ('Head Spa Essencial', 30),
  ('Head Spa Imersão', 45),
  ('Head Spa Ritual', 60),
  ('Ritual Leveza', 90),
  ('Ritual Pele Renovada', 110),
  ('Ritual Desacelerar', 75),
  ('Ritual Conexão', 105),
  ('Ritual TSpa', 150)
) as v(name, duration_min)
where not exists (select 1 from public.services);

-- ---------------------------------------------------------------------
-- 4. Clientes (a anamnese é dado de saúde: protegido pela LGPD)
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  whatsapp text,
  birthday date,
  allergies text,
  pregnant boolean not null default false,
  massage_pressure text check (massage_pressure in ('leve', 'media', 'firme')),
  preferences text,
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists clients_name_idx on public.clients (lower(name));

-- ---------------------------------------------------------------------
-- 4b. Profissionais (hoje uma; o painel já aceita mais)
-- ---------------------------------------------------------------------
create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Primeira profissional (troque o nome no painel, em Mais → Profissionais).
insert into public.professionals (name)
select 'Thauany Santos'
where not exists (select 1 from public.professionals);

-- ---------------------------------------------------------------------
-- 5. Agendamentos
--    Horários guardados no horário local do spa (Brasília), sem fuso.
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  service_name text not null,
  starts_at timestamp not null,
  ends_at timestamp not null,
  room smallint not null default 1 check (room in (1, 2)),
  needs_professional boolean not null default true,
  professional_id uuid references public.professionals (id) on delete restrict,
  price numeric(10,2) not null default 0 check (price >= 0),
  status text not null default 'agendado'
    check (status in ('agendado', 'confirmado', 'concluido', 'faltou', 'cancelado')),
  payment_method text check (payment_method in ('pix', 'credito', 'debito', 'dinheiro', 'pacote')),
  paid boolean not null default false,
  notes text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_order check (ends_at > starts_at),
  -- Regra 1: a mesma sala não pode ter dois atendimentos ao mesmo tempo.
  constraint appointments_room_overlap exclude using gist (
    room with =, tsrange(starts_at, ends_at) with &&
  ) where (status not in ('cancelado', 'faltou'))
);
-- Vários serviços no mesmo atendimento (ex.: Head Spa + Ritual dos Pés): ids na ordem escolhida.
-- service_id continua guardando o primeiro, e service_name junta os nomes ("Head Spa + Ritual dos Pés").
alter table public.appointments add column if not exists service_ids uuid[] not null default '{}';

-- Cada atendimento que precisa de profissional fica ligado a uma delas.
alter table public.appointments
  add column if not exists professional_id uuid references public.professionals (id) on delete restrict;
update public.appointments
set professional_id = (select id from public.professionals order by created_at limit 1)
where needs_professional and professional_id is null;

alter table public.appointments drop constraint if exists appointments_professional_required;
alter table public.appointments add constraint appointments_professional_required
  check (not needs_professional or professional_id is not null);

-- Regra 2: cada profissional faz um atendimento por vez (profissionais diferentes podem atender juntas).
alter table public.appointments drop constraint if exists appointments_professional_overlap;
alter table public.appointments add constraint appointments_professional_overlap exclude using gist (
  professional_id with =, tsrange(starts_at, ends_at) with &&
) where (professional_id is not null and status not in ('cancelado', 'faltou'));

create index if not exists appointments_professional_idx on public.appointments (professional_id);

create index if not exists appointments_starts_idx on public.appointments (starts_at);
create index if not exists appointments_client_idx on public.appointments (client_id);

-- Regras 3 e 4: horário de funcionamento e Sala 2 desativada.
create or replace function public.validate_appointment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  s public.settings;
begin
  new.updated_at := now();

  if new.status in ('cancelado', 'faltou') then
    return new;
  end if;

  -- Só valida quando o horário/sala muda (assim, mudar o status de um
  -- atendimento antigo continua funcionando mesmo se os ajustes mudaram).
  if tg_op = 'UPDATE'
     and new.starts_at = old.starts_at
     and new.ends_at = old.ends_at
     and new.room = old.room
     and new.professional_id is not distinct from old.professional_id
     and old.status not in ('cancelado', 'faltou') then
    return new;
  end if;

  select * into s from public.settings where id = 1;

  if new.professional_id is not null
     and not exists (select 1 from public.professionals where id = new.professional_id and active) then
    raise exception 'Essa profissional está desativada. Ative em Mais → Profissionais ou escolha outra.'
      using errcode = 'P0001';
  end if;

  if new.room = 2 and not s.room2_enabled then
    raise exception 'A Sala 2 está desativada. Ative em Mais → Ajustes para usá-la.'
      using errcode = 'P0001';
  end if;

  if new.ends_at::date <> new.starts_at::date
     or new.starts_at::time < s.open_time
     or new.ends_at::time > s.close_time then
    raise exception 'Fora do horário de funcionamento (% às %).',
      to_char(s.open_time, 'HH24:MI'), to_char(s.close_time, 'HH24:MI')
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_validate on public.appointments;
create trigger appointments_validate
  before insert or update on public.appointments
  for each row execute function public.validate_appointment();

-- ---------------------------------------------------------------------
-- 6. Financeiro (entradas e despesas)
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('entrada', 'despesa')),
  category text not null,
  description text,
  amount numeric(10,2) not null check (amount >= 0),
  date date not null default current_date,
  payment_method text check (payment_method in ('pix', 'credito', 'debito', 'dinheiro', 'pacote')),
  appointment_id uuid unique references public.appointments (id) on delete cascade,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists transactions_date_idx on public.transactions (date);

-- Agendamento pago → cria/atualiza a entrada. Desmarcou "pago" ou cancelou → remove.
create or replace function public.sync_appointment_payment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  client_name text;
begin
  if new.paid and new.status <> 'cancelado' then
    select name into client_name from public.clients where id = new.client_id;
    insert into public.transactions
      (kind, category, description, amount, date, payment_method, appointment_id, is_sample)
    values
      ('entrada',
       case when new.payment_method = 'pacote' then 'Pacotes' else 'Atendimentos' end,
       new.service_name || ' · ' || coalesce(client_name, 'Cliente'),
       new.price, new.starts_at::date, new.payment_method, new.id, new.is_sample)
    on conflict (appointment_id) do update set
      category = excluded.category,
      description = excluded.description,
      amount = excluded.amount,
      date = excluded.date,
      payment_method = excluded.payment_method;
  else
    delete from public.transactions where appointment_id = new.id;
  end if;
  return null;
end;
$$;

drop trigger if exists appointments_payment on public.appointments;
create trigger appointments_payment
  after insert or update on public.appointments
  for each row execute function public.sync_appointment_payment();

-- ---------------------------------------------------------------------
-- 6b. Despesas fixas (ex.: aluguel): lançadas sozinhas todo mês
-- ---------------------------------------------------------------------
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null check (char_length(description) between 2 and 120),
  category text not null,
  amount numeric(10,2) not null check (amount >= 0),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  payment_method text check (payment_method in ('pix', 'credito', 'debito', 'dinheiro', 'pacote')),
  active boolean not null default true,
  start_month date not null,          -- primeiro mês (dia 1)
  generated_until date,               -- último mês já lançado (dia 1)
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column if not exists recurring_id uuid references public.recurring_expenses (id) on delete set null;
create index if not exists transactions_recurring_idx on public.transactions (recurring_id);

-- Lança as despesas fixas que faltam até o mês atual. O painel chama ao abrir o Financeiro.
-- Cada mês é lançado uma única vez: se você apagar o lançamento de um mês, ele não volta.
create or replace function public.generate_recurring_expenses()
returns integer
language plpgsql
set search_path = public
as $$
declare
  r public.recurring_expenses;
  current_month date := date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)::date;
  m date;
  last_day int;
  created int := 0;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  for r in select * from public.recurring_expenses where active for update loop
    m := coalesce((r.generated_until + interval '1 month')::date, r.start_month);
    if m < r.start_month then
      m := r.start_month;
    end if;
    while m <= current_month loop
      last_day := extract(day from (m + interval '1 month' - interval '1 day'))::int;
      insert into public.transactions
        (kind, category, description, amount, date, payment_method, recurring_id, is_sample)
      values
        ('despesa', r.category, r.description, r.amount, m + (least(r.day_of_month, last_day) - 1),
         r.payment_method, r.id, r.is_sample);
      update public.recurring_expenses set generated_until = m where id = r.id;
      created := created + 1;
      m := (m + interval '1 month')::date;
    end loop;
  end loop;
  return created;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Leads (funil)
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  whatsapp text not null check (char_length(whatsapp) between 8 and 20),
  source text not null default 'outro'
    check (source in ('instagram', 'whatsapp', 'indicacao', 'google', 'site', 'outro')),
  interest text check (char_length(interest) <= 300),
  notes text,
  stage text not null default 'novo'
    check (stage in ('novo', 'em_contato', 'agendou', 'perdido')),
  consent boolean not null default false,
  consent_at timestamptz,
  client_id uuid references public.clients (id) on delete set null,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_stage_idx on public.leads (stage, created_at desc);

-- Último contato com o lead (WhatsApp ou mudança de etapa): mede se ele está quente ou esfriando.
alter table public.leads add column if not exists last_contact_at timestamptz;

-- Envios repetidos do formulário: quantas vezes a pessoa enviou e quando foi o último
alter table public.leads add column if not exists submissions integer not null default 1;
alter table public.leads add column if not exists last_submission_at timestamptz;
update public.leads set last_submission_at = created_at where last_submission_at is null;
alter table public.leads alter column last_submission_at set default now();

-- Telefone "comparável": só dígitos e sem o 55 do Brasil (8399999… = 558399999…)
create or replace function public.phone_key(phone text)
returns text
language sql
immutable
as $$
  select case
    when length(d) >= 12 and left(d, 2) = '55' then substr(d, 3)
    else d
  end
  from (select regexp_replace(coalesce(phone, ''), '\D', '', 'g') as d) x;
$$;

-- Recebe o formulário do site (tspa.com.br/agendar). Única porta de entrada do visitante:
-- ele não lê nada, só envia. Junta envios repetidos do mesmo WhatsApp.
--   'novo'       → lead novo
--   'cliente'    → lead novo, já ligado à cliente cadastrada com esse WhatsApp
--   'atualizado' → já havia lead em aberto com esse número: junta os interesses e anota
--   'ignorado'   → o mesmo número enviou há menos de 10 minutos
create or replace function public.submit_lead(
  p_name text,
  p_whatsapp text,
  p_interest text default null,
  p_source text default 'site'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_digits text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_key text := public.phone_key(p_whatsapp);
  v_interest text := nullif(btrim(coalesce(p_interest, '')), '');
  v_source text := case when p_source in ('instagram', 'whatsapp', 'indicacao', 'google', 'site', 'outro') then p_source else 'site' end;
  v_open public.leads;
  v_client uuid;
  v_when text := to_char(now() at time zone 'America/Sao_Paulo', 'DD/MM "às" HH24:MI');
  v_merged text;
begin
  if char_length(v_name) not between 2 and 100
     or char_length(v_digits) not between 10 and 13
     or char_length(coalesce(v_interest, '')) > 300 then
    raise exception 'Dados inválidos' using errcode = '22023';
  end if;

  -- Proteção geral: no máximo 30 envios por hora (robôs que chamem a API direto)
  if (select count(*) from public.leads where last_submission_at > now() - interval '1 hour') >= 30 then
    raise exception 'Muitos envios' using errcode = 'P0001';
  end if;

  select * into v_open
  from public.leads
  where public.phone_key(whatsapp) = v_key and stage in ('novo', 'em_contato')
  order by created_at desc
  limit 1;

  if found then
    if v_open.last_submission_at > now() - interval '10 minutes' then
      return 'ignorado';
    end if;
    -- Junta os interesses sem repetir
    select string_agg(item, ', ' order by first_pos)
    into v_merged
    from (
      select btrim(item) as item, min(pos) as first_pos
      from unnest(string_to_array(concat_ws(', ', v_open.interest, v_interest), ',')) with ordinality as t(item, pos)
      where btrim(item) <> ''
      group by btrim(item)
    ) u;
    update public.leads
    set interest = left(v_merged, 300),
        notes = concat_ws(E'\n', notes, 'Enviou o formulário de novo em ' || v_when || '.'),
        submissions = submissions + 1,
        last_submission_at = now()
    where id = v_open.id;
    return 'atualizado';
  end if;

  select id into v_client from public.clients where public.phone_key(whatsapp) = v_key limit 1;

  insert into public.leads
    (name, whatsapp, interest, source, consent, consent_at, client_id, notes, last_submission_at)
  values
    (v_name, v_digits, v_interest, v_source, true, now(), v_client,
     case when v_client is not null then 'Já é cliente.' end, now());

  return case when v_client is not null then 'cliente' else 'novo' end;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch
  before update on public.leads
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 8. Resumo por cliente (visitas, total gasto, última e próxima visita)
-- ---------------------------------------------------------------------
create or replace view public.client_stats
with (security_invoker = true) as
select
  c.id as client_id,
  count(a.id) filter (where a.status = 'concluido') as visits,
  coalesce(sum(a.price) filter (where a.status = 'concluido'), 0) as total_spent,
  max(a.starts_at) filter (where a.status = 'concluido') as last_visit,
  min(a.starts_at) filter (
    where a.status in ('agendado', 'confirmado')
      and a.starts_at >= (now() at time zone 'America/Sao_Paulo')
  ) as next_visit
from public.clients c
left join public.appointments a on a.client_id = c.id
group by c.id;

-- ---------------------------------------------------------------------
-- 8b. Clientes sem cadastro repetido
--     Bloqueia uma cliente nova (ou edição) com o mesmo WhatsApp ou o mesmo
--     nome de outra. O nome é comparado sem acentos, maiúsculas e espaços extras
--     ("Ana  Lúcia" = "ana lucia"); o WhatsApp, sem o 55 do Brasil.
-- ---------------------------------------------------------------------
create or replace function public.name_key(name text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    translate(lower(coalesce(name, '')), 'áàâãäåéèêëíìîïóòôõöúùûüçñý', 'aaaaaaeeeeiiiiooooouuuucny'),
    '\s+', ' ', 'g'));
$$;

create index if not exists clients_name_key_idx on public.clients (public.name_key(name));
create index if not exists clients_phone_key_idx on public.clients (public.phone_key(whatsapp));

create or replace function public.check_client_duplicate()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_other text;
begin
  new.name := btrim(regexp_replace(new.name, '\s+', ' ', 'g'));
  new.whatsapp := nullif(regexp_replace(coalesce(new.whatsapp, ''), '\D', '', 'g'), '');

  if new.whatsapp is not null
     and (tg_op = 'INSERT' or public.phone_key(new.whatsapp) is distinct from public.phone_key(old.whatsapp)) then
    select name into v_other
    from public.clients
    where public.phone_key(whatsapp) = public.phone_key(new.whatsapp) and id <> new.id
    limit 1;
    if found then
      raise exception 'Já existe uma cliente com esse WhatsApp: %.', v_other using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'INSERT' or public.name_key(new.name) <> public.name_key(old.name) then
    select name into v_other
    from public.clients
    where public.name_key(name) = public.name_key(new.name) and id <> new.id
    limit 1;
    if found then
      raise exception 'Já existe uma cliente chamada %. Se for outra pessoa, inclua o sobrenome.', v_other
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists clients_no_duplicate on public.clients;
create trigger clients_no_duplicate
  before insert or update on public.clients
  for each row execute function public.check_client_duplicate();

-- Trava definitiva no banco. Só é criada quando não há repetidas antigas;
-- se houver, o painel mostra o filtro "Repetidas" para você resolver e rodar o script de novo.
do $$
begin
  if not exists (
    select 1 from public.clients where whatsapp is not null
    group by public.phone_key(whatsapp) having count(*) > 1
  ) then
    create unique index if not exists clients_phone_unique
      on public.clients (public.phone_key(whatsapp)) where whatsapp is not null;
  else
    raise notice 'Há clientes com o mesmo WhatsApp. Resolva pelo filtro "Repetidas" do painel e rode o script de novo.';
  end if;

  if not exists (
    select 1 from public.clients group by public.name_key(name) having count(*) > 1
  ) then
    create unique index if not exists clients_name_unique on public.clients (public.name_key(name));
  else
    raise notice 'Há clientes com o mesmo nome. Resolva pelo filtro "Repetidas" do painel e rode o script de novo.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 8c. Lista de clientes com indicadores (a tela busca aos poucos, com filtros)
--     visitas, total gasto, ticket médio, a receber, faltas, primeira/última/próxima visita
-- ---------------------------------------------------------------------
drop view if exists public.client_overview;
drop view if exists public.client_list;

create view public.client_list
with (security_invoker = true) as
select
  c.*,
  public.name_key(c.name) as name_key,
  extract(month from c.birthday)::int as birthday_month,
  coalesce(s.visits, 0)::int as visits,
  coalesce(s.total_spent, 0)::numeric(12,2) as total_spent,
  (case when s.visits > 0 then round(s.total_spent / s.visits, 2) else 0 end)::numeric(12,2) as avg_ticket,
  coalesce(s.to_receive, 0)::numeric(12,2) as to_receive,
  coalesce(s.no_shows, 0)::int as no_shows,
  s.first_visit,
  s.last_visit,
  s.next_visit,
  ((now() at time zone 'America/Sao_Paulo')::date - s.last_visit::date) as days_since_last,
  (
    (c.whatsapp is not null and exists (
      select 1 from public.clients o
      where o.id <> c.id and public.phone_key(o.whatsapp) = public.phone_key(c.whatsapp)
    ))
    or exists (
      select 1 from public.clients o
      where o.id <> c.id and public.name_key(o.name) = public.name_key(c.name)
    )
  ) as has_duplicate
from public.clients c
left join lateral (
  select
    count(*) filter (where a.status = 'concluido') as visits,
    sum(a.price) filter (where a.status = 'concluido') as total_spent,
    sum(a.price) filter (where a.status = 'concluido' and not a.paid) as to_receive,
    count(*) filter (where a.status = 'faltou') as no_shows,
    min(a.starts_at) filter (where a.status = 'concluido') as first_visit,
    max(a.starts_at) filter (where a.status = 'concluido') as last_visit,
    min(a.starts_at) filter (
      where a.status in ('agendado', 'confirmado')
        and a.starts_at >= (now() at time zone 'America/Sao_Paulo')
    ) as next_visit
  from public.appointments a
  where a.client_id = c.id
) s on true;

-- Resumo do topo da tela e contagem de cada filtro.
-- Regras (iguais às do painel): recorrente = 3+ visitas · sumida = 60+ dias sem vir e sem horário marcado
-- · nova = cadastrada nos últimos 30 dias · ativa = veio nos últimos 60 dias ou tem horário marcado.
create view public.client_overview
with (security_invoker = true) as
select
  count(*)::int as total,
  count(*) filter (
    where (created_at at time zone 'America/Sao_Paulo') >= date_trunc('month', now() at time zone 'America/Sao_Paulo')
  )::int as new_this_month,
  count(*) filter (where days_since_last <= 60 or next_visit is not null)::int as active,
  count(*) filter (where visits >= 3)::int as loyal,
  count(*) filter (where days_since_last > 60 and next_visit is null)::int as lapsed,
  count(*) filter (where created_at >= now() - interval '30 days')::int as recent,
  count(*) filter (where visits = 0)::int as never,
  count(*) filter (where birthday_month = extract(month from now() at time zone 'America/Sao_Paulo'))::int as birthdays,
  count(*) filter (where has_duplicate)::int as duplicates,
  coalesce(sum(total_spent), 0)::numeric(12,2) as revenue,
  coalesce(sum(to_receive), 0)::numeric(12,2) as to_receive,
  (case when sum(visits) > 0 then round(sum(total_spent) / sum(visits), 2) else 0 end)::numeric(12,2) as avg_ticket
from public.client_list;

-- ---------------------------------------------------------------------
-- 8d. Notificações no celular (resumo do dia e lembrete antes do atendimento)
--     O envio é feito pela função push-agenda (veja admin/NOTIFICACOES.md).
-- ---------------------------------------------------------------------
alter table public.settings add column if not exists notify_daily_time time not null default '07:30';
alter table public.settings add column if not exists notify_before_min smallint not null default 30;
alter table public.settings drop constraint if exists settings_notify_before;
alter table public.settings add constraint settings_notify_before check (notify_before_min between 5 and 240);

-- Aparelhos que recebem as notificações (um por celular/navegador ativado)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  device text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

-- O que já foi enviado (para não repetir). Só a função de envio lê e escreve.
create table if not exists public.push_log (
  kind text not null check (kind in ('resumo', 'lembrete')),
  ref text not null,
  sent_at timestamptz not null default now(),
  primary key (kind, ref)
);
delete from public.push_log where sent_at < now() - interval '30 days';

-- ---------------------------------------------------------------------
-- 9. Segurança: Row Level Security (RLS)
--    • Painel: só o e-mail de admin_users lê e escreve.
--    • Formulário público (anon): só pode INSERIR lead, nunca ler.
-- ---------------------------------------------------------------------
alter table public.admin_users  enable row level security;
alter table public.settings     enable row level security;
alter table public.services     enable row level security;
alter table public.professionals enable row level security;
alter table public.clients      enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;
alter table public.leads        enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_log   enable row level security;   -- sem política: só a função de envio (service role) acessa

do $$
declare
  t text;
begin
  foreach t in array array['settings', 'services', 'professionals', 'clients', 'appointments', 'transactions', 'recurring_expenses', 'leads', 'push_subscriptions'] loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format(
      'create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t);
  end loop;
end;
$$;

-- O visitante não grava direto na tabela: só pela função submit_lead (que junta repetidos)
drop policy if exists public_insert_lead on public.leads;

-- Permissões: o visitante anônimo não acessa nada além de inserir lead.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on public.admin_users from authenticated;
revoke all on public.push_log from authenticated;
revoke all on function public.submit_lead(text, text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text) to anon, authenticated;

grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 10. Dados de exemplo (botões em Mais → Ajustes)
--     Tudo marcado com is_sample = true, para apagar sem tocar no resto.
-- ---------------------------------------------------------------------
create or replace function public.clear_sample_data()
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;
  delete from public.transactions where is_sample;
  delete from public.recurring_expenses where is_sample;
  delete from public.appointments where is_sample;
  delete from public.leads where is_sample;
  delete from public.clients where is_sample;
  delete from public.services where is_sample;
end;
$$;

create or replace function public.load_sample_data()
returns void
language plpgsql
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  s public.settings;
  c uuid[];
  sv uuid[];
  sv_name text[] := array['Massagem Relaxante (exemplo)', 'Head Spa Ritual (exemplo)', 'Limpeza de Pele (exemplo)', 'Ofurô (exemplo)'];
  sv_dur int[] := array[60, 60, 60, 60];
  sv_price numeric[] := array[180, 220, 160, 90];
  sv_prof boolean[] := array[true, true, true, false];
  r record;
  new_id uuid;
  prof uuid;
  i int;
  start_ts timestamp;
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;

  perform public.clear_sample_data();
  select * into s from public.settings where id = 1;
  select id into prof from public.professionals where active order by created_at limit 1;

  for i in 1..4 loop
    insert into public.services (name, duration_min, price, needs_professional, is_sample)
    values (sv_name[i], sv_dur[i], sv_price[i], sv_prof[i], true)
    returning id into new_id;
    sv := sv || new_id;
  end loop;

  for r in
    select * from (values
      ('Ana Beatriz Lima (exemplo)',  '83999990001', date '1990-03-14', 'Nenhuma',         false, 'media', 'Prefere óleo sem perfume.'),
      ('Carla Mendes (exemplo)',      '83999990002', date '1985-07-02', 'Lavanda',         false, 'firme', 'Gosta de música baixa.'),
      ('Juliana Rocha (exemplo)',     '83999990003', date '1994-11-28', null,              true,  'leve',  'Gestante de 5 meses.'),
      ('Fernanda Alves (exemplo)',    '83999990004', null,              'Látex',           false, 'media', null),
      ('Patrícia Souza (exemplo)',    '83999990005', date '1979-01-09', null,              false, 'firme', 'Tensão nos ombros.'),
      ('Marina Costa (exemplo)',      '83999990006', null,              null,              false, 'leve',  null)
    ) as t(name, whatsapp, birthday, allergies, pregnant, pressure, preferences)
  loop
    insert into public.clients (name, whatsapp, birthday, allergies, pregnant, massage_pressure, preferences, is_sample)
    values (r.name, r.whatsapp, r.birthday, r.allergies, r.pregnant, r.pressure, r.preferences, true)
    returning id into new_id;
    c := c || new_id;
  end loop;

  -- day: dias a partir de hoje · minute: minutos após a abertura · svc/cli: posição nas listas acima
  for r in
    select * from (values
      (-6,  60, 1, 1, 1, 'concluido',  true,  'pix'),
      (-5, 120, 1, 2, 2, 'concluido',  true,  'credito'),
      (-4,  60, 1, 3, 3, 'faltou',     false, null),
      (-3, 180, 1, 1, 4, 'concluido',  true,  'dinheiro'),
      (-2,  60, 1, 2, 5, 'concluido',  false, null),
      (-1, 240, 1, 3, 6, 'concluido',  true,  'debito'),
      ( 0,  60, 1, 1, 2, 'confirmado', false, null),
      ( 0,  60, 2, 4, 5, 'confirmado', false, null),
      ( 0, 180, 1, 2, 1, 'agendado',   false, null),
      ( 0, 300, 1, 3, 4, 'agendado',   false, null),
      ( 1, 120, 1, 1, 3, 'agendado',   false, null),
      ( 2,  60, 1, 2, 6, 'confirmado', false, null),
      ( 3, 240, 1, 1, 2, 'agendado',   false, null),
      ( 5, 120, 1, 3, 5, 'agendado',   false, null)
    ) as t(day, minute, room, svc, cli, status, paid, method)
  loop
    begin
      start_ts := (today + r.day) + s.open_time + make_interval(mins => r.minute);
      insert into public.appointments
        (client_id, service_id, service_name, starts_at, ends_at, room, needs_professional, professional_id,
         price, status, payment_method, paid, is_sample)
      values
        (c[r.cli], sv[r.svc], replace(sv_name[r.svc], ' (exemplo)', ''), start_ts,
         start_ts + make_interval(mins => sv_dur[r.svc]), r.room, sv_prof[r.svc],
         case when sv_prof[r.svc] then prof end,
         sv_price[r.svc], r.status, r.method, r.paid, true);
    exception when others then
      null; -- ignora o que não couber (ex.: Sala 2 desativada ou horário fora do expediente)
    end;
  end loop;

  insert into public.recurring_expenses (description, category, amount, day_of_month, payment_method, start_month, generated_until, is_sample)
  values ('Aluguel da sala (exemplo)', 'Aluguel', 1200, 5, 'pix', date_trunc('month', today)::date, date_trunc('month', today)::date, true)
  returning id into new_id;
  insert into public.transactions (kind, category, description, amount, date, payment_method, recurring_id, is_sample)
  values ('despesa', 'Aluguel', 'Aluguel da sala (exemplo)', 1200, date_trunc('month', today)::date + 4, 'pix', new_id, true);

  insert into public.transactions (kind, category, description, amount, date, payment_method, is_sample)
  values
    ('despesa', 'Produtos',      'Óleos e máscaras (exemplo)',   340, today - 3, 'credito', true),
    ('despesa', 'Energia/Água',  'Conta de energia (exemplo)',   210, today - 8, 'pix', true),
    ('despesa', 'Marketing',     'Impulsionamento (exemplo)',    150, today - 2, 'credito', true),
    ('despesa', 'Lavanderia',    'Toalhas e lençóis (exemplo)',   90, today - 1, 'dinheiro', true),
    ('entrada', 'Produtos',      'Venda de óleo (exemplo)',       60, today - 2, 'pix', true);

  insert into public.leads (name, whatsapp, source, interest, notes, stage, consent, consent_at, is_sample, created_at, last_contact_at)
  values
    ('Renata Dias (exemplo)',    '83999990101', 'instagram', 'Head Spa Ritual',         null,                  'novo',       true, now(), true, now() - interval '2 hours',  null),
    ('Luana Freitas (exemplo)',  '83999990102', 'site',      'Massagem Relaxante',      null,                  'novo',       true, now(), true, now() - interval '8 days',   null),
    ('Bianca Torres (exemplo)',  '83999990103', 'indicacao', 'Ritual TSpa de presente', 'Indicada pela Ana.',  'em_contato', true, now(), true, now() - interval '5 days',   now() - interval '3 days'),
    ('Sofia Nunes (exemplo)',    '83999990104', 'google',    'Drenagem Linfática',      'Pediu valores.',      'em_contato', true, now(), true, now() - interval '12 days',  now() - interval '9 days'),
    ('Helena Prado (exemplo)',   '83999990105', 'instagram', 'Limpeza de Pele',         null,                  'agendou',    true, now(), true, now() - interval '6 days',   now() - interval '5 days'),
    ('Tatiane Melo (exemplo)',   '83999990106', 'whatsapp',  'Head Spa Essencial',      'Achou longe.',        'perdido',    true, now(), true, now() - interval '9 days',   now() - interval '8 days');
  update public.leads set last_submission_at = created_at where is_sample;
end;
$$;

revoke all on function public.load_sample_data() from public, anon;
revoke all on function public.clear_sample_data() from public, anon;
revoke all on function public.generate_recurring_expenses() from public, anon;
grant execute on function public.generate_recurring_expenses() to authenticated;
grant execute on function public.load_sample_data() to authenticated;
grant execute on function public.clear_sample_data() to authenticated;

-- ---------------------------------------------------------------------
-- 11. SEU E-MAIL AQUI — troque pelo e-mail que você vai usar no login
-- ---------------------------------------------------------------------
insert into public.admin_users (email)
values ('tsparefugio@gmail.com')
on conflict (email) do nothing;
