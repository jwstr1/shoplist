-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the sync-agpd edge function to run daily at 3am UTC
select cron.schedule(
  'sync-agpd-prices',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://fzmofjppjhitnbdlvagg.supabase.co/functions/v1/sync-agpd',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer REMOVED_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
