-- Papéis e esquema "auth" que o Supabase já traz prontos. Roda só na primeira vez que o banco é criado.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login password 'authenticator' noinherit;
grant anon, authenticated, service_role to authenticator;

create role supabase_auth_admin login password 'auth' createrole noinherit;
create schema auth authorization supabase_auth_admin;
grant create on database postgres to supabase_auth_admin;
alter role supabase_auth_admin set search_path = auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- auth.jwt(): lê os dados do login enviados pela API (igual ao Supabase)
create function auth.jwt() returns jsonb
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
alter function auth.jwt() owner to supabase_auth_admin;
grant execute on function auth.jwt() to anon, authenticated, service_role;
