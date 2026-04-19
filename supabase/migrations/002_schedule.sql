-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Enable pg_net for HTTP calls
create extension if not exists pg_net;

-- Schedule the sync-agpd edge function to run daily at 3am UTC
-- NOTE: The Authorization header uses the service_role key which must be set
-- as a Supabase vault secret named 'service_role_key' before this runs.
-- Alternatively, configure this via Supabase Dashboard > Edge Functions > sync-agpd > Schedule
select cron.schedule(
  'sync-agpd-prices',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://fzmofjppjhitnbdlvagg.supabase.co/functions/v1/sync-agpd',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
