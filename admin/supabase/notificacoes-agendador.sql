-- =====================================================================
-- TSpa · Agendador das notificações (rodar UMA vez no Supabase de produção)
--
-- Chama a função push-agenda a cada 5 minutos. Antes de rodar:
--   1. Troque SEU-PROJETO pelo código do projeto (o "xxxx" de https://xxxx.supabase.co).
--   2. Troque COLE-O-CRON-SECRET pelo CRON_SECRET gerado (o mesmo dos segredos da função).
-- Pode rodar de novo para trocar a URL ou o segredo.
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Guarda URL e segredo no cofre do Supabase (não ficam visíveis no agendamento)
do $$
declare
  v_url text := 'https://SEU-PROJETO.supabase.co/functions/v1/push-agenda';
  v_secret text := 'COLE-O-CRON-SECRET';
  v_id uuid;
begin
  if v_url like '%SEU-PROJETO%' or v_secret = 'COLE-O-CRON-SECRET' then
    raise exception 'Troque SEU-PROJETO e COLE-O-CRON-SECRET antes de rodar.';
  end if;

  select id into v_id from vault.secrets where name = 'push_agenda_url';
  if v_id is null then perform vault.create_secret(v_url, 'push_agenda_url');
  else perform vault.update_secret(v_id, v_url); end if;

  select id into v_id from vault.secrets where name = 'push_agenda_secret';
  if v_id is null then perform vault.create_secret(v_secret, 'push_agenda_secret');
  else perform vault.update_secret(v_id, v_secret); end if;
end;
$$;

-- A cada 5 minutos (se já existir com esse nome, é substituído)
select cron.schedule(
  'push-agenda',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'push_agenda_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'push_agenda_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $job$
);

-- Para conferir depois: últimas execuções e respostas da função
--   select * from cron.job_run_details order by start_time desc limit 5;
--   select status_code, content from net._http_response order by created desc limit 5;
-- Para desligar:  select cron.unschedule('push-agenda');
